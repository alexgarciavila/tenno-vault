import type { Metadata, Viewport } from "next";
import "./globals.css";
import { michroma, rajdhani } from "./fonts";
import { AppShell } from "../components/layout/AppShell";
import { I18nProvider } from "../lib/i18n";

export const metadata: Metadata = {
  title: "Tenno Vault",
  description:
    "Gestor personal del progreso de Incarnon (adaptadores Genesis y armas innatas) de Warframe.",
  // Manifest PWA. Los iconos favicon/apple-touch se resuelven automáticamente
  // desde src/app/icon.png y src/app/apple-icon.png (convención de Next).
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Tenno Vault",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#04070a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${rajdhani.variable} ${michroma.variable}`}>
      <body className="antialiased">
        <I18nProvider>
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
