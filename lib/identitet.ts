"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * "Ja sam Pera" se pamti u pregledacu, po grupi. Ovo je udobnost, ne zastita -
 * server namerno ne proverava ko je ko, jer je dogovoreno da mozes uneti
 * termine i umesto rodjaka koji nema pametan telefon.
 */
const kljuc = (slug: string) => `pk_ja_${slug}`;

export function citajIdentitet(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(kljuc(slug));
  } catch {
    return null; // privatni rezim ume da zabrani localStorage
  }
}

export function upisiIdentitet(slug: string, memberId: string) {
  try {
    window.localStorage.setItem(kljuc(slug), memberId);
  } catch {
    /* nije kriticno */
  }
}

/**
 * Vraca zapamceni identitet, ali samo ako taj clan i dalje postoji u grupi
 * (neko ga je mogao obrisati u medjuvremenu).
 */
export function useIdentitet(slug: string, postojeciIds: string[]) {
  const [ja, setJa] = useState<string | null>(null);
  const [ucitano, setUcitano] = useState(false);
  // Zavisimo od sadrzaja liste, ne od reference: pozivalac skoro sigurno
  // pravi novi niz pri svakom renderu, sto bi inace vrtelo efekat u krug.
  const kljucIds = postojeciIds.join(",");

  useEffect(() => {
    // localStorage je spoljasnji izvor bez SSR ekvivalenta - citanje mora
    // da ceka mont, pa je setState ovde namerno, ne slucajno izveden state.
    const sacuvan = citajIdentitet(slug);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJa(sacuvan && kljucIds.split(",").includes(sacuvan) ? sacuvan : null);
    setUcitano(true);
  }, [slug, kljucIds]);

  const postavi = useCallback(
    (memberId: string) => {
      upisiIdentitet(slug, memberId);
      setJa(memberId);
    },
    [slug]
  );

  return { ja, postavi, ucitano };
}
