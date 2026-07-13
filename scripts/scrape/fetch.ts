/**
 * Wrapper de `fetch` nativo cortés con la wiki:
 * - User-Agent identificativo.
 * - Rate limit global: 1 petición cada 1500 ms.
 * - 3 reintentos con backoff exponencial (2 s / 4 s / 8 s) ante error de red o status >= 500.
 * - 404 (y resto de 4xx) no se reintenta.
 */

export const USER_AGENT =
  "TennoVault/0.1 (personal, non-commercial; contact: agarcia@infordisa.com)";

export const RATE_LIMIT_MS = 1500;
const RETRY_DELAYS_MS = [2000, 4000, 8000];

export class FetchHttpError extends Error {
  readonly status: number;

  constructor(url: string, status: number) {
    super(`HTTP ${status} al descargar ${url}`);
    this.name = "FetchHttpError";
    this.status = status;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastRequestAt = 0;

/** Espera lo necesario para respetar el rate limit global (compartido por todo el proceso). */
async function respectRateLimit(): Promise<void> {
  const wait = lastRequestAt + RATE_LIMIT_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

/** Solo para tests: resetea el reloj interno del rate limit. */
export function resetRateLimitForTests(): void {
  lastRequestAt = 0;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof FetchHttpError) return error.status >= 500;
  // Error de red (fetch nativo lanza TypeError/Error sin status).
  return true;
}

/**
 * Descarga una URL y devuelve el HTML como texto.
 * Lanza `FetchHttpError` (status conocido) o el último error de red tras agotar reintentos.
 */
export async function politeFetch(url: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS_MS[attempt - 1];
      if (delay !== undefined) await sleep(delay);
    }
    await respectRateLimit();

    try {
      const response = await fetchImpl(url, {
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
      if (response.ok) return await response.text();
      const error = new FetchHttpError(url, response.status);
      if (!isRetryable(error)) throw error;
      lastError = error;
    } catch (error) {
      if (!isRetryable(error)) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Fallo desconocido al descargar ${url}`);
}
