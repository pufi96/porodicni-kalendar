// Srce aplikacije: iz sablona i izuzetaka izracunaj kada se ljudi poklapaju.
// Sve funkcije su ciste (bez baze i bez Date.now()) da bi bile testabilne.

import { addDaysIso, isoWeekday, MINUTES_IN_DAY } from "./time";

export type Interval = { startMin: number; endMin: number };

export type MemberInput = {
  id: string;
  name: string;
  color: string;
  /** Nedeljni sablon. weekday: 1 = ponedeljak ... 7 = nedelja. */
  recurring: { weekday: number; startMin: number; endMin: number }[];
  /** Izuzeci po datumu. Postojanje unosa gasi sablon za taj dan. */
  overrides: { date: string; slots: Interval[] }[];
};

export type Window = {
  date: string;
  startMin: number;
  endMin: number;
  /** Clanovi slobodni tokom CELOG ovog intervala. */
  memberIds: string[];
  /** Clanovi grupe koji nisu slobodni ceo interval. */
  missingIds: string[];
};

/** Sortira, odbacuje prazne i spaja intervale koji se preklapaju ili dodiruju. */
export function normalizeIntervals(list: Interval[]): Interval[] {
  const valid = list
    .filter((i) => i.endMin > i.startMin)
    .map((i) => ({
      startMin: Math.max(0, i.startMin),
      endMin: Math.min(MINUTES_IN_DAY, i.endMin),
    }))
    .filter((i) => i.endMin > i.startMin)
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const out: Interval[] = [];
  for (const iv of valid) {
    const last = out[out.length - 1];
    if (last && iv.startMin <= last.endMin) {
      last.endMin = Math.max(last.endMin, iv.endMin);
    } else {
      out.push({ ...iv });
    }
  }
  return out;
}

/**
 * Dostupnost jednog clana za jedan datum.
 * Pravilo: ako za taj datum postoji izuzetak, vaze njegovi slotovi
 * (prazna lista = nije slobodan). Inace se razvija nedeljni sablon.
 */
export function resolveDay(member: MemberInput, dateIso: string): Interval[] {
  const override = member.overrides.find((o) => o.date === dateIso);
  if (override) return normalizeIntervals(override.slots);

  const wd = isoWeekday(dateIso);
  return normalizeIntervals(
    member.recurring
      .filter((r) => r.weekday === wd)
      .map((r) => ({ startMin: r.startMin, endMin: r.endMin }))
  );
}

/** Da li je clan slobodan bar delimicno tog dana. */
export function isFreeOnDay(member: MemberInput, dateIso: string): boolean {
  return resolveDay(member, dateIso).length > 0;
}

type Segment = { start: number; end: number; ids: Set<string> };

/**
 * Sweep-line: podeli dan na segmente izmedju svih pocetaka i krajeva,
 * pa za svaki segment zapamti ko je tada slobodan.
 */
function buildSegments(perMember: { id: string; intervals: Interval[] }[]): Segment[] {
  type Ev = { t: number; delta: number; id: string };
  const events: Ev[] = [];
  for (const m of perMember) {
    for (const iv of m.intervals) {
      events.push({ t: iv.startMin, delta: 1, id: m.id });
      events.push({ t: iv.endMin, delta: -1, id: m.id });
    }
  }
  if (events.length === 0) return [];

  // Zatvaranja pre otvaranja na istoj tacki: ako jedan zavrsava u 18:00
  // a drugi tad pocinje, to NIJE preklapanje.
  events.sort((a, b) => a.t - b.t || a.delta - b.delta);

  const segments: Segment[] = [];
  const active = new Set<string>();
  let i = 0;
  while (i < events.length) {
    const t = events[i].t;
    while (i < events.length && events[i].t === t) {
      const ev = events[i];
      if (ev.delta === 1) active.add(ev.id);
      else active.delete(ev.id);
      i++;
    }
    if (i < events.length && active.size > 0) {
      const next = events[i].t;
      if (next > t) segments.push({ start: t, end: next, ids: new Set(active) });
    }
  }
  return segments;
}

function isSuperset(a: Set<string>, b: Set<string>): boolean {
  if (a.size < b.size) return false;
  for (const x of b) if (!a.has(x)) return false;
  return true;
}

/**
 * Svi maksimalni termini za jedan dan.
 * Enumerise se svaki raspon segmenata (i..j) i uzima presek clanova - kvadratno,
 * ali segmenata po danu ima svega nekoliko desetina pa je to trenutno.
 * Na kraju se izbacuju termini koje neki drugi termin nadmasuje
 * i po skupu ljudi i po duzini.
 */
export function findWindowsForDay(
  dateIso: string,
  members: MemberInput[],
  opts: { minMembers: number; minDurationMin: number }
): Window[] {
  const perMember = members
    .map((m) => ({ id: m.id, intervals: resolveDay(m, dateIso) }))
    .filter((m) => m.intervals.length > 0);

  const segments = buildSegments(perMember);
  const allIds = members.map((m) => m.id);
  const candidates: Window[] = [];

  for (let i = 0; i < segments.length; i++) {
    let acc = new Set(segments[i].ids);
    for (let j = i; j < segments.length; j++) {
      // Prekid u vremenu znaci da dalje sirenje nije neprekidan termin.
      if (j > i && segments[j].start !== segments[j - 1].end) break;
      if (j > i) {
        const next = new Set<string>();
        for (const id of acc) if (segments[j].ids.has(id)) next.add(id);
        acc = next;
      }
      if (acc.size < opts.minMembers) break; // presek moze samo da se smanjuje

      const start = segments[i].start;
      const end = segments[j].end;
      if (end - start < opts.minDurationMin) continue;

      const ids = [...acc];
      candidates.push({
        date: dateIso,
        startMin: start,
        endMin: end,
        memberIds: ids,
        missingIds: allIds.filter((id) => !acc.has(id)),
      });
    }
  }

  // Izbaci termin ako postoji drugi sa nadskupom ljudi I sirim rasponom.
  return candidates.filter((w, idx) =>
    !candidates.some((o, oIdx) => {
      if (oIdx === idx) return false;
      const wider = o.startMin <= w.startMin && o.endMin >= w.endMin;
      const richer = isSuperset(new Set(o.memberIds), new Set(w.memberIds));
      if (!wider || !richer) return false;
      const strictlyBetter =
        o.memberIds.length > w.memberIds.length ||
        o.endMin - o.startMin > w.endMin - w.startMin;
      // Kod potpuno istih termina zadrzi samo prvi.
      return strictlyBetter || oIdx < idx;
    })
  );
}

export type FindOptions = {
  /** Prvi dan koji se gleda, ukljucen. */
  startDate: string;
  /** Koliko dana unapred. */
  days: number;
  /** Najkrace prihvatljivo druzenje, u minutima. */
  minDurationMin: number;
  /** Koliko ljudi sme da fali. 0 = moraju svi. */
  maxMissing: number;
};

/** Rangirani termini kroz vise dana: prvo vise ljudi, pa duze, pa ranije. */
export function findWindows(members: MemberInput[], opts: FindOptions): Window[] {
  const total = members.length;
  if (total < 2) return [];
  const minMembers = Math.max(2, total - opts.maxMissing);

  const out: Window[] = [];
  for (let i = 0; i < opts.days; i++) {
    const date = addDaysIso(opts.startDate, i);
    out.push(
      ...findWindowsForDay(date, members, {
        minMembers,
        minDurationMin: opts.minDurationMin,
      })
    );
  }

  return out.sort(
    (a, b) =>
      b.memberIds.length - a.memberIds.length ||
      b.endMin - b.startMin - (a.endMin - a.startMin) ||
      a.date.localeCompare(b.date) ||
      a.startMin - b.startMin
  );
}

/**
 * Za heat-mapu: po datumu, najveci broj ljudi koji se tog dana
 * poklapaju bar `minDurationMin`.
 */
export function bestCountByDate(
  members: MemberInput[],
  opts: FindOptions
): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < opts.days; i++) {
    const date = addDaysIso(opts.startDate, i);
    const wins = findWindowsForDay(date, members, {
      minMembers: 2,
      minDurationMin: opts.minDurationMin,
    });
    map[date] = wins.reduce((mx, w) => Math.max(mx, w.memberIds.length), 0);
  }
  return map;
}
