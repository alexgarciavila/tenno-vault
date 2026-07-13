// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FetchHttpError, politeFetch, resetRateLimitForTests, USER_AGENT } from "../fetch";

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
});
