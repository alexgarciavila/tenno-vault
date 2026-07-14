// @vitest-environment node
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

import catalogJson from "../../../src/data/incarnon-catalog.json";
import { incarnonCatalogSchema } from "../../../src/data/catalog-schema";
import { validateImageBytes } from "../image";
import reportJson from "../report/last-run.json";

const PUBLIC_ROOT = resolve("public", "generated", "incarnon-images");
const STAGING_ROOT = resolve("scripts", "scrape", ".staging", "incarnon-images");

function filesBelow(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const stat = lstatSync(path);
      expect(stat.isSymbolicLink(), `No se permiten symlinks: ${path}`).toBe(false);
      if (stat.isDirectory()) visit(path);
      else {
        expect(stat.isFile(), `Se esperaba un archivo regular: ${path}`).toBe(true);
        files.push(relative(root, path).split(sep).join("/"));
      }
    }
  };
  visit(root);
  return files.sort();
}

describe("catálogo v2 e imágenes publicadas reales", () => {
  it("mantiene un informe completo 53/53 sin incidencias ni staging pendiente", () => {
    expect(reportJson).toMatchObject({
      mode: "all",
      total: 53,
      ok: 53,
      reviewRequired: [],
      kept: [],
      errors: [],
      imageIssues: [],
      imagesKept: [],
      publication: { status: "published" },
    });
    expect(reportJson.imagesStaged).toHaveLength(53);
    expect(new Set(reportJson.imagesStaged).size).toBe(53);
    expect(reportJson.imagesPublished).toHaveLength(53);
    expect(new Set(reportJson.imagesPublished).size).toBe(53);
    expect([...reportJson.imagesPublished].sort()).toEqual([...reportJson.imagesStaged].sort());
    expect(filesBelow(STAGING_ROOT)).toEqual([]);
  });

  it("valida referencias, blobs, hashes, tipos, rutas, origen y ausencia de huérfanos", () => {
    const catalog = incarnonCatalogSchema.parse(catalogJson);
    expect(catalog.schemaVersion).toBe(2);
    expect(catalog.weapons).toHaveLength(53);
    expect(catalog.weapons.every((weapon) => weapon.dataStatus === "complete")).toBe(true);
    expect(catalog.weapons.every((weapon) => weapon.reviewNotes.length === 0)).toBe(true);

    const expectedFiles: string[] = [];
    for (const weapon of catalog.weapons) {
      expect(weapon.image, `Falta imagen publicada para ${weapon.id}`).not.toBeNull();
      const image = weapon.image!;
      const relativePath = image.localPath.replace(/^\//, "");
      const expectedPrefix = `generated/incarnon-images/${weapon.id}/`;
      expect(relativePath.startsWith(expectedPrefix)).toBe(true);
      expectedFiles.push(relativePath.slice("generated/incarnon-images/".length));

      const bytes = readFileSync(resolve("public", relativePath));
      const validated = validateImageBytes(image.sourceUrl, image.contentType, bytes);
      expect(validated.sha256).toBe(image.sha256);
      expect(validated.contentType).toBe(image.contentType);
    }

    expect(expectedFiles).toHaveLength(53);
    expect(new Set(expectedFiles).size).toBe(53);
    expect(filesBelow(PUBLIC_ROOT)).toEqual(expectedFiles.sort());
  });

  it("conserva atribución global y trazabilidad individual de origen", () => {
    const catalog = incarnonCatalogSchema.parse(catalogJson);
    expect(catalog.attribution).toEqual({
      source: "Warframe Wiki",
      sourceUrl: "https://wiki.warframe.com/w/Incarnon",
      license: "CC BY-NC-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
    });
    for (const weapon of catalog.weapons) {
      expect(weapon.sourceUrl).toMatch(/^https:\/\/wiki\.warframe\.com\/w\//);
      expect(weapon.image?.sourceUrl).toMatch(/^https:\/\/wiki\.warframe\.com\/images\//);
    }
  });
});
