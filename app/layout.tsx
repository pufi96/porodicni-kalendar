import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kad se vidimo?",
  description:
    "Zajednicki kalendar slobodnog vremena za porodicu - svako upise kad moze, aplikacija nadje termin koji svima odgovara.",
};

export const viewport: Viewport = {
  themeColor: "#b45309",
  width: "device-width",
  initialScale: 1,
  // Bez maximumScale: zabrana zumiranja odmaze starijim korisnicima.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr-Latn">
      <body className="antialiased">{children}</body>
    </html>
  );
}
