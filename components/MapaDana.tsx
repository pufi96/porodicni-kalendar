"use client";

import {
  DANI_KRATKO,
  addDaysIso,
  isoToLocalDate,
  isoWeekday,
  MESECI,
  mnozina,
} from "@/lib/time";

/**
 * Mreza narednih nedelja, red = nedelja, kolona = dan (pon-ned).
 * Sto je polje tamnije, vise ljudi se tog dana poklapa.
 */
export function MapaDana({
  startDate,
  days,
  brojPoDanu,
  ukupno,
  izabran,
  onIzbor,
}: {
  startDate: string;
  days: number;
  brojPoDanu: Record<string, number>;
  ukupno: number;
  izabran: string | null;
  onIzbor: (date: string) => void;
}) {
  // Poravnavamo pocetak na ponedeljak da kolone uvek budu isti dani.
  const pomak = isoWeekday(startDate) - 1;
  const prviPon = addDaysIso(startDate, -pomak);
  const brojNedelja = Math.ceil((days + pomak) / 7);

  function jacina(broj: number): { bg: string; text: string } {
    if (broj < 2) return { bg: "var(--surface-2)", text: "var(--muted)" };
    const udeo = ukupno > 1 ? (broj - 1) / (ukupno - 1) : 1;
    // Ista nijansa, raste zasicenost - lakse za citanje od duge boja.
    return {
      bg: `color-mix(in srgb, var(--accent) ${Math.round(15 + udeo * 75)}%, var(--surface))`,
      text: udeo > 0.5 ? "#fff" : "var(--text)",
    };
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {DANI_KRATKO.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted">
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {Array.from({ length: brojNedelja }, (_, w) => (
          <div key={w} className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, d) => {
              const date = addDaysIso(prviPon, w * 7 + d);
              const uOpsegu = date >= startDate && date < addDaysIso(startDate, days);
              const broj = brojPoDanu[date] ?? 0;
              const dan = isoToLocalDate(date);
              const prviUMesecu = dan.getDate() === 1;

              if (!uOpsegu) {
                return (
                  <div
                    key={date}
                    className="aspect-square rounded-lg opacity-30"
                    style={{ background: "var(--surface-2)" }}
                    aria-hidden
                  />
                );
              }

              const { bg, text } = jacina(broj);
              const aktivan = izabran === date;

              return (
                <button
                  key={date}
                  onClick={() => onIzbor(date)}
                  style={{ background: bg, color: text }}
                  className={`relative aspect-square rounded-lg text-sm font-medium transition
                    ${aktivan ? "ring-2 ring-accent ring-offset-1 ring-offset-bg" : ""}`}
                  title={`${date} - ${broj} ${mnozina(broj, "osoba", "osobe", "osoba")} moze`}
                >
                  {dan.getDate()}
                  {prviUMesecu && (
                    <span className="absolute inset-x-0 -bottom-0.5 text-[9px] leading-none opacity-70">
                      {MESECI[dan.getMonth()].slice(0, 3)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 text-xs text-muted">
        <span>manje</span>
        <div className="flex gap-0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((u) => (
            <span
              key={u}
              className="h-3 w-4 rounded-sm"
              style={{
                background: `color-mix(in srgb, var(--accent) ${Math.round(15 + u * 75)}%, var(--surface))`,
              }}
            />
          ))}
        </div>
        <span>vise ljudi</span>
      </div>
    </div>
  );
}
