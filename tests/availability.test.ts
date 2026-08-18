import { describe, expect, it } from "vitest";
import {
  bestCountByDate,
  findWindows,
  findWindowsForDay,
  normalizeIntervals,
  resolveDay,
  type MemberInput,
} from "../lib/availability";
import {
  addDaysIso,
  formatTrajanje,
  hhmmToMin,
  isoWeekday,
  minToHHMM,
} from "../lib/time";

// U 2026: 17.8. je ponedeljak, 18.8. utorak, 22.8. subota, 23.8. nedelja.
const PON = "2026-08-17";
const UTO = "2026-08-18";
const SUB = "2026-08-22";
const NED = "2026-08-23";

const h = (n: number) => n * 60;

function member(
  id: string,
  recurring: { weekday: number; startMin: number; endMin: number }[],
  overrides: { date: string; slots: { startMin: number; endMin: number }[] }[] = []
): MemberInput {
  return { id, name: id, color: "#000000", recurring, overrides };
}

describe("time helpers", () => {
  it("prevodi minute u HH:mm i nazad", () => {
    expect(minToHHMM(1080)).toBe("18:00");
    expect(minToHHMM(0)).toBe("00:00");
    expect(minToHHMM(1439)).toBe("23:59");
    expect(hhmmToMin("18:00")).toBe(1080);
    expect(hhmmToMin("9:30")).toBe(570);
    expect(hhmmToMin("24:00")).toBe(1440);
  });

  it("odbija neispravan unos vremena", () => {
    expect(hhmmToMin("25:00")).toBeNull();
    expect(hhmmToMin("18:70")).toBeNull();
    expect(hhmmToMin("osamnaest")).toBeNull();
  });

  it("racuna ISO dan u nedelji, ponedeljak = 1", () => {
    expect(isoWeekday(PON)).toBe(1);
    expect(isoWeekday(SUB)).toBe(6);
    expect(isoWeekday(NED)).toBe(7);
  });

  it("pomera datume preko granice meseca i godine bez UTC pomaka", () => {
    expect(addDaysIso("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysIso("2026-03-01", -1)).toBe("2026-02-28");
    // Prelazak na letnje racunanje vremena (poslednja nedelja marta)
    expect(addDaysIso("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDaysIso("2026-03-29", 1)).toBe("2026-03-30");
  });

  it("formatira trajanje", () => {
    expect(formatTrajanje(120)).toBe("2h");
    expect(formatTrajanje(150)).toBe("2h 30min");
    expect(formatTrajanje(45)).toBe("45min");
  });
});

describe("normalizeIntervals", () => {
  it("spaja preklapajuce i dodirujuce intervale", () => {
    expect(
      normalizeIntervals([
        { startMin: h(10), endMin: h(12) },
        { startMin: h(11), endMin: h(14) },
      ])
    ).toEqual([{ startMin: h(10), endMin: h(14) }]);

    expect(
      normalizeIntervals([
        { startMin: h(9), endMin: h(12) },
        { startMin: h(12), endMin: h(15) },
      ])
    ).toEqual([{ startMin: h(9), endMin: h(15) }]);
  });

  it("ostavlja razdvojene intervale i odbacuje prazne", () => {
    expect(
      normalizeIntervals([
        { startMin: h(18), endMin: h(22) },
        { startMin: h(9), endMin: h(12) },
        { startMin: h(13), endMin: h(13) },
      ])
    ).toEqual([
      { startMin: h(9), endMin: h(12) },
      { startMin: h(18), endMin: h(22) },
    ]);
  });
});

describe("resolveDay", () => {
  const pera = member(
    "pera",
    [
      { weekday: 1, startMin: h(18), endMin: h(22) },
      { weekday: 6, startMin: h(9), endMin: h(23) },
    ],
    [
      // Ovog ponedeljka ipak ne moze uopste
      { date: PON, slots: [] },
      // Ove subote moze samo uvece
      { date: SUB, slots: [{ startMin: h(19), endMin: h(23) }] },
    ]
  );

  it("razvija nedeljni sablon kada nema izuzetka", () => {
    const drugiPon = addDaysIso(PON, 7);
    expect(resolveDay(pera, drugiPon)).toEqual([{ startMin: h(18), endMin: h(22) }]);
  });

  it("izuzetak sa praznom listom gasi ceo dan, ne pada nazad na sablon", () => {
    expect(resolveDay(pera, PON)).toEqual([]);
  });

  it("izuzetak sa slotovima potpuno zamenjuje sablon", () => {
    expect(resolveDay(pera, SUB)).toEqual([{ startMin: h(19), endMin: h(23) }]);
  });

  it("vraca prazno za dan koji sablon ne pokriva", () => {
    expect(resolveDay(pera, UTO)).toEqual([]);
  });
});

describe("findWindowsForDay", () => {
  it("dodirivanje krajeva nije preklapanje", () => {
    const a = member("a", [{ weekday: 6, startMin: h(9), endMin: h(18) }]);
    const b = member("b", [{ weekday: 6, startMin: h(18), endMin: h(23) }]);
    const wins = findWindowsForDay(SUB, [a, b], { minMembers: 2, minDurationMin: 30 });
    expect(wins).toEqual([]);
  });

  it("clan sa dva slota istog dana se ne broji dvaput", () => {
    const a = member("a", [
      { weekday: 6, startMin: h(9), endMin: h(12) },
      { weekday: 6, startMin: h(18), endMin: h(22) },
    ]);
    const wins = findWindowsForDay(SUB, [a], { minMembers: 2, minDurationMin: 60 });
    expect(wins).toEqual([]);
  });

  it("nalazi i duzi termin sa manje ljudi i kraci sa vise", () => {
    // a: 9-12, b: 10-14, c: 11-13
    const a = member("a", [{ weekday: 6, startMin: h(9), endMin: h(12) }]);
    const b = member("b", [{ weekday: 6, startMin: h(10), endMin: h(14) }]);
    const c = member("c", [{ weekday: 6, startMin: h(11), endMin: h(13) }]);

    const wins = findWindowsForDay(SUB, [a, b, c], {
      minMembers: 2,
      minDurationMin: 60,
    });

    const kao = wins.map((w) => ({
      od: w.startMin / 60,
      do: w.endMin / 60,
      ko: [...w.memberIds].sort().join(","),
    }));

    expect(kao).toContainEqual({ od: 11, do: 12, ko: "a,b,c" });
    expect(kao).toContainEqual({ od: 10, do: 12, ko: "a,b" });
    expect(kao).toContainEqual({ od: 11, do: 13, ko: "b,c" });
    // [12,13) {b,c} je nadmasen sa [11,13) {b,c} i mora biti izbacen
    expect(kao).not.toContainEqual({ od: 12, do: 13, ko: "b,c" });
  });

  it("postuje minimalno trajanje", () => {
    const a = member("a", [{ weekday: 6, startMin: h(10), endMin: h(11) }]);
    const b = member("b", [{ weekday: 6, startMin: h(10), endMin: h(11) }]);
    expect(
      findWindowsForDay(SUB, [a, b], { minMembers: 2, minDurationMin: 120 })
    ).toEqual([]);
    expect(
      findWindowsForDay(SUB, [a, b], { minMembers: 2, minDurationMin: 60 })
    ).toHaveLength(1);
  });

  it("ne spaja termine preko rupe u vremenu", () => {
    const a = member("a", [
      { weekday: 6, startMin: h(9), endMin: h(11) },
      { weekday: 6, startMin: h(15), endMin: h(18) },
    ]);
    const b = member("b", [
      { weekday: 6, startMin: h(9), endMin: h(11) },
      { weekday: 6, startMin: h(15), endMin: h(18) },
    ]);
    const wins = findWindowsForDay(SUB, [a, b], { minMembers: 2, minDurationMin: 60 });
    expect(wins).toHaveLength(2);
    expect(wins.every((w) => w.endMin - w.startMin <= h(3))).toBe(true);
  });

  it("popunjava missingIds onima koji ne mogu ceo termin", () => {
    const a = member("a", [{ weekday: 6, startMin: h(10), endMin: h(14) }]);
    const b = member("b", [{ weekday: 6, startMin: h(10), endMin: h(14) }]);
    const c = member("c", [{ weekday: 6, startMin: h(20), endMin: h(22) }]);
    const wins = findWindowsForDay(SUB, [a, b, c], {
      minMembers: 2,
      minDurationMin: 120,
    });
    const jutarnji = wins.find((w) => w.startMin === h(10));
    expect(jutarnji?.memberIds.sort()).toEqual(["a", "b"]);
    expect(jutarnji?.missingIds).toEqual(["c"]);
  });
});

describe("findWindows (rangiranje kroz dane)", () => {
  const opts = {
    startDate: PON,
    days: 7,
    minDurationMin: 120,
    maxMissing: 1,
  };

  // Svi mogu subotom 10-14; utorkom mogu samo dvoje, ali 4 sata.
  const a = member("a", [
    { weekday: 6, startMin: h(10), endMin: h(14) },
    { weekday: 2, startMin: h(16), endMin: h(20) },
  ]);
  const b = member("b", [
    { weekday: 6, startMin: h(10), endMin: h(14) },
    { weekday: 2, startMin: h(16), endMin: h(20) },
  ]);
  const c = member("c", [{ weekday: 6, startMin: h(10), endMin: h(13) }]);

  it("prvo rangira po broju ljudi, pa po duzini", () => {
    const wins = findWindows([a, b, c], opts);
    expect(wins.length).toBeGreaterThan(0);
    const prvi = wins[0];
    expect(prvi.memberIds.length).toBe(3);
    expect(prvi.date).toBe(SUB);
    expect(prvi.startMin).toBe(h(10));
    expect(prvi.endMin).toBe(h(13));

    // Rangiranje mora biti monotono po broju ljudi
    for (let i = 1; i < wins.length; i++) {
      expect(wins[i - 1].memberIds.length).toBeGreaterThanOrEqual(
        wins[i].memberIds.length
      );
    }
  });

  it("maxMissing = 0 trazi da mogu svi", () => {
    const wins = findWindows([a, b, c], { ...opts, maxMissing: 0 });
    expect(wins.every((w) => w.memberIds.length === 3)).toBe(true);
    expect(wins.every((w) => w.date === SUB)).toBe(true);
  });

  it("vraca prazno kada je grupa manja od dvoje", () => {
    expect(findWindows([a], opts)).toEqual([]);
    expect(findWindows([], opts)).toEqual([]);
  });

  it("bestCountByDate daje maksimum po danu za heat-mapu", () => {
    const map = bestCountByDate([a, b, c], opts);
    expect(map[SUB]).toBe(3);
    expect(map[UTO]).toBe(2);
    expect(map[NED]).toBe(0);
  });
});
