import { ClanoviPanel } from "@/components/ClanoviPanel";
import { requireGroup } from "@/lib/guard";

export default async function ClanoviStrana({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const grupa = await requireGroup(slug);

  return (
    <ClanoviPanel
      slug={slug}
      clanovi={grupa.members.map((m) => ({
        id: m.id,
        name: m.name,
        color: m.color,
      }))}
    />
  );
}
