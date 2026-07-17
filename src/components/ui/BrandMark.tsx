/** Identidad geométrica propia de Tenno Vault; no reproduce marcas oficiales. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center text-[0.625rem] font-extrabold tracking-[0.08em] text-accent ${className}`}
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full" fill="none">
        <path
          d="M20 2.5 35.2 11.25v17.5L20 37.5 4.8 28.75v-17.5z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M20 7.5 30.9 13.8v12.4L20 32.5 9.1 26.2V13.8z"
          stroke="currentColor"
          strokeOpacity=".38"
        />
      </svg>
      <span className="relative">TV</span>
    </span>
  );
}
