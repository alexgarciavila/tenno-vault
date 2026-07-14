import { createHash } from "node:crypto";

import type { IncarnonImageContentType, IncarnonImage } from "../../src/data/catalog-schema";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_AXIS = 4096;
export const MAX_IMAGE_PIXELS = 16_000_000;

export interface ValidatedImage {
  finalSourceUrl: string;
  contentType: IncarnonImageContentType;
  bytes: Uint8Array;
  byteLength: number;
  width: number;
  height: number;
  sha256: string;
}

const EXTENSION_BY_TYPE: Record<IncarnonImageContentType, "png" | "jpg" | "webp"> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function assertAllowedImageUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "wiki.warframe.com" ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    !url.pathname.startsWith("/images/")
  ) {
    throw new Error(`URL de imagen no permitida: ${value}`);
  }
  return url;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function readPngDimensions(bytes: Uint8Array): [number, number] | null {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((value, index) => bytes[index] === value) || bytes.length < 57) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let dimensions: [number, number] | null = null;
  let sawIdat = false;
  let sawIend = false;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = ascii(bytes, offset + 4, 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (!/^[A-Za-z]{4}$/.test(type) || dataEnd < dataStart || chunkEnd > bytes.length) return null;
    if (crc32(bytes.subarray(offset + 4, dataEnd)) !== view.getUint32(dataEnd)) return null;

    if (offset === 8) {
      if (type !== "IHDR" || length !== 13) return null;
      const width = view.getUint32(dataStart);
      const height = view.getUint32(dataStart + 4);
      const bitDepth = bytes[dataStart + 8]!;
      const colorType = bytes[dataStart + 9]!;
      const validDepths: Record<number, readonly number[]> = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16],
      };
      if (
        !validDepths[colorType]?.includes(bitDepth) ||
        bytes[dataStart + 10] !== 0 ||
        bytes[dataStart + 11] !== 0 ||
        (bytes[dataStart + 12] !== 0 && bytes[dataStart + 12] !== 1)
      ) {
        return null;
      }
      dimensions = [width, height];
    } else if (type === "IHDR") {
      return null;
    }
    if (type === "IDAT") {
      if (sawIend || length === 0) return null;
      sawIdat = true;
    }
    if (type === "IEND") {
      if (!sawIdat || length !== 0) return null;
      sawIend = true;
      offset = chunkEnd;
      break;
    }
    offset = chunkEnd;
  }
  return dimensions && sawIdat && sawIend && offset === bytes.length ? dimensions : null;
}

function readWebpDimensions(bytes: Uint8Array): [number, number] | null {
  if (bytes.length < 26 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP")
    return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4, true) !== bytes.length - 8) return null;
  let offset = 12;
  let canvas: [number, number] | null = null;
  let image: [number, number] | null = null;
  while (offset + 8 <= bytes.length) {
    const kind = ascii(bytes, offset, 4);
    const length = view.getUint32(offset + 4, true);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + (length & 1);
    if (dataEnd < dataStart || chunkEnd > bytes.length) return null;
    if (kind === "VP8X") {
      if (canvas || length !== 10) return null;
      canvas = [
        1 + (bytes[dataStart + 4]! | (bytes[dataStart + 5]! << 8) | (bytes[dataStart + 6]! << 16)),
        1 + (bytes[dataStart + 7]! | (bytes[dataStart + 8]! << 8) | (bytes[dataStart + 9]! << 16)),
      ];
    } else if (kind === "VP8L") {
      if (image || length < 5 || bytes[dataStart] !== 0x2f) return null;
      const bits = view.getUint32(dataStart + 1, true);
      image = [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    } else if (kind === "VP8 ") {
      if (
        image ||
        length < 10 ||
        bytes[dataStart + 3] !== 0x9d ||
        bytes[dataStart + 4] !== 0x01 ||
        bytes[dataStart + 5] !== 0x2a
      ) {
        return null;
      }
      image = [
        (bytes[dataStart + 6]! | (bytes[dataStart + 7]! << 8)) & 0x3fff,
        (bytes[dataStart + 8]! | (bytes[dataStart + 9]! << 8)) & 0x3fff,
      ];
    }
    offset = chunkEnd;
  }
  if (offset !== bytes.length || !image) return null;
  if (canvas && (canvas[0] !== image[0] || canvas[1] !== image[1])) return null;
  return canvas ?? image;
}

function readJpegDimensions(bytes: Uint8Array): [number, number] | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1]!;
    if (marker === 0xd9 || marker === 0xda) break;
    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    if (length < 2 || offset + length + 2 > bytes.length) return null;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)) {
      return [
        (bytes[offset + 7]! << 8) | bytes[offset + 8]!,
        (bytes[offset + 5]! << 8) | bytes[offset + 6]!,
      ];
    }
    offset += length + 2;
  }
  return null;
}

export function validateImageBytes(
  sourceUrl: string,
  contentTypeHeader: string | null,
  bytes: Uint8Array,
): ValidatedImage {
  const finalSourceUrl = assertAllowedImageUrl(sourceUrl).href;
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error(`Tamaño de imagen no permitido: ${bytes.length} bytes.`);
  }
  const contentType = contentTypeHeader?.split(";", 1)[0]?.trim().toLowerCase();
  let dimensions: [number, number] | null = null;
  if (contentType === "image/png") dimensions = readPngDimensions(bytes);
  else if (contentType === "image/jpeg") dimensions = readJpegDimensions(bytes);
  else if (contentType === "image/webp") dimensions = readWebpDimensions(bytes);
  else throw new Error(`Content-Type de imagen no permitido: ${contentType ?? "ausente"}.`);
  if (!dimensions)
    throw new Error("La firma o cabecera binaria no coincide con el tipo declarado.");
  const [width, height] = dimensions;
  if (
    width < 1 ||
    height < 1 ||
    width > MAX_IMAGE_AXIS ||
    height > MAX_IMAGE_AXIS ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new Error(`Dimensiones de imagen no permitidas: ${width}x${height}.`);
  }
  return {
    finalSourceUrl,
    contentType: contentType as IncarnonImageContentType,
    bytes,
    byteLength: bytes.length,
    width,
    height,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export function imageMetadata(weaponId: string, image: ValidatedImage): IncarnonImage {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(weaponId)) throw new Error("weapon.id no seguro.");
  const extension = EXTENSION_BY_TYPE[image.contentType];
  return {
    localPath: `/generated/incarnon-images/${weaponId}/${image.sha256}.${extension}`,
    sourceUrl: image.finalSourceUrl,
    contentType: image.contentType,
    sha256: image.sha256,
  };
}
