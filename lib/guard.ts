import { notFound, redirect } from "next/navigation";
import { db } from "./db";
import { hasGroupAccess } from "./session";
import type { MemberInput } from "./availability";

/** Grupa sa clanovima, bez detalja dostupnosti - dovoljno za zaglavlje i spisak. */
export async function requireGroup(slug: string) {
  const grupa = await db.group.findUnique({
    where: { slug },
    include: { members: { orderBy: { createdAt: "asc" } } },
  });
  if (!grupa) notFound();
  if (!(await hasGroupAccess(grupa.id))) redirect(`/g/${slug}/pin`);
  return grupa;
}

/**
 * Grupa sa punom dostupnoscu svih clanova, spremna za lib/availability.
 * Jedan upit sa ugnjezdenim relacijama - grupe su male (do ~15 ljudi),
 * pa nema potrebe za pametnijim ucitavanjem.
 */
export async function requireGroupWithAvailability(slug: string) {
  const grupa = await db.group.findUnique({
    where: { slug },
    include: {
      members: {
        orderBy: { createdAt: "asc" },
        include: {
          recurring: { orderBy: [{ weekday: "asc" }, { startMin: "asc" }] },
          overrides: {
            include: { slots: { orderBy: { startMin: "asc" } } },
            orderBy: { date: "asc" },
          },
        },
      },
    },
  });
  if (!grupa) notFound();
  if (!(await hasGroupAccess(grupa.id))) redirect(`/g/${slug}/pin`);

  const members: MemberInput[] = grupa.members.map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
    recurring: m.recurring.map((r) => ({
      weekday: r.weekday,
      startMin: r.startMin,
      endMin: r.endMin,
    })),
    overrides: m.overrides.map((o) => ({
      date: o.date,
      slots: o.slots.map((s) => ({ startMin: s.startMin, endMin: s.endMin })),
    })),
  }));

  return { grupa, members };
}

/** Provera da clan zaista pripada grupi - stiti od podmetnutog memberId. */
export async function assertMemberInGroup(memberId: string, groupId: string) {
  const clan = await db.member.findFirst({
    where: { id: memberId, groupId },
    select: { id: true },
  });
  if (!clan) throw new Error("Clan ne pripada ovoj grupi.");
  return clan;
}
