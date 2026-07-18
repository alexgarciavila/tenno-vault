/**
 * Diccionario de textos de UI en español (idioma por defecto del proyecto).
 * Centraliza TODOS los literales de interfaz. `en.ts` replica esta misma forma
 * (paridad de claves forzada por `satisfies Strings`, ver ./en.ts) y `useT()`
 * (ver ./index.ts) devuelve el diccionario del idioma activo del store.
 *
 * El contenido del catálogo (nombres de armas, perks, desafíos) NO se traduce:
 * permanece en inglés tal como aparece en la wiki.
 */
export const es = {
  app: {
    name: "Tenno Vault",
    tagline: "Gestor personal del progreso de Incarnon de Warframe.",
    loading: "Cargando…",
  },
  nav: {
    home: "Inicio",
    incarnon: "Incarnon",
    evolutions: "Evoluciones",
    settings: "Configuración",
    about: "Acerca de",
    more: "Más",
    collapse: "Contraer menú",
    expand: "Expandir menú",
    skipToContent: "Saltar al contenido",
    primary: "Navegación principal",
    close: "Cerrar",
  },
  status: {
    completed: "Completado",
    incompleteData: "Datos incompletos",
  },
  category: {
    primary: "Primaria",
    secondary: "Secundaria",
    melee: "Cuerpo a cuerpo",
  },
  kind: {
    genesis: "Genesis",
    innate: "Innata",
  },
  home: {
    title: "Inicio",
    welcomeTitle: "Todavía no has registrado ningún Incarnon.",
    welcomeBody: "Empieza marcando tus primeras copias.",
    goToIncarnon: "Ir a Incarnon",
    metrics: {
      withCopies: "Armas con alguna copia",
      withInstallations: "Armas con instalaciones",
      inventory: "Copias en inventario",
      missing: "Copias por conseguir",
      completed: "Armas completadas",
      evolutions: "Evoluciones completadas",
    },
    quickAccessTitle: "Accesos rápidos",
    viewIncarnon: "Ver Incarnon",
    viewPending: "Ver por conseguir",
    viewEvolutions: "Ver evoluciones",
  },
  incarnon: {
    title: "Incarnon",
    subtitle: "Adaptadores · Rotación",
    searchLabel: "Buscar arma",
    searchPlaceholder: "Braton, Lex, Skana…",
    filters: "Filtros",
    filtersActive: "filtros activos",
    clearFilters: "Quitar filtros",
    filterProgress: "Condiciones de progreso",
    filterCategory: "Categoría",
    filterWeek: "Semana de rotación",
    filterKind: "Tipo",
    weekNotApplicable: "No aplica a armas innatas",
    hasInventory: "En inventario",
    hasMissingCopies: "Por conseguir",
    hasPendingInstallations: "Instalaciones pendientes",
    hasIncompleteEvolutions: "Evoluciones incompletas",
    view: "Vista",
    viewCards: "Tarjetas",
    viewTable: "Tabla",
    uninstalledCopies: "Copias sin instalar",
    increment: "Añadir copia",
    decrement: "Quitar copia",
    installedVariants: "Variantes instaladas",
    variant: "Variante",
    copies: "Copias",
    installed: "Instaladas",
    inInventory: "En inventario",
    toAcquire: "Por conseguir",
    compactCopiesSingular:
      "{installed} instalada · {inventory} en inventario · {missing} por conseguir",
    compactCopies: "{installed} instaladas · {inventory} en inventario · {missing} por conseguir",
    surplus: "Excedente: {count} {copies}",
    copy: "copia",
    copiesPlural: "copias",
    viewEvolutions: "Ver evoluciones",
    viewWiki: "Ver en la wiki",
    emptyTitle: "Ningún arma coincide con los filtros.",
    emptyBody: "Prueba a quitar alguno.",
    tableRegionLabel: "Tabla de Incarnon",
    tableScrollHint: "Desplaza horizontalmente para ver todas las columnas.",
    colName: "Nombre",
    colCategory: "Categoría",
    colWeek: "Semana",
    colCopies: "Copias",
    colEvolutions: "Evoluciones",
    colActions: "Acciones",
    weekShort: "Semana",
  },
  evolutions: {
    title: "Evoluciones",
    subtitle: "Progreso · Perks",
    subtitlePrefix: "Progreso por arma",
    completedCountLabel: "completadas",
    emptyTitle: "Todavía no tienes ninguna instalación registrada.",
    emptyBody:
      "Ve a Incarnon y marca una variante como instalada para empezar a seguir sus evoluciones.",
    goToIncarnon: "Ir a Incarnon",
    tier: "Evolución",
    fixedPerk: "Perk fijo",
    unlockOnInstall: "Se desbloquea al instalar.",
    challenge: "Desafío",
    choosePerk: "Elige un perk",
    completed: "Completado",
    pending: "Pendiente",
    perksLegend: "Perks disponibles",
    viewWiki: "Ver en la wiki",
    progress: "Progreso",
  },
  settings: {
    title: "Configuración",
    languageSection: "Idioma",
    languageEs: "Español",
    languageEn: "English",
    viewSection: "Vista por defecto",
    backupSection: "Copia de seguridad",
    export: "Exportar progreso",
    exportHint: "Descarga un archivo JSON con todo tu progreso y ajustes.",
    import: "Importar copia de seguridad",
    importHint: "Selecciona un archivo de copia para restaurar tu progreso.",
    importErrorInvalidJson: "El archivo no contiene un JSON válido.",
    importErrorInvalidSchema: "El archivo no tiene un formato válido de Tenno Vault.",
    importErrorUnsupportedVersion:
      "La versión del archivo no es compatible con esta versión de la app.",
    previewTitle: "Confirmar importación",
    previewReplaceWarning: "Esta acción reemplaza todo tu progreso actual. No se puede deshacer.",
    previewAdded: "armas nuevas",
    previewModified: "armas con cambios",
    previewRemoved: "armas que se eliminarán",
    previewUnchanged: "armas sin cambios",
    previewOrphans: "instalaciones no reconocidas se descartarán (no están en el catálogo actual).",
    previewConfirm: "Importar y sobrescribir",
    dangerSection: "Zona de peligro",
    reset: "Restablecer todo el progreso",
    resetTitle: "¿Restablecer todo el progreso?",
    resetBody:
      "Se borrarán todas tus copias, instalaciones y evoluciones registradas. Esta acción no se puede deshacer.",
    resetCheckbox: "Entiendo que se perderá todo mi progreso",
    resetConfirm: "Restablecer",
    cancel: "Cancelar",
  },
  about: {
    title: "Acerca de",
    appHeading: "Tenno Vault",
    appBody: "Aplicación personal para gestionar el progreso de Incarnon de Warframe.",
    sourceHeading: "Fuente de datos",
    sourceBody:
      "Los datos de armas y evoluciones proceden de la Warframe Wiki (wiki.warframe.com), generados el",
    sourceLink: "Ver la página de origen",
    licenseHeading: "Licencia del contenido",
    licenseBody: "CC BY-NC-SA 3.0",
    licenseLink: "Ver texto de la licencia",
    noticeHeading: "Aviso",
    noticeBody:
      "Este proyecto no está afiliado a Digital Extremes. Uso estrictamente personal y no comercial.",
  },
  confirm: {
    cancel: "Cancelar",
    uninstallTitle: "¿Quitar la instalación?",
    uninstallConfirm: "Quitar instalación",
    uninstallBody: "Tiene {completed} de {total} evoluciones completadas. Se perderá ese progreso.",
    uninstallBodyGeneric: "Se perderá el progreso de esta instalación.",
  },
  common: {
    of: "de",
    catalogUpdated: "Catálogo actualizado el",
    viewAttribution: "Ver atribución",
    opensInNewTab: "(se abre en una pestaña nueva)",
  },
} as const;

/** Idiomas soportados por la UI. */
export type Language = "es" | "en";

/**
 * Ensancha los literales del diccionario `es` (por `as const`) a `string` para
 * que `en.ts` pueda tener los MISMOS campos con valores distintos y seguir
 * cumpliendo `satisfies Strings`. Así el tipo obliga a paridad de claves sin
 * exigir que los textos coincidan.
 */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Strings = Widen<typeof es>;
