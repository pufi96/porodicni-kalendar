import { randomBytes } from "node:crypto";

// Nase i strane dijakritike -> osnovna latinica, da slug ostane URL-bezbedan.
const MAPA: Record<string, string> = {
  č: "c", ć: "c", đ: "dj", š: "s", ž: "z",
  Č: "c", Ć: "c", Đ: "dj", Š: "s", Ž: "z",
  á: "a", à: "a", ä: "a", é: "e", è: "e", í: "i", ó: "o", ö: "o", ú: "u", ü: "u",
};

export function slugify(s: string): string {
  return s
    .split("")
    .map((ch) => MAPA[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

/**
 * Slug je prva brava na vratima: link mora biti neprovaljiv nagadjanjem,
 * jer je PIN sam po sebi slab. Zato uvek ide slucajan sufiks.
 */
export function makeSlug(name: string): string {
  const osnova = slugify(name) || "grupa";
  const sufiks = randomBytes(4).toString("hex").slice(0, 6);
  return `${osnova}-${sufiks}`;
}

/** Boje clanova - biraju se redom, dovoljno razlicite da se razaznaju na traci. */
export const BOJE = [
  "#e11d48", // rozecrvena
  "#0891b2", // tirkiz
  "#ca8a04", // zlatna
  "#7c3aed", // ljubicasta
  "#059669", // zelena
  "#ea580c", // narandzasta
  "#2563eb", // plava
  "#db2777", // pink
  "#65a30d", // maslinasta
  "#9333ea", // violet
  "#0d9488", // teal
  "#dc2626", // crvena
  "#4f46e5", // indigo
  "#a16207", // braon
  "#16a34a", // trava
];

export function nextColor(usedCount: number): string {
  return BOJE[usedCount % BOJE.length];
}

export const PIN_REGEX = /^\d{4,6}$/;
