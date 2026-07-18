# Especificación — contenido bilingüe en Evoluciones

- **Feature slug:** `fix-evoluciones-i18n`
- **Modo:** especificación completa
- **Versión:** v3
- **Fecha:** 2026-07-18
- **Estado:** Aprobada

## 1. Contexto y objetivo

La pantalla de Evoluciones ya localiza sus textos de interfaz, pero muestra en inglés los textos procedentes del catálogo generado desde la Warframe Wiki. El alcance fue aclarado por el usuario: «El problema son los textos importados de la wiki, no los textos de la intyerfaz.»

El objetivo v3 es que el idioma seleccionado controle también todo el contenido textual importado que Evoluciones presenta y que el catálogo actual de entrega tenga cobertura española completa. Para las 53 armas publicadas, seleccionar español no debe dejar ningún campo localizable visible en inglés. El fallback por campo se conserva exclusivamente como resiliencia ante datos futuros, ausentes o corruptos; no permite aceptar cobertura parcial en la entrega.

Este cambio responde a la comprobación del usuario «he revisado una evolucion al azar y sihue saliendo en ingles» y a su confirmación de que exige el 100 % del contenido aplicable: «claro...». La infraestructura v3 ya aprobada y ejecutada cubre 73 de 1594 campos aplicables (4,58 %); quedan 1521 campos por cubrir editorialmente.

### Historial contractual y modificación requerida en v3

Antes de v2, `AGENTS.md` establecía que el «contenido del catálogo [está] en inglés tal como aparece en la wiki». La feature contradijo materialmente aquel requisito y no podía tratarse como bug de UI.

El usuario aprobó sustituirlo por el siguiente contrato, que `doc-agent` aplicó durante v2:

> El catálogo conserva una representación canónica en inglés y puede incluir traducciones propias al español de los campos textuales, derivadas de la fuente oficial inglesa. La aplicación muestra la representación correspondiente al idioma activo y usa inglés como fallback por campo cuando falte español. Las traducciones se identifican como tales y mantienen atribución, ShareAlike, uso no comercial y condiciones compatibles con CC BY-NC-SA 3.0. Cualquier fuente española futura requerirá verificación y aprobación expresa de su procedencia y licencia.

La aprobación y ejecución de v2 se mantienen como historial. Sin embargo, `AGENTS.md` documenta actualmente cobertura española incremental y 4,58 %, lo que contradice el gate funcional de v3. Tras aprobar v3, `doc-agent` deberá actualizar esa cobertura a completa para el catálogo de entrega, sin eliminar EN canónico, fallback de resiliencia, atribución ni licencia.

## 2. Evidencia sobre las fuentes

Comprobación puntual realizada el 2026-07-18, sin ejecutar scraping completo:

- `https://wiki.warframe.com/w/Incarnon` declara idioma de contenido `en`.
- La API MediaWiki no devolvió `langlinks` en español para `Incarnon` ni para `Braton Incarnon Genesis`.
- `Braton Incarnon Genesis` declara `pagelanguage: en`.
- Con `?uselang=es`, la interfaz de MediaWiki cambia parcialmente a español, pero el contenido de Evoluciones sigue marcado como `lang="en"` y conserva en inglés desafíos, nombres y descripciones.
- El mapa interwiki anuncia el código `es`, pero apunta a la misma URL inglesa; no demuestra que exista contenido editorial español.

**Conclusión sobre la fuente oficial inglesa:** no se ha podido confirmar que `wiki.warframe.com` proporcione actualmente una versión española de los textos de evolución. `uselang=es` no es una fuente española válida. La fuente oficial inglesa continúa siendo canónica y conserva su atribución y licencia CC BY-NC-SA 3.0.

### 2.1 Comprobación puntual de Wiki Warframe Español en Fandom (v2)

Comprobación realizada el 2026-07-18 mediante un conjunto limitado de consultas puntuales a páginas/API y a la declaración de licencia, sin recorrido masivo ni scraping completo:

| Evidencia | Resultado observado |
|---|---|
| [Portada de Wiki Warframe Español](https://warframe.fandom.com/es/wiki/Wiki_Warframe_Espa%C3%B1ol) | Se identifica como enciclopedia mantenida por jugadores; declara que Digital Extremes «no participa activamente». El pie indica CC-BY-SA. Por tanto, no es la wiki oficial actual `wiki.warframe.com`, sino una comunidad Fandom independiente. |
| [API `siteinfo`/`rightsinfo`](https://warframe.fandom.com/es/api.php?action=query&format=json&formatversion=2&meta=siteinfo&siprop=general%7Crightsinfo) | Idioma `es`; licencia del texto `CC-BY-SA`, con enlace a la página de licencia de Fandom. |
| [Licencia de Fandom](https://www.fandom.com/es/licensing-es) | Salvo indicación distinta, texto bajo CC BY-SA 3.0 Unported. Exige atribución y que las adaptaciones se compartan bajo la misma licencia; permite atribuir mediante URL al artículo, copia estable equivalente o lista de autores. |
| [Phenmor](https://warframe.fandom.com/es/wiki/Phenmor) y [secciones por API](https://warframe.fandom.com/es/api.php?action=parse&format=json&formatversion=2&page=Phenmor&prop=sections) | La página existe y fue revisada el 2025-09-05, pero la muestra renderizada no contiene condiciones de Evolución ni nombres, descripciones o notas de perks. Muestra datos generales, «Forma Incarnon» y claves internas de mejoras; la API no devuelve secciones editoriales. |
| [Furis](https://warframe.fandom.com/es/wiki/Furis) y [secciones por API](https://warframe.fandom.com/es/api.php?action=parse&format=json&formatversion=2&page=Furis&prop=sections) | La página existe, pero su última revisión editorial indicada por API es del 2020-09-22, anterior a Incarnon Genesis. Sus secciones no incluyen Evoluciones/Incarnon. La variante acentuada `Furís`, `Incarnon` y `Adaptador Incarnon Genesis` aparecen como páginas inexistentes en la consulta puntual. |
| [Búsqueda API «Incarnon»](https://warframe.fandom.com/es/api.php?action=opensearch&format=json&formatversion=2&search=Incarnon&limit=20&namespace=0) | Devuelve páginas de armas (Laetum, Phenmor, etc.), pero no una página temática Incarnon; la existencia del arma no acredita cobertura de sus evoluciones. |
| Muestra adicional: Laetum, Felarx, Innodem, Atomos y Latron | Las páginas existen, pero la consulta puntual de metadatos muestra cobertura heterogénea: revisiones desde 2020 a 2025 y páginas mínimas basadas en datos transcluidos. No se comprobó cobertura total ni se infiere de esta muestra. |

**Veredicto de aptitud:** la fuente es accesible, tiene licencia identificable y una estructura MediaWiki consultable, pero **no es apta en su estado observado como origen automatizable de los textos ES necesarios para Evoluciones**. En la muestra requerida faltan precisamente condiciones, nombres, descripciones y notas de perks; además hay desfase editorial y nomenclatura distinta. Una estructura técnica estable no compensa la ausencia del contenido objetivo. No se afirma que ninguna página del sitio pueda contener datos útiles ni que la cobertura global sea cero.

**Compatibilidad y obligaciones:** CC BY-SA 3.0 de Fandom y CC BY-NC-SA 3.0 de la wiki oficial son licencias diferentes. El uso no comercial de Tenno Vault no elimina las obligaciones diferenciadas. Si en el futuro se incorpora texto Fandom, debe conservar título/URL de cada artículo (e idealmente historial/autores), nombre de la comunidad, licencia y enlace, fecha de consulta e indicación de cambios; las adaptaciones de ese texto deben respetar ShareAlike. El contenido oficial inglés mantiene por separado su atribución CC BY-NC-SA 3.0. No se debe presentar ambos orígenes bajo una licencia única ni crear una adaptación inseparable sin revisión específica de compatibilidad.

## 3. Alcance

### Dentro de alcance

1. Catálogo bilingüe EN/ES para los textos importados visibles en Evoluciones.
2. Conservación del inglés como representación canónica y comportamiento íntegro al seleccionar inglés.
3. Selección de representación por el idioma activo de la aplicación.
4. Fallback español → inglés a nivel de campo.
5. Procedencia y atribución de las representaciones inglesa y española.
6. Generación y validación offline del catálogo, sin traducción ni peticiones de red durante la ejecución de la app.
7. Evolución del contrato Zod y aumento de `schemaVersion`.
8. Publicación segura: conservar el último JSON válido ante resultados incompletos o inválidos.
9. Pruebas automatizadas y QA de ambos idiomas, fallback, catálogo y regresión del progreso local.
10. Modificación contractual de la documentación del proyecto una vez aprobada la feature.
11. Cobertura española del 100 % de todos los campos localizables visibles en Evoluciones para las 53 armas del catálogo publicado actual.
12. Revisión editorial y QA trazables de los 1521 campos aplicables actualmente restantes, en los lotes que se estimen manejables, con un único gate final global y por arma.

### Fuera de alcance

- Traducir nuevas pantallas salvo componentes compartidos imprescindibles para Evoluciones.
- Backend, API en ejecución, base de datos, autenticación o sincronización.
- Cambiar el idioma o traducir en tiempo de ejecución mediante red.
- Usar Wiki Warframe Español de Fandom como origen automatizado de Evoluciones mientras no supere la validación de cobertura definida en v2.
- Seleccionar otro servicio de traducción, dependencia o proveedor externo sin aprobación explícita.
- Ejecutar `npm run scrape -- --all` durante especificación.
- Traducir identificadores estables, claves de progreso, valores numéricos o URLs.
- Cambiar el progreso persistido del usuario o eliminar datos.
- Implementar código en esta fase.
- Traducir contenido o modificar el sidecar/catálogo durante esta revisión de especificación.
- Considerar una muestra, un subconjunto de armas o solo desafíos como entrega funcional completa.

## 4. Campos afectados

Todo texto procedente del catálogo que la pantalla de Evoluciones renderice debe pasar por la resolución de idioma:

| Entidad | Campo conceptual actual | Uso visible |
|---|---|---|
| Arma | nombre del arma/adaptador | cabecera del acordeón |
| Variante | nombre de variante | cabecera de instalación |
| Tier | condición de desbloqueo | desafío en vista resumida y detallada |
| Perk | nombre | resumen, perk fijo y opciones seleccionables |
| Perk | descripción | detalle del perk |
| Perk | notas | detalle adicional |
| Perk/variante | valores por variante | detalle; normalmente numérico/simbólico |

Los identificadores de arma, variante, tier y perk no se localizan. Los nombres propios o canónicos que coincidan legítimamente en ambos idiomas pueden conservar el mismo valor, pero deben constar como traducción ES explícita o quedar cubiertos por una regla editorial de neutralidad verificable; en ambos casos cuentan como cubiertos, no como `missing`. Los valores `shared` demostrablemente numéricos o simbólicos son no aplicables (`notApplicable`) y quedan fuera del denominador. Si un valor contiene lenguaje natural, es localizable y sí entra en el denominador.

### 4.1 Denominador y métricas de cobertura (v3)

- `totalApplicable`: número de campos localizables aplicables visibles en Evoluciones para el catálogo publicado actual.
- `translated`: campos aplicables con valor ES explícito válido o cubiertos por una regla de neutralidad editorial verificable.
- `missing`: campos aplicables sin cobertura ES válida. Debe cumplirse `missing = 0`.
- `notApplicable`: valores `shared` exclusivamente numéricos/simbólicos y otros elementos no localizables definidos en esta sección. No forman parte de `totalApplicable` y no se cuentan como `missing`.
- Invariante: `translated + missing = totalApplicable` globalmente, por arma y en cualquier desglose aplicable.
- Línea base observada al abrir v3: 53 armas, `totalApplicable = 1594`, `translated = 73`, `missing = 1521` y `notApplicable = 631`. Si el catálogo o la clasificación cambia legítimamente antes del release, el denominador podrá variar, pero deberá recalcularse, justificarse y seguir cumpliendo el 100 % global y por cada arma del catálogo publicado.

## 5. Modelo funcional de datos

### MD-01 — Identidad estable y representaciones localizadas

- Cada entidad conserva sus identificadores estables actuales, independientes del idioma.
- El catálogo conserva una representación inglesa obligatoria de cada campo textual afectado.
- La representación española sigue siendo técnicamente opcional por campo para resiliencia y compatibilidad con datos futuros, pero todos los campos aplicables del catálogo actual de entrega deben quedar cubiertos en ES.
- La forma estructural concreta deberá ser validada por `architect-agent`, pero el contrato observable debe equivaler a valores localizados por idioma (`en`, `es`) sin duplicar entidades ni cambiar sus IDs.

### MD-02 — Procedencia

El catálogo debe poder acreditar, para cada idioma y fuente incluidos:

- idioma;
- fuente o responsabilidad de traducción;
- URL de origen aplicable;
- licencia y URL de licencia, sin sustituirla por la de otra fuente;
- fecha de generación o actualización.
- título y URL del artículo; para Fandom, enlace de historial o mecanismo equivalente de atribución a autores e indicación de modificaciones cuando aplique.

La atribución vigente a Warframe Wiki, su enlace, `sourceUrl` por arma y CC BY-NC-SA 3.0 no se eliminan. Si el español es una traducción propia derivada del contenido inglés, debe identificarse como traducción y mantener atribución, ShareAlike y uso no comercial. Si en una futura revisión se admite texto de Fandom, su CC BY-SA 3.0 y atribución se registran por separado; no se etiquetará como contenido oficial.

### MD-03 — Contrato y versionado

- El cambio estructural de v2 exigió actualizar el esquema Zod compartido, el generador y sus validaciones en la misma entrega.
- La infraestructura implementada ya usa `schemaVersion: 3`; el delta editorial v3 de esta especificación no exige por sí solo otro aumento de versión de esquema.
- Un catálogo con versión antigua o con cobertura inferior al gate v3 no se publicará como si cumpliera el contrato de entrega actual.
- No se requiere migración del estado Zustand/localStorage si los IDs permanecen invariantes. Esta hipótesis debe verificarse con pruebas de regresión; si se descubre que algún ID depende del texto traducido, la implementación se bloquea y vuelve a arquitectura/especificación antes de migrar datos.

## 6. Requerimientos funcionales

- **RF-01 (US-01):** al seleccionar español, Evoluciones resolverá en español todos los campos localizables enumerados en la sección 4 que tengan traducción disponible.
- **RF-02 (US-02):** al seleccionar inglés, Evoluciones mostrará siempre la representación inglesa canónica.
- **RF-03 (US-03):** si falta o es inválida una traducción española concreta, la UI mostrará el valor inglés de ese mismo campo, nunca un hueco, `undefined`, una clave interna o un error de renderizado.
- **RF-04 (US-01, US-02):** cambiar el idioma actualizará el contenido importado visible de Evoluciones de forma coherente con la UI, sin alterar selecciones de perks ni estados completados.
- **RF-05 (US-04, v2):** el catálogo generado contendrá metadatos verificables y diferenciados de procedencia, atribución y licencia para cada fuente del contenido localizado.
- **RF-06 (US-05):** el catálogo se generará offline y la aplicación no dependerá de la wiki ni de un traductor en tiempo de ejecución.
- **RF-07 (US-05):** solo se publicará un candidato completo según las reglas de cobertura acordadas, válido contra Zod y coherente con su `schemaVersion`.
- **RF-08 (US-05):** ante extracción, traducción, emparejamiento o validación inesperados, el proceso marcará el elemento para revisión, lo reflejará en el informe y conservará el último JSON válido; no sobrescribirá el catálogo con un resultado parcial.
- **RF-09 (US-03):** la ausencia esperada de una traducción opcional se registrará como cobertura faltante y activará fallback; no se confundirá con una traducción vacía válida.
- **RF-10 (US-06):** la localización no cambiará IDs ni la relación entre progreso, instalaciones, tiers y perks.
- **RF-11 (US-05, v2):** una fuente ES solo será admitida para generación si una auditoría previa de cobertura confirma, arma por arma y campo por campo, las condiciones de evolución y nombres/descripciones/notas de perks requeridos; una muestra positiva no equivaldrá a cobertura total.
- **RF-12 (US-07, v3):** el catálogo de entrega cubrirá en español el 100 % de los campos localizables aplicables visibles en Evoluciones para sus 53 armas actuales: nombres de arma/variante que requieran localización o neutralidad documentada, desafíos, nombres/descripciones/notas de perks y valores textuales localizables.
- **RF-13 (US-07, v3):** la publicación final exigirá `missing = 0`, `translated = totalApplicable` y 100 % de cobertura tanto global como para cada arma; no se aceptará una muestra ni una media global que oculte armas incompletas.
- **RF-14 (US-03, US-07, v3):** el fallback ES→EN permanecerá operativo y probado para resiliencia, pero cualquier fallback EN observable al recorrer Evoluciones en español con el catálogo publicado actual bloqueará la entrega.
- **RF-15 (US-07, v3):** las traducciones propias preservarán cifras, símbolos, placeholders, nombres propios/canónicos que deban mantenerse y significado mecánico, además de la atribución, ShareAlike, uso no comercial y CC BY-NC-SA 3.0 ya aprobados.
- **RF-16 (US-07, v3):** la revisión editorial podrá organizarse en lotes con evidencia de cobertura y revisión por arma/campo; ningún lote parcial habilita release. Solo existe un gate final cuando todos los lotes convergen en el 100 % exigido.

## 7. Requerimientos no funcionales

- **RNF-01 — Licencia (v2):** mantener CC BY-NC-SA 3.0 para el origen oficial inglés y, si llegara a incorporarse contenido Fandom, CC BY-SA 3.0 separada, con atribución, ShareAlike, indicación de cambios y enlaces correspondientes; no homogeneizar licencias.
- **RNF-02 — Sin red en runtime:** la PWA exportada debe resolver EN/ES y fallback exclusivamente desde recursos estáticos locales.
- **RNF-03 — Integridad:** publicación atómica y preservación del último catálogo válido.
- **RNF-04 — Trazabilidad:** el informe de generación debe distinguir cobertura ES faltante, fuente no verificada, desajustes entre idiomas y errores estructurales.
- **RNF-05 — Compatibilidad:** conservar el stack oficial, la separación catálogo de solo lectura/progreso mutable y el comportamiento responsive y accesible existente.
- **RNF-06 — Calidad:** pruebas del esquema, generación, resolución de idioma, UI y regresión del progreso; lint, formato, type-check, tests y build en verde antes del cierre.
- **RNF-07 — Calidad editorial (v3):** cada campo añadido o declarado neutral debe poder rastrearse al EN canónico y superar revisión de fidelidad mecánica, cifras, símbolos, placeholders, ortografía y consistencia terminológica; las incidencias se corrigen antes del gate final.

## 8. Estrategia de fallback

1. Idioma activo `en`: usar siempre `en`; no caer a español.
2. Idioma activo `es`: intentar `es` por cada campo localizable.
3. Si el valor ES falta, está vacío o no valida: usar el valor EN del mismo campo.
4. Si también falta EN en un campo obligatorio: el candidato de catálogo es inválido y no se publica.
5. La resolución es por campo. Esta mezcla sigue siendo una salvaguarda válida para datos futuros o corruptos, pero no es aceptable al evaluar el catálogo actual de entrega.
6. El fallback no cambia IDs, progreso ni selección de perk.
7. La UI no mostrará alertas intrusivas por cada fallback. La cobertura faltante será observable en el informe de generación y testeable con fixtures; queda pendiente decidir si se desea además un indicador discreto en la UI (D-04), que no bloquea el comportamiento base.

## 9. Fuente española: D-01 resuelta con opción A (v2)

La propuesta inicial de usar Wiki Warframe Español de Fandom motivó la verificación exigida por v1. Esta concluyó que Fandom **no supera el umbral de aptitud como fuente automatizada** porque la muestra no contiene los campos objetivo. Tras conocer ese resultado, el usuario cerró D-01 con la elección textual «A».

Rutas que permanecen disponibles:

- **Opción A — Traducción propia derivada (seleccionada):** traducciones españolas elaboradas y revisadas para el proyecto a partir del contenido inglés de la Warframe Wiki, identificadas como traducción y distribuidas con atribución, ShareAlike, uso no comercial y condiciones compatibles con CC BY-NC-SA 3.0. El inglés permanece canónico y cada campo ES ausente o inválido usa fallback a EN.
- **Opción B — Fuente española verificable:** Fandom queda evaluada y rechazada para automatización en v2. Solo podrá reconsiderarse con una nueva evidencia manual o editorial que identifique URLs concretas con condiciones y perks completos para Phenmor, Furis y una muestra representativa de Genesis/innatas, seguida de auditoría de cobertura completa antes de publicar.
- **Opción C — Mecanismo externo de traducción:** requiere una modificación aprobada de esta spec, revisión de licencia/privacidad/coste y confirmación explícita de cualquier dependencia o servicio nuevo.

La implementación de contenido ES debe seguir exclusivamente la opción A aprobada. Fandom permanece descartada como fuente automatizada por cobertura insuficiente y solo podrá reconsiderarse mediante una modificación aprobada de esta especificación y la validación de cobertura indicada. El HTML oficial con `uselang=es` y la mera existencia de páginas de armas en Fandom no constituyen una fuente española válida.

### Validación manual concreta si se insiste en B

Un editor deberá aportar, para Phenmor, Furis y al menos una innata y dos Genesis adicionales, URL y captura/texto de: cinco condiciones de Evolución cuando aplique; todos los nombres y descripciones de perks; notas visibles; fecha/revisión; y correspondencia inequívoca con el arma/perk inglés oficial. Si Phenmor o Furis siguen sin esos campos, B se considera bloqueada sin necesidad de scraping completo.

## 10. Criterios de aceptación

- **CA-01 (RF-01):** dado un arma fixture con traducciones ES diferentes de EN para nombre de perk, desafío, descripción y notas, al usar español todos esos valores ES aparecen tanto en la vista resumida como en la detallada y sus equivalentes EN no aparecen en esos campos.
- **CA-02 (RF-02):** con el mismo fixture y el idioma inglés, todos los campos afectados muestran EN y ninguno toma el valor ES.
- **CA-03 (RF-03, RF-09):** si falta solo la descripción ES de un perk, en español se muestran el nombre ES y la descripción EN; no hay texto vacío, clave interna ni error.
- **CA-04 (RF-03):** si falta ES en nombre de arma, variante, desafío, perk o notas, cada campo cae individualmente a EN y la pantalla sigue siendo operable.
- **CA-05 (RF-04, RF-10):** después de seleccionar un perk y marcar un tier como completado, cambiar ES→EN→ES cambia textos pero conserva exactamente perk, instalación y estado completado.
- **CA-06 (RF-05, RNF-01, v2):** el candidato conserva la atribución oficial inglesa y metadatos separados para cada eventual fuente ES (título, artículo, historial/autores cuando aplique, licencia, enlace, fecha y cambios); no presenta Fandom como oficial ni mezcla ambas licencias.
- **CA-07 (RF-06, RNF-02):** la pantalla funciona en un build estático sin acceso de red y no realiza peticiones de contenido/traducción al cambiar idioma.
- **CA-08 (RF-07):** un candidato con el nuevo modelo y versión valida contra Zod; uno con estructura/versionado incoherentes es rechazado antes de publicación.
- **CA-09 (RF-08):** ante fixture con tabla inesperada, traducción no emparejable o EN obligatorio ausente, se genera una incidencia de revisión y el archivo de catálogo válido preexistente permanece byte a byte sin reemplazo.
- **CA-10 (RF-08, RF-09):** una traducción ES opcional ausente se reporta como cobertura faltante y usa fallback, mientras una extracción EN estructuralmente incompleta impide publicar.
- **CA-11 (RF-10):** los IDs de armas, variantes, tiers y perks son iguales entre EN y ES; las pruebas existentes del store siguen pasando sin migración destructiva.
- **CA-12 (sección 4):** una prueba de cobertura enumera todos los puntos donde Evoluciones renderiza datos del catálogo y demuestra que ninguno accede directamente a un texto localizable sin resolución de idioma.
- **CA-13 (contrato):** la documentación operativa deja de afirmar que todo el catálogo se mantiene solo en inglés y refleja el contrato bilingüe aprobado, sin eliminar las obligaciones de atribución/licencia.
- **CA-14 (RNF-06):** `npm run lint`, `npm run format`, `npm run typecheck`, `npm run test` y `npm run build` finalizan correctamente antes del cierre.
- **CA-15 (RF-11, v2):** antes de admitir una fuente ES automatizada existe una matriz de cobertura completa por arma/campo; una ausencia en la muestra activa fallback y una ausencia sistemática de evoluciones impide considerar apta la fuente.
- **CA-16 (RF-12, RF-13, v3):** el informe del candidato final enumera las 53 armas actuales y acredita globalmente y para cada una `missing = 0`, `translated = totalApplicable` y porcentaje 100 %. Los `shared` numéricos/simbólicos aparecen como `notApplicable` y quedan fuera del denominador.
- **CA-17 (RF-12, RF-14, v3):** un recorrido verificable de todos los campos localizables visibles en las vistas resumida y detallada de Evoluciones, con español activo y el catálogo candidato final, encuentra cero fragmentos resueltos mediante fallback EN.
- **CA-18 (RF-15, RNF-07, v3):** la evidencia editorial de cada lote confirma que cifras, símbolos, placeholders y significado mecánico coinciden con el EN canónico; cualquier discrepancia o traducción vacía bloquea el lote y el release.
- **CA-19 (RF-12, RF-13, v3):** un nombre propio/canónico idéntico en EN y ES solo cuenta como `translated` si existe valor ES explícito o una regla de neutralidad documentada y verificable que lo cubre; de lo contrario cuenta como `missing`.
- **CA-20 (RF-16, v3):** pueden validarse lotes parciales sin publicar la entrega, pero el gate de release se mantiene cerrado hasta integrar y revisar todos los lotes y satisfacer simultáneamente CA-16–CA-19.
- **CA-21 (RF-12, v3):** desafíos, nombres de perks, descripciones, notas y valores textuales están incluidos en la matriz; una comprobación limitada a desafíos, Phenmor/Furis o cualquier muestra no satisface el criterio.
- **CA-22 (RF-14, v3):** los fixtures de datos futuros o corruptos siguen demostrando fallback ES→EN por campo sin huecos ni errores, separado de la prueba del catálogo de entrega, que exige cero fallback.

## 11. Supuestos

- Solo existen dos idiomas de producto en este alcance: `es` y `en`.
- Inglés continúa siendo canónico y obligatorio para permitir fallback y preservar fidelidad a la fuente actual.
- La traducción no debe alterar cantidades, placeholders X/Y ni significado mecánico.
- La línea base de 1594 campos aplicables y 631 no aplicables corresponde al catálogo actual de 53 armas; cualquier variación legítima antes del release debe quedar explicada por el informe y respetar las invariantes de cobertura.
- Los IDs pueden mantenerse estables al separar identidad y texto; debe verificarse porque actualmente el ID de perk se deriva de su nombre inglés durante generación.
- La localización del catálogo no pertenece al progreso del usuario y no se persiste en Zustand.

## 12. Riesgos y mitigaciones

| Riesgo | Impacto | Tratamiento exigido |
|---|---|---|
| No existe fuente oficial española verificada | Exige elaborar y revisar el contenido ES | Aplicar D-01 opción A: traducción propia derivada, atribuida y compatible con CC BY-NC-SA 3.0 |
| Fandom carece de los campos objetivo o está desactualizada | Generación ES vacía, parcial o incorrecta | No usarla automáticamente en v2; fallback EN y gate de cobertura completa |
| Licencias distintas entre wiki oficial y Fandom | Atribución/relicenciamiento incorrectos | Metadatos y atribución separados; no crear una adaptación inseparable sin revisión |
| Nomenclatura y revisiones no alineadas entre wikis | Emparejamiento erróneo de armas/perks | IDs canónicos EN, correspondencia explícita y `review-required` ante dudas |
| Traducciones alteran mecánicas o cifras | Información de juego incorrecta | Revisión bilingüe, fixtures y comparación de placeholders/valores |
| IDs derivados de nombres cambian | Pérdida aparente de perks seleccionados | Mantener IDs canónicos EN; bloquear y rediseñar antes de cualquier migración |
| Volumen editorial: 1521 campos aplicables restantes | Errores, inconsistencias o revisión superficial | Trabajar en lotes trazables por arma/campo, con revisión editorial y QA de cada lote; mantener un único gate final del 100 % |
| Cobertura ES parcial | Mezcla visible de idiomas y expectativa incumplida | Bloquear release mientras `missing > 0` globalmente o en cualquier arma; fallback solo como resiliencia |
| Nombres idénticos EN/ES contabilizados sin criterio | Métrica 100 % artificial | Exigir ES explícito o regla de neutralidad verificable y auditable |
| Cambio HTML de la wiki | Catálogo parcial o corrupto | `review-required`, validación y preservación del último JSON válido |
| Atribución insuficiente de una traducción | Incumplimiento CC BY-NC-SA | Metadatos por idioma y revisión de licencia antes de publicar |
| Rama activa basada en otra rama de fix | Cambios ajenos en entrega | `git-agent` debe revisar base/diff antes de continuar; no se resuelve en esta spec |

## 13. Dependencias y decisiones abiertas

- **D-01 (resuelta en v2):** el usuario eligió «A»: traducción propia derivada de la wiki oficial inglesa, con atribución y licencia compatibles con CC BY-NC-SA 3.0, uso no comercial, inglés canónico y fallback ES→EN por campo. Fandom permanece descartada como fuente automatizada por cobertura insuficiente.
- **D-02 (resuelta funcionalmente):** un catálogo con identidades únicas y textos localizados EN obligatorio/ES opcional; el diseño estructural final corresponde a arquitectura.
- **D-03 (resuelta):** fallback por campo de ES a EN; EN nunca cae a ES.
- **D-04 (resuelta en v2):** sin indicador visual intrusivo; el fallback se identifica semánticamente y en el informe.
- **D-05 (resuelta y ejecutada en v2; reabierta documentalmente por D-15):** `doc-agent` aplicó el contrato bilingüe aprobado. V3 requiere ahora sustituir la referencia a cobertura incremental/4,58 % por cobertura completa de entrega.
- **D-06 (resuelta en v2):** Fandom no se considera fuente oficial ni sustituye la fuente inglesa oficial; cualquier uso futuro conservará procedencia/licencia diferenciadas.
- **D-13 (resuelta por requisito del usuario, v3):** el catálogo actual de entrega exige cobertura española completa de todos los campos aplicables de las 53 armas; no se acepta cobertura incremental para release.
- **D-14 (resuelta, v3):** `shared` numérico/simbólico es `notApplicable` y queda fuera del denominador; nombres idénticos solo cuentan como cubiertos mediante ES explícito o regla editorial de neutralidad verificable.
- **D-15 (resuelta, v3):** se permiten lotes editoriales internos, pero hay un solo gate final de 100 % global y por arma, con cero fallback EN observable en español para el catálogo publicado actual.

## 14. Validación del usuario

- **Estado:** Aprobada
- **Veredicto:** v3 aprobada explícitamente; queda abierto el gate de implementación del delta de cobertura completa. La aprobación y ejecución de v2 se conservan como historial.
- **Pregunta de validación (cita textual):** «¿Apruebas explícitamente la especificación v3?»
- **Evidencia de aprobación de v3 (cita textual):** «si».
- **Evidencia de D-01 (cita textual):** «A».
- **Evidencia de aprobación de v2 (cita textual):** «Apruebo v2 y el cambio de AGENTS.md».
- **Evidencia del cambio que origina v3 (citas textuales):** «he revisado una evolucion al azar y sihue saliendo en ingles» y «claro...».
- **Gate v3:** abierto para implementación. El siguiente tramo operativo es la revalidación de rama y alcance por `git-agent` (T-17), seguida del handover a `dev-agent` para T-18 y T-19. En esta aprobación no se ha traducido contenido, modificado código/catálogo/`AGENTS.md`, ejecutado Git ni alterado `state.md`/`journal.md`.

## 15. Changelog

- **v1 — 2026-07-18:** especificación inicial tras reclasificar el reporte de bug de UI a feature completa; se documentan catálogo bilingüe, fuente abierta, fallback, licencia, versionado y preservación del último JSON válido.
- **v2 — 2026-07-18:** se evalúa puntualmente Wiki Warframe Español de Fandom; se documenta CC BY-SA 3.0 y atribución diferenciada, su carácter no oficial, ausencia de Evoluciones/perks en la muestra, rechazo como origen automatizado actual, validación manual alternativa y riesgos de cobertura/licencia/emparejamiento.
- **v2 — 2026-07-18 (cierre de validación):** el usuario elige D-01 opción A, aprueba v2 y el cambio contractual de `AGENTS.md`; se cierra el gate sin modificar el alcance funcional.
- **v3 — 2026-07-18:** se corrige el criterio de entrega tras confirmar el usuario cobertura española completa. Se fija el 100 % global y por arma para las 53 armas actuales, `missing = 0`, cero fallback EN observable en español, denominador de campos aplicables, neutralidad verificable y revisión editorial por lotes con un único gate final. La validación vuelve a `Pendiente` solo para este delta.
- **v3 — 2026-07-18 (cierre de validación):** el usuario aprueba explícitamente v3 con «si» en respuesta directa a «¿Apruebas explícitamente la especificación v3?». Se abre el gate de implementación sin modificar los requisitos 1594/1594, `missing = 0`, 100 % global y por las 53 armas, ni cero fallback observable.
