/**
 * Estado vacío reutilizable (sin resultados de filtro, sin instalaciones,
 * usuario nuevo). CTA opcional.
 */
export function EmptyState({
  title,
  description,
  ctaLabel,
  onCta,
}: {
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <p className="text-lg font-medium text-fg">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-fg-muted">{description}</p> : null}
      {ctaLabel && onCta ? (
        <button
          type="button"
          onClick={onCta}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 font-medium text-bg hover:bg-accent-strong"
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}
