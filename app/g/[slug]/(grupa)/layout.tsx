import type { Metadata } from "next";
import { Navigacija } from "@/components/Navigacija";
import { PodeliLink } from "@/components/PodeliLink";
import { requireGroup } from "@/lib/guard";
import { mnozina } from "@/lib/time";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function GrupaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const grupa = await requireGroup(slug);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {grupa.name}
            </h1>
            <p className="text-xs text-muted">
              {grupa.members.length}{" "}
              {mnozina(grupa.members.length, "clan", "clana", "clanova")}
            </p>
          </div>
          <PodeliLink slug={slug} naziv={grupa.name} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5">{children}</main>

      <Navigacija slug={slug} />
    </div>
  );
}
