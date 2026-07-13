// Service worker de Tenno Vault (Serwist + @serwist/next).
//
// Este archivo se compila con webpack durante `next build` y se emite en
// `public/sw.js` (de ahí lo copia el export estático a `out/sw.js`). El
// manifiesto de precache (`self.__SW_MANIFEST`) lo inyecta el plugin
// InjectManifest de @serwist/next con los assets del build (chunks JS/CSS que
// incluyen el catálogo importado) y los ficheros de `public/`.
//
// Se ejecuta en contexto WebWorker; ver `types: ["@serwist/next/typings"]` y
// `lib: ["webworker"]` en tsconfig.json para el tipado de este entorno.
//
// Limitación conocida (precache de documentos HTML): con `output: 'export'` los
// `index.html` de cada ruta se generan DESPUÉS de compilar este SW, por lo que
// no forman parte de `self.__SW_MANIFEST` y no se precachean. La navegación
// offline a subrutas (p. ej. `/incarnon/`) queda cubierta por el runtime
// caching de `defaultCache` tras la primera visita online. No intentamos
// inyectarlos manualmente para no acoplar el SW al output del export.
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Manifiesto de precache inyectado en tiempo de build por Serwist.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
