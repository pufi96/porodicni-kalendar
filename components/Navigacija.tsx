"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABOVI = [
  { put: "", naziv: "Preklapanja" },
  { put: "/moj", naziv: "Moj kalendar" },
  { put: "/clanovi", naziv: "Clanovi" },
];

export function Navigacija({ slug }: { slug: string }) {
  const pathname = usePathname();
  const osnova = `/g/${slug}`;

  return (
    <nav
      className="sticky bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur
                 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABOVI.map((t) => {
          const href = `${osnova}${t.put}`;
          const aktivan =
            t.put === "" ? pathname === osnova : pathname.startsWith(href);
          return (
            <li key={t.put} className="flex-1">
              <Link
                href={href}
                aria-current={aktivan ? "page" : undefined}
                className={`flex h-14 items-center justify-center text-sm font-medium
                  transition ${
                    aktivan
                      ? "border-t-2 border-accent text-accent"
                      : "border-t-2 border-transparent text-muted hover:text-text"
                  }`}
              >
                {t.naziv}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
