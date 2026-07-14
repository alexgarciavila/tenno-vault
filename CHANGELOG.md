# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.2.0]

### Añadido

- Imágenes locales para las 53 armas Incarnon, incluidas en el export estático
  y en el precache de la PWA, con trazabilidad a su fuente original.
- Fallback estable y accesible en las tarjetas cuando una imagen no está
  disponible o no puede cargarse.

### Cambiado

- Catálogo actualizado a `schemaVersion` 2 para incorporar la ruta local y la
  URL de origen de cada imagen, manteniendo la atribución CC BY-NC-SA 3.0.
- Scraper reforzado con validación de imágenes y orígenes, límites de descarga,
  publicación atómica, conservación del último catálogo válido e informes de
  incidencias y recursos publicados.

## [0.1.0] - 2026-07-13

### Añadido

- Catálogo de Incarnon con 53 armas (adaptadores Genesis y armas con Incarnon
  innato), generado a partir de la wiki oficial de Warframe y con atribución
  a la licencia CC BY-NC-SA 3.0.
- Gestión manual de inventario: registro de copias sin instalar, instalación
  por variante de arma y cálculo automático de copias pendientes y cubiertas.
- Seguimiento de evoluciones por instalación, con condiciones de desbloqueo,
  selección de perks y progreso por tier.
- Pantallas de Inicio (métricas de progreso), Incarnon (buscador, filtros y
  vista en tarjetas o tabla), Evoluciones, Configuración y Acerca de.
- Copias de seguridad del progreso: exportación e importación en formato JSON
  con vista previa y confirmación antes de aplicar cambios.
- Internacionalización de la interfaz en español e inglés.
- Aplicación instalable como PWA.
