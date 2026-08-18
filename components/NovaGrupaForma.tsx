"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { napraviGrupu, type StanjeForme } from "@/app/actions/grupa";

function Dugme() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="dugme-glavno w-full" disabled={pending}>
      {pending ? "Pravim grupu..." : "Napravi grupu"}
    </button>
  );
}

export function NovaGrupaForma() {
  const [stanje, akcija] = useActionState<StanjeForme, FormData>(napraviGrupu, {});

  return (
    <form action={akcija} className="space-y-4">
      <div>
        <label className="oznaka" htmlFor="naziv">
          Kako se zove grupa?
        </label>
        <input
          id="naziv"
          name="naziv"
          className="polje"
          placeholder="npr. Rodjaci sa mamine strane"
          maxLength={40}
          required
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="oznaka" htmlFor="pin">
            PIN (4-6 cifara)
          </label>
          <input
            id="pin"
            name="pin"
            className="polje tracking-[0.3em]"
            inputMode="numeric"
            pattern="\d{4,6}"
            maxLength={6}
            placeholder="0000"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label className="oznaka" htmlFor="pin2">
            Ponovi PIN
          </label>
          <input
            id="pin2"
            name="pin2"
            className="polje tracking-[0.3em]"
            inputMode="numeric"
            pattern="\d{4,6}"
            maxLength={6}
            placeholder="0000"
            required
            autoComplete="off"
          />
        </div>
      </div>

      <p className="text-sm text-muted">
        PIN saljes rodjacima zajedno sa linkom. Nema registracije ni lozinki.
      </p>

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
