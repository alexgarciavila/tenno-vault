/**
 * Acceso tipado al catálogo de Incarnon generado (solo lectura). El JSON se
 * valida con el esquema Zod UNA sola vez de forma perezosa y se cachea; el resto
 * de la app consume el catálogo ya validado.
 */

import catalogJson from "./incarnon-catalog.json";
import { incarnonCatalogSchema, type IncarnonCatalog, type IncarnonWeapon } from "./catalog-schema";

let cached: IncarnonCatalog | null = null;

/** Catálogo completo, validado y cacheado tras el primer acceso. */
export function getCatalog(): IncarnonCatalog {
  if (cached === null) {
    cached = incarnonCatalogSchema.parse(catalogJson);
  }
  return cached;
}

/** Arma del catálogo por id, o `undefined` si no existe. */
export function getWeapon(id: string): IncarnonWeapon | undefined {
  return getCatalog().weapons.find((weapon) => weapon.id === id);
}
