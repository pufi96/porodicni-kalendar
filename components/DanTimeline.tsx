"use client";

import { resolveDay, type MemberInput } from "@/lib/availability";
import { formatDanPuno, minToHHMM } from "@/lib/time";

/**
 * Traka po clanu za jedan dan, plus istaknut presek.
 * Opseg sati se racuna iz podataka - prikaz punih 0-24 bi sve zgurao u ugao.
 */
export function DanTimeline({
  date,
  members,
  istakni,
}: {
  date: string;
  members: MemberInput[];
  istakni?: { startMin: number; endMin: number } | null;
}) {
  const redovi = members.map((m) => ({
    member: m,
    intervals: resolveDay(m, date),
  }));

  const sviIntervali = redovi.flatMap((r) => r.intervals);
  if (sviIntervali.length === 0) {
    return (
      <div className="kartica p-4">
        <p className="font-medium">{formatDanPuno(date)}</p>
        <p className="mt-1 text-sm text-muted">Tog dana niko nije slobodan.</p>
      </div>
    );
  }

  const min = Math.floor(Math.min(...sviIntervali.map((i) => i.startMin)) / 60) * 60;
  const max = Math.ceil(Math.max(...sviIntervali.map((i) => i.endMin)) / 60) * 60;
  const raspon = Math.max(60, max - min);
  const pct = (v: number) => ((v - min) / raspon) * 100;

  const sati: number[] = [];
  const korak = raspon > 8 * 60 ? 180 : 60;
  for (let t = min; t <= max; t += korak) sati.push(t);

  return (
    <div className="kartica space-y-3 p-4">
      <p className="font-medium">{formatDanPuno(date)}</p>

      <div className="space-y-2">
        {redovi.map(({ member, intervals }) => (
          <div key={member.id} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-xs text-muted" title={member.name}>
              {member.name}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-2">
              {istakni && (
                <div
                  className="absolute inset-y-0 bg-accent/15"
                  style={{
                    left: `${pct(istakni.startMin)}%`,
                    width: `${pct(istakni.endMin) - pct(istakni.startMin)}%`,
                  }}
                  aria-hidden
                />
              )}
              {intervals.map((iv, i) => (
                <div
                  key={i}
                  className="absolute inset-y-1 rounded"
                  style={{
                    left: `${pct(iv.startMin)}%`,
                    width: `${Math.max(1.5, pct(iv.endMin) - pct(iv.startMin))}%`,
                    background: member.color,
                  }}
                  title={`${minToHHMM(iv.startMin)}-${minToHHMM(iv.endMin)}`}
                />
              ))}
              {intervals.length === 0 && (
                <span className="absolute inset-0 flex items-center pl-2 text-[11px] text-muted">
                  ne moze
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <span className="w-20 shrink-0" aria-hidden />
        <div className="relative h-4 flex-1">
          {sati.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 text-[10px] text-muted"
              style={{ left: `${pct(t)}%` }}
            >
              {minToHHMM(t)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
