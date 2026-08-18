// Sve vreme u aplikaciji je lokalno beogradsko i cuva se kao broj minuta
// od ponoci. Datumi su "YYYY-MM-DD" stringovi. Nijedna funkcija ovde ne
// pravi Date iz stringa bez eksplicitne kontrole, jer `new Date("2026-08-22")`
// parsira kao UTC ponoc i u minusnim zonama vraca prethodni dan.

export const MINUTES_IN_DAY = 24 * 60;

export const DANI_KRATKO = ["Pon", "Uto", "Sre", "Cet", "Pet", "Sub", "Ned"];
export const DANI_PUNO = [
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Cetvrtak",
  "Petak",
  "Subota",
  "Nedelja",
];
export const MESECI = [
  "januar", "februar", "mart", "april", "maj", "jun",
  "jul", "avgust", "septembar", "oktobar", "novembar", "decembar",
];

/** 1080 -> "18:00" */
export function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "18:00" -> 1080. Vraca null za neispravan unos. */
export function hhmmToMin(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 24 || mm > 59) return null;
  const total = h * 60 + mm;
  return total > MINUTES_IN_DAY ? null : total;
}

/** "2026-08-22" -> Date u LOKALNOJ zoni (ne UTC). */
export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date -> "2026-08-22", po lokalnim komponentama, bez UTC pomeranja. */
export function localDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return localDateToIso(new Date());
}

/** Svi clanovi su u Srbiji, pa je ovo jedina zona koja nas zanima. */
export const ZONA = "Europe/Belgrade";

/**
 * "Danas" po beogradskom vremenu, bez obzira gde server radi.
 * Vercel funkcije rade u UTC, pa bi todayIso() posle 22h vratio juce.
 */
export function todayIsoInZone(zone: string = ZONA): string {
  const delovi = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const uzmi = (tip: string) => delovi.find((d) => d.type === tip)?.value ?? "";
  return `${uzmi("year")}-${uzmi("month")}-${uzmi("day")}`;
}

/** ISO dan u nedelji: 1 = ponedeljak ... 7 = nedelja. */
export function isoWeekday(iso: string): number {
  const js = isoToLocalDate(iso).getDay(); // 0 = nedelja
  return js === 0 ? 7 : js;
}

export function addDaysIso(iso: string, days: number): string {
  const d = isoToLocalDate(iso);
  d.setDate(d.getDate() + days);
  return localDateToIso(d);
}

/** Niz uzastopnih datuma, pocevsi od `startIso`, duzine `count`. */
export function dateRange(startIso: string, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(addDaysIso(startIso, i));
  return out;
}

/** "Sub 22.8." - kratak prikaz za liste termina. */
export function formatDanKratko(iso: string): string {
  const d = isoToLocalDate(iso);
  return `${DANI_KRATKO[isoWeekday(iso) - 1]} ${d.getDate()}.${d.getMonth() + 1}.`;
}

/** "subota, 22. avgust" - duzi prikaz za zaglavlje dana. */
export function formatDanPuno(iso: string): string {
  const d = isoToLocalDate(iso);
  return `${DANI_PUNO[isoWeekday(iso) - 1].toLowerCase()}, ${d.getDate()}. ${MESECI[d.getMonth()]}`;
}

/**
 * Srpska mnozina: 1 osoba, 2-4 osobe, 5+ osoba.
 * Izuzetak su 11-14, koji uvek idu na "osoba".
 */
export function mnozina(n: number, jedna: string, dve: string, pet: string): string {
  const d = n % 10;
  const dd = n % 100;
  if (dd >= 11 && dd <= 14) return pet;
  if (d === 1) return jedna;
  if (d >= 2 && d <= 4) return dve;
  return pet;
}

/** 150 -> "2h 30min", 120 -> "2h", 45 -> "45min" */
export function formatTrajanje(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
