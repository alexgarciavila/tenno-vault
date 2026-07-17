export function EditorialPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="editorial-page-header flex flex-wrap items-end gap-x-4 gap-y-2">
      <h1 className="editorial-page-header__copy font-extrabold uppercase tracking-[0.08em] text-fg">
        {title}
      </h1>
      <span aria-hidden="true" className="editorial-rule mb-2 hidden sm:block" />
      {subtitle ? (
        <p className="editorial-page-header__copy w-full text-[0.8125rem] font-medium tracking-[0.08em] text-gold sm:w-auto sm:pb-1">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
