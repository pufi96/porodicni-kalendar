"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { nextColor } from "@/lib/group";
import { hasGroupAccess } from "@/lib/session";

export type StanjeClana = { greska?: string; uspeh?: string };

const MAX_CLANOVA = 30;

/**
 * Svaka akcija mora sama da proveri pristup: server akcije su javni HTTP
 * endpointi, sto sto je stranica koja ih poziva zasticena nista ne znaci.
 */
async function grupaZaAkciju(slug: string) {
  const g = await db.group.findUnique({ where: { slug }, select: { id: true } });
  if (!g) throw new Error("Grupa ne postoji.");
  if (!(await hasGroupAccess(g.id))) throw new Error("Nemas pristup ovoj grupi.");
  return g;
}

export async function dodajClana(
  _prev: StanjeClana,
  formData: FormData
): Promise<StanjeClana> {
  const slug = String(formData.get("slug") ?? "");
  const ime = String(formData.get("ime") ?? "").trim();

  if (ime.length < 2) return { greska: "Upisi ime (bar 2 slova)." };
  if (ime.length > 30) return { greska: "Ime je predugacko (najvise 30 slova)." };

  const g = await grupaZaAkciju(slug);
  const broj = await db.member.count({ where: { groupId: g.id } });
  if (broj >= MAX_CLANOVA) {
    return { greska: `Grupa je puna (najvise ${MAX_CLANOVA} clanova).` };
  }

  const postoji = await db.member.findFirst({
    where: { groupId: g.id, name: ime },
    select: { id: true },
  });
  if (postoji) return { greska: `Vec postoji clan po imenu "${ime}".` };

  await db.member.create({
    data: { groupId: g.id, name: ime, color: nextColor(broj) },
  });

  revalidatePath(`/g/${slug}`, "layout");
  return { uspeh: `${ime} je dodat.` };
}

export async function obrisiClana(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const g = await grupaZaAkciju(slug);

  // Brisanje ide preko groupId da se podmetnut tudji memberId ne primi.
  await db.member.deleteMany({ where: { id: memberId, groupId: g.id } });
  revalidatePath(`/g/${slug}`, "layout");
}

export async function preimenujClana(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const ime = String(formData.get("ime") ?? "").trim();
  if (ime.length < 2 || ime.length > 30) return;

  const g = await grupaZaAkciju(slug);
  await db.member.updateMany({
    where: { id: memberId, groupId: g.id },
    data: { name: ime },
  });
  revalidatePath(`/g/${slug}`, "layout");
}
