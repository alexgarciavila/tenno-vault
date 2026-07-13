import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const nextConfig: NextConfig = {
  output: "export",
  // Con `output: 'export'` cada ruta se emite como carpeta con `index.html`
  // (p. ej. `out/incarnon/index.html`) en vez de `out/incarnon.html`. Sin esto,
  // un servidor estático sin reescritura devuelve 404 al recargar o compartir
  // subrutas como `/incarnon`. Next normaliza los enlaces internos a la barra
  // final automáticamente.
  trailingSlash: true,
};

// Entradas de precache de los ficheros estáticos de `public/` (iconos, manifest).
//
// Las generamos aquí en lugar de dejar que @serwist/next haga su propio glob de
// `public/`: en Windows ese glob resuelve los ficheros de subcarpetas con "\",
// produciendo URLs inválidas como "/icons\icon-192.png" que no se cachearían
// offline. Al pasar `additionalPrecacheEntries`, Serwist omite su globbing y usa
// estas URLs normalizadas a "/". Los chunks del build (que incluyen el catálogo
// importado) los añade Serwist automáticamente desde los assets de webpack.
function publicPrecacheEntries(): { url: string; revision: string }[] {
  const publicDir = join(process.cwd(), "public");
  const entries: { url: string; revision: string }[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      // Excluir el propio SW y sus artefactos generados por Serwist.
      if (/^sw\.js(\.map)?$/.test(name) || /^swe-worker-.*\.js(\.map)?$/.test(name)) {
        continue;
      }
      const url = "/" + relative(publicDir, full).split(sep).join("/");
      const revision = createHash("md5").update(readFileSync(full)).digest("hex");
      entries.push({ url, revision });
    }
  };
  walk(publicDir);
  return entries;
}

// PWA con Serwist. Compatible con `output: 'export'`: el service worker se
// compila a `public/sw.js` durante el build y el export estático lo copia a
// `out/sw.js`. En desarrollo se desactiva para no interferir con HMR.
const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  // register: true por defecto → Serwist inyecta el registro del SW en el
  // bundle cliente; reloadOnOnline: true recarga al recuperar conexión.
  reloadOnOnline: true,
  additionalPrecacheEntries: publicPrecacheEntries(),
});

export default withSerwist(nextConfig);
