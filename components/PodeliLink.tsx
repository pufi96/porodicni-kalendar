"use client";

import { useState } from "react";

export function PodeliLink({ slug, naziv }: { slug: string; naziv: string }) {
  const [poruka, setPoruka] = useState<string | null>(null);

  async function podeli() {
    // URL se gradi u pregledacu jer server ne zna pravi domen iza proxy-ja.
    const link = `${window.location.origin}/g/${slug}`;
    const tekst = `Kalendar za "${naziv}" - upisi kad si slobodan:\n${link}\n(PIN ti saljem posebno)`;

    if (navigator.share) {
      try {
        await navigator.share({ title: naziv, text: tekst });
        return;
      } catch {
        // Korisnik je odustao ili deljenje nije dozvoljeno - padamo na kopiranje.
      }
    }

    try {
      await navigator.clipboard.writeText(tekst);
      setPoruka("Kopirano!");
    } catch {
      setPoruka(link);
    }
    setTimeout(() => setPoruka(null), 2500);
  }

  return (
    <button onClick={podeli} className="dugme-tiho px-3 py-2 text-sm">
      {poruka ?? "Podeli link"}
    </button>
  );
}
