"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIdentitet } from "@/lib/identitet";
import type { ClanKratko } from "@/components/ClanoviPanel";

/**
 * Prikazuje se samo kad u adresi nema ?ko=. Ako je uredjaj vec zapamtio
 * ko si, odmah te prebacuje na tvoj kalendar; inace bira ko si.
 */
export function IzborClana({
  slug,
  clanovi,
}: {
  slug: string;
  clanovi: ClanKratko[];
}) {
  const router = useRouter();
  const { ja, postavi, ucitano } = useIdentitet(
    slug,
    clanovi.map((c) => c.id)
  );

  useEffect(() => {
    if (ucitano && ja) router.replace(`/g/${slug}/moj?ko=${ja}`);
  }, [ucitano, ja, router, slug]);

  if (clanovi.length === 0) {
    return (
      <div className="kartica p-5 text-center">
        <p className="text-muted">
          U grupi jos nema nikoga. Prvo dodaj sebe u tabu{" "}
          <span className="font-medium text-text">Clanovi</span>.
        </p>
      </div>
    );
  }

  if (ucitano && ja) return null; // preusmeravanje je vec krenulo

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Ko si ti?</h2>
        <p className="mt-1 text-sm text-muted">
          Biramo samo jednom - uredjaj te zapamti.
        </p>
      </div>
      <ul className="space-y-2">
        {clanovi.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => {
                postavi(c.id);
                router.replace(`/g/${slug}/moj?ko=${c.id}`);
              }}
              className="kartica flex w-full items-center gap-3 px-4 py-3.5 text-left
                         transition hover:border-accent"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: c.color }}
                aria-hidden
              />
              <span className="font-medium">{c.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
