"use client";

import { hhmmToMin, minToHHMM } from "@/lib/time";

export const BRZI_OPSEZI: { naziv: string; od: string; do: string }[] = [
  { naziv: "Posle posla", od: "18:00", do: "22:00" },
  { naziv: "Prepodne", od: "09:00", do: "13:00" },
  { naziv: "Popodne", od: "14:00", do: "18:00" },
  { naziv: "Ceo dan", od: "09:00", do: "22:00" },
];

const SATI = Array.from({ length: 25 }, (_, i) => i); // 00..24
const MINUTI = [0, 15, 30, 45];

function rasclani(v: string): { sat: number; min: number } {
  const m = hhmmToMin(v);
  if (m === null) return { sat: 18, min: 0 };
  return { sat: Math.floor(m / 60), min: m % 60 };
}

/**
 * Dva dropdowna (sat, minut) umesto <input type="time">. Nativni time input
 * se prikazuje u 12h AM/PM formatu kad je OS region postavljen na engleski,
 * bez obzira sto je ostatak strane na srpskom - ovako je prikaz uvek 24h,
 * bez obzira na regionalna podesavanja uredjaja.
 */
function SelektorVremena({
  vrednost,
  onChange,
  oznaka,
}: {
  vrednost: string;
  onChange: (v: string) => void;
  oznaka: string;
}) {
  const { sat, min } = rasclani(vrednost);

  return (
    <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
      <select
        aria-label={`${oznaka} - sat`}
        className="w-full appearance-none bg-transparent py-3 pl-3 pr-1 text-center outline-none"
        value={sat}
        onChange={(e) => {
          const noviSat = Number(e.target.value);
          // 24 ima smisla samo kao 24:00 - ostali minuti bi bili van dana.
          onChange(minToHHMM(noviSat * 60 + (noviSat === 24 ? 0 : min)));
        }}
      >
        {SATI.map((s) => (
          <option key={s} value={s}>
            {String(s).padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className="text-muted">:</span>
      <select
        aria-label={`${oznaka} - minut`}
        className="w-full appearance-none bg-transparent py-3 pl-1 pr-3 text-center outline-none disabled:opacity-40"
        value={min}
        disabled={sat === 24}
        onChange={(e) => onChange(minToHHMM(sat * 60 + Number(e.target.value)))}
      >
        {MINUTI.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>
    </div>
  );
}

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
        <SelektorVremena vrednost={od} onChange={setOd} oznaka="Od" />
        <span className="text-muted">do</span>
        <SelektorVremena vrednost={doo} onChange={setDoo} oznaka="Do" />
      </div>

      {nevalja && (
        <p className="text-sm text-warn">Kraj mora biti posle pocetka.</p>
      )}
    </div>
  );
}
