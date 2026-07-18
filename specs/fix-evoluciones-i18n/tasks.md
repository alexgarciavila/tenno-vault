# Tareas — contenido bilingüe en Evoluciones

- **Versión:** v3
- **Estado global:** delta v3 aprobado; T-16–T-23 completadas con sus veredictos; T-24 pendiente de formato, gates finales, revisión de alcance/staging y propuesta de cierre
- **Nota:** T-00–T-14 conservan su estado `completed` como historial de v2. T-15 queda invalidada por v3 como cierre inmediato. No se ha realizado ningún commit ni PR. La siguiente transición corresponde a `git-agent` para T-24, sin commit automático ni autorizado.

## Orden de ejecución por agentes

### Decisión y gates

- [x] **T-00 — spec-agent — Evaluar Wiki Warframe Español de Fandom** (`completed`, v2; US-04, US-05; CA-06, CA-15)
  - Comprobación puntual de licencia, atribución, relación con la wiki oficial, Phenmor, Furis y muestra adicional.
  - Resultado: CC BY-SA 3.0 identificable, pero fuente no apta actualmente para automatizar Evoluciones por ausencia de los campos objetivo en la muestra.
  - No se ejecutó scraping completo ni se modificó catálogo/código.

- [x] **T-01 — orchestrator-agent / usuario — Resolver D-01 y D-05 (v2)** (`completed`; US-04, US-05; CA-06, CA-13, CA-15)
  - D-01: elegida «A», traducción propia derivada de la wiki oficial inglesa.
  - D-05: aprobado explícitamente el cambio contractual de `AGENTS.md`; su aplicación posterior quedó completada en T-14.

- [x] **T-02 — spec-agent — Registrar aprobación de v2** (`completed`, depende de T-01)
  - Evidencias literales registradas en `spec.md`: «A» y «Apruebo v2 y el cambio de AGENTS.md».
  - Gate de especificación marcado como aprobado.

- [x] **T-03 — git-agent — Verificar rama y base de trabajo** (`completed`, PASS condicionado; depende de T-02)
  - Revisar la rama activa `fix/evoluciones-i18n`, su base heredada y el diff para evitar incluir cambios ajenos.
  - No crear commits ni cambiar historia sin la validación correspondiente.
  - Resultado: rama y base verificadas; el cierre debe seleccionar archivos explícitamente por existir cambios ajenos no rastreados y marcas LF/CRLF sin diff real.

### Diseño

- [x] **T-04 — ux-ui-agent — Validar comportamiento de idioma y fallback** (`completed`, APPROVE; depende de T-03; US-01, US-02, US-03; CA-01–CA-04, CA-12)
  - Confirmar cobertura en vistas resumida/detallada, cambio de idioma y tratamiento accesible del fallback.
  - Resolver D-04 con el usuario solo si propone un cambio observable respecto al valor por defecto.
  - Resultado: comportamiento y fallback aprobados, incluido el idioma efectivo accesible en fragmentos con fallback.

- [x] **T-05 — architect-agent — Definir contrato bilingüe del catálogo** (`completed`, APPROVE; depende de T-03; US-04, US-05, US-06; CA-06, CA-08, CA-11)
  - Concretar el modelo que mantiene IDs únicos, EN obligatorio, ES opcional y procedencia por idioma.
  - Definir compatibilidad, aumento de `schemaVersion`, validación, emparejamiento EN/ES y publicación atómica.
  - Verificar que ningún ID cambia; si cambia, bloquear cualquier migración y volver a especificación.
  - Mantener licencias/procedencias separadas y evitar una adaptación inseparable de fuentes con licencias distintas.
  - Resultado: contrato aprobado y decisiones D-07–D-12 consolidadas en `decisions.md`.

### Implementación

- [x] **T-06 — dev-agent — Evolucionar esquema y validación del catálogo** (`completed`, depende de T-05; US-04, US-05; CA-06, CA-08)
  - Alinear contrato Zod, tipos, `schemaVersion` y validaciones de procedencia/cobertura.

- [x] **T-07 — dev-agent — Adaptar generación offline y preservación** (`completed`, depende de T-01 y T-06; US-05; CA-07–CA-10, CA-15)
  - Incorporar únicamente la ruta ES aprobada.
  - Reportar cobertura/fallos, marcar revisión y no sustituir el último JSON válido ante candidatos parciales o inválidos.
  - Mantener User-Agent, rate limit, reintentos, atribución y límites vigentes.
  - No automatizar Fandom sin matriz de cobertura completa y nueva aptitud aprobada (CA-15).

- [x] **T-08 — dev-agent — Resolver textos de catálogo por idioma** (`completed`, depende de T-06; US-01, US-02, US-03; CA-01–CA-04, CA-12)
  - Aplicar EN/ES y fallback por campo a todos los accesos catalogados de Evoluciones.
  - Evitar traducción o peticiones de red en runtime.

- [x] **T-09 — dev-agent — Preservar identidad y progreso** (`completed`, depende de T-05 y T-08; US-06; CA-05, CA-11)
  - Mantener IDs y asociaciones de progreso al alternar idiomas y al consumir el catálogo versionado.

### Pruebas y validación

- [x] **T-10 — test-agent — Pruebas de esquema, generador y publicación** (`completed`, PASS final; depende de T-06 y T-07; US-04, US-05; CA-06–CA-10, CA-15)
  - Cubrir catálogo bilingüe válido, versión incompatible, ES faltante, EN obligatorio ausente, desajuste de traducción y preservación byte a byte del JSON previo.
  - Usar fixtures; no requiere scraping completo.
  - Resultado: revalidación final en verde dentro de la suite de 234/234 tras cerrar las remediaciones de cobertura, identidad y compatibilidad con Node 20.

- [x] **T-11 — test-agent — Pruebas de UI, fallback y progreso** (`completed`, PASS final; depende de T-08 y T-09; US-01, US-02, US-03, US-06; CA-01–CA-05, CA-11, CA-12)
  - Probar vista resumida y detallada, cambio ES/EN, fallback individual y ausencia de regresión del store.
  - Resultado: UI, fallback y progreso validados; suite final de 234/234 en verde tras las remediaciones.

- [x] **T-12 — qa-agent — QA funcional responsive/PWA** (`completed`, PASS; depende de T-10 y T-11; todas las US)
  - Verificar ambos idiomas, cobertura parcial, cambio de idioma sin pérdida de estado y funcionamiento offline.
  - Resultado: QA funcional aprobada en ambos idiomas, fallback, persistencia, responsive y ausencia de red al cambiar idioma.

- [x] **T-13 — reviewer-agent — Revisión final** (`completed`, APPROVE WITH CONDITIONS; depende de T-12; CA-01–CA-15)
  - Auditar trazabilidad, licencia, ausencia de red en runtime, IDs estables, preservación del catálogo y cambios acotados.
  - Resultado: todos los hallazgos productivos cerrados; las condiciones restantes se asignaron a T-14 (CA-13) y T-15 (formato y gates finales con selección explícita de archivos).

### Documentación y cierre

- [x] **T-14 — doc-agent — Actualizar contrato operativo** (`completed`, PASS; aprobada por D-05; depende de T-13; US-04; CA-13)
  - Sustituir el requisito de catálogo exclusivamente inglés por el contrato bilingüe aprobado.
  - Mantener atribución, licencia, uso no comercial y separación catálogo/progreso.
  - Resultado: `AGENTS.md` actualizado por `doc-agent`; CA-13 cumplido.

- [ ] **T-15 — git-agent — Validaciones y cierre Git de v2** (`invalidada`, v3; dependía de T-14; CA-14)
  - Comprobar lint, formato, type-check, tests y build antes de proponer commit/PR.
  - Proponer cualquier commit al usuario y esperar validación explícita.
  - Estado histórico: quedó pendiente de formato y gates finales, pero el cambio de requisito suspendió el cierre antes de commit/PR. Se sustituye por T-24 tras completar v3.

### Reapertura por cobertura completa v3

- [x] **T-16 — spec-agent / usuario — Validar explícitamente v3** (`completed`, v3; US-07; CA-16–CA-22)
  - Aprobado el delta que exige 100 % global y por arma para las 53 armas actuales.
  - Evidencia literal: pregunta «¿Apruebas explícitamente la especificación v3?»; respuesta del usuario «si».
  - Gate de aprobación cerrado; ejecución v3 completada hasta T-23 y cierre Git pendiente en T-24.

- [x] **T-17 — git-agent — Revalidar rama y alcance de trabajo** (`completed`, PASS condicionado, v3; depende de T-16)
  - Verificar rama, base y diff antes de reabrir ejecución, preservando las cautelas ya registradas sobre archivos ajenos.
  - No realizar commit ni cierre en este punto.
  - Resultado: rama y 37 archivos de feature preservados, con staging vacío; se mantuvo la selección explícita y la exclusión de 405 archivos no rastreados ajenos y 9 marcas EOL.

- [x] **T-18 — dev-agent — Completar cobertura editorial española** (`completed`, PASS en 6 lotes, v3; depende de T-17; US-07; CA-16, CA-18, CA-19, CA-21)
  - Cubrir los 1521 campos aplicables restantes de la línea base para las 53 armas actuales, incluidos desafíos, nombres/descripciones/notas de perks y valores textuales.
  - Preservar cifras, símbolos, placeholders, nombres canónicos y significado mecánico; registrar explícitamente las traducciones iguales o la neutralidad editorial verificable.
  - Se permiten lotes internos trazables, sin declarar release parcial ni rebajar el gate final.
  - Resultado: seis lotes editoriales completados; sidecar global en 1594/1594 campos aplicables, `missing = 0` y 53/53 armas al 100 %, sin publicación parcial entre lotes.

- [x] **T-19 — dev-agent — Consolidar candidato e informe de cobertura 100 %** (`completed`, PASS final, v3; depende de T-18; US-03, US-07; CA-16, CA-17, CA-19, CA-20, CA-22)
  - Demostrar `missing = 0`, `translated = totalApplicable` y 100 % global y por cada arma.
  - Excluir correctamente del denominador los `shared` numéricos/simbólicos y conservar el fallback técnico para datos futuros/corruptos.
  - Resultado: catálogo e informe publicados coherentemente con 1594/1594, `missing = 0`, 631 no aplicables y 53/53 armas al 100 %. Las remediaciones integraron el gate en el pipeline oficial, publicación transaccional conjunta, preservación en abortos/`--list-only` y correspondencia estructural candidato–informe.

- [x] **T-20 — test-agent — Reabrir pruebas automatizadas de cobertura y regresión** (`completed`, PASS final, v3; depende de T-19; US-03, US-07; CA-16–CA-22)
  - Verificar métricas e invariantes globales/por arma, cero fallback con el catálogo candidato y fallback aislado con fixtures futuros/corruptos.
  - Verificar preservación mecánica, neutralidad válida, identidad, progreso, licencia y gates de calidad existentes.
  - Resultado: 264/264 pruebas en verde; cubiertos bypass estructural, informe manipulado, modos CLI y rollback. CA-20 cerrado definitivamente; lint, typecheck y build en verde, con formato aún reservado para T-24.

- [x] **T-21 — qa-agent — QA funcional y editorial completa** (`completed`, PASS, v3; depende de T-20; US-01–US-07; CA-16–CA-22)
  - Revisar las 53 armas en español mediante una matriz por arma/campo, no por muestra, en vistas resumida y detallada.
  - Confirmar cero inglés por fallback observable y documentar/cerrar incidencias de fidelidad, terminología, cifras, placeholders o contenido omitido.
  - Resultado: PASS tras corregir las omisiones mecánicas de Dread y Bronco; 53 armas/97 variantes sin fallback y patrón completo verificado en 32/32 armas, con progreso, red y responsive en verde.

- [x] **T-22 — reviewer-agent — Revisión final del alcance v3** (`completed`, APPROVE WITH CONDITIONS, v3; depende de T-21; CA-01–CA-22)
  - Auditar evidencia del 100 %, calidad editorial, trazabilidad, licencia, ausencia de regresiones y cumplimiento del único gate final.
  - Resultado: hallazgos productivos cerrados y sin defectos nuevos; CA-01–CA-22 aprobados salvo las condiciones downstream de documentación (T-23/CA-13) y formato/gates/Git (T-24/CA-14).

- [x] **T-23 — doc-agent — Actualizar contrato de cobertura** (`completed`, PASS, v3; depende de T-22; US-07; CA-13, CA-16)
  - Sustituir en `AGENTS.md` la cobertura incremental/4,58 % por el requisito de cobertura completa del catálogo actual de entrega.
  - Mantener EN canónico, fallback como resiliencia, generación offline, atribución, ShareAlike, uso no comercial y CC BY-NC-SA 3.0.
  - Resultado: CA-13 cerrado; contrato actualizado a 1594/1594, 53/53 y `missing = 0`, con gate global/por arma, publicación conjunta, preservación en abortos/`--list-only` y fallback solo de resiliencia.

- [ ] **T-24 — git-agent — Gates finales y propuesta de cierre v3** (`pending`, v3; depende de T-23; CA-14, CA-16–CA-22)
  - Ejecutar los gates finales oficiales y revisar selección explícita de archivos.
  - Proponer cualquier commit al usuario y esperar validación explícita; no incluir archivos ajenos.
  - Handover pendiente: ejecutar formato y gates finales, verificar alcance y staging explícito, y presentar la propuesta de commit. No existe autorización para crear el commit.

## Matriz resumida de trazabilidad

| Tareas | Historias principales | Criterios principales |
|---|---|---|
| T-00–T-03 | US-04, US-05 | CA-06, CA-13, CA-15 |
| T-04, T-08 | US-01, US-02, US-03 | CA-01–CA-04, CA-12 |
| T-05, T-06 | US-04, US-05, US-06 | CA-06, CA-08, CA-11 |
| T-07, T-10 | US-05 | CA-07–CA-10, CA-15 |
| T-09, T-11 | US-06 | CA-05, CA-11 |
| T-12–T-15 | Todas | CA-01–CA-15 |
| T-16–T-19 (v3) | US-03, US-07 | CA-16–CA-22 |
| T-20–T-24 (v3) | Todas, especialmente US-07 | CA-01–CA-22 |
