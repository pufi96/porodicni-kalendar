"use client";

import Link from "next/link";
import { useIdentitet } from "@/lib/identitet";
import type { ClanKratko } from "@/components/ClanoviPanel";

/**
 * Uvek jasno kaze cije termine trenutno menjas. Namerno bez zabrane:
 * dogovoreno je da se moze unositi i umesto rodjaka bez telefona,
 * ali onda to mora da se vidi na prvi pogled.
 */
export function ZaglavljeClana({
  slug,
  clan,
  clanovi,
}: {
  slug: string;
  clan: ClanKratko;
  clanovi: ClanKratko[];
}) {
  const { ja, postavi, ucitano } = useIdentitet(
    slug,
    clanovi.map((c) => c.id)
  );

  const tudji = ucitano && ja !== null && ja !== clan.id;
  const nepoznat = ucitano && ja === null;
  const mojClan = clanovi.find((c) => c.id === ja);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className="h-4 w-4 shrink-0 rounded-full"
          style={{ background: clan.color }}
          aria-hidden
        />
        <h2 className="flex-1 truncate text-lg font-medium">{clan.name}</h2>
        <Link
          href={`/g/${slug}/clanovi`}
          className="rounded-lg px-2 py-1 text-sm text-accent"
        >
          Promeni
        </Link>
      </div>

      {tudji && (
        <p className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          Unosis umesto {clan.name}.{" "}
          {mojClan && (
            <Link href={`/g/${slug}/moj?ko=${mojClan.id}`} className="underline">
              Nazad na svoj kalendar ({mojClan.name})
            </Link>
          )}
        </p>
      )}

      {nepoznat && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
          Ovo je tvoj kalendar?
          <button
            onClick={() => postavi(clan.id)}
            className="rounded-lg bg-accent px-2.5 py-1 text-sm font-medium text-white"
          >
            Da, to sam ja
          </button>
        </p>
      )}
    </div>
  );
}
