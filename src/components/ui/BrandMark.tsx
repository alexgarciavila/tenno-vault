/**
 * Identidad geométrica propia de Tenno Vault; no reproduce marcas oficiales.
 * Hexágono de acento con monograma "T" en tipografía display (Michroma).
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center ${className}`}
    >
      <span className="wf-hex absolute inset-0 bg-gradient-to-br from-accent to-[#1b6d7c]" />
      <span className="wf-hex absolute inset-[7%] bg-bg-deep" />
      <span className="relative font-display text-[0.8rem] leading-none text-accent">T</span>
    </span>
  );
}
