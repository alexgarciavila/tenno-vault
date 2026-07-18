import { randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, parse, relative, resolve, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";

import {
  incarnonCatalogSchema,
  type IncarnonCatalog,
  type IncarnonImage,
} from "../../src/data/catalog-schema";
import { validateImageBytes } from "./image";
import { DEFAULT_REPORT_PATH, type RunReport } from "./report";
import { assertCompleteTranslationCoverage } from "./translations/coverage-gate";
import { measureLocalizedCatalogCoverage } from "./translations/coverage";
import { formatValidationError } from "./validate";

export const CATALOG_PATH = join("src", "data", "incarnon-catalog.json");
export const IMAGE_PUBLIC_ROOT = join("public", "generated", "incarnon-images");
export const IMAGE_STAGING_ROOT = join("scripts", "scrape", ".staging", "incarnon-images");

export interface PublicationPaths {
  catalogPath: string;
  publicRoot: string;
  stagingRoot: string;
}

export interface CatalogReportPublicationPaths extends PublicationPaths {
  reportPath: string;
}

const DEFAULT_PATHS: PublicationPaths = {
  catalogPath: CATALOG_PATH,
  publicRoot: IMAGE_PUBLIC_ROOT,
  stagingRoot: IMAGE_STAGING_ROOT,
};

const DEFAULT_CATALOG_REPORT_PATHS: CatalogReportPublicationPaths = {
  ...DEFAULT_PATHS,
  reportPath: DEFAULT_REPORT_PATH,
};

export interface StagedImage {
  metadata: IncarnonImage;
  stagingPath: string;
}

const SAFE_WEAPON_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_RUN_ID = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,127})$/;
const EXTENSION_BY_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

function pathKey(path: string): string {
  const normalized = resolve(path);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function assertInside(root: string, target: string): void {
  const relativePath = relative(resolve(root), resolve(target));
  if (relativePath === "" || (!relativePath.startsWith("..") && !relativePath.includes(`..${sep}`)))
    return;
  throw new Error(`Ruta fuera de la raíz segura: ${target}`);
}

function ensureSafeDirectory(path: string): string {
  const absolute = resolve(path);
  const root = parse(absolute).root;
  let current = root;
  for (const segment of absolute.slice(root.length).split(sep).filter(Boolean)) {
    current = join(current, segment);
    if (!existsSync(current)) mkdirSync(current);
    const stat = lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`Se rechazó un enlace simbólico: ${current}`);
    if (!stat.isDirectory()) throw new Error(`La ruta segura no es un directorio: ${current}`);
  }
  if (pathKey(realpathSync.native(absolute)) !== pathKey(absolute)) {
    throw new Error(`La raíz resuelta sale de la ruta segura: ${absolute}`);
  }
  return absolute;
}

function assertRegularFile(path: string): void {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw new Error(`Se rechazó un enlace simbólico: ${path}`);
  if (!stat.isFile()) throw new Error(`El recurso no es un archivo regular: ${path}`);
}

function secureRead(path: string): Buffer {
  assertRegularFile(path);
  const noFollow = constants.O_NOFOLLOW ?? 0;
  const fd = openSync(path, constants.O_RDONLY | noFollow);
  try {
    if (!fstatSync(fd).isFile()) throw new Error(`El recurso no es un archivo regular: ${path}`);
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

function exclusiveWrite(path: string, data: string | Uint8Array): void {
  ensureSafeDirectory(dirname(path));
  const noFollow = constants.O_NOFOLLOW ?? 0;
  let fd: number | null = null;
  let created = false;
  try {
    fd = openSync(
      path,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow,
      0o600,
    );
    created = true;
    writeFileSync(fd, data);
  } catch (error) {
    if (fd !== null) {
      closeSync(fd);
      fd = null;
    }
    if (created && existsSync(path)) {
      try {
        assertRegularFile(path);
        unlinkSync(path);
      } catch {
        // No se sigue ni elimina una ruta que haya cambiado a enlace.
      }
    }
    throw error;
  } finally {
    if (fd !== null) closeSync(fd);
  }
}

function imagePathParts(image: IncarnonImage): { weaponId: string; filename: string } {
  const prefix = "/generated/incarnon-images/";
  if (!image.localPath.startsWith(prefix))
    throw new Error(`Ruta local fuera del área publicada: ${image.localPath}`);
  const segments = image.localPath.slice(prefix.length).split("/");
  const [weaponId, filename] = segments;
  const extension = EXTENSION_BY_TYPE[image.contentType];
  if (
    segments.length !== 2 ||
    !weaponId ||
    !SAFE_WEAPON_ID.test(weaponId) ||
    filename !== `${image.sha256}.${extension}`
  ) {
    throw new Error(`Ruta local insegura o incoherente: ${image.localPath}`);
  }
  return { weaponId, filename };
}

function imageDiskPath(image: IncarnonImage, publicRoot: string): string {
  const root = resolve(publicRoot);
  const { weaponId, filename } = imagePathParts(image);
  const target = resolve(root, weaponId, filename);
  assertInside(root, target);
  return target;
}

function assertMetadataEqual(actual: IncarnonImage, expected: IncarnonImage): void {
  if (
    actual.localPath !== expected.localPath ||
    actual.sourceUrl !== expected.sourceUrl ||
    actual.contentType !== expected.contentType ||
    actual.sha256 !== expected.sha256
  ) {
    throw new Error("Los metadatos staged no corresponden con el catálogo candidato.");
  }
}

export function verifyPublishedImage(
  image: IncarnonImage,
  publicRoot: string = IMAGE_PUBLIC_ROOT,
): void {
  const root = ensureSafeDirectory(publicRoot);
  const path = imageDiskPath(image, root);
  if (!existsSync(path)) throw new Error(`No existe el recurso publicado ${image.localPath}.`);
  ensureSafeDirectory(dirname(path));
  const bytes = secureRead(path);
  const validated = validateImageBytes(image.sourceUrl, image.contentType, bytes);
  if (validated.sha256 !== image.sha256) throw new Error(`Hash incorrecto en ${image.localPath}.`);
}

export function stageImage(
  runId: string,
  weaponId: string,
  image: IncarnonImage,
  bytes: Uint8Array,
  stagingRoot: string = IMAGE_STAGING_ROOT,
): StagedImage {
  if (!SAFE_RUN_ID.test(runId)) throw new Error("runId no seguro.");
  if (!SAFE_WEAPON_ID.test(weaponId)) throw new Error("weaponId no seguro.");
  const parts = imagePathParts(image);
  if (parts.weaponId !== weaponId) throw new Error("weaponId y metadatos no corresponden.");
  const validated = validateImageBytes(image.sourceUrl, image.contentType, bytes);
  if (validated.sha256 !== image.sha256) throw new Error("El blob no coincide con sus metadatos.");

  const root = ensureSafeDirectory(stagingRoot);
  const stagingPath = resolve(root, runId, weaponId, parts.filename);
  assertInside(root, stagingPath);
  exclusiveWrite(stagingPath, bytes);
  return { metadata: image, stagingPath };
}

/** Elimina únicamente el staging de una ejecución cuyo identificador ya fue validado. */
export function cleanupStagingRun(runId: string, stagingRoot: string = IMAGE_STAGING_ROOT): void {
  if (!SAFE_RUN_ID.test(runId)) throw new Error("runId no seguro para limpieza.");
  if (!existsSync(stagingRoot)) return;

  const root = ensureSafeDirectory(stagingRoot);
  const runDirectory = resolve(root, runId);
  assertInside(root, runDirectory);
  if (!existsSync(runDirectory)) return;

  const stat = lstatSync(runDirectory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`El staging de la ejecución no es un directorio seguro: ${runDirectory}`);
  }
  if (pathKey(realpathSync.native(runDirectory)) !== pathKey(runDirectory)) {
    throw new Error(`El staging de la ejecución sale de la ruta segura: ${runDirectory}`);
  }
  rmSync(runDirectory, { recursive: true, force: true });
}

function validateStagedImage(staged: StagedImage, stagingRoot: string): Buffer {
  const root = ensureSafeDirectory(stagingRoot);
  const absolute = resolve(staged.stagingPath);
  assertInside(root, absolute);
  const segments = relative(root, absolute).split(sep);
  const [runId, weaponId, filename] = segments;
  const parts = imagePathParts(staged.metadata);
  if (
    segments.length !== 3 ||
    !runId ||
    !SAFE_RUN_ID.test(runId) ||
    !weaponId ||
    !SAFE_WEAPON_ID.test(weaponId) ||
    weaponId !== parts.weaponId ||
    filename !== parts.filename
  ) {
    throw new Error("El staging no corresponde con runId, weaponId y metadatos.");
  }
  ensureSafeDirectory(dirname(absolute));
  const bytes = secureRead(absolute);
  const validated = validateImageBytes(
    staged.metadata.sourceUrl,
    staged.metadata.contentType,
    bytes,
  );
  if (validated.sha256 !== staged.metadata.sha256)
    throw new Error("El blob staged no coincide con sus metadatos.");
  return bytes;
}

function prepareCatalogPublication(
  catalog: IncarnonCatalog,
  stagedImages: StagedImage[],
  paths: PublicationPaths,
): IncarnonCatalog {
  const validation = incarnonCatalogSchema.safeParse(catalog);
  if (!validation.success) {
    throw new Error(`El catálogo candidato no valida:\n${formatValidationError(validation.error)}`);
  }

  const stagedByPath = new Map<string, StagedImage>();
  for (const staged of stagedImages) {
    if (stagedByPath.has(staged.metadata.localPath))
      throw new Error(`Blob staged duplicado: ${staged.metadata.localPath}`);
    stagedByPath.set(staged.metadata.localPath, staged);
  }
  const catalogImages = new Map(
    validation.data.weapons.flatMap((weapon) =>
      weapon.image ? [[weapon.image.localPath, weapon.image]] : [],
    ),
  );
  const stagedBytes = new Map<string, Buffer>();
  for (const staged of stagedImages) {
    const expected = catalogImages.get(staged.metadata.localPath);
    if (!expected) throw new Error("El blob staged no corresponde con el catálogo candidato.");
    assertMetadataEqual(staged.metadata, expected);
    stagedBytes.set(staged.metadata.localPath, validateStagedImage(staged, paths.stagingRoot));
  }

  for (const weapon of validation.data.weapons) {
    if (!weapon.image) continue;
    const staged = stagedByPath.get(weapon.image.localPath);
    if (!staged) verifyPublishedImage(weapon.image, paths.publicRoot);
  }

  for (const staged of stagedImages) {
    const target = imageDiskPath(staged.metadata, ensureSafeDirectory(paths.publicRoot));
    ensureSafeDirectory(dirname(target));
    if (existsSync(target)) {
      verifyPublishedImage(staged.metadata, paths.publicRoot);
      continue;
    }
    const bytes = stagedBytes.get(staged.metadata.localPath);
    if (!bytes) throw new Error("No se validaron los bytes staged antes de publicar.");
    exclusiveWrite(target, bytes);
    verifyPublishedImage(staged.metadata, paths.publicRoot);
    assertRegularFile(staged.stagingPath);
    unlinkSync(staged.stagingPath);
  }

  return validation.data;
}

interface AtomicJsonFile {
  path: string;
  contents: string;
  validate?: (raw: unknown) => void;
}

/** Prepara todos los JSON antes del commit y restaura sus bytes previos si falla un rename. */
function replaceJsonFilesAtomically(files: AtomicJsonFile[]): void {
  const targets = files.map((file) => resolve(file.path));
  if (new Set(targets.map(pathKey)).size !== targets.length) {
    throw new Error("Las rutas de publicación JSON deben ser distintas.");
  }

  const transactionId = `${process.pid}-${randomUUID()}`;
  const prepared: Array<{
    target: string;
    tmpPath: string;
    backupPath: string;
    hadPrevious: boolean;
  }> = [];
  try {
    for (const [index, file] of files.entries()) {
      const target = targets[index]!;
      ensureSafeDirectory(dirname(target));
      if (existsSync(target)) assertRegularFile(target);
      const tmpPath = `${target}.tmp-${transactionId}`;
      const backupPath = `${target}.bak-${transactionId}`;
      exclusiveWrite(tmpPath, file.contents);
      const reread: unknown = JSON.parse(secureRead(tmpPath).toString("utf8"));
      file.validate?.(reread);
      prepared.push({ target, tmpPath, backupPath, hadPrevious: existsSync(target) });
    }
  } catch (error) {
    for (const item of prepared) {
      if (existsSync(item.tmpPath)) unlinkSync(item.tmpPath);
    }
    const pendingTarget = targets[prepared.length];
    if (pendingTarget) {
      const pendingTmp = `${pendingTarget}.tmp-${transactionId}`;
      if (existsSync(pendingTmp)) unlinkSync(pendingTmp);
    }
    throw error;
  }

  const backedUp: typeof prepared = [];
  const committed: typeof prepared = [];
  try {
    for (const item of prepared) {
      if (!item.hadPrevious) continue;
      assertRegularFile(item.target);
      renameSync(item.target, item.backupPath);
      backedUp.push(item);
    }
    for (const item of prepared) {
      renameSync(item.tmpPath, item.target);
      committed.push(item);
    }
  } catch (error) {
    for (const item of committed.reverse()) {
      if (existsSync(item.target)) unlinkSync(item.target);
    }
    for (const item of backedUp.reverse()) {
      if (existsSync(item.backupPath)) renameSync(item.backupPath, item.target);
    }
    for (const item of prepared) {
      if (existsSync(item.tmpPath)) unlinkSync(item.tmpPath);
    }
    throw error;
  }

  for (const item of backedUp) {
    assertRegularFile(item.backupPath);
    unlinkSync(item.backupPath);
  }
}

function catalogJsonFile(catalog: IncarnonCatalog, path: string): AtomicJsonFile {
  return {
    path,
    contents: `${JSON.stringify(catalog, null, 2)}\n`,
    validate(raw) {
      const check = incarnonCatalogSchema.safeParse(raw);
      if (!check.success) {
        throw new Error(`El catálogo temporal no valida:\n${formatValidationError(check.error)}`);
      }
    },
  };
}

/** Publica catálogo e informe desde temporales preparados dentro de una misma transacción local. */
export function publishCatalogWithReport(
  catalog: IncarnonCatalog,
  stagedImages: StagedImage[],
  report: RunReport,
  paths: CatalogReportPublicationPaths = DEFAULT_CATALOG_REPORT_PATHS,
): void {
  if (report.publication.status !== "published" || !report.coverage) {
    throw new Error(
      "BLOCKED: catálogo e informe solo pueden publicarse como un resultado completo.",
    );
  }

  const candidate = incarnonCatalogSchema.safeParse(catalog);
  if (!candidate.success) {
    throw new Error(`El catálogo candidato no valida:\n${formatValidationError(candidate.error)}`);
  }
  const measuredCoverage = measureLocalizedCatalogCoverage(candidate.data);
  if (!isDeepStrictEqual(report.coverage, measuredCoverage)) {
    throw new Error(
      "BLOCKED: la cobertura del informe no corresponde exactamente con el catálogo candidato.",
    );
  }
  assertCompleteTranslationCoverage(measuredCoverage);
  const validated = prepareCatalogPublication(catalog, stagedImages, paths);
  replaceJsonFilesAtomically([
    catalogJsonFile(validated, paths.catalogPath),
    {
      path: paths.reportPath,
      contents: `${JSON.stringify(report, null, 2)}\n`,
    },
  ]);
}
