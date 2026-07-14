// @vitest-environment node
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import catalogJson from "../../../src/data/incarnon-catalog.json";
import { incarnonCatalogSchema } from "../../../src/data/catalog-schema";
import { imageMetadata, validateImageBytes } from "../image";
import { cleanupStagingRun, publishCatalog, stageImage, type PublicationPaths } from "../publish";

const temporaryRoots: string[] = [];

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(12 + data.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  bytes.set(new TextEncoder().encode(type), 4);
  bytes.set(data, 8);
  view.setUint32(8 + data.length, crc32(bytes.slice(4, 8 + data.length)));
  return bytes;
}

function png(): Uint8Array {
  const ihdr = new Uint8Array([0, 0, 0, 2, 0, 0, 0, 2, 8, 2, 0, 0, 0]);
  const chunks = [
    chunk("IHDR", ihdr),
    chunk("IDAT", new Uint8Array([1])),
    chunk("IEND", new Uint8Array()),
  ];
  const bytes = new Uint8Array(8 + chunks.reduce((total, item) => total + item.length, 0));
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  let offset = 8;
  for (const item of chunks) {
    bytes.set(item, offset);
    offset += item.length;
  }
  return bytes;
}

function paths(): { root: string; value: PublicationPaths } {
  const root = mkdtempSync(join(tmpdir(), "tenno-vault-images-"));
  temporaryRoots.push(root);
  return {
    root,
    value: {
      catalogPath: join(root, "src", "data", "catalog.json"),
      publicRoot: join(root, "public", "generated", "incarnon-images"),
      stagingRoot: join(root, "staging"),
    },
  };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("publicación coherente de catálogo e imágenes", () => {
  it("promueve primero el blob SHA-256 y después confirma el catálogo", () => {
    const { root, value } = paths();
    const base = incarnonCatalogSchema.parse(catalogJson);
    const bytes = png();
    const validated = validateImageBytes(
      "https://wiki.warframe.com/images/test.png",
      "image/png",
      bytes,
    );
    const metadata = imageMetadata(base.weapons[0]!.id, validated);
    const catalog = {
      ...base,
      weapons: [{ ...base.weapons[0]!, image: metadata }],
    };
    const staged = stageImage("run", base.weapons[0]!.id, metadata, bytes, value.stagingRoot);

    publishCatalog(catalog, [staged], value);

    expect(existsSync(join(root, "public", metadata.localPath))).toBe(true);
    expect(
      incarnonCatalogSchema.parse(JSON.parse(readFileSync(value.catalogPath, "utf8"))).weapons,
    ).toHaveLength(1);
  });

  it("conserva intacto el JSON previo si falta un blob referenciado", () => {
    const { value } = paths();
    const base = incarnonCatalogSchema.parse(catalogJson);
    const bytes = png();
    const validated = validateImageBytes(
      "https://wiki.warframe.com/images/test.png",
      "image/png",
      bytes,
    );
    const metadata = imageMetadata(base.weapons[0]!.id, validated);
    const validCatalog = { ...base, weapons: [{ ...base.weapons[0]!, image: metadata }] };
    publishCatalog(
      validCatalog,
      [stageImage("run", base.weapons[0]!.id, metadata, bytes, value.stagingRoot)],
      value,
    );
    const previous = readFileSync(value.catalogPath, "utf8");
    const missingHash = "c".repeat(64);
    const broken = {
      ...validCatalog,
      weapons: [
        {
          ...validCatalog.weapons[0]!,
          image: {
            ...metadata,
            sha256: missingHash,
            localPath: `/generated/incarnon-images/${base.weapons[0]!.id}/${missingHash}.png`,
          },
        },
      ],
    };

    expect(() => publishCatalog(broken, [], value)).toThrow("No existe el recurso");
    expect(readFileSync(value.catalogPath, "utf8")).toBe(previous);
  });

  it("rechaza symlinks en staging y no escribe fuera de la raíz", () => {
    const { root, value } = paths();
    const outside = join(root, "outside");
    mkdirSync(outside);
    mkdirSync(value.stagingRoot, { recursive: true });
    symlinkSync(outside, join(value.stagingRoot, "run"), "junction");
    const base = incarnonCatalogSchema.parse(catalogJson);
    const validated = validateImageBytes(
      "https://wiki.warframe.com/images/test.png",
      "image/png",
      png(),
    );
    const metadata = imageMetadata(base.weapons[0]!.id, validated);

    expect(() =>
      stageImage("run", base.weapons[0]!.id, metadata, validated.bytes, value.stagingRoot),
    ).toThrow(/enlace simbólico|symlink/i);
    expect(existsSync(join(outside, base.weapons[0]!.id))).toBe(false);
  });

  it("crea temporales de staging de forma exclusiva sin sobrescribirlos", () => {
    const { value } = paths();
    const base = incarnonCatalogSchema.parse(catalogJson);
    const validated = validateImageBytes(
      "https://wiki.warframe.com/images/test.png",
      "image/png",
      png(),
    );
    const metadata = imageMetadata(base.weapons[0]!.id, validated);
    const staged = stageImage(
      "run",
      base.weapons[0]!.id,
      metadata,
      validated.bytes,
      value.stagingRoot,
    );
    expect(() =>
      stageImage("run", base.weapons[0]!.id, metadata, validated.bytes, value.stagingRoot),
    ).toThrow();
    expect(readFileSync(staged.stagingPath)).toEqual(Buffer.from(validated.bytes));
  });

  it("rechaza symlinks en publicación y valida runId/weaponId/metadatos", () => {
    const { root, value } = paths();
    const base = incarnonCatalogSchema.parse(catalogJson);
    const validated = validateImageBytes(
      "https://wiki.warframe.com/images/test.png",
      "image/png",
      png(),
    );
    const metadata = imageMetadata(base.weapons[0]!.id, validated);
    expect(() =>
      stageImage("../run", base.weapons[0]!.id, metadata, validated.bytes, value.stagingRoot),
    ).toThrow("runId no seguro");
    expect(() =>
      stageImage("run", "otra-arma", metadata, validated.bytes, value.stagingRoot),
    ).toThrow("no corresponden");

    const staged = stageImage(
      "run",
      base.weapons[0]!.id,
      metadata,
      validated.bytes,
      value.stagingRoot,
    );
    const outside = join(root, "outside-public");
    mkdirSync(outside);
    mkdirSync(value.publicRoot, { recursive: true });
    symlinkSync(outside, join(value.publicRoot, base.weapons[0]!.id), "junction");
    const catalog = { ...base, weapons: [{ ...base.weapons[0]!, image: metadata }] };
    expect(() => publishCatalog(catalog, [staged], value)).toThrow(/enlace simbólico|symlink/i);
    expect(existsSync(join(outside, metadata.sha256 + ".png"))).toBe(false);
  });

  it("limpia solo el staging del run abortado y conserva otros runs y recursos publicados", () => {
    const { root, value } = paths();
    const base = incarnonCatalogSchema.parse(catalogJson);
    const validated = validateImageBytes(
      "https://wiki.warframe.com/images/test.png",
      "image/png",
      png(),
    );
    const metadata = imageMetadata(base.weapons[0]!.id, validated);
    const aborted = stageImage(
      "run-abortado",
      base.weapons[0]!.id,
      metadata,
      validated.bytes,
      value.stagingRoot,
    );
    const other = stageImage(
      "otro-run",
      base.weapons[0]!.id,
      metadata,
      validated.bytes,
      value.stagingRoot,
    );
    const publishedRoot = join(root, "public", "generated", "incarnon-images");
    const published = join(publishedRoot, "persistente.png");
    mkdirSync(publishedRoot, { recursive: true });
    writeFileSync(published, validated.bytes);

    cleanupStagingRun("run-abortado", value.stagingRoot);

    expect(existsSync(aborted.stagingPath)).toBe(false);
    expect(existsSync(other.stagingPath)).toBe(true);
    expect(existsSync(published)).toBe(true);
  });

  it("rechaza una limpieza con runId no validado sin tocar staging", () => {
    const { value } = paths();
    const sentinel = join(value.stagingRoot, "otro-run", "sentinel.txt");
    mkdirSync(join(value.stagingRoot, "otro-run"), { recursive: true });
    writeFileSync(sentinel, "intacto");

    expect(() => cleanupStagingRun("../otro-run", value.stagingRoot)).toThrow(
      "runId no seguro para limpieza",
    );
    expect(readFileSync(sentinel, "utf8")).toBe("intacto");
  });
});
