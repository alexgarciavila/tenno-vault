import type { CatalogLanguage, LocalizedText, LocalizedVariantValue } from "../data/catalog-schema";

export type ResolvedCatalogText = Readonly<{
  text: string;
  requestedLanguage: CatalogLanguage;
  effectiveLanguage: CatalogLanguage;
  isFallback: boolean;
  languageNeutral: false;
}>;

export function resolveCatalogText(
  value: LocalizedText,
  requestedLanguage: CatalogLanguage,
): ResolvedCatalogText {
  if (value.en.trim().length === 0) throw new Error("El texto canónico EN está vacío.");
  if (requestedLanguage === "es" && value.es?.trim()) {
    return {
      text: value.es,
      requestedLanguage,
      effectiveLanguage: "es",
      isFallback: false,
      languageNeutral: false,
    };
  }
  return {
    text: value.en,
    requestedLanguage,
    effectiveLanguage: "en",
    isFallback: requestedLanguage === "es",
    languageNeutral: false,
  };
}

export type ResolvedCatalogValue = Readonly<{
  text: string;
  requestedLanguage: CatalogLanguage;
  effectiveLanguage: CatalogLanguage;
  isFallback: boolean;
  languageNeutral: boolean;
}>;

export function resolveCatalogValue(
  value: LocalizedVariantValue,
  requestedLanguage: CatalogLanguage,
): ResolvedCatalogValue {
  if (value.kind === "shared") {
    return {
      text: value.value,
      requestedLanguage,
      effectiveLanguage: requestedLanguage,
      isFallback: false,
      languageNeutral: true,
    };
  }
  return resolveCatalogText(value.text, requestedLanguage);
}
