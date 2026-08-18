"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hasGroupAccess } from "@/lib/session";
import { MINUTES_IN_DAY } from "@/lib/time";

export type StanjeDostupnosti = { greska?: string };

/** Server akcije su javni endpointi - pristup se proverava u svakoj. */
async function clanZaAkciju(slug: string, memberId: string) {
  const g = await db.group.findUnique({ where: { slug }, select: { id: true } });
  if (!g) throw new Error("Grupa ne postoji.");
  if (!(await hasGroupAccess(g.id))) throw new Error("Nemas pristup ovoj grupi.");

  const clan = await db.member.findFirst({
    where: { id: memberId, groupId: g.id },
    select: { id: true },
  });
  if (!clan) throw new Error("Taj clan nije u ovoj grupi.");
  return { groupId: g.id, memberId: clan.id };
}

function proveriOpseg(od: number, doo: number): string | null {
  if (!Number.isInteger(od) || !Number.isInteger(doo)) return "Neispravno vreme.";
  if (od < 0 || doo > MINUTES_IN_DAY) return "Vreme mora biti izmedju 00:00 i 24:00.";
  if (doo <= od) return "Kraj mora biti posle pocetka.";
  return null;
}

// --- Nedeljni sablon --------------------------------------------------------

export async function dodajSablonSlot(
  _prev: StanjeDostupnosti,
  formData: FormData
): Promise<StanjeDostupnosti> {
  const slug = String(formData.get("slug") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const weekday = Number(formData.get("weekday"));
  const od = Number(formData.get("od"));
  const doo = Number(formData.get("do"));

  if (weekday < 1 || weekday > 7) return { greska: "Neispravan dan." };
  const greska = proveriOpseg(od, doo);
  if (greska) return { greska };

  const { memberId: mid } = await clanZaAkciju(slug, memberId);
  await db.recurringSlot.create({
    data: { memberId: mid, weekday, startMin: od, endMin: doo },
  });

  revalidatePath(`/g/${slug}`, "layout");
  return {};
}

export async function obrisiSablonSlot(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const slotId = String(formData.get("slotId") ?? "");

  const { memberId: mid } = await clanZaAkciju(slug, memberId);
  await db.recurringSlot.deleteMany({ where: { id: slotId, memberId: mid } });
  revalidatePath(`/g/${slug}`, "layout");
}

/** Brzi presetovi - zamenjuju ceo sablon, da se ne gomilaju duplikati. */
export async function primeniPreset(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const preset = String(formData.get("preset") ?? "");

  const { memberId: mid } = await clanZaAkciju(slug, memberId);

  const sabloni: Record<string, { weekday: number; startMin: number; endMin: number }[]> = {
    "posle-posla": [1, 2, 3, 4, 5].map((d) => ({
      weekday: d,
      startMin: 18 * 60,
      endMin: 22 * 60,
    })),
    "vikend": [6, 7].map((d) => ({
      weekday: d,
      startMin: 10 * 60,
      endMin: 22 * 60,
    })),
    "uvek": [1, 2, 3, 4, 5, 6, 7].map((d) => ({
      weekday: d,
      startMin: 9 * 60,
      endMin: 22 * 60,
    })),
    "obrisi": [],
  };

  const novi = sabloni[preset];
  if (!novi) return;

  await db.$transaction([
    db.recurringSlot.deleteMany({ where: { memberId: mid } }),
    ...(novi.length
      ? [db.recurringSlot.createMany({ data: novi.map((s) => ({ ...s, memberId: mid })) })]
      : []),
  ]);

  revalidatePath(`/g/${slug}`, "layout");
}

// --- Izuzeci po datumu ------------------------------------------------------

const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Upisuje izuzetak za jedan datum. Slotovi stizu kao JSON niz;
 * prazan niz je punopravno stanje i znaci "tog dana ne mogu uopste".
 */
export async function sacuvajIzuzetak(
  _prev: StanjeDostupnosti,
  formData: FormData
): Promise<StanjeDostupnosti> {
  const slug = String(formData.get("slug") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const date = String(formData.get("date") ?? "");
  const sirovi = String(formData.get("slots") ?? "[]");

  if (!ISO_DATUM.test(date)) return { greska: "Izaberi datum." };

  let slots: { startMin: number; endMin: number }[];
  try {
    const p = JSON.parse(sirovi);
    if (!Array.isArray(p)) throw new Error();
    slots = p.map((s: { startMin: number; endMin: number }) => ({
      startMin: Number(s.startMin),
      endMin: Number(s.endMin),
    }));
  } catch {
    return { greska: "Neispravni termini." };
  }

  for (const s of slots) {
    const greska = proveriOpseg(s.startMin, s.endMin);
    if (greska) return { greska };
  }

  const { memberId: mid } = await clanZaAkciju(slug, memberId);

  // Stari izuzetak se brise pa upisuje nov: slotovi su vezani za njega,
  // pa kaskadno brisanje sredi i njih.
  await db.$transaction([
    db.dayOverride.deleteMany({ where: { memberId: mid, date } }),
    db.dayOverride.create({
      data: {
        memberId: mid,
        date,
        slots: { create: slots },
      },
    }),
  ]);

  revalidatePath(`/g/${slug}`, "layout");
  return {};
}

/** Vraca dan na nedeljni sablon. */
export async function obrisiIzuzetak(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const date = String(formData.get("date") ?? "");

  const { memberId: mid } = await clanZaAkciju(slug, memberId);
  await db.dayOverride.deleteMany({ where: { memberId: mid, date } });
  revalidatePath(`/g/${slug}`, "layout");
}
