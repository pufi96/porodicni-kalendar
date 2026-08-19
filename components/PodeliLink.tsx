"use client";

import { useEffect, useRef, useState } from "react";

export function PodeliLink({ slug, naziv }: { slug: string; naziv: string }) {
  const [otvoren, setOtvoren] = useState(false);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const okvirRef = useRef<HTMLDivElement>(null);
  const poljeRef = useRef<HTMLInputElement>(null);

  function sastaviTekst(l: string) {
    return `Kalendar za "${naziv}" - upisi kad si slobodan:\n${l}\n(PIN ti saljem posebno)`;
  }

  // Klik izvan panela i Escape ga zatvaraju.
  useEffect(() => {
    if (!otvoren) return;

    function naKlik(e: MouseEvent) {
      if (!okvirRef.current?.contains(e.target as Node)) setOtvoren(false);
    }
    function naTaster(e: KeyboardEvent) {
      if (e.key === "Escape") setOtvoren(false);
    }

    document.addEventListener("mousedown", naKlik);
    document.addEventListener("keydown", naTaster);
    return () => {
      document.removeEventListener("mousedown", naKlik);
      document.removeEventListener("keydown", naTaster);
    };
  }, [otvoren]);

  async function podeli() {
    // URL se gradi tek ovde jer server ne zna pravi domen iza proxy-ja,
    // a `window` postoji samo u pregledacu.
    const trenutni = `${window.location.origin}/g/${slug}`;
    setLink(trenutni);

    // Na telefonu je nativni share sheet najkraci put do WhatsApp-a.
    if (navigator.share) {
      try {
        await navigator.share({ title: naziv, text: sastaviTekst(trenutni) });
        return;
      } catch {
        // Korisnik je odustao ili deljenje nije dozvoljeno - otvaramo panel.
      }
    }
    setPoruka(null);
    setOtvoren(true);
  }

  async function kopiraj(sta: string, potvrda: string) {
    try {
      await navigator.clipboard.writeText(sta);
      setPoruka(potvrda);
    } catch {
      // Clipboard ume da bude odbijen (Brave, stariji pregledaci, ili izgubljen
      // "user gesture" posle zatvorenog share sheet-a). Zato link stoji u polju
      // koje moze rucno da se selektuje - ovde ga samo unapred selektujemo.
      setPoruka("Pregledac ne da kopiranje - link je selektovan, kopiraj rucno.");
      poljeRef.current?.select();
    }
  }

  return (
    <div ref={okvirRef} className="relative shrink-0">
      <button onClick={podeli} className="dugme-tiho px-3 py-2 text-sm">
        Podeli link
      </button>

      {otvoren && (
        <div className="kartica absolute right-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] space-y-3 p-3 shadow-lg">
          <p className="text-sm text-muted">
            Posalji link rodjacima, a PIN im javi posebnom porukom.
          </p>

          <input
            ref={poljeRef}
            readOnly
            value={link}
            aria-label="Link do grupe"
            onFocus={(e) => e.currentTarget.select()}
            onClick={(e) => e.currentTarget.select()}
            className="polje px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <button
              onClick={() => kopiraj(sastaviTekst(link), "Poruka je kopirana!")}
              className="dugme-glavno flex-1 px-3 py-2 text-sm"
            >
              Kopiraj poruku
            </button>
            <button
              onClick={() => kopiraj(link, "Link je kopiran!")}
              className="dugme-tiho flex-1 px-3 py-2 text-sm"
            >
              Kopiraj link
            </button>
          </div>

          {poruka && <p className="text-sm text-accent">{poruka}</p>}
        </div>
      )}
    </div>
  );
}
