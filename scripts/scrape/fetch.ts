/**
 * Wrapper de `fetch` nativo cortés con la wiki:
 * - User-Agent identificativo.
 * - Rate limit global: 1 petición cada 1500 ms.
 * - 3 reintentos con backoff exponencial (2 s / 4 s / 8 s) ante error de red o status >= 500.
 * - 404 (y resto de 4xx) no se reintenta.
 */

import { assertAllowedWikiPageUrl } from "./normalize";

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

export interface BinaryFetchResult {
  finalUrl: string;
  contentType: string | null;
  bytes: Uint8Array;
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
  // `fetch` nativo representa fallos de red como TypeError.
  return error instanceof TypeError;
}

/**
 * Descarga una URL y devuelve el HTML como texto.
 * Lanza `FetchHttpError` (status conocido) o el último error de red tras agotar reintentos.
 */
export async function politeFetch(url: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  let lastError: unknown;
  const initialUrl = assertAllowedWikiPageUrl(url);

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS_MS[attempt - 1];
      if (delay !== undefined) await sleep(delay);
    }
    try {
      let current = initialUrl;
      for (let redirects = 0; redirects <= 5; redirects++) {
        await respectRateLimit();
        const response = await fetchImpl(current, {
          headers: { "User-Agent": USER_AGENT },
          redirect: "manual",
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get("location");
          if (!location) throw new Error("Redirect HTML sin cabecera Location.");
          current = assertAllowedWikiPageUrl(new URL(location, current).href);
          continue;
        }
        if (!response.ok) throw new FetchHttpError(current.href, response.status);
        assertAllowedWikiPageUrl(response.url || current.href);
        return await response.text();
      }
      throw new Error("Demasiados redirects al descargar HTML.");
    } catch (error) {
      if (!isRetryable(error)) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Fallo desconocido al descargar ${url}`);
}

async function cancelBody(response: Response): Promise<void> {
  if (!response.body || response.body.locked) return;
  try {
    await response.body.cancel();
  } catch {
    // El rechazo principal de seguridad no debe quedar oculto por un fallo de cancelación.
  }
}

async function readBodyWithLimit(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error("Límite binario inválido.");
  const lengthHeader = response.headers.get("content-length");
  if (lengthHeader !== null && !/^(?:0|[1-9]\d*)$/.test(lengthHeader.trim())) {
    await cancelBody(response);
    throw new Error(`Content-Length inválido: ${lengthHeader}.`);
  }
  const declaredLength = lengthHeader === null ? null : Number(lengthHeader.trim());
  if (declaredLength !== null && !Number.isSafeInteger(declaredLength)) {
    await cancelBody(response);
    throw new Error(`Content-Length inválido: ${lengthHeader}.`);
  }
  if (declaredLength !== null && declaredLength > maxBytes) {
    await cancelBody(response);
    throw new Error(`La imagen declara ${declaredLength} bytes; máximo ${maxBytes}.`);
  }
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // Se conserva el error de tamaño como causa principal.
      }
      throw new Error(`La imagen supera el máximo de ${maxBytes} bytes.`);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** Descarga binaria con redirects manuales para validar cada destino antes de solicitarlo. */
export async function politeFetchBinary(
  url: string,
  validateUrl: (value: string) => URL,
  maxBytes: number,
  fetchImpl: typeof fetch = fetch,
): Promise<BinaryFetchResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS_MS[attempt - 1];
      if (delay !== undefined) await sleep(delay);
    }
    try {
      let current = validateUrl(url);
      for (let redirects = 0; redirects <= 5; redirects++) {
        await respectRateLimit();
        const response = await fetchImpl(current, {
          headers: { "User-Agent": USER_AGENT },
          redirect: "manual",
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get("location");
          if (!location) throw new Error("Redirect de imagen sin cabecera Location.");
          current = validateUrl(new URL(location, current).href);
          continue;
        }
        if (!response.ok) throw new FetchHttpError(current.href, response.status);
        const finalUrl = validateUrl(response.url || current.href).href;
        const bytes = await readBodyWithLimit(response, maxBytes);
        return {
          finalUrl,
          contentType: response.headers.get("content-type"),
          bytes,
        };
      }
      throw new Error("Demasiados redirects al descargar la imagen.");
    } catch (error) {
      if (!isRetryable(error)) throw error;
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Fallo desconocido al descargar ${url}`);
}
