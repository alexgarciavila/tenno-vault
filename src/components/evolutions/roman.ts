/**
 * Convierte un entero positivo (tier de evolución, 1–N) a numeral romano, como
 * en el prototipo aprobado (I–V). Determinista y sin dependencias.
 */
const ROMAN: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return String(value);
  let remaining = Math.floor(value);
  let result = "";
  for (const [amount, symbol] of ROMAN) {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  }
  return result;
}
