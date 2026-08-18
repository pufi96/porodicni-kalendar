"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  bestCountByDate,
  findWindows,
  findWindowsForDay,
  type MemberInput,
  type Window,
} from "@/lib/availability";
import { DanTimeline } from "@/components/DanTimeline";
import { MapaDana } from "@/components/MapaDana";
import { formatDanKratko, formatDanPuno, formatTrajanje, minToHHMM } from "@/lib/time";

const PRIKAZI_ODMAH = 12;

function opisEkipe(w: Window, ukupno: number, imena: Map<string, string>): string {
  if (w.missingIds.length === 0) return `mogu svi (${ukupno})`;
  const fale = w.missingIds.map((id) => imena.get(id) ?? "?").join(", ");
  return `${w.memberIds.length} od ${ukupno} - fali ${fale}`;
}

function KopirajDugme({
  w,
  imena,
  slug,
}: {
  w: Window;
  imena: Map<string, string>;
  slug: string;
}) {
  const [kopirano, setKopirano] = useState(false);

  async function kopiraj() {
    const mogu = w.memberIds.map((id) => imena.get(id) ?? "?").join(", ");
    const ne = w.missingIds.map((id) => imena.get(id) ?? "?").join(", ");
    const link = `${window.location.origin}/g/${slug}`;
    const tekst = [
      `Predlog: ${formatDanPuno(w.date)}, ${minToHHMM(w.startMin)}-${minToHHMM(w.endMin)}`,
      `Mogu: ${mogu}`,
      ne ? `Ne moze: ${ne}` : null,
      `Kalendar: ${link}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ text: tekst });
        return;
      }
      await navigator.clipboard.writeText(tekst);
    } catch {
      return; // korisnik odustao ili nema dozvolu
    }
    setKopirano(true);
    setTimeout(() => setKopirano(false), 2000);
  }

  return (
    <button
      onClick={kopiraj}
      className="rounded-lg px-2 py-1 text-sm font-medium text-accent"
    >
      {kopirano ? "Kopirano!" : "Kopiraj predlog"}
    </button>
  );
}

export function PreklapanjaPanel({
  slug,
  members,
  danas,
}: {
  slug: string;
  members: MemberInput[];
  danas: string;
}) {
  const [minSati, setMinSati] = useState(2);
  const [smeDaFali, setSmeDaFali] = useState(0);
  const [nedelja, setNedelja] = useState(8);
  const [prikazano, setPrikazano] = useState(PRIKAZI_ODMAH);
  const [izabranDan, setIzabranDan] = useState<string | null>(null);
  const [istaknut, setIstaknut] = useState<Window | null>(null);

  const imena = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members]
  );

  const opts = useMemo(
    () => ({
      startDate: danas,
      days: nedelja * 7,
      minDurationMin: minSati * 60,
      maxMissing: smeDaFali,
    }),
    [danas, nedelja, minSati, smeDaFali]
  );

  // Racuna se u pregledacu: podaci grupe su mali, a klizaci tako reaguju
  // odmah, bez odlaska na server pri svakom pomeranju.
  const termini = useMemo(() => findWindows(members, opts), [members, opts]);
  const brojPoDanu = useMemo(
    () => bestCountByDate(members, opts),
    [members, opts]
  );

  const danDetalj = useMemo(() => {
    if (!izabranDan) return null;
    return findWindowsForDay(izabranDan, members, {
      minMembers: 2,
      minDurationMin: minSati * 60,
    });
  }, [izabranDan, members, minSati]);

  if (members.length < 2) {
    return (
      <div className="kartica p-5 text-center">
        <h2 className="font-medium">Jos nema sta da se poredi</h2>
        <p className="mt-2 text-sm text-muted">
          Dodaj bar dvoje ljudi u grupu, pa im upisi kad su slobodni.
        </p>
        <Link href={`/g/${slug}/clanovi`} className="dugme-glavno mt-4">
          Dodaj clanove
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="kartica space-y-4 p-4">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="trajanje" className="text-sm font-medium">
              Najkrace druzenje
            </label>
            <span className="text-sm text-muted">{formatTrajanje(minSati * 60)}</span>
          </div>
          <input
            id="trajanje"
            type="range"
            min={1}
            max={8}
            step={1}
            value={minSati}
            onChange={(e) => setMinSati(Number(e.target.value))}
            className="mt-2 w-full accent-accent"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Sme da fali</p>
          <div className="flex gap-2">
            {[0, 1, 2].map((n) => (
              <button
                key={n}
                onClick={() => setSmeDaFali(n)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition ${
                  smeDaFali === n
                    ? "border-accent bg-accent-soft font-medium text-accent"
                    : "border-border text-muted"
                }`}
              >
                {n === 0 ? "niko" : n === 1 ? "jedan" : "dvoje"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Gledamo unapred</p>
          <div className="flex gap-2">
            {[4, 8, 12].map((n) => (
              <button
                key={n}
                onClick={() => setNedelja(n)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition ${
                  nedelja === n
                    ? "border-accent bg-accent-soft font-medium text-accent"
                    : "border-border text-muted"
                }`}
              >
                {n} nedelja
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">
          Najbolji termini{" "}
          <span className="font-normal text-muted">({termini.length})</span>
        </h2>

        {termini.length === 0 ? (
          <div className="kartica p-4 text-sm text-muted">
            <p className="font-medium text-text">Nema termina pod ovim uslovima.</p>
            <p className="mt-1">
              Probaj da skratis najkrace druzenje, dozvolis da neko fali, ili
              zamolis rodjake da upisu svoje termine.
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {termini.slice(0, prikazano).map((w) => {
                const kljuc = `${w.date}-${w.startMin}-${w.endMin}-${w.memberIds.join()}`;
                const svi = w.missingIds.length === 0;
                return (
                  <li key={kljuc} className="kartica p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium">{formatDanKratko(w.date)}</p>
                      <p className="text-sm">
                        <span className="font-medium">
                          {minToHHMM(w.startMin)}-{minToHHMM(w.endMin)}
                        </span>{" "}
                        <span className="text-muted">
                          ({formatTrajanje(w.endMin - w.startMin)})
                        </span>
                      </p>
                    </div>

                    <p
                      className={`mt-1 text-sm ${svi ? "font-medium text-good" : "text-muted"}`}
                    >
                      {opisEkipe(w, members.length, imena)}
                    </p>

                    <div className="mt-2 flex gap-1">
                      {members.map((m) => (
                        <span
                          key={m.id}
                          title={m.name}
                          className="h-2 w-full rounded-full"
                          style={{
                            background: w.memberIds.includes(m.id)
                              ? m.color
                              : "var(--surface-2)",
                          }}
                        />
                      ))}
                    </div>

                    <div className="mt-3 flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setIzabranDan(w.date);
                          setIstaknut(w);
                        }}
                        className="rounded-lg px-2 py-1 text-sm text-muted hover:text-text"
                      >
                        Vidi dan
                      </button>
                      <KopirajDugme w={w} imena={imena} slug={slug} />
                    </div>
                  </li>
                );
              })}
            </ul>

            {prikazano < termini.length && (
              <button
                onClick={() => setPrikazano((p) => p + PRIKAZI_ODMAH)}
                className="dugme-tiho w-full"
              >
                Prikazi jos ({termini.length - prikazano})
              </button>
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Pregled po danima</h2>
        <div className="kartica p-4">
          <MapaDana
            startDate={danas}
            days={nedelja * 7}
            brojPoDanu={brojPoDanu}
            ukupno={members.length}
            izabran={izabranDan}
            onIzbor={(d) => {
              setIzabranDan(d === izabranDan ? null : d);
              setIstaknut(null);
            }}
          />
        </div>

        {izabranDan && (
          <div className="space-y-2">
            <DanTimeline date={izabranDan} members={members} istakni={istaknut} />
            {danDetalj && danDetalj.length > 0 && (
              <ul className="space-y-1.5">
                {danDetalj.slice(0, 5).map((w) => (
                  <li
                    key={`${w.startMin}-${w.endMin}-${w.memberIds.join()}`}
                    className="kartica flex items-center justify-between gap-2 px-4 py-2.5 text-sm"
                  >
                    <span className="font-medium">
                      {minToHHMM(w.startMin)}-{minToHHMM(w.endMin)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-muted">
                      {opisEkipe(w, members.length, imena)}
                    </span>
                    <KopirajDugme w={w} imena={imena} slug={slug} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
