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

describe("catálogo v3 e imágenes publicadas reales", () => {
  it("materializa la conversión v3 53/53 sin incidencias ni staging pendiente", () => {
    expect(reportJson).toMatchObject({
      catalogSchemaVersion: 3,
      translationSchemaVersion: 1,
      translationSource: "project-translation",
      mode: "convert-v3",
      total: 53,
      ok: 53,
      reviewRequired: [],
      kept: [],
      errors: [],
      imageIssues: [],
      imagesKept: [],
      imagesStaged: [],
      imagesPublished: [],
      translationIssues: [],
      identityIssues: [],
      publication: { status: "published" },
    });
    expect(reportJson.coverage).toMatchObject({
      translated: 1594,
      missing: 0,
      notApplicable: 631,
      percentage: 100,
    });
    expect(Object.values(reportJson.coverage.byWeapon)).toHaveLength(53);
    expect(
      Object.values(reportJson.coverage.byWeapon).every(
        (weapon) => weapon.missing === 0 && weapon.percentage === 100,
      ),
    ).toBe(true);
    expect(filesBelow(STAGING_ROOT)).toEqual([]);
  });

  it("mantiene el informe publicado coherente por campo, arma y arma/campo", () => {
    const sum = (stats: Array<{ translated: number; missing: number; notApplicable: number }>) =>
      stats.reduce(
        (total, item) => ({
          translated: total.translated + item.translated,
          missing: total.missing + item.missing,
          notApplicable: total.notApplicable + item.notApplicable,
        }),
        { translated: 0, missing: 0, notApplicable: 0 },
      );
    const expected = {
      translated: reportJson.coverage.translated,
      missing: reportJson.coverage.missing,
      notApplicable: reportJson.coverage.notApplicable,
    };

    expect(sum(Object.values(reportJson.coverage.byField))).toEqual(expected);
    expect(sum(Object.values(reportJson.coverage.byWeapon))).toEqual(expected);
    expect(Object.keys(reportJson.coverage.byWeapon).sort()).toEqual(
      catalogJson.weapons.map((weapon) => weapon.id).sort(),
    );
    for (const weapon of Object.values(reportJson.coverage.byWeapon)) {
      expect(sum(Object.values(weapon.byField))).toEqual({
        translated: weapon.translated,
        missing: weapon.missing,
        notApplicable: weapon.notApplicable,
      });
    }
  });

  it("valida referencias, blobs, hashes, tipos, rutas, origen y ausencia de huérfanos", () => {
    const catalog = incarnonCatalogSchema.parse(catalogJson);
    expect(catalog.schemaVersion).toBe(3);
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
      canonicalLanguage: "en",
      translations: [
        {
          id: "tenno-vault-es-from-warframe-wiki-en",
          language: "es",
          kind: "project-translation",
          derivedFrom: "warframe-wiki-en",
          responsibility: "Colaboradores de Tenno Vault",
          license: "CC BY-NC-SA 3.0",
          licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
          updatedAt: "2026-07-18T00:00:00.000Z",
          changes:
            "Traducción propia al español del contenido canónico inglés de la Warframe Wiki.",
        },
      ],
    });
    for (const weapon of catalog.weapons) {
      expect(weapon.sourceUrl).toMatch(/^https:\/\/wiki\.warframe\.com\/w\//);
      expect(weapon.image?.sourceUrl).toMatch(/^https:\/\/wiki\.warframe\.com\/images\//);
    }
  });
});
