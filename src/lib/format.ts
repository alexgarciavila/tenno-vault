/**
 * Formateo de la fecha `generatedAt` del catálogo a `dd/mm/aaaa`. Se usa UTC de
 * forma determinista para que el valor renderizado sea idéntico en el prerender
 * del export estático y en el cliente (sin depender de la zona horaria del
 * entorno de build ni del navegador).
 */
export function formatCatalogDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
