# Decisiones — contenido bilingüe en Evoluciones

- **Versión:** v3
- **Fecha:** 2026-07-18

## D-01 — Procedencia del contenido español (resuelta v2)

- **Estado:** resuelta en v2.
- **Hecho verificado:** no se confirmó contenido editorial español para Evoluciones en la wiki oficial; `uselang=es` localiza la interfaz de MediaWiki, no la tabla de contenido.
- **Decisión del usuario que inició v2:** «Para español podemos obtener los datos de https://warframe.fandom.com/es/wiki/Wiki_Warframe_Espa%C3%B1ol».
- **Resultado:** Fandom tiene licencia y API verificables, pero Phenmor y Furis no contienen en la muestra las condiciones y textos de perks requeridos. B no supera el gate de cobertura y no se usará automáticamente.
- **Decisión final del usuario (cita textual):** «A».
- **Opción seleccionada:** traducción propia derivada de la wiki oficial inglesa, revisada e identificada como traducción, con atribución, ShareAlike, uso no comercial y licencia compatibles con CC BY-NC-SA 3.0.
- **Reglas vinculadas:** inglés canónico obligatorio y fallback `es → en` por campo cuando la traducción española falte o sea inválida.
- **Fandom:** permanece descartada como fuente automatizada por cobertura insuficiente. Solo podrá reconsiderarse mediante nueva evidencia, auditoría completa de cobertura y modificación aprobada de la especificación.
- **No permitido:** asumir que el contenido inglés mostrado bajo `uselang=es` es español, inventar una fuente o seleccionar unilateralmente un proveedor/dependencia.
- **Consecuencia:** queda desbloqueada la ruta de traducción propia; cualquier mecanismo externo o uso futuro de Fandom exige versionar y aprobar el cambio de alcance.

## D-02 — Modelo funcional bilingüe

- **Estado:** sustituida por D-07.
- **Decisión:** una sola identidad estable por entidad; texto EN obligatorio y texto ES opcional por campo localizable; procedencia por idioma.
- **Motivo:** evita duplicar armas/perks, permite fallback gradual y protege las referencias del progreso.
- **Consecuencia:** cambio del contrato Zod y aumento de `schemaVersion`.

## D-03 — Fallback

- **Estado:** resuelta.
- **Decisión:** fallback por campo `es → en`; en modo inglés se usa siempre inglés.
- **Casos inválidos:** EN obligatorio ausente impide publicación; ES vacío se trata como ausente, no como traducción válida.
- **Consecuencia UI:** puede existir mezcla puntual ES/EN cuando la cobertura sea parcial, pero nunca huecos o claves internas.

## D-04 — Indicador visual de fallback

- **Estado:** resuelta y aprobada por UX/UI.
- **Decisión:** sin alerta, badge, icono, tooltip ni nota visual por campo; la falta se registra en el informe de generación y el fragmento fallback se marca semánticamente con `lang="en"`.
- **Consecuencia:** cualquier indicador visible futuro constituye un cambio observable y debe volver a UX/spec.

## D-05 — Cambio de contrato de proyecto

- **Estado:** resuelta, aprobada y ejecutada en v2; el ajuste de cobertura v3 queda reabierto en D-15/T-23.
- **Propuesta:** reemplazar la obligación de catálogo exclusivamente inglés por un catálogo con EN canónico, ES localizado y fallback ES→EN, manteniendo licencia y atribución.
- **Decisión del usuario (cita textual):** «Apruebo v2 y el cambio de AGENTS.md».
- **Consecuencia histórica:** `doc-agent` aplicó el cambio contractual de v2 manteniendo EN canónico, ES localizado, fallback `es → en` por campo, atribución y licencia compatibles con la fuente oficial CC BY-NC-SA 3.0 y uso no comercial. V3 exige un ajuste documental adicional sobre cobertura completa.

## D-06 — Relación y licencias de las fuentes (v2)

- **Estado:** resuelta a nivel de requisito.
- **Decisión:** `wiki.warframe.com` sigue siendo el origen oficial canónico EN bajo CC BY-NC-SA 3.0. Wiki Warframe Español es una comunidad Fandom mantenida por jugadores, no la wiki oficial actual, y su texto declara CC BY-SA 3.0.
- **Atribución Fandom si hubiera uso futuro:** comunidad, título/URL del artículo, historial/autores o equivalente, CC BY-SA 3.0 y enlace, fecha de consulta e indicación de cambios.
- **Consecuencia:** atribuciones y licencias separadas; Fandom no sustituye ni elimina la atribución oficial y no se presenta todo el catálogo bajo una única licencia.
- **Cautela:** cualquier adaptación que mezcle inseparablemente textos de ambas fuentes requiere revisión específica de compatibilidad antes de publicación.

## Evidencia consultada

- Página oficial `https://wiki.warframe.com/w/Incarnon`.
- API MediaWiki `siteinfo`, `langlinks` e `info` para `Incarnon` y `Braton Incarnon Genesis`.
- Render oficial de `Braton Incarnon Genesis?uselang=es`, incluyendo comprobación tras carga de la página.
- No se ejecutó scraping completo ni se incorporó contenido al catálogo.
- Portada Fandom española y declaración de independencia editorial respecto de Digital Extremes: `https://warframe.fandom.com/es/wiki/Wiki_Warframe_Espa%C3%B1ol`.
- Licencia/atribución Fandom: `https://www.fandom.com/es/licensing-es` y API `siteinfo/rightsinfo` de la comunidad.
- Páginas y API de secciones/metadatos para Phenmor, Furis, Laetum, Felarx, Innodem, Atomos y Latron; búsquedas API puntuales de «Incarnon» y «Furis Incarnon».
- Phenmor: existe y tiene revisión de 2025, pero no presenta Evoluciones/perks en la muestra. Furis: revisión editorial de 2020 y sin sección Incarnon; `Furís`, `Incarnon` y `Adaptador Incarnon Genesis` resultaron inexistentes en la consulta puntual.
- La muestra no demuestra cobertura total ni ausencia total en todo Fandom.

## D-07 — Contrato de catálogo v3 y granularidad de localización

- **Estado:** aprobada.
- **Contexto:** el contrato v2 almacena textos como `string`; Evoluciones necesita EN obligatorio, ES opcional y fallback por campo sin duplicar armas, variantes, tiers ni perks. Los valores por variante pueden ser texto natural o datos neutros (números/símbolos).
- **Decisión:** aumentar `CATALOG_SCHEMA_VERSION` de `2` a `3`. Definir en `src/data/catalog-schema.ts`:
  - `catalogLanguageSchema = z.enum(["en", "es"])`.
  - `nonBlankTextSchema = z.string().min(1).refine(value => value.trim().length > 0)` sin `transform`, para validar sin modificar el texto fuente.
  - `localizedTextSchema = z.object({ en: nonBlankTextSchema, es: nonBlankTextSchema.optional() }).strict()`.
  - `localizedVariantValueSchema = z.discriminatedUnion("kind", [z.object({ kind: z.literal("shared"), value: nonBlankTextSchema }).strict(), z.object({ kind: z.literal("localized"), text: localizedTextSchema }).strict()])`.
  - Sustituir por `LocalizedText` los campos `weapon.name`, `weapon.weaponName`, `variant.name`, `perk.name` y `perk.description`; usar `LocalizedText | null` en `tier.unlockCondition` y `LocalizedText | undefined` en `perk.notes`.
  - Mantener `variantValues` opcional y por `variantId`, pero cada valor pasa a `LocalizedVariantValue`. El generador solo marca `shared` cuando una validación conservadora demuestra que es numérico/simbólico; ante lenguaje natural usa `localized`, aunque inicialmente solo tenga EN.
  - `id`, `kind`, `category`, `rotation`, `tier`, `selectable`, URLs, imagen, fechas, estado y notas técnicas de revisión no se localizan.
- **Modelo exacto de ejemplo:**

```json
{
  "schemaVersion": 3,
  "attribution": {
    "source": "Warframe Wiki",
    "sourceUrl": "https://wiki.warframe.com/w/Incarnon",
    "license": "CC BY-NC-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-nc-sa/3.0/",
    "canonicalLanguage": "en",
    "translations": [
      {
        "id": "tenno-vault-es-from-warframe-wiki-en",
        "language": "es",
        "kind": "project-translation",
        "derivedFrom": "warframe-wiki-en",
        "responsibility": "Tenno Vault contributors",
        "license": "CC BY-NC-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-nc-sa/3.0/",
        "updatedAt": "2026-07-18T00:00:00.000Z",
        "changes": "Traducción propia al español del contenido canónico inglés."
      }
    ]
  },
  "weapons": [{
    "id": "braton",
    "name": { "en": "Braton Incarnon Genesis", "es": "Génesis Incarnon de Braton" },
    "weaponName": { "en": "Braton" },
    "variants": [{
      "id": "braton-prime",
      "name": { "en": "Braton Prime" },
      "wikiUrl": "https://wiki.warframe.com/w/Braton_Prime"
    }],
    "evolutions": [{
      "tier": 2,
      "selectable": true,
      "unlockCondition": {
        "en": "Complete a solo mission with this weapon equipped.",
        "es": "Completa una misión en solitario con esta arma equipada."
      },
      "perks": [{
        "id": "braton-e2-daring-reverie",
        "name": { "en": "Daring Reverie", "es": "Ensueño audaz" },
        "description": { "en": "+20 Base Damage", "es": "+20 de daño base" },
        "variantValues": {
          "braton-prime": { "kind": "shared", "value": "X = 24 · Y = 30" }
        }
      }]
    }]
  }]
}
```

- **Alternativas descartadas:** entidades EN y ES duplicadas, porque romperían referencias y favorecerían divergencias; diccionarios paralelos dentro del bundle de UI, porque separarían texto y validación del catálogo; conservar `string` y añadir campos `nameEs`, `descriptionEs`, etc., porque multiplica contratos y no escala por campo; tratar todos los valores de variante como compartidos, porque algunos contienen lenguaje natural.
- **Consecuencias:** todos los consumidores de los campos que pasan a `LocalizedText` deben adaptarse. Fuera de Evoluciones, los consumidores actuales pueden mostrar explícitamente `.en` en esta feature para conservar su comportamiento; no se amplía la localización observable de otras pantallas. `reviewNotes` continúa siendo diagnóstico del generador y queda fuera del contenido localizado.
- **Trazabilidad:** US-01, US-02, US-03, US-04, US-05; T-05, T-06, T-08; CA-01–CA-04, CA-06, CA-08, CA-12.

## D-08 — Identidad canónica, compatibilidad v1/v2 y progreso persistido

- **Estado:** aprobada.
- **Contexto:** `weaponId` y `variantId` se derivan hoy de nombres EN, y `perkId()` construye `<weaponId>-e<tier>-<slug(nameEn)>`. El progreso v1 persiste `weaponId`, `variantId`, `tier` y `selectedPerkId`; cualquier cambio produciría progreso huérfano.
- **Decisión:** los IDs publicados pasan a ser canónicos y autoritativos; nunca se recalculan desde ES ni desde texto resuelto. `readCatalogForGeneration` debe conservar esquemas legacy v1 y v2 independientes del esquema actual y migrarlos **solo en memoria** a v3, envolviendo cada texto existente como `{ en: valor }`, convirtiendo valores por variante mediante la clasificación conservadora y ampliando la atribución sin eliminar sus cuatro campos vigentes.
- **Decisión de reconciliación:** al refrescar EN, una función pura debe reconciliar el candidato extraído con el catálogo previo por `weaponId` + `tier` + nombre EN normalizado. Una coincidencia inequívoca reutiliza literalmente el `perk.id` previo. Un perk de una entidad existente que no coincida, una colisión o una coincidencia ambigua se marca `review-required` y aborta la publicación; no se genera silenciosamente otro ID. Para un arma/perk realmente nuevo, el slug EN solo propone el ID inicial, que debe superar unicidad y revisión antes de convertirse en canónico. Los renombres legítimos futuros requieren una correspondencia explícita y revisada de alias EN antiguo → ID canónico, nunca una migración automática del estado.
- **Gate v2 → v3:** antes de publicar por primera vez v3, comparar una huella de identidad ordenada (`weapon.id`, `variant.id`, `tier`, `perk.id`) entre el v2 leído y el candidato v3. Debe ser exactamente igual. Cualquier diferencia produce **REJECT/BLOCKED**, deja el JSON previo byte a byte intacto y vuelve a spec/arquitectura; esta feature no autoriza una migración de progreso.
- **Compatibilidad del store:** `USER_STATE_SCHEMA_VERSION` permanece en `1`; no se modifica la forma Zustand, backups ni migraciones. El cambio de idioma solo lee catálogo/ajustes y no ejecuta acciones del progreso. Las claves React/DOM siguen basadas en IDs/tier, nunca en texto resuelto.
- **Alternativas descartadas:** regenerar todos los IDs desde el nuevo modelo, porque es destructivo; emparejar por posición de perk, porque un reordenamiento asignaría progreso al perk equivocado; migrar `selectedPerkId`, porque no existe una necesidad si se preserva identidad y una migración inferida sería insegura.
- **Consecuencias:** una edición EN legítima puede exigir revisión manual antes de publicar; se acepta este coste para impedir reasignaciones silenciosas. La comprobación de huella es un gate adicional al Zod.
- **Trazabilidad:** US-06; T-05, T-06, T-07, T-09, T-10, T-11; CA-05, CA-09, CA-11.

## D-09 — Traducciones propias como overlay editorial y procedencia

- **Estado:** aprobada.
- **Contexto:** ES se elaborará incrementalmente por el proyecto a partir del EN oficial. No debe ser sobrescrita por scraping ni confundirse con Fandom. Incorporarla manualmente dentro del JSON generado dificultaría regenerar el catálogo con seguridad.
- **Decisión:** mantener un sidecar versionado y validado, propiedad editorial, en `scripts/scrape/translations/es.json`, con su esquema Zod en `scripts/scrape/translations/schema.ts`. Forma exacta: `{ schemaVersion: 1, language: "es", updatedAt, responsibility, changes, weapons: Record<weaponId, { name?, weaponName?, variants?: Record<variantId, { name? }>, evolutions?: Record<tierString, { unlockCondition?, perks?: Record<perkId, { name?, description?, notes?, variantValues?: Record<variantId, string> }> }> }> }`; todo texto usa `nonBlankTextSchema`. El fichero es parcial: omitir un campo significa “sin cobertura ES”, nunca texto vacío.
- **Validación referencial:** una función pura aplica el overlay únicamente por IDs/tier canónicos. Arma, variante, tier, perk o valor huérfano; traducción de `notes` cuando EN no tiene `notes`; o clave duplicada/incoherente impiden publicar y se reportan como desajuste. Deben validarse además placeholders (`X`, `Y` y equivalentes), cifras y símbolos mecánicos para detectar pérdidas o alteraciones; una discrepancia requiere revisión, no corrección automática.
- **Procedencia:** conservar los campos actuales de `attribution` para compatibilidad de la UI y añadir `canonicalLanguage: "en"` y `translations`. La entrada ES usa `kind: "project-translation"`, `derivedFrom: "warframe-wiki-en"`, responsable, licencia/URL CC BY-NC-SA 3.0, `updatedAt` e indicación de cambios. El `sourceUrl` exacto por arma sigue siendo la URL inglesa de la que deriva tanto EN como su traducción. Zod exige exactamente una entrada ES si existe al menos un valor ES y prohíbe una entrada ES si el overlay no aportó contenido. No se añaden metadatos Fandom porque no se usa esa fuente.
- **Estrategia incremental:** se pueden añadir armas o campos al sidecar en cambios pequeños y revisables. Cada generación vuelve a aplicar todo el overlay sobre EN actual, informa cobertura y usa fallback para lo omitido. El scraper nunca escribe el sidecar ni llama a traductores/red para ES.
- **Alternativas descartadas:** traducción en runtime, por romper PWA offline y trazabilidad; scraping Fandom, por D-01/D-06; editar directamente el JSON generado, porque las regeneraciones perderían autoría y cambios; un mapa plano de rutas textuales, porque es más propenso a claves huérfanas y errores al renombrar estructuras.
- **Consecuencias:** el sidecar añade un artefacto mantenido manualmente, pero mantiene separadas extracción y autoría. El JSON publicado continúa siendo autocontenido y la app no carga el sidecar.
- **Trazabilidad:** US-03, US-04, US-05; T-06, T-07, T-10; CA-03, CA-04, CA-06, CA-07, CA-10, CA-15.

## D-10 — Resolvedor puro e integración semántica en Evoluciones

- **Estado:** aprobada.
- **Contexto:** devolver solo `string` no permite distinguir ES idéntico a EN de un fallback, ni aplicar `lang="en"` exclusivamente al fragmento inglés dentro de una página ES.
- **Decisión:** crear en implementación `src/lib/catalog-i18n.ts` sin estado ni React, con estos contratos:

```ts
type CatalogLanguage = "en" | "es";
type ResolvedCatalogText = Readonly<{
  text: string;
  requestedLanguage: CatalogLanguage;
  effectiveLanguage: CatalogLanguage;
  isFallback: boolean;
  languageNeutral: false;
}>;

function resolveCatalogText(
  value: LocalizedText,
  requestedLanguage: CatalogLanguage,
): ResolvedCatalogText;

type ResolvedCatalogValue = Readonly<{
  text: string;
  requestedLanguage: CatalogLanguage;
  effectiveLanguage: CatalogLanguage;
  isFallback: boolean;
  languageNeutral: boolean;
}>;

function resolveCatalogValue(
  value: LocalizedVariantValue,
  requestedLanguage: CatalogLanguage,
): ResolvedCatalogValue;
```

- **Semántica:** `en` siempre devuelve `en`, `isFallback: false`; `es` válido devuelve `es` aunque sea textualmente igual a EN; ES ausente devuelve EN e `isFallback: true`. EN en blanco lanza error de contrato (inalcanzable tras Zod). Un valor `shared` devuelve su texto, `effectiveLanguage` igual al solicitado, `isFallback: false`, `languageNeutral: true`; la UI no necesita añadir `lang` al fragmento neutro.
- **Integración i18n/UI:** extender el contexto existente para exponer el idioma activo mediante `useLanguage()` o `useI18n()` y conservar `useT()` para compatibilidad. `EvolutionsView` resuelve nombre de arma/variante, condición y nombre resumido; `EvolutionTierCard` resuelve nombre, descripción, notas y valores. Prefijo UI y dato de catálogo se renderizan en nodos separados. Solo cuando `effectiveLanguage !== requestedLanguage` se aplica `lang={effectiveLanguage}` al nodo del catálogo; no hay badge, tooltip ni alerta. Los callbacks, IDs y objetos de progreso siguen recibiendo IDs canónicos.
- **Cobertura:** inventariar los accesos directos actuales de `EvolutionsView.tsx` (`weapon.name`, `variant.name`, `fixedPerk/chosen.name`, `unlockCondition`) y `EvolutionTierCard.tsx` (`fixedPerk/perk.name`, `unlockCondition`, `description`, `notes`, `variantValues`). Ninguno puede quedar renderizado directamente. Los consumidores fuera de Evoluciones que deban compilar usan EN canónico hasta que otra spec amplíe su UX.
- **Alternativas descartadas:** resolver bloques/tarjetas completos, porque impediría fallback por campo; localizar dentro del store, porque mezclaría catálogo inmutable y progreso; devolver solo texto o inferir idioma comparando cadenas, porque fallaría cuando EN y ES coinciden.
- **Consecuencias:** la composición JSX necesita separar fragmentos hoy interpolados. El resolvedor es testeable sin DOM y no hace red, persistencia ni caché.
- **Trazabilidad:** US-01, US-02, US-03, US-06; T-08, T-09, T-11; CA-01–CA-05, CA-07, CA-11, CA-12.

## D-11 — Pipeline de generación, cobertura y publicación segura

- **Estado:** aprobada.
- **Contexto:** el pipeline actual valida Zod y confirma el JSON mediante `rename`, pero puede publicar aun con armas `review-required` y no informa cobertura ES. CA-09 exige conservar el catálogo anterior byte a byte ante extracción, traducción o emparejamiento inesperados.
- **Decisión:** ordenar la generación así: (1) leer/validar catálogo previo v1/v2/v3; (2) extraer EN; (3) reconciliar IDs contra el previo; (4) migrar/armar candidato v3 completo; (5) cargar y validar sidecar ES; (6) aplicar overlay; (7) comprobar integridad mecánica y huella de IDs; (8) calcular cobertura; (9) validar Zod global y recursos; (10) publicar mediante el temporal + `rename` existente.
- **Gate de publicación:** cualquier extracción estructural inesperada, `review-required` nuevo, EN obligatorio ausente, desajuste referencial/placeholder, cambio de identidad, candidato incompleto o fallo de recurso marca la ejecución `aborted` y evita llamar a `publishCatalog`; el JSON previo queda byte a byte intacto. La ausencia esperada de ES es `missing`, no error, y permite publicar con fallback. Los blobs content-addressed pueden validarse/promoverse antes del commit point actual, pero nunca se elimina un recurso previo; el único estado consumible cambia con el `rename` del JSON.
- **Informe:** ampliar `RunReport` con `catalogSchemaVersion`, `translationSchemaVersion`, `translationSource: "project-translation"`, `coverage` global y por arma/campo (`translated`, `missing`, `notApplicable`, porcentaje), `translationIssues` tipadas (`orphan`, `blank`, `placeholder-mismatch`, `mechanic-mismatch`) e `identityIssues`. `publication.reason` debe distinguir validación, cobertura esperada y bloqueo. No registrar el texto completo traducido si no aporta diagnóstico.
- **Modos parciales:** `--weapon` vuelve a aplicar y validar el overlay completo sobre los registros conservados para producir un catálogo v3 coherente. `--list-only` no publica catálogo y puede omitir carga de traducciones. La primera conversión v2→v3 debe poder ejecutarse con fixtures/entrada local; ejecutar `--all` sigue requiriendo el flujo y confirmación definidos en `AGENTS.md`.
- **Alternativas descartadas:** publicar registros previos mientras una parte falla, porque cambiaría bytes/metadatos pese a CA-09; considerar ES incompleto como fallo, porque impediría adopción incremental; escritura directa, porque perdería el commit point atómico existente.
- **Consecuencias:** un fallo de una sola entidad aborta el lote y puede retrasar otros cambios, a cambio de una garantía simple de integridad y rollback (el catálogo previo ya es el rollback). Las pruebas no necesitan red ni `--all`.
- **Trazabilidad:** US-04, US-05, US-06; T-06, T-07, T-09, T-10; CA-06–CA-11, CA-15.

## D-12 — Secuencia de implementación y mapa de archivos

- **Estado:** aprobada.
- **Contexto:** el cambio cruza contrato compartido, generador, datos publicados, i18n y UI; debe evitar un estado intermedio que publique v3 sin validación o rompa progreso.
- **Decisión:** `dev-agent` implementará en este orden:
  1. `src/data/catalog-schema.ts`: schemas/tipos v3 y procedencia; fixtures unitarios del contrato.
  2. `scripts/scrape/catalog-compat.ts`: schemas legacy autocontenidos y migración pura v1/v2→v3; no reutilizar el schema base v3 para parsear legacy.
  3. `scripts/scrape/translations/schema.ts` y `scripts/scrape/translations/es.json`: sidecar inicialmente parcial, con pocas traducciones revisadas suficientes para CA-01–CA-04; no traducir todo el catálogo.
  4. `scripts/scrape/identity.ts` y `scripts/scrape/translations/apply.ts`: reconciliación/huella y overlay como funciones puras.
  5. `scripts/scrape/validate.ts`, `report.ts`, `index.ts`, `publish.ts`: gates, cobertura, versión 3 y preservación; adaptar fixtures/tests sin ejecutar `--all`.
  6. Generar/converter `src/data/incarnon-catalog.json` a v3 solo después de pasar validación local y comprobar igualdad de huella. Mantener todos los IDs y atribución vigente.
  7. `src/lib/catalog-i18n.ts` y pruebas puras; ampliar `src/lib/i18n/index.tsx` para exponer idioma.
  8. `src/components/evolutions/EvolutionsView.tsx` y `EvolutionTierCard.tsx`: resolver todos los campos y aplicar `lang`; adaptar consumidores EN de otros componentes afectados por el cambio de tipo sin ampliar su UX.
  9. Pruebas de store/backup/UI y matriz CA-12; no aumentar `USER_STATE_SCHEMA_VERSION`.
- **Alternativas descartadas:** convertir primero el JSON y arreglar consumidores después, porque dejaría el árbol temporalmente inválido; mezclar overlay, scraping y React en un módulo, porque viola separación de responsabilidades y dificulta pruebas puras.
- **Consecuencias:** los commits futuros pueden separarse por contrato/generación y consumo, pero cada punto compartible debe compilar y no publicar un contrato incoherente. No se añaden dependencias ni servicios.
- **Trazabilidad:** T-06–T-11; CA-01–CA-12, CA-14.

## D-13 — Cobertura completa como gate de entrega (v3)

- **Estado:** resuelta y aprobada formalmente en v3.
- **Evidencia:** tras indicar «he revisado una evolucion al azar y sihue saliendo en ingles», el usuario confirmó con «claro...» que exige el 100 % de desafíos, perks, descripciones, notas y valores textuales aplicables.
- **Decisión:** para las 53 armas del catálogo actual, la entrega exige `missing = 0`, `translated = totalApplicable` y 100 % tanto global como por arma. La línea base es 73/1594 campos aplicables traducidos (4,58 %) y 1521 restantes.
- **Consecuencia:** la estrategia incremental de D-09 y el permiso de publicación con ES ausente de D-11 siguen siendo válidos como capacidad técnica y para trabajo intermedio, pero quedan sustituidos como criterio de release del catálogo actual. Ningún lote, muestra ni promedio global compensa un arma incompleta.
- **Trazabilidad:** US-07; RF-12, RF-13, RF-16; CA-16, CA-20, CA-21; T-18–T-24.

## D-14 — Denominador, no aplicables y neutralidad editorial (v3)

- **Estado:** resuelta y aprobada formalmente en v3.
- **Decisión:** el denominador contiene todos los campos localizables aplicables visibles en Evoluciones. Los valores `shared` demostrablemente numéricos o simbólicos se contabilizan como `notApplicable`, no como `missing`, y quedan fuera de `totalApplicable`.
- **Nombres iguales:** un nombre propio o canónico que deba conservarse idéntico en español cuenta como cubierto solo si existe una traducción ES explícita válida o una regla editorial de neutralidad documentada, determinista y verificable. La mera igualdad accidental o la ausencia de ES cuenta como `missing`.
- **Invariantes:** `translated + missing = totalApplicable`; `missing = 0` y porcentaje 100 % deben cumplirse globalmente y por arma. La línea base de 631 `notApplicable` puede variar únicamente con una reclasificación justificada y auditable.
- **Trazabilidad:** US-07; RF-12, RF-13, RF-15; CA-16, CA-19; T-18–T-20.

## D-15 — Fallback de resiliencia y revisión editorial por lotes (v3)

- **Estado:** resuelta y aprobada formalmente en v3.
- **Decisión de fallback:** D-03 y D-10 permanecen vigentes para datos futuros, ausentes o corruptos. Sin embargo, cualquier fragmento resuelto mediante fallback EN al usar español con el catálogo candidato actual bloquea el release.
- **Decisión editorial:** los 1521 campos restantes pueden trabajarse y revisarse en lotes trazables por arma/campo. Cada lote debe preservar cifras, símbolos, placeholders, nombres canónicos y significado mecánico, además de atribución, ShareAlike, uso no comercial y CC BY-NC-SA 3.0.
- **QA:** cada lote genera evidencia y cierra incidencias, pero no constituye una aprobación de release. Hay un único gate final tras integrar todos los lotes, revisar las 53 armas y obtener 100 % global y por arma con cero fallback observable.
- **Consecuencia documental:** `AGENTS.md` debe dejar de presentar 4,58 % y cobertura incremental como estado aceptable de entrega, manteniendo el fallback como protección técnica.
- **Trazabilidad:** US-03, US-07; RF-14–RF-16; RNF-07; CA-17, CA-18, CA-20, CA-22; T-18–T-24.

## Changelog de decisiones

- **v3 — 2026-07-18:** se añaden D-13–D-15 para fijar cobertura completa, denominador verificable, neutralidad editorial, fallback solo de resiliencia y revisión por lotes con un único gate final.
- **v3 — 2026-07-18 (aprobación):** D-13–D-15 quedan aprobadas formalmente. Evidencia literal: a «¿Apruebas explícitamente la especificación v3?» el usuario respondió «si». Se abre implementación sin alterar 1594/1594, `missing = 0`, 100 % global y por las 53 armas ni cero fallback observable.
