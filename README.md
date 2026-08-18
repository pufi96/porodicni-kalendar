# Kad se vidimo?

Zajednicki kalendar slobodnog vremena za porodicu. Svako upise kad je slobodan,
a aplikacija sama izracuna termine u kojima se najveci broj ljudi poklapa.

Bez registracije: grupa se otvara deljivim linkom i PIN-om.

## Kako radi

- **Nedeljni sablon** — svako podesi jednom kad je obicno slobodan
  (npr. radnim danima 18–22, subotom 9–22). Kalendar se popunjava sam.
- **Izuzeci** — za konkretan datum koji odstupa. Izuzetak potpuno zamenjuje
  sablon za taj dan; prazan izuzetak znaci „tog dana ne mogu uopste".
- **Preklapanja** — rangirana lista termina, plus mapa dana obojena po tome
  koliko ljudi tog dana moze. Dugme *Kopiraj predlog* pravi gotovu poruku
  za WhatsApp ili Viber.

Sve vreme je beogradsko. U bazi se cuva kao broj minuta od ponoci
(`1080` = 18:00), a datumi kao `YYYY-MM-DD` — nigde nema `Date` sa vremenskom
zonom, pa nema ni greske tipa „pisalo je 18h a prikazalo 19h".

## Pokretanje lokalno

```bash
npm install
```

```bash
npx prisma migrate dev
```

```bash
npm run dev
```

Aplikacija radi na http://localhost:3000.

Za demo podatke (grupa „Demo porodica", PIN `1234`):

```bash
npm run seed
```

## Testovi

```bash
npm test
```

Testovi pokrivaju `lib/availability.ts` — racun preseka slobodnog vremena.
To je jedino mesto gde greska prolazi tiho; sve ostalo se odmah vidi u UI.

## Struktura

| Putanja | Sta radi |
|---|---|
| `lib/availability.ts` | Srce: `resolveDay` (sablon + izuzeci) i `findWindows` (presek, sweep-line) |
| `lib/time.ts` | Minuti ⟷ `HH:mm`, ISO datumi bez UTC zamki, srpska mnozina |
| `lib/session.ts` | Potpisan kolacic (jose) i ogranicavanje pokusaja PIN-a |
| `lib/guard.ts` | Provera pristupa i ucitavanje grupe sa dostupnoscu |
| `app/actions/` | Server akcije — sve mutacije idu kroz njih |
| `prisma/schema.prisma` | Sema baze |

## Bezbednost

PIN od 4–6 cifara je slab sam po sebi, pa ga nose tri stvari zajedno:

- **Link se ne moze nagadjati** — slug ima slucajan sufiks (`porodica-x7k2m9`).
- **PIN se cuva heshovan** (bcrypt), nikad kao tekst.
- **Ogranicenje pokusaja** — 10 po IP-u i grupi u 15 minuta, brojano u bazi
  (serverless funkcije ne dele memoriju, pa brojac u procesu ne bi vazio nista).
- Sesija je potpisan JWT u `httpOnly` + `secure` + `sameSite=lax` kolacicu,
  traje 90 dana i pamti sve grupe u koje si ulazio.
- Sve `/g/*` strane su `noindex`.

Identitet clana („ja sam Pera") stoji u `localStorage` i **namerno se ne proverava
na serveru** — tako mozes uneti termine i umesto rodjaka koji nema pametan telefon.
Kad menjas tudji kalendar, to jasno pise na vrhu strane.

## Deploy — besplatan hosting

Preporuka: **Vercel** (aplikacija) + **Neon** (Postgres baza). Oboje ima trajno
besplatan tier, ne trazi karticu, i ova kombinacija je pravljena bas za
Next.js + Prisma:

- **Vercel** je jedini od besplatnih hostinga za Next.js koji ne uspavljuje
  server. Render/Railway free tier gase servis posle 15-ak minuta neaktivnosti
  pa prvi sledeci zahtev ceka i 30-ak sekundi — bas kad rodjak prvi put otvori
  link, sto ostavlja los prvi utisak.
- **Neon** je serverless Postgres koji takodje ne trazi karticu za besplatan
  tier (0.5 GB — za porodicni kalendar i vise nego dovoljno), i direktno se
  povezuje sa Vercel nalogom kao integracija (Vercel sam ponudi da doda
  `DATABASE_URL`).

Napravljeno je ono sto ide bez naloga:
- `prisma generate` je vec deo `npm run build` ([package.json](package.json)) —
  Vercel bi inace keshirao stari Prisma Client.
- `package.json` ima `engines.node: ">=20.9"` da Vercel odabere ispravnu
  verziju Node-a za Next 16.
- Sema je probno validirana pod `provider = "postgresql"` (`npx prisma
  validate`) — prolazi bez izmena, jer ne koristi nista SQLite-specificno.

Ostaje ono sto samo ti mozes, jer trazi tvoje naloge:

**1. Promeni bazu u `prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**2. Napravi bazu na [neon.tech](https://neon.tech)** (besplatan tier) i uzmi
connection string.

**3. Napravi migracije za Postgres.** Postojece migracije su SQLite-specificne,
pa se brisu i prave iznova:

```bash
rm -rf prisma/migrations prisma/dev.db
```

```bash
DATABASE_URL="<neon-connection-string>" npx prisma migrate dev --name init
```

**4. Generisi tajnu za sesiju:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**5. Push na GitHub, pa uvezi repo na [vercel.com](https://vercel.com).**
U Vercel podesavanjima dodaj dve promenljive okruzenja:

| Promenljiva | Vrednost |
|---|---|
| `DATABASE_URL` | connection string sa Neona |
| `SESSION_SECRET` | vrednost iz koraka 4 |

**6. Posle prvog deploya pusti migracije na produkcijsku bazu:**

```bash
DATABASE_URL="<neon-connection-string>" npx prisma migrate deploy
```

### Provera posle deploya

Vercel funkcije rade u UTC. Aplikacija zato racuna „danas" preko
`todayIsoInZone("Europe/Belgrade")` u `lib/time.ts`. Posle deploya proveri
uvece (posle 22h) da prvi dan u mapi i dalje bude danasnji, a ne juce.

## Napomene o verzijama

Projekat trazi **Node ≥ 20.9** (Next 16). Sistemski Node na ovoj masini je
20.5.0, pa je za razvoj postavljen odvojen Node 24 LTS samo za ovaj projekat,
bez diranja sistemskog Node-a:

- Raspakovan u `%LOCALAPPDATA%\nodejs-lts-v24\node-v24.19.0-win-x64`
  (zvanicni zip sa nodejs.org, sha256 proveren — nije instaliran preko
  sistemskog instalera, pa ne dira ostale projekte na masini).
- `.claude/dev.cmd` postavlja PATH na taj Node i tek onda pokrece `npm run dev`
  — to je ono sto `.claude/launch.json` pokrece za pregled u Claude Code-u.
- Za rad iz obicnog terminala, ili dodaj taj folder na PATH, ili pokreni:

  ```bash
  "C:\Users\Pufi\AppData\Local\nodejs-lts-v24\node-v24.19.0-win-x64\npm.cmd" run dev
  ```

Sistemski Node je u medjuvremenu i sam podignut na 24.19.0 (`winget install
OpenJS.NodeJS.LTS` je prosao posle potvrde UAC prompta). I dalje ostaje
losa strana: sistemski `npm` u nekim ljuskama (PowerShell) i dalje resolvuje
na stariji globalni `npm` shim (`%APPDATA%\npm`) umesto na svezi 11.x koji
dolazi uz Node 24, dok Bash ljuska to resolvuje ispravno. Zbog te
nedoslednosti `.claude/dev.cmd` i dalje koristi izolovani Node 24 zip da
build/dev uvek budu ponovljivi bez obzira na to koja se ljuska koristi. Ako
zelis da i sistemski `npm` bude dosledan, pokreni `npm install -g npm@latest`
(ne dira ostale globalne pakete).

### Zasto Prisma i TypeScript nisu na najnovijoj glavnoj verziji

I `prisma` i `typescript` imaju noviju glavnu verziju dostupnu (7, odnosno 7),
ali su namerno preskocene:

- **Prisma 7** brise Rust query engine i **zahteva driver adapter** za svaku
  bazu, novi `prisma.config.ts`, i drugaciju putanju generisanog klijenta
  (vise ne `@prisma/client` nego prilagodjena putanja). To nije podesavanje
  verzije nego prepravka svakog fajla koji dodiruje bazu — ostaje se na
  **Prisma 6.19** (najnovija stabilna 6.x), sto je i dalje realan pomak sa 6.16.
- **TypeScript 7** (novi Go kompajler, ~10x brzi) tek je postao stabilan
  (jul 2026) i `@typescript-eslint` ga jos ne podrzava
  (`typescript: '>=4.8.4 <6.1.0'` u njegovim peer zavisnostima) — sa TS7 bi
  ESLint prestao da radi. Ostaje se na **TypeScript 6.0.3**, koju i sam
  `eslint-config-next@16` koristi u razvoju.

Vitest i Next su presli na najnovije glavne verzije (4, odnosno 16) — kod
vec prati Next 15-ov obrazac (`await params/cookies/headers`), a Vitest
konfiguracija je dovoljno prosta da nove verzije nista ne menjaju.
