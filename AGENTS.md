# AGENTS.md — Tenno Vault

Fuente de verdad operativa para agentes de IA en este repositorio.

---

## 1. Contexto del proyecto

- Nombre: `Tenno Vault`
- Tipo: `aplicación web frontend (SPA estática, PWA instalable)`
- Estado: `en desarrollo inicial (MVP)`
- Dominio funcional: `gestión personal del progreso de Incarnon (adaptadores Genesis y armas innatas) de Warframe`
- Plataforma objetivo: `web responsive (escritorio y móvil), instalable como PWA`
- Idioma del proyecto/producto: `español (UI por defecto) con inglés como opción; catálogo con inglés canónico obligatorio y traducción propia al español opcional por campo`

Objetivo breve:

Aplicación personal y no comercial para registrar manualmente qué adaptadores Incarnon posee el usuario, en qué variantes de arma están instalados y el progreso de sus evoluciones y perks. El catálogo de armas se genera offline con un script independiente que extrae datos del HTML renderizado de la wiki oficial inglesa de Warframe (`wiki.warframe.com`, licencia CC BY-NC-SA 3.0) y aplica las traducciones propias al español disponibles. El progreso del usuario se persiste localmente en el navegador.

Fuera de alcance por defecto:

- Backend, base de datos remota, autenticación o sincronización en la nube.
- Integración con la API del juego o cuentas de Warframe.
- Uso comercial o monetización (prohibido por la licencia CC BY-NC-SA 3.0 del contenido).
- Scraping agresivo de la wiki (sin rate limit o sin User-Agent identificativo).

---

## 2. Jerarquía de instrucciones

En caso de conflicto, aplicar este orden (mayor a menor prioridad):

1. Instrucciones del sistema/plataforma del agente.
2. Este `AGENTS.md`.
3. Instrucciones del entorno de ejecución (developer).
4. Reglas de skills individuales.
5. Solicitud explícita del usuario para la tarea actual.

Si dos reglas del mismo nivel conflictúan, aplicar la más restrictiva.

---

## 3. Orquestación obligatoria

`orchestrator-agent` es la puerta de entrada obligatoria del flujo: toda solicitud pasa primero por él, y el primary agent nunca ejecuta en directo una tarea que tenga agente especializado asignado.

Reglas de delegación:

- Delegar siempre en el agente especializado correspondiente; la ejecución directa solo está permitida cuando no existe agente para esa tarea.
- `orchestrator-agent` no bloquea el inicio de la delegación pidiendo validación global; solo exige validación explícita en hitos críticos (ej. spec aprobada).
- Si la delegación falla, reportar el bloqueo y reintentar con más contexto; nunca ejecutar la tarea especializada como fallback.
- Cada agente especializado rechaza explícitamente solicitudes fuera de su rol, deriva al agente correcto y bloquea esa parte de la ejecución.
- Si una solicitud mezcla tareas de varios dominios, cada agente ejecuta solo su tramo y lista las derivaciones pendientes.

### 3.1 Especificación persistente por feature

- Toda especificación aprobada se persiste en `specs/<feature-slug>/` (`feature-slug` en kebab-case).
- Artefactos mínimos: `spec.md`, `user-stories.md`, `tasks.md`. Opcionales: `decisions.md`, `ux-ui.md`.
- Artefactos de coordinación (propiedad exclusiva de `orchestrator-agent`): `state.md` (foto del estado actual del flujo) y `journal.md` (historial append-only: una entrada por handover con agente, fecha, resumen, veredicto y decisiones del usuario con cita textual).
- Bloqueo: no se implementa código productivo sin `Validación del usuario: Aprobada`.
- Excepción: las solicitudes clasificadas como `trivial` por el triaje de `orchestrator-agent` (cambio mínimo sin efecto en comportamiento ni API) no requieren spec ni validación previa; van directas al agente especializado y a `git-agent`. En caso de duda sobre el tamaño, aplica el bloqueo.
- Si cambian requisitos durante la ejecución, se vuelve a `spec-agent` y se versiona el alcance.
- Flujo mínimo: `orchestrator-agent` -> `spec-agent` -> validación explícita del usuario -> `git-agent` -> `ux-ui-agent` (si aplica) -> `architect-agent` (si aplica) -> `dev-agent`. Sin validación explícita, el flujo se detiene en especificación.
- El triaje de tamaño (`trivial`/`acotada`/`feature completa`) y sus rutas cortas se definen en `agents/orchestrator-agent.md`; el bloqueo de spec aplica siempre a la ruta `feature completa` y, cuando haya ambigüedad de alcance, también a la `acotada`.

Mapa de delegación:

| Dominio | Agente | Capacidad recomendada |
|---|---|---|
| Entrada y coordinación | `orchestrator-agent` | media |
| Inicialización | `init-agent` | baja |
| Especificaciones | `spec-agent` | alta |
| UX/UI (*) | `ux-ui-agent` | media |
| Arquitectura (*) | `architect-agent` | alta |
| Implementación | `dev-agent` | alta |
| Bugfix | `bugfix-agent` | alta |
| Refactor | `refactor-agent` | alta |
| Seguridad (*) | `security-agent` | alta |
| Testing automatizado | `test-agent` | media |
| QA funcional | `qa-agent` | media |
| Revisión final | `reviewer-agent` | alta |
| Documentación | `doc-agent` | media |
| Git/PR/commit/branch/merge | `git-agent` | baja |

(*) Agentes condicionales: participan solo cuando se cumple su criterio de activación (definido en la sección 2 de su archivo en `agents/`). El resto participa siempre en su tramo de la ruta. Excepción: `security-agent` se incluye siempre que su criterio se cumpla, aunque la ruta de triaje sea corta.

Sobre la columna "Capacidad recomendada":

- Expresa el nivel de razonamiento que el rol necesita (`alta` = decisiones con consecuencias y análisis profundo; `media` = ejecución con criterio; `baja` = trabajo procedimental con gates), NO un modelo concreto.
- El mapeo a modelos/proveedores concretos se hace en la capa específica de la herramienta (frontmatter `model:`/`effort:` en `.claude/agents/*.md` de Claude Code), nunca en estos documentos agnósticos.

---

## 4. Reglas globales

- No inventar herramientas, comandos o flujos no definidos.
- Respetar convenciones del proyecto y decisiones de arquitectura.
- Priorizar legibilidad, mantenibilidad y seguridad.
- No introducir nuevas dependencias o servicios externos sin confirmación.
- No modificar documentación salvo petición del usuario o necesidad contractual explícita.
- Aplicar KISS, SRP y guard clauses cuando mejore claridad.
- Reutilizar skills disponibles cuando encaje.
- Separar estrictamente catálogo estático e inmutable (datos generados, solo lectura) del progreso del usuario (estado local mutable).
- Mantener inglés canónico obligatorio y español como traducción propia opcional por campo, derivada de la wiki oficial inglesa. En español, resolver cada campo mediante fallback `es → en` solo como resiliencia ante datos futuros, ausentes o corruptos; este fallback no permite aceptar un catálogo de entrega parcial. En inglés, usar siempre `en`, sin fallback a español.
- Generar y aplicar las traducciones offline; la aplicación no realiza peticiones de contenido ni traducción en runtime.
- Toda lógica de dominio (cálculo de copias, estados, migraciones) se implementa como funciones puras testeables.
- Mantener en la app y en el archivo de datos generado la atribución a la wiki de Warframe, ShareAlike, la licencia CC BY-NC-SA 3.0 y el uso no comercial, también para las traducciones propias derivadas.

---

## 5. Seguridad operativa (confirmación obligatoria)

Pedir confirmación explícita antes de ejecutar acciones:

- Destructivas o irreversibles (borrar `src/data/incarnon-catalog.json` u otros datos generados, `git push --force`, eliminación de ramas, reescritura de historia).
- Cambios de infraestructura, red, despliegues o pipelines.
- Cambios de credenciales, secretos, permisos o políticas de seguridad.
- Migraciones de esquema del estado persistido que puedan perder datos del usuario.
- Operaciones con impacto en coste/facturación.
- Ejecuciones completas del scraper contra la wiki (`--all`) fuera del flujo planificado; nunca reducir el rate limit ni eliminar el User-Agent identificativo.

Reglas obligatorias:

- Nunca exponer secretos en código, tests, logs ni commits.
- Gestionar configuración sensible vía variables de entorno o gestor de secretos.
- Este proyecto no expone endpoints; si en el futuro se añade cualquier operación sensible, debe declarar autenticación y permisos explícitamente.

---

## 6. Stack tecnológico oficial

### 6.1 Base del proyecto

- Backend: `no aplica (aplicación 100 % cliente)`
- Frontend: `Next.js 15 (App Router, output: 'export') + React 19 + TypeScript (strict) + Tailwind CSS 4`
- Estado y persistencia: `Zustand con middleware persist (localStorage) y migraciones versionadas`
- Validación de datos: `Zod (catálogo, backups, estado persistido)`
- PWA: `Serwist (@serwist/next)`
- Scraper de catálogo: `script TypeScript en scripts/scrape/ ejecutado con tsx; cheerio para parseo; fetch nativo`
- Base de datos: `no aplica (localStorage del navegador)`
- Gestor de dependencias/entornos: `npm`
- Contenedores local/dev: `no aplica`
- Versiones de runtime pineadas: `Node 20+, TypeScript 5, Next.js 15`

Regla:

- No usar alternativas a este stack ni cambiar versiones de runtime sin confirmación explícita.

### 6.2 Calidad y testing

- Lint: `ESLint (config de Next.js)`
- Format: `Prettier`
- Tests: `Vitest + @testing-library/react; fixtures HTML reales en scripts/scrape/__fixtures__/ para el scraper`
- Type-check: `tsc --noEmit (modo estricto)`

---

## 7. Arquitectura y estructura

### 7.1 Arquitectura objetivo

- Estilo: `SPA estática exportada (sin servidor), diseño modular preparado para añadir futuras herramientas de Warframe`
- Versionado API: `no aplica`
- Acoplamiento: `catálogo JSON estático e inmutable, generado offline con schemaVersion 3; la app solo lo consume tipado y validado, sin red en runtime`
- Capas: `data (catálogo + esquemas Zod) / lib (dominio puro: inventario, backup, i18n) / store (Zustand) / components / app (rutas)`
- Reglas UI/estilos: `Tailwind CSS 4; componentes reutilizables; indicadores de estado siempre acompañados de texto (accesibilidad); responsive móvil-primero`

### 7.2 Estructura base esperada

- `src/app/` -> rutas: `/` (inicio), `/incarnon`, `/evoluciones`, `/configuracion`, `/acerca-de`
- `src/components/` -> layout (menú), tarjetas, tabla compacta, controles de inventario
- `src/data/` -> `incarnon-catalog.json` (generado, versionado en git, `schemaVersion: 3`) y `catalog-schema.ts` (Zod + tipos, compartido con el scraper)
- `src/lib/` -> `inventory.ts`, `backup.ts`, `i18n/`
- `src/store/` -> stores Zustand (progreso + ajustes)
- `scripts/scrape/` -> generador del catálogo, sidecar editorial ES (`translations/es.json`), fixtures e informe (`report/last-run.json`)
- `specs/` -> especificaciones persistentes por feature
- `agents/` -> definiciones agnósticas de agentes; `.claude/agents/` -> instancias para Claude Code

Regla:

- Si la estructura real difiere, seguir convenciones existentes del repositorio.

---

## 8. Contrato API

No aplica: la aplicación no expone ni consume APIs en ejecución. El contrato de datos vigente es el esquema Zod del catálogo (`src/data/catalog-schema.ts`) con `schemaVersion: 3`: cada texto localizable exige `en` y admite `es` opcional. El sidecar editorial ES (`scripts/scrape/translations/es.json`) se valida y aplica durante la generación offline; no se carga en runtime. El catálogo de entrega solo puede publicarse si acredita `missing = 0`, 100 % de cobertura española global y 100 % para cada arma; la cobertura vigente es 1594/1594 campos aplicables y 53/53 armas al 100 %. Cualquier cambio de estructura del catálogo debe reflejarse en el esquema, el scraper y un bump de `schemaVersion`.

---

## 9. Observabilidad

No aplica: no hay servicios en ejecución. El scraper publica conjuntamente el catálogo y su informe de ejecución en `scripts/scrape/report/last-run.json`, únicamente tras superar el gate de cobertura completa. Una ejecución abortada o en modo `--list-only` preserva ambos activos publicados y reporta por consola el resultado o las páginas que requieran revisión, cuando corresponda.

---

## 10. Comandos oficiales (fuente de verdad)

Si un comando no aparece aquí ni en una skill activa, pedir confirmación.

### 10.1 Setup inicial

```bash
npm install
```

### 10.2 Desarrollo

```bash
npm run dev
```

### 10.3 Scraper de catálogo

```bash
npm run scrape -- --all            # catálogo completo (respeta rate limit)
npm run scrape -- --weapon <id>    # una sola arma
npm run scrape -- --list-only      # solo lista e índice de rotación
```

### 10.4 Tests

```bash
npm run test           # suite completa (Vitest)
npm run test:watch     # modo watch
```

### 10.5 Calidad

```bash
npm run lint
npm run format
npm run typecheck
```

### 10.6 Build

```bash
npm run build          # export estático (out/)
```

---

## 11. Workflow de git y pull requests

- Estrategia: `trunk-based con ramas cortas por feature`.
- Nombre de rama: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: `Conventional Commits (feat:, fix:, chore:, test:, docs:, refactor:)`, título y cuerpo en castellano.
- Todo commit debe proponerse primero al usuario y solo ejecutarse tras validación explícita.
- Antes de PR ejecutar como mínimo: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

Checklist mínimo PR:

- Cambios acotados al objetivo.
- Tests/lint/type-check en verde.
- Riesgos y supuestos documentados.
- Si cambia el esquema del catálogo o del estado persistido, migración y `schemaVersion` actualizados.

CI/CD: no aplica por ahora; todas las validaciones se ejecutan en local antes de commit/PR.

---

## 12. Definition of Done (DoD)

Una tarea se considera terminada solo si:

- La aplicación compila (`npm run build`) y ejecuta correctamente.
- Tests relevantes pasan (`npm run test`).
- No hay errores de lint/format/type-check.
- Si cambia lógica, hay tests nuevos o actualizados.
- Si cambia el esquema del catálogo o del estado persistido, hay migración versionada y el scraper/esquema Zod están alineados.
- Los datos del usuario nunca se pierden sin confirmación explícita (import, reset, migraciones).
- Se reportan riesgos, límites y supuestos en la respuesta final.

---

## 13. Catálogo de skills

Sin skills propias de repo por ahora. Cuando se añadan en `.claude/skills/`, registrarlas aquí con ruta y criterio de activación.

---

## 14. Limitaciones y advertencias

- No modificar despliegue/infra productiva sin confirmación (no existe aún).
- Evitar cambios masivos sin plan incremental.
- No asumir credenciales o acceso externo sin verificar.
- Si falta contexto crítico, pedir solo el dato bloqueante.
- El contenido extraído de la wiki está bajo CC BY-NC-SA 3.0: mantener atribución, enlace a la fuente y uso no comercial; no eliminar `sourceUrl` ni el bloque `attribution` del catálogo.
- La cobertura española vigente es completa: 1594/1594 campos aplicables y 53/53 armas al 100 %, con `missing = 0`. Este resultado global y por arma es un gate obligatorio antes de publicar conjuntamente catálogo e informe; cualquier ausencia ES bloquea la publicación del catálogo de entrega.
- Wiki Warframe Español de Fandom no es una fuente automatizada aprobada; su uso futuro exige nueva evidencia, auditoría completa de cobertura y aprobación expresa de procedencia y licencia.
- El scraper es cortés por diseño: User-Agent identificativo, ~1 petición/1,5 s, máximo 3 reintentos. No relajar estos límites.
- La estructura HTML de la wiki puede cambiar: ante estructura inesperada, marcar el registro como `review-required` y conservar el último JSON válido; nunca sobrescribir el catálogo con datos parciales.

---

## 15. Estilo de respuesta

- Idioma de respuesta del agente: `español`.
- Formato: resultado principal primero, luego detalles accionables.
- Tono: claro, directo y colaborativo.
- Proponer siguientes pasos solo cuando aporten valor.

---

## 16. Notas finales

Este archivo es la fuente de verdad operativa para agentes en este repo.
Si hay conflicto con una skill, prevalece `AGENTS.md`.

Fecha de última actualización: `2026-07-18`
Responsable: `agarcia@infordisa.com`
