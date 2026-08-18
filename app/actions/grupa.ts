"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { makeSlug, PIN_REGEX } from "@/lib/group";
import {
  clearPinAttempts,
  clientIp,
  grantGroupAccess,
  pinAttemptsLeft,
  recordPinAttempt,
  revokeGroupAccess,
  PROZOR_MIN,
} from "@/lib/session";

export type StanjeForme = { greska?: string };

export async function napraviGrupu(
  _prev: StanjeForme,
  formData: FormData
): Promise<StanjeForme> {
  const naziv = String(formData.get("naziv") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const pin2 = String(formData.get("pin2") ?? "").trim();

  if (naziv.length < 2) return { greska: "Upisi naziv grupe (bar 2 slova)." };
  if (naziv.length > 40) return { greska: "Naziv je predugacak (najvise 40 slova)." };
  if (!PIN_REGEX.test(pin)) return { greska: "PIN mora imati 4 do 6 cifara." };
  if (pin !== pin2) return { greska: "PIN i potvrda se ne poklapaju." };

  const grupa = await db.group.create({
    data: {
      slug: makeSlug(naziv),
      name: naziv,
      pinHash: await bcrypt.hash(pin, 10),
    },
  });

  await grantGroupAccess(grupa.id);
  // redirect baca izuzetak po dizajnu - mora biti van try/catch bloka.
  redirect(`/g/${grupa.slug}?novo=1`);
}

export async function proveriPin(
  _prev: StanjeForme,
  formData: FormData
): Promise<StanjeForme> {
  const slug = String(formData.get("slug") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();

  const ip = await clientIp();
  const preostalo = await pinAttemptsLeft(slug, ip);
  if (preostalo <= 0) {
    return {
      greska: `Previse pogresnih pokusaja. Probaj ponovo za ${PROZOR_MIN} minuta.`,
    };
  }

  const grupa = await db.group.findUnique({ where: { slug } });
  const ispravan = grupa ? await bcrypt.compare(pin, grupa.pinHash) : false;

  if (!grupa || !ispravan) {
    await recordPinAttempt(slug, ip);
    const ostalo = preostalo - 1;
    return {
      greska:
        ostalo > 0
          ? `Pogresan PIN. Jos ${ostalo} ${ostalo === 1 ? "pokusaj" : "pokusaja"}.`
          : `Previse pogresnih pokusaja. Probaj ponovo za ${PROZOR_MIN} minuta.`,
    };
  }

  await clearPinAttempts(slug, ip);
  await grantGroupAccess(grupa.id);
  redirect(`/g/${slug}`);
}

export async function odjaviSe(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  await revokeGroupAccess(groupId);
  redirect(`/g/${slug}/pin`);
}
