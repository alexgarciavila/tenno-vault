// @vitest-environment node
import { describe, expect, it } from "vitest";

import { assertAllowedImageUrl, imageMetadata, validateImageBytes } from "../image";

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(new TextEncoder().encode(type), 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.slice(4, 8 + data.length)));
  return chunk;
}

function png(width = 2, height = 3): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const chunks = [
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", new Uint8Array([1])),
    pngChunk("IEND", new Uint8Array()),
  ];
  const bytes = new Uint8Array(8 + chunks.reduce((total, chunk) => total + chunk.length, 0));
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  let offset = 8;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

function webp(width = 2, height = 3): Uint8Array {
  const payload = new Uint8Array(5);
  payload[0] = 0x2f;
  const bits = (width - 1) | ((height - 1) << 14);
  new DataView(payload.buffer).setUint32(1, bits, true);
  const bytes = new Uint8Array(26);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  view.setUint32(4, 18, true);
  bytes.set(new TextEncoder().encode("WEBPVP8L"), 8);
  view.setUint32(16, payload.length, true);
  bytes.set(payload, 20);
  return bytes;
}

describe("validación segura de imágenes", () => {
  it("valida firma, dimensiones, hash y deriva una ruta content-addressed", () => {
    const image = validateImageBytes(
      "https://wiki.warframe.com/images/Braton.png",
      "image/png",
      png(),
    );
    expect(image).toMatchObject({ width: 2, height: 3, byteLength: png().length });
    expect(image.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(imageMetadata("braton", image).localPath).toBe(
      `/generated/incarnon-images/braton/${image.sha256}.png`,
    );
  });

  it("rechaza origen, esquema, credenciales, traversal y contenido activo", () => {
    for (const url of [
      "http://wiki.warframe.com/images/a.png",
      "https://example.com/images/a.png",
      "https://user@wiki.warframe.com/images/a.png",
      "https://wiki.warframe.com/w/a.png",
    ]) {
      expect(() => assertAllowedImageUrl(url)).toThrow();
    }
    expect(() =>
      imageMetadata(
        "../escape",
        validateImageBytes("https://wiki.warframe.com/images/a.png", "image/png", png()),
      ),
    ).toThrow("weapon.id no seguro");
    expect(() =>
      validateImageBytes(
        "https://wiki.warframe.com/images/a.svg",
        "image/svg+xml",
        new TextEncoder().encode("<svg></svg>"),
      ),
    ).toThrow("Content-Type");
  });

  it("rechaza firma o dimensiones no permitidas", () => {
    expect(() =>
      validateImageBytes("https://wiki.warframe.com/images/a.png", "image/png", new Uint8Array(24)),
    ).toThrow("firma");
    expect(() =>
      validateImageBytes("https://wiki.warframe.com/images/a.png", "image/png", png(4097, 1)),
    ).toThrow("Dimensiones");
  });

  it("rechaza PNG truncado, sin IDAT/IEND o con CRC inválido", () => {
    const valid = png();
    for (const invalid of [valid.slice(0, 24), valid.slice(0, -12)]) {
      expect(() =>
        validateImageBytes("https://wiki.warframe.com/images/a.png", "image/png", invalid),
      ).toThrow("firma o cabecera");
    }
    const badCrc = valid.slice();
    badCrc[29] = badCrc[29]! ^ 0xff;
    expect(() =>
      validateImageBytes("https://wiki.warframe.com/images/a.png", "image/png", badCrc),
    ).toThrow("firma o cabecera");
  });

  it("valida el contenedor WebP completo y rechaza tamaños/chunks incoherentes", () => {
    expect(
      validateImageBytes("https://wiki.warframe.com/images/a.webp", "image/webp", webp()),
    ).toMatchObject({ width: 2, height: 3 });
    const badRiffSize = webp();
    new DataView(badRiffSize.buffer).setUint32(4, 999, true);
    expect(() =>
      validateImageBytes("https://wiki.warframe.com/images/a.webp", "image/webp", badRiffSize),
    ).toThrow("firma o cabecera");
    const truncatedChunk = webp().slice(0, -2);
    expect(() =>
      validateImageBytes("https://wiki.warframe.com/images/a.webp", "image/webp", truncatedChunk),
    ).toThrow("firma o cabecera");
  });
});
