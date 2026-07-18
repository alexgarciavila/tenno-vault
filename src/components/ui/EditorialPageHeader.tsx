export function EditorialPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="editorial-page-header flex flex-wrap items-end gap-x-4 gap-y-2">
      <h1 className="editorial-page-header__copy editorial-page-header__title">{title}</h1>
      <span aria-hidden="true" className="editorial-rule mb-2 hidden sm:block" />
      {subtitle ? (
        <p className="editorial-page-header__copy w-full text-[0.75rem] font-medium uppercase tracking-[0.2em] text-fg-subtle sm:w-auto sm:pb-1">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
