"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  dodajSablonSlot,
  obrisiSablonSlot,
  primeniPreset,
} from "@/app/actions/dostupnost";
import { OpsegUnos } from "@/components/OpsegUnos";
import { DANI_PUNO, hhmmToMin, minToHHMM } from "@/lib/time";

export type SablonSlot = {
  id: string;
  weekday: number;
  startMin: number;
  endMin: number;
};

function SacuvajDugme({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="dugme-glavno px-5"
      disabled={disabled || pending}
    >
      {pending ? "Cuvam..." : "Dodaj"}
    </button>
  );
}

function PresetDugme({
  slug,
  memberId,
  preset,
  children,
}: {
  slug: string;
  memberId: string;
  preset: string;
  children: React.ReactNode;
}) {
  return (
    <form action={primeniPreset}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="preset" value={preset} />
      <button type="submit" className="dugme-tiho px-3 py-2 text-sm">
        {children}
      </button>
    </form>
  );
}

export function SablonEditor({
  slug,
  memberId,
  slotovi,
}: {
  slug: string;
  memberId: string;
  slotovi: SablonSlot[];
}) {
  const [otvoren, setOtvoren] = useState<number | null>(null);
  const [od, setOd] = useState("18:00");
  const [doo, setDoo] = useState("22:00");

  const odMin = hhmmToMin(od);
  const doMin = hhmmToMin(doo);
  const opsegValjan = odMin !== null && doMin !== null && doMin > odMin;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-medium">Nedeljni sablon</h2>
        <p className="mt-1 text-sm text-muted">
          Podesi kad si obicno slobodan. Kalendar se popunjava sam, a za dane koji
          odstupaju dodajes izuzetak ispod.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <PresetDugme slug={slug} memberId={memberId} preset="posle-posla">
          Radnim danima 18-22
        </PresetDugme>
        <PresetDugme slug={slug} memberId={memberId} preset="vikend">
          Vikendom 10-22
        </PresetDugme>
        <PresetDugme slug={slug} memberId={memberId} preset="obrisi">
          Obrisi sve
        </PresetDugme>
      </div>

      <ul className="space-y-2">
        {DANI_PUNO.map((naziv, i) => {
          const weekday = i + 1;
          const dnevni = slotovi
            .filter((s) => s.weekday === weekday)
            .sort((a, b) => a.startMin - b.startMin);
          const jeOtvoren = otvoren === weekday;

          return (
            <li key={weekday} className="kartica overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-24 shrink-0 text-sm font-medium">{naziv}</span>

                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {dnevni.length === 0 ? (
                    <span className="text-sm text-muted">nisam slobodan</span>
                  ) : (
                    dnevni.map((s) => (
                      <form key={s.id} action={obrisiSablonSlot}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="memberId" value={memberId} />
                        <input type="hidden" name="slotId" value={s.id} />
                        <button
                          type="submit"
                          title="Ukloni ovaj termin"
                          className="group flex items-center gap-1 rounded-lg bg-accent-soft px-2 py-1
                                     text-sm font-medium text-accent"
                        >
                          {minToHHMM(s.startMin)}-{minToHHMM(s.endMin)}
                          <span className="text-accent/60 group-hover:text-warn">
                            &times;
                          </span>
                        </button>
                      </form>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setOtvoren(jeOtvoren ? null : weekday)}
                  className="shrink-0 rounded-lg px-2 py-1 text-sm text-accent"
                  aria-expanded={jeOtvoren}
                >
                  {jeOtvoren ? "Zatvori" : "+ Dodaj"}
                </button>
              </div>

              {jeOtvoren && (
                <form
                  action={async (fd) => {
                    await dodajSablonSlot({}, fd);
                    setOtvoren(null);
                  }}
                  className="space-y-3 border-t border-border bg-surface-2 px-4 py-4"
                >
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="memberId" value={memberId} />
                  <input type="hidden" name="weekday" value={weekday} />
                  <input type="hidden" name="od" value={odMin ?? ""} />
                  <input type="hidden" name="do" value={doMin ?? ""} />

                  <OpsegUnos od={od} doo={doo} setOd={setOd} setDoo={setDoo} />
                  <div className="flex justify-end">
                    <SacuvajDugme disabled={!opsegValjan} />
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
