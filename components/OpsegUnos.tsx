"use client";

import { hhmmToMin } from "@/lib/time";

export const BRZI_OPSEZI: { naziv: string; od: string; do: string }[] = [
  { naziv: "Posle posla", od: "18:00", do: "22:00" },
  { naziv: "Prepodne", od: "09:00", do: "13:00" },
  { naziv: "Popodne", od: "14:00", do: "18:00" },
  { naziv: "Ceo dan", od: "09:00", do: "22:00" },
];

/**
 * Dva polja za vreme plus brzi izbori. Na telefonu type="time" otvara
 * nativni tocak, sto je daleko lakse starijima od kucanja.
 */
export function OpsegUnos({
  od,
  doo,
  setOd,
  setDoo,
}: {
  od: string;
  doo: string;
  setOd: (v: string) => void;
  setDoo: (v: string) => void;
}) {
  const odMin = hhmmToMin(od);
  const doMin = hhmmToMin(doo);
  const nevalja = odMin !== null && doMin !== null && doMin <= odMin;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {BRZI_OPSEZI.map((b) => (
          <button
            key={b.naziv}
            type="button"
            onClick={() => {
              setOd(b.od);
              setDoo(b.do);
            }}
            className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm
                       text-muted transition hover:border-accent hover:text-accent"
          >
            {b.naziv}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="od">
          Od
        </label>
        <input
          id="od"
          type="time"
          value={od}
          onChange={(e) => setOd(e.target.value)}
          className="polje flex-1"
          step={900}
        />
        <span className="text-muted">do</span>
        <label className="sr-only" htmlFor="do">
          Do
        </label>
        <input
          id="do"
          type="time"
          value={doo}
          onChange={(e) => setDoo(e.target.value)}
          className="polje flex-1"
          step={900}
        />
      </div>

      {nevalja && (
        <p className="text-sm text-warn">Kraj mora biti posle pocetka.</p>
      )}
    </div>
  );
}
