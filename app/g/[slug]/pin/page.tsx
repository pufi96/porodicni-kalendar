import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PinForma } from "@/components/PinForma";
import { db } from "@/lib/db";
import { hasGroupAccess } from "@/lib/session";

// Grupe se nikad ne indeksiraju - link je deo zastite.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PinStrana({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const grupa = await db.group.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!grupa) notFound();
  if (await hasGroupAccess(grupa.id)) redirect(`/g/${slug}`);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <header className="mb-6 text-center">
        <p className="text-sm text-muted">Grupa</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{grupa.name}</h1>
      </header>

      <section className="kartica p-5">
        <PinForma slug={slug} />
      </section>

      <p className="mt-6 text-center text-sm text-muted">
        PIN si dobio zajedno sa linkom. Unosis ga samo prvi put na ovom uredjaju.
      </p>
    </main>
  );
}
