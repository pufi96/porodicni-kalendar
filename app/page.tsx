import { NovaGrupaForma } from "@/components/NovaGrupaForma";

export default function Pocetna() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Kad se vidimo?</h1>
        <p className="mt-3 text-muted">
          Svako upise kad je slobodan, a aplikacija sama nadje termine u kojima se
          poklapate. Bez registracije - samo link i PIN.
        </p>
      </header>

      <section className="kartica p-5">
        <NovaGrupaForma />
      </section>

      <section className="mt-8 space-y-3 text-sm text-muted">
        <h2 className="font-medium text-text">Kako radi</h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Napravis grupu i dobijes link.</li>
          <li>Posaljes link i PIN rodjacima u WhatsApp ili Viber grupu.</li>
          <li>Svako podesi kad je obicno slobodan i doda izuzetke.</li>
          <li>Aplikacija izbaci termine koji odgovaraju najvecem broju ljudi.</li>
        </ol>
        <p className="pt-2">
          Vec imas grupu? Otvori link koji si dobio - cuva se u pregledacu 90 dana,
          pa PIN unosis samo prvi put.
        </p>
      </section>
    </main>
  );
}
