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
import { useEffect, useState } from "react";
import { useT } from "../../lib/i18n";
import { BottomNav } from "./BottomNav";
import { MoreSheet } from "./MoreSheet";
import { SidebarNav } from "./SidebarNav";
import { BrandMark } from "../ui/BrandMark";

const MAIN_ID = "contenido-principal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname() ?? "/";
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const tablet = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    setCollapsed(tablet.matches);
    const closeMobileSheet = () => {
      if (tablet.matches || desktop.matches) setMoreOpen(false);
    };
    tablet.addEventListener("change", closeMobileSheet);
    desktop.addEventListener("change", closeMobileSheet);
    return () => {
      tablet.removeEventListener("change", closeMobileSheet);
      desktop.removeEventListener("change", closeMobileSheet);
    };
  }, []);

  return (
    <div className="relative flex min-h-dvh">
      <a
        href={`#${MAIN_ID}`}
        className="sr-only bg-accent px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-[max(0.75rem,env(safe-area-inset-top))] focus:z-[60]"
      >
        {t.nav.skipToContent}
      </a>

      <SidebarNav
        pathname={pathname}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="extreme-panel reflow-chain flex min-h-14 flex-wrap items-center gap-2 border-b border-border-subtle bg-bg-deep/95 px-4 pt-[env(safe-area-inset-top)] md:hidden">
          <BrandMark className="size-8" />
          <span className="reflow-text flex-1 font-bold uppercase tracking-[0.08em] text-fg">
            {t.app.name}
          </span>
        </header>

        <main
          id={MAIN_ID}
          className="mx-auto w-full min-w-0 max-w-[90rem] flex-1 px-4 py-6 pb-[var(--mobile-bottom-nav-clearance)] sm:px-5 md:px-6 md:py-8 md:pb-8 lg:px-8 xl:px-10"
        >
          {children}
        </main>
      </div>

      <BottomNav pathname={pathname} moreActive={moreOpen} onOpenMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} pathname={pathname} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
