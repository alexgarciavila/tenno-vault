/**
 * Fuentes autoalojadas con `next/font/local` (integrado en Next, sin
 * dependencia npm ni fetch en runtime: la PWA sigue funcionando offline).
 *
 * - Michroma (display): wordmark, títulos de página y nombres de arma.
 * - Rajdhani (texto): resto de la interfaz, pesos 400/500/600/700.
 *
 * Los .woff2 (subset latin) se descargaron de Google Fonts a `./fonts/`. Ambas
 * familias están bajo SIL Open Font License 1.1 (ver `./fonts/*-OFL.txt`).
 *
 * Se exponen como variables CSS (`--font-michroma`, `--font-rajdhani`) que
 * `globals.css` cablea en `@theme` como `--font-display` y `--font-sans`.
 */
import localFont from "next/font/local";

export const michroma = localFont({
  src: [{ path: "./fonts/michroma-latin-400.woff2", weight: "400", style: "normal" }],
  variable: "--font-michroma",
  display: "swap",
  fallback: ["Trebuchet MS", "sans-serif"],
  adjustFontFallback: false,
});

export const rajdhani = localFont({
  src: [
    { path: "./fonts/rajdhani-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/rajdhani-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/rajdhani-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/rajdhani-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-rajdhani",
  display: "swap",
  fallback: ["Segoe UI", "sans-serif"],
  adjustFontFallback: false,
});
