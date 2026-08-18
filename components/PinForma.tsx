"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { proveriPin, type StanjeForme } from "@/app/actions/grupa";

function Dugme() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dugme-glavno w-full" disabled={pending}>
      {pending ? "Proveravam..." : "Udji"}
    </button>
  );
}

export function PinForma({ slug }: { slug: string }) {
  const [stanje, akcija] = useActionState<StanjeForme, FormData>(proveriPin, {});

  return (
    <form action={akcija} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label className="oznaka" htmlFor="pin">
          PIN grupe
        </label>
        <input
          id="pin"
          name="pin"
          className="polje text-center text-2xl tracking-[0.5em]"
          inputMode="numeric"
          pattern="\d{4,6}"
          maxLength={6}
          placeholder="000000"
          required
          autoFocus
          autoComplete="off"
        />
      </div>

      {stanje.greska && (
        <p
          role="alert"
          className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn"
        >
          {stanje.greska}
        </p>
      )}

      <Dugme />
    </form>
  );
}
