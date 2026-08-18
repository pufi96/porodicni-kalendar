// Demo grupa da odmah vidis kako aplikacija izgleda sa podacima.
// Pokretanje: npm run seed   (PIN je 1234)
// Bezbedno je pokrenuti vise puta - stara demo grupa se prvo obrise.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const h = (n) => n * 60;
const SLUG = "demo-porodica-000001";

const clanovi = [
  {
    name: "Bojan",
    color: "#e11d48",
    // Radnim danima posle posla, subotom ceo dan
    recurring: [
      ...[1, 2, 3, 4, 5].map((d) => ({ weekday: d, startMin: h(18), endMin: h(22) })),
      { weekday: 6, startMin: h(9), endMin: h(22) },
    ],
  },
  {
    name: "Mika",
    color: "#0891b2",
    recurring: [
      { weekday: 2, startMin: h(17), endMin: h(21) },
      { weekday: 4, startMin: h(17), endMin: h(21) },
      { weekday: 6, startMin: h(10), endMin: h(23) },
      { weekday: 7, startMin: h(12), endMin: h(20) },
    ],
  },
  {
    name: "Baba Mara",
    color: "#ca8a04",
    // Penzionerka - skoro uvek moze, ali ne uvece
    recurring: [1, 2, 3, 4, 5, 6, 7].map((d) => ({
      weekday: d,
      startMin: h(9),
      endMin: h(20),
    })),
  },
  {
    name: "Steva",
    color: "#7c3aed",
    recurring: [
      { weekday: 5, startMin: h(19), endMin: h(23) },
      { weekday: 6, startMin: h(14), endMin: h(23) },
      { weekday: 7, startMin: h(10), endMin: h(18) },
    ],
  },
];

/** Prva subota od danas - da demo izuzetak uvek padne na koristan dan. */
function prvaSubota() {
  const d = new Date();
  const indeks = (d.getDay() + 6) % 7; // ponedeljak = 0 ... subota = 5
  d.setDate(d.getDate() + (((5 - indeks + 7) % 7) || 7));
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

await db.group.deleteMany({ where: { slug: SLUG } });

const grupa = await db.group.create({
  data: {
    slug: SLUG,
    name: "Demo porodica",
    pinHash: await bcrypt.hash("1234", 10),
  },
});

for (const c of clanovi) {
  await db.member.create({
    data: {
      groupId: grupa.id,
      name: c.name,
      color: c.color,
      recurring: { create: c.recurring },
    },
  });
}

// Bojan te subote ipak ne moze - da se vidi kako izuzetak gasi sablon.
const bojan = await db.member.findFirst({
  where: { groupId: grupa.id, name: "Bojan" },
});
await db.dayOverride.create({
  data: { memberId: bojan.id, date: prvaSubota(), slots: { create: [] } },
});

console.log(`Demo grupa spremna:
  http://localhost:3000/g/${SLUG}
  PIN: 1234
  Bojan ima izuzetak za ${prvaSubota()} (ne moze).`);

await db.$disconnect();
