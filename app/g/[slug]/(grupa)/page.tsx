import Link from "next/link";
import { PreklapanjaPanel } from "@/components/PreklapanjaPanel";
import { requireGroupWithAvailability } from "@/lib/guard";
import { todayIsoInZone } from "@/lib/time";

export default async function PreklapanjaStrana({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const { slug } = await params;
  const { novo } = await searchParams;
  const { members } = await requireGroupWithAvailability(slug);

  // "Danas" racunamo po beogradskom vremenu na serveru, da klijent i server
  // krenu od istog dana i da ne bude neslaganja pri hidraciji.
  const danas = todayIsoInZone();

  return (
    <div className="space-y-6">
      {novo && (
        <section className="rounded-2xl border border-accent/30 bg-accent-soft p-4">
          <h2 className="font-medium text-accent">Grupa je napravljena</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-accent/90">
            <li>
              Dodaj sebe i rodjake u tabu{" "}
              <Link href={`/g/${slug}/clanovi`} className="underline">
                Clanovi
              </Link>
              .
            </li>
            <li>Posalji link dugmetom gore desno, a PIN posebnom porukom.</li>
            <li>Svako podesi svoj nedeljni sablon i termini se pojave ovde.</li>
          </ol>
        </section>
      )}

      <PreklapanjaPanel slug={slug} members={members} danas={danas} />
    </div>
  );
}
