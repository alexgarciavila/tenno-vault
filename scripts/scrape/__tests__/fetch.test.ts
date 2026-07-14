// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FetchHttpError,
  politeFetch,
  politeFetchBinary,
  RATE_LIMIT_MS,
  resetRateLimitForTests,
  USER_AGENT,
} from "../fetch";
import { assertAllowedImageUrl } from "../image";

function responseOf(status: number, body = "ok"): Response {
  return new Response(body, { status });
}

describe("politeFetch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimitForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("envía el User-Agent identificativo y devuelve el HTML", async () => {
    const impl = vi
      .fn<(url: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(responseOf(200, "<html/>"));
    const promise = politeFetch("https://wiki.warframe.com/w/Incarnon", impl);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("<html/>");

    expect(impl).toHaveBeenCalledTimes(1);
    const init = impl.mock.calls[0]?.[1] as RequestInit | undefined;
    expect((init?.headers as Record<string, string>)["User-Agent"]).toBe(USER_AGENT);
    expect(USER_AGENT).toContain("TennoVault/0.1");
  });

  it("reintenta hasta 3 veces ante status >= 500 con backoff", async () => {
    const impl = vi
      .fn()
      .mockResolvedValueOnce(responseOf(500))
      .mockResolvedValueOnce(responseOf(503))
      .mockResolvedValueOnce(responseOf(200, "recuperado"));
    const promise = politeFetch("https://wiki.warframe.com/w/X", impl);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("recuperado");
    expect(impl).toHaveBeenCalledTimes(3);
  });

  it("agota los 3 reintentos y propaga el último error", async () => {
    const impl = vi.fn(async () => responseOf(500));
    const promise = politeFetch("https://wiki.warframe.com/w/X", impl);
    const expectation = expect(promise).rejects.toBeInstanceOf(FetchHttpError);
    await vi.runAllTimersAsync();
    await expectation;
    expect(impl).toHaveBeenCalledTimes(4); // intento inicial + 3 reintentos
  });

  it("no reintenta ante 404", async () => {
    const impl = vi.fn(async () => responseOf(404));
    const promise = politeFetch("https://wiki.warframe.com/w/No_Existe", impl);
    const expectation = expect(promise).rejects.toMatchObject({ status: 404 });
    await vi.runAllTimersAsync();
    await expectation;
    expect(impl).toHaveBeenCalledTimes(1);
  });

  it("reintenta ante error de red", async () => {
    const impl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(responseOf(200, "ok"));
    const promise = politeFetch("https://wiki.warframe.com/w/X", impl);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(impl).toHaveBeenCalledTimes(2);
  });

  it("rechaza destinos HTML externos, privados, con credenciales o puerto antes del fetch", async () => {
    const impl = vi.fn();
    for (const url of [
      "https://example.com/w/X",
      "https://127.0.0.1/w/X",
      "https://192.168.1.20/w/X",
      "https://user@wiki.warframe.com/w/X",
      "https://wiki.warframe.com:8443/w/X",
      "https://wiki.warframe.com:443/w/X",
    ]) {
      await expect(politeFetch(url, impl)).rejects.toThrow("página no permitida");
    }
    expect(impl).not.toHaveBeenCalled();
  });

  it("valida manualmente cada redirect HTML y la URL final", async () => {
    const redirectImpl = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://10.0.0.1/internal" },
      }),
    );
    const redirected = politeFetch("https://wiki.warframe.com/w/X", redirectImpl);
    const redirectExpectation = expect(redirected).rejects.toThrow("página no permitida");
    await vi.runAllTimersAsync();
    await redirectExpectation;
    expect(redirectImpl).toHaveBeenCalledTimes(1);

    resetRateLimitForTests();
    const finalResponse = responseOf(200, "<html/>");
    Object.defineProperty(finalResponse, "url", { value: "https://example.com/w/X" });
    const finalImpl = vi.fn().mockResolvedValue(finalResponse);
    const final = politeFetch("https://wiki.warframe.com/w/X", finalImpl);
    const finalExpectation = expect(final).rejects.toThrow("página no permitida");
    await vi.runAllTimersAsync();
    await finalExpectation;
  });
});

describe("politeFetchBinary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimitForTests();
  });
  afterEach(() => vi.useRealTimers());

  it("comparte cortesía y valida redirects antes de seguirlos", async () => {
    const impl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "/images/final.png" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "image/png", "content-length": "3" },
        }),
      );
    const promise = politeFetchBinary(
      "https://wiki.warframe.com/images/start.png",
      assertAllowedImageUrl,
      10,
      impl,
    );
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toMatchObject({
      finalUrl: "https://wiki.warframe.com/images/final.png",
      bytes: new Uint8Array([1, 2, 3]),
    });
    expect(impl).toHaveBeenCalledTimes(2);
    for (const call of impl.mock.calls) {
      expect((call[1].headers as Record<string, string>)["User-Agent"]).toBe(USER_AGENT);
      expect(call[1].redirect).toBe("manual");
    }
  });

  it("mantiene el intervalo global efectivo entre peticiones concurrentes", async () => {
    const requestedAt: number[] = [];
    const impl = vi.fn(async () => {
      requestedAt.push(Date.now());
      return new Response(new Uint8Array([1]), {
        status: 200,
        headers: { "content-type": "image/png", "content-length": "1" },
      });
    });

    const first = politeFetchBinary(
      "https://wiki.warframe.com/images/a.png",
      assertAllowedImageUrl,
      10,
      impl,
    );
    const second = politeFetchBinary(
      "https://wiki.warframe.com/images/b.png",
      assertAllowedImageUrl,
      10,
      impl,
    );
    await vi.runAllTimersAsync();
    await Promise.all([first, second]);

    expect(requestedAt).toHaveLength(2);
    expect(requestedAt[1]! - requestedAt[0]!).toBeGreaterThanOrEqual(RATE_LIMIT_MS);
  });

  it("rechaza redirects externos y límites declarados", async () => {
    const external = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location: "https://example.com/a.png" } }),
      );
    const redirected = politeFetchBinary(
      "https://wiki.warframe.com/images/a.png",
      assertAllowedImageUrl,
      10,
      external,
    );
    const expectation = expect(redirected).rejects.toThrow("no permitida");
    await vi.runAllTimersAsync();
    await expectation;

    resetRateLimitForTests();
    const tooLarge = politeFetchBinary(
      "https://wiki.warframe.com/images/a.png",
      assertAllowedImageUrl,
      2,
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-length": "3" },
        }),
      ),
    );
    const sizeExpectation = expect(tooLarge).rejects.toThrow("máximo 2");
    await vi.runAllTimersAsync();
    await sizeExpectation;
  });

  it("cancela el stream al superar el máximo sin Content-Length", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
      },
      cancel() {
        cancelled = true;
      },
    });
    const promise = politeFetchBinary(
      "https://wiki.warframe.com/images/a.png",
      assertAllowedImageUrl,
      3,
      vi.fn().mockResolvedValue(new Response(stream, { status: 200 })),
    );
    const expectation = expect(promise).rejects.toThrow("máximo de 3");
    await vi.runAllTimersAsync();
    await expectation;
    expect(cancelled).toBe(true);
  });

  it("rechaza Content-Length inválido y cancela el cuerpo antes de leerlo", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1]));
        controller.close();
      },
      cancel() {
        cancelled = true;
      },
    });
    const promise = politeFetchBinary(
      "https://wiki.warframe.com/images/a.png",
      assertAllowedImageUrl,
      3,
      vi
        .fn()
        .mockResolvedValue(
          new Response(stream, { status: 200, headers: { "content-length": "NaN" } }),
        ),
    );
    const expectation = expect(promise).rejects.toThrow("Content-Length inválido");
    await vi.runAllTimersAsync();
    await expectation;
    expect(cancelled).toBe(true);
  });
});
