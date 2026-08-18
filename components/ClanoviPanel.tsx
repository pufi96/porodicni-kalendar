"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  dodajClana,
  obrisiClana,
  type StanjeClana,
} from "@/app/actions/clanovi";
import { useIdentitet } from "@/lib/identitet";

export type ClanKratko = { id: string; name: string; color: string };

function DodajDugme() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dugme-glavno px-5" disabled={pending}>
      {pending ? "..." : "Dodaj"}
    </button>
  );
}

function BrisiDugme({ slug, clan }: { slug: string; clan: ClanKratko }) {
  const [potvrda, setPotvrda] = useState(false);

  if (!potvrda) {
    return (
      <button
        onClick={() => setPotvrda(true)}
        className="rounded-lg px-2 py-1 text-sm text-muted hover:text-warn"
        aria-label={`Obrisi ${clan.name}`}
      >
        Obrisi
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <form action={obrisiClana}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="memberId" value={clan.id} />
        <button
          type="submit"
          className="rounded-lg bg-warn/10 px-2 py-1 text-sm font-medium text-warn"
        >
          Sigurno
        </button>
      </form>
      <button
        onClick={() => setPotvrda(false)}
        className="rounded-lg px-2 py-1 text-sm text-muted"
      >
        Ne
      </button>
    </span>
  );
}

export function ClanoviPanel({
  slug,
  clanovi,
}: {
  slug: string;
  clanovi: ClanKratko[];
}) {
  const [stanje, akcija] = useActionState<StanjeClana, FormData>(dodajClana, {});
  const { ja, postavi, ucitano } = useIdentitet(
    slug,
    clanovi.map((c) => c.id)
  );

  return (
    <div className="space-y-6">
      <section className="kartica p-4">
        <h2 className="mb-3 font-medium">Dodaj clana</h2>
        <form action={akcija} className="flex gap-2">
          <input type="hidden" name="slug" value={slug} />
          <input
            name="ime"
            className="polje flex-1"
            placeholder="Ime, npr. Baba Mara"
            maxLength={30}
            required
            autoComplete="off"
          />
          <DodajDugme />
        </form>
        {stanje.greska && (
          <p role="alert" className="mt-2 text-sm text-warn">
            {stanje.greska}
          </p>
        )}
        {stanje.uspeh && (
          <p className="mt-2 text-sm text-good">{stanje.uspeh}</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-medium">
          Ko je u grupi{" "}
          <span className="font-normal text-muted">({clanovi.length})</span>
        </h2>

        {clanovi.length === 0 ? (
          <p className="kartica p-4 text-sm text-muted">
            Jos nema nikoga. Dodaj prvo sebe, pa ostale rodjake - i one koji nemaju
            telefon, njihove termine mozes uneti ti.
          </p>
        ) : (
          <ul className="space-y-2">
            {clanovi.map((c) => {
              const toSamJa = ucitano && ja === c.id;
              return (
                <li
                  key={c.id}
                  className="kartica flex items-center gap-3 px-4 py-3"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: c.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {c.name}
                    {toSamJa && (
                      <span className="ml-2 rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">
                        to sam ja
                      </span>
                    )}
                  </span>

                  {!toSamJa && (
                    <button
                      onClick={() => postavi(c.id)}
                      className="rounded-lg px-2 py-1 text-sm text-muted hover:text-accent"
                    >
                      To sam ja
                    </button>
                  )}
                  <Link
                    href={`/g/${slug}/moj?ko=${c.id}`}
                    className="rounded-lg px-2 py-1 text-sm text-accent"
                  >
                    Termini
                  </Link>
                  <BrisiDugme slug={slug} clan={c} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted">
        Brisanje clana brise i sve njegove termine. Ne moze da se ponisti.
      </p>
    </div>
  );
}
