import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { db } from "./db";

const COOKIE = "pk_sesija";
const DANA = 90;

// Kolacic pamti SVE grupe za koje je PIN vec unet, da ulazak u drugu
// porodicnu grupu ne izbaci korisnika iz prve.
type Payload = { gids: string[] };

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET nije podesen. Vidi .env.example za generisanje vrednosti."
    );
  }
  return new TextEncoder().encode(s);
}

async function readPayload(): Promise<Payload> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return { gids: [] };
  try {
    const { payload } = await jwtVerify(token, secret());
    const gids = (payload as { gids?: unknown }).gids;
    return { gids: Array.isArray(gids) ? gids.filter((g) => typeof g === "string") : [] };
  } catch {
    // Istekao ili potpis ne valja - tretiraj kao da nije ni bio prijavljen.
    return { gids: [] };
  }
}

async function writePayload(payload: Payload) {
  const token = await new SignJWT({ gids: payload.gids })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DANA}d`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * DANA,
  });
}

/** Dodaje grupu u sesiju posle uspesnog PIN-a. */
export async function grantGroupAccess(groupId: string) {
  const { gids } = await readPayload();
  if (!gids.includes(groupId)) gids.push(groupId);
  await writePayload({ gids });
}

export async function hasGroupAccess(groupId: string): Promise<boolean> {
  const { gids } = await readPayload();
  return gids.includes(groupId);
}

export async function revokeGroupAccess(groupId: string) {
  const { gids } = await readPayload();
  await writePayload({ gids: gids.filter((g) => g !== groupId) });
}

// --- Ogranicavanje pokusaja PIN-a -------------------------------------------
// Mora u bazi: serverless funkcije ne dele memoriju, pa brojac u procesu
// ne bi vazio nista u produkciji.

const PROZOR_MIN = 15;
const MAX_POKUSAJA = 10;

export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "lokalno";
}

export async function pinAttemptsLeft(slug: string, ip: string): Promise<number> {
  const od = new Date(Date.now() - PROZOR_MIN * 60_000);
  const broj = await db.pinAttempt.count({
    where: { groupSlug: slug, ip, at: { gte: od } },
  });
  return Math.max(0, MAX_POKUSAJA - broj);
}

export async function recordPinAttempt(slug: string, ip: string) {
  await db.pinAttempt.create({ data: { groupSlug: slug, ip } });
  // Usput pocisti stare zapise da tabela ne raste beskonacno.
  await db.pinAttempt.deleteMany({
    where: { at: { lt: new Date(Date.now() - PROZOR_MIN * 60_000) } },
  });
}

export async function clearPinAttempts(slug: string, ip: string) {
  await db.pinAttempt.deleteMany({ where: { groupSlug: slug, ip } });
}

export { PROZOR_MIN, MAX_POKUSAJA };
