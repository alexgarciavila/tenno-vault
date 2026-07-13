"use client";

/**
 * Armazón de la aplicación. Compone: skip-link, sidebar de escritorio
 * (riel/expandido), barra inferior móvil + hoja "Más", y el `<main>` con
 * landmark. El estado de colapso del sidebar es de sesión (no se persiste); su
 * valor inicial depende del breakpoint via CSS en `SidebarNav`, aquí arranca
 * expandido y el usuario lo alterna.
 *
 * El `<h1>` de cada pantalla vive en el contenido de la página (un h1 por
 * pantalla); la barra superior móvil solo muestra la marca, sin duplicar
 * encabezado.
 */
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useT } from "../../lib/i18n";
import { BottomNav } from "./BottomNav";
import { MoreSheet } from "./MoreSheet";
import { SidebarNav } from "./SidebarNav";

const MAIN_ID = "contenido-principal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname() ?? "/";
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <a
        href={`#${MAIN_ID}`}
        className="sr-only rounded-lg bg-accent px-4 py-2 font-medium text-bg focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50"
      >
        {t.nav.skipToContent}
      </a>

      <SidebarNav
        pathname={pathname}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center border-b border-border bg-surface-alt px-4 py-3 md:hidden">
          <span className="font-semibold tracking-tight text-fg">{t.app.name}</span>
        </header>

        <main id={MAIN_ID} className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      <BottomNav pathname={pathname} moreActive={moreOpen} onOpenMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} pathname={pathname} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
