import { IzborClana } from "@/components/IzborClana";
import { IzuzeciEditor } from "@/components/IzuzeciEditor";
import { SablonEditor } from "@/components/SablonEditor";
import { ZaglavljeClana } from "@/components/ZaglavljeClana";
import { db } from "@/lib/db";
import { requireGroup } from "@/lib/guard";

export default async function MojKalendar({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ko?: string }>;
}) {
  const { slug } = await params;
  const { ko } = await searchParams;
  const grupa = await requireGroup(slug);

  const clanovi = grupa.members.map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
  }));

  // Bez ?ko= ne znamo cije termine menjamo - identitet je u pregledacu,
  // pa izbor prepustamo klijentskoj komponenti.
  const clan = ko ? clanovi.find((c) => c.id === ko) : undefined;
  if (!clan) return <IzborClana slug={slug} clanovi={clanovi} />;

  const [sablon, izuzeci] = await Promise.all([
    db.recurringSlot.findMany({
      where: { memberId: clan.id },
      orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
    }),
    db.dayOverride.findMany({
      where: { memberId: clan.id },
      include: { slots: { orderBy: { startMin: "asc" } } },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <ZaglavljeClana slug={slug} clan={clan} clanovi={clanovi} />

      <SablonEditor
        slug={slug}
        memberId={clan.id}
        slotovi={sablon.map((s) => ({
          id: s.id,
          weekday: s.weekday,
          startMin: s.startMin,
          endMin: s.endMin,
        }))}
      />

      <IzuzeciEditor
        slug={slug}
        memberId={clan.id}
        izuzeci={izuzeci.map((o) => ({
          date: o.date,
          slots: o.slots.map((s) => ({ startMin: s.startMin, endMin: s.endMin })),
        }))}
      />
    </div>
  );
}
