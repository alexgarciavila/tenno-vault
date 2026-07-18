# Historias de usuario — contenido bilingüe en Evoluciones

- **Versión:** v3
- **Estado de validación:** v3 aprobada explícitamente; v2 aprobada como historial

## US-01 — Consultar Evoluciones en español

**Como** usuario que ha seleccionado español,  
**quiero** ver en español los textos del catálogo mostrados en Evoluciones,  
**para** comprender desafíos y efectos sin que la pantalla permanezca en inglés.

### Criterios vinculados

- CA-01, CA-12.
- Incluye nombres de arma/variante cuando exista forma localizada, condiciones de desbloqueo, nombres de perks, descripciones, notas y cualquier valor con lenguaje natural.

## US-02 — Conservar el contenido inglés

**Como** usuario que ha seleccionado inglés,  
**quiero** ver la representación inglesa canónica del catálogo,  
**para** mantener la terminología original de la Warframe Wiki.

### Criterios vinculados

- CA-02.

## US-03 — Seguir usando la pantalla ante datos futuros incompletos (modificada v3)

**Como** usuario en español,  
**quiero** que cada traducción inesperadamente ausente en datos futuros o corruptos caiga al texto inglés correspondiente,  
**para** no encontrar huecos, errores o contenido inutilizable, sin que esa resiliencia permita publicar incompleto el catálogo actual.

### Criterios vinculados

- CA-03, CA-04, CA-10, CA-22.

## US-04 — Conocer la procedencia del contenido (v2)

**Como** usuario y mantenedor,  
**quiero** que el catálogo bilingüe conserve por separado fuente, atribución, licencia y cambios de cada origen,  
**para** poder verificar que el contenido y sus traducciones se usan lícitamente.

### Criterios vinculados

- CA-06, CA-13.
- La wiki oficial inglesa conserva CC BY-NC-SA 3.0; cualquier contenido Fandom futuro conserva CC BY-SA 3.0 y no se presenta como oficial.

## US-05 — Generar un catálogo bilingüe fiable (v2)

**Como** mantenedor,  
**quiero** admitir una fuente española solo tras verificar su cobertura completa y generar el catálogo offline sin sustituir el último JSON válido ante fallos,  
**para** evitar publicar datos parciales o corruptos y mantener la PWA independiente de la red.

### Criterios vinculados

- CA-07, CA-08, CA-09, CA-10, CA-14, CA-15.

## US-06 — Preservar el progreso al cambiar de idioma

**Como** usuario con instalaciones, evoluciones y perks registrados,  
**quiero** que localizar el catálogo o cambiar de idioma no altere mi progreso,  
**para** no perder ni desasociar datos personales.

### Criterios vinculados

- CA-05, CA-11.

## US-07 — Disponer de Evoluciones completamente en español (v3)

**Como** usuario que ha seleccionado español,  
**quiero** que las 53 armas del catálogo actual tengan traducidos o neutralizados de forma editorial verificable todos sus campos localizables visibles,  
**para** recorrer Evoluciones sin encontrar fallback inglés en desafíos, perks, descripciones, notas ni otros valores textuales.

### Criterios vinculados

- CA-16–CA-21.
- La cobertura debe ser 100 % global y por arma, con `missing = 0`; los valores `shared` exclusivamente numéricos/simbólicos son no aplicables y no entran en el denominador.
- Las traducciones preservan cifras, símbolos, placeholders, nombres canónicos que deban mantenerse y significado mecánico, con la atribución y licencia vigentes.

## Matriz de trazabilidad

| Historia | Requisitos | Criterios |
|---|---|---|
| US-01 | RF-01, RF-04 | CA-01, CA-12 |
| US-02 | RF-02, RF-04 | CA-02 |
| US-03 (modificada v3) | RF-03, RF-09, RF-14 | CA-03, CA-04, CA-10, CA-22 |
| US-04 (v2) | RF-05 | CA-06, CA-13 |
| US-05 (v2) | RF-06, RF-07, RF-08, RF-09, RF-11 | CA-07, CA-08, CA-09, CA-10, CA-14, CA-15 |
| US-06 | RF-04, RF-10 | CA-05, CA-11 |
| US-07 (v3) | RF-12, RF-13, RF-14, RF-15, RF-16 | CA-16–CA-22 |
