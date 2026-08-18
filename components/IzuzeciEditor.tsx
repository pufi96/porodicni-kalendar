"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  obrisiIzuzetak,
  sacuvajIzuzetak,
  type StanjeDostupnosti,
} from "@/app/actions/dostupnost";
import { OpsegUnos } from "@/components/OpsegUnos";
import { formatDanPuno, hhmmToMin, minToHHMM, todayIso } from "@/lib/time";

export type Izuzetak = {
  date: string;
  slots: { startMin: number; endMin: number }[];
};

function SacuvajDugme() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dugme-glavno" disabled={pending}>
      {pending ? "Cuvam..." : "Sacuvaj izuzetak"}
    </button>
  );
}

export function IzuzeciEditor({
  slug,
  memberId,
  izuzeci,
}: {
  slug: string;
  memberId: string;
  izuzeci: Izuzetak[];
}) {
  const [otvoren, setOtvoren] = useState(false);
  const [datum, setDatum] = useState(todayIso());
  const [mogu, setMogu] = useState(false);
  const [opsezi, setOpsezi] = useState<{ startMin: number; endMin: number }[]>([]);
  const [od, setOd] = useState("18:00");
  const [doo, setDoo] = useState("22:00");

  const [stanje, akcija] = useActionState<StanjeDostupnosti, FormData>(
    async (prev, fd) => {
      const rez = await sacuvajIzuzetak(prev, fd);
      if (!rez.greska) {
        setOtvoren(false);
        setOpsezi([]);
        setMogu(false);
      }
      return rez;
    },
    {}
  );

  function dodajOpseg() {
    const a = hhmmToMin(od);
    const b = hhmmToMin(doo);
    if (a === null || b === null || b <= a) return;
    setOpsezi((p) =>
      [...p, { startMin: a, endMin: b }].sort((x, y) => x.startMin - y.startMin)
    );
  }

  // Buduci izuzeci su korisni; prosle ne prikazujemo da spisak ne raste zauvek.
  const danas = todayIso();
  const vidljivi = izuzeci
    .filter((i) => i.date >= danas)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-medium">Izuzeci</h2>
        <p className="mt-1 text-sm text-muted">
          Za konkretan datum koji odstupa od sablona. Izuzetak potpuno zamenjuje
          sablon za taj dan.
        </p>
      </div>

      {vidljivi.length > 0 && (
        <ul className="space-y-2">
          {vidljivi.map((i) => (
            <li key={i.date} className="kartica flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{formatDanPuno(i.date)}</p>
                <p className="text-sm text-muted">
                  {i.slots.length === 0
                    ? "ne mogu uopste"
                    : i.slots
                        .map((s) => `${minToHHMM(s.startMin)}-${minToHHMM(s.endMin)}`)
                        .join(", ")}
                </p>
              </div>
              <form action={obrisiIzuzetak}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="memberId" value={memberId} />
                <input type="hidden" name="date" value={i.date} />
                <button
                  type="submit"
                  className="rounded-lg px-2 py-1 text-sm text-muted hover:text-accent"
                >
                  Vrati na sablon
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {!otvoren ? (
        <button onClick={() => setOtvoren(true)} className="dugme-tiho w-full">
          + Dodaj izuzetak
        </button>
      ) : (
        <form action={akcija} className="kartica space-y-4 p-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="memberId" value={memberId} />
          <input
            type="hidden"
            name="slots"
            value={JSON.stringify(mogu ? opsezi : [])}
          />

          <div>
            <label className="oznaka" htmlFor="datum">
              Koji datum?
            </label>
            <input
              id="datum"
              name="date"
              type="date"
              className="polje"
              value={datum}
              min={danas}
              onChange={(e) => setDatum(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMogu(false)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition ${
                !mogu
                  ? "border-accent bg-accent-soft font-medium text-accent"
                  : "border-border text-muted"
              }`}
            >
              Ne mogu tog dana
            </button>
            <button
              type="button"
              onClick={() => setMogu(true)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition ${
                mogu
                  ? "border-accent bg-accent-soft font-medium text-accent"
                  : "border-border text-muted"
              }`}
            >
              Mogu, ali drugacije
            </button>
          </div>

          {mogu && (
            <div className="space-y-3 rounded-xl bg-surface-2 p-3">
              <OpsegUnos od={od} doo={doo} setOd={setOd} setDoo={setDoo} />
              <button type="button" onClick={dodajOpseg} className="dugme-tiho w-full py-2">
                + Dodaj ovaj termin
              </button>

              {opsezi.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {opsezi.map((s, idx) => (
                    <button
                      key={`${s.startMin}-${s.endMin}-${idx}`}
                      type="button"
                      onClick={() => setOpsezi((p) => p.filter((_, k) => k !== idx))}
                      className="flex items-center gap-1 rounded-lg bg-accent-soft px-2 py-1
                                 text-sm font-medium text-accent"
                    >
                      {minToHHMM(s.startMin)}-{minToHHMM(s.endMin)}
                      <span className="text-accent/60">&times;</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Dodaj bar jedan termin, ili izaberi &bdquo;Ne mogu tog dana&ldquo;.
                </p>
              )}
            </div>
          )}

          {stanje.greska && (
            <p role="alert" className="text-sm text-warn">
              {stanje.greska}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOtvoren(false)}
              className="dugme-tiho"
            >
              Odustani
            </button>
            <SacuvajDugme />
          </div>
        </form>
      )}
    </section>
  );
}
