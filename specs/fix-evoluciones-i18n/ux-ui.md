# UX/UI — contenido bilingüe en Evoluciones

- **Feature slug:** `fix-evoluciones-i18n`
- **Spec de referencia:** v2 aprobada
- **Fecha:** 2026-07-18
- **Veredicto UX/UI:** **APPROVE**
- **Validación adicional del usuario:** no requerida; no se propone rediseño ni cambio observable respecto a D-04.

## 1. Objetivo de experiencia

La vista de Evoluciones debe presentar sus textos de catálogo en el idioma activo sin cambiar la estructura, jerarquía, interacción ni progreso actuales. En español, cada campo usa su traducción ES cuando existe y cae de forma independiente al valor EN canónico cuando falta; en inglés, todos los campos usan EN. La mezcla puntual por fallback debe seguir siendo comprensible y pronunciable por tecnologías de asistencia, sin llenar la pantalla de avisos.

Trazabilidad principal: US-01, US-02, US-03 y US-06; CA-01–CA-05, CA-11 y CA-12.

## 2. Comportamiento al cambiar de idioma

1. El idioma activo es una preferencia global única. Al cambiarlo, la UI ya localizada y todos los textos de catálogo visibles en Evoluciones se resuelven en el mismo render; no se requiere recarga, confirmación, red ni estado de carga adicional. (US-01, US-02; CA-01, CA-02, CA-07)
2. `es`: resolver cada campo localizable como `es` válido; si no existe, está vacío o es inválido, mostrar el `en` del mismo campo. `en`: mostrar siempre `en`, sin fallback a español. (US-03; CA-03, CA-04)
3. El cambio solo sustituye contenido textual. Debe conservar IDs y, si la vista permanece montada, expansión de acordeones, foco, posición de scroll y controles seleccionados. En todos los casos debe conservar instalaciones, perks seleccionados y tiers completados. No debe disparar escrituras en el store de progreso. (US-06; CA-05, CA-11)
4. No mostrar transición vacía, parpadeo deliberado, toast ni diálogo: el contenido está disponible localmente y el cambio es reversible.
5. El control de idioma existente en Configuración mantiene el foco y su estado accesible al activarse. No se añade otro selector a Evoluciones dentro de esta feature.
6. El atributo `lang` del documento debe reflejar el idioma activo, como ya hace el patrón i18n existente. Un fragmento EN mostrado por fallback dentro de una página ES debe marcarse específicamente con `lang="en"`; el texto ES resuelto puede heredar `lang="es"` del documento. No se debe marcar como inglés un valor que haya resuelto válidamente a ES aunque ambas cadenas coincidan.

## 3. Cobertura visible obligatoria

Todo acceso visible a un campo de catálogo localizable debe usar la misma resolución por campo. La cobertura no depende de que el campo aparezca hoy traducido o de que EN y ES coincidan.

### 3.1 Elementos globales y estados de la vista

1. Título, subtítulo/progreso global, carga, estado vacío y CTA: siguen usando el diccionario de UI y cambian con el idioma activo.
2. Etiquetas de categoría, `Completado`, `Pendiente`, `Evolución`, `Desafío`, `Elegir perk`, texto de instalación y enlace `Ver en la wiki`: siguen usando el diccionario de UI.
3. Contadores, numerales romanos, IDs, cantidades y estado visual no cambian por idioma.
4. El destino del enlace a la wiki y la atribución no cambian al alternar idioma; el label visible sí sigue el idioma de UI.

### 3.2 Vista resumida — acordeón plegado

1. **Cabecera del arma/adaptador:** nombre localizado por campo; fallback EN marcado con `lang="en"`.
2. **Badge de categoría:** texto de UI localizado; no procede del fallback del catálogo.
3. **Contador agregado:** permanece numérico y conserva exactamente su cálculo.
4. **Nombre principal de cada tier:**
   - perk fijo: nombre localizado;
   - perk seleccionado común a las instalaciones: nombre localizado a partir del ID seleccionado;
   - sin selección única: etiqueta genérica `Evolución <romano>` del diccionario de UI.
5. **Condición/desafío:** prefijo de UI en el idioma activo y condición de desbloqueo localizada por separado. Si solo la condición cae a EN, marcar únicamente ese fragmento con `lang="en"`, no toda la frase.
6. **Estado del tier:** `Completado`/`Pendiente` permanece como texto de UI junto al indicador visual; su lógica AND entre instalaciones no cambia.

### 3.3 Vista detallada — acordeón desplegado

1. **Cabecera de instalación:** nombre de variante localizado; fallback EN marcado con `lang="en"`. El fallback defensivo a un ID interno no es una solución de i18n aceptable para un catálogo válido.
2. **Minibarra y fracción de progreso:** no cambian; la barra continúa siendo decorativa y la fracción textual sigue siendo la fuente accesible.
3. **Cabecera de tier:** etiqueta `Evolución <romano>` localizada como UI y, en el tier fijo, nombre del perk localizado como fragmento independiente.
4. **Estado del tier:** etiqueta textual `Completado`/`Pendiente` y estilos actuales sin cambios de significado.
5. **Condición/desafío:** misma composición y regla `lang` por fragmento que en la vista resumida.
6. **Legend de selección:** texto de UI localizado; se conservan `fieldset`, `legend` y radios nativos.
7. **Cada opción de perk:** nombre, descripción y notas resueltos independientemente. Es válido, por ejemplo, mostrar nombre ES y descripción EN si solo falta esta última; cada fragmento EN de fallback lleva `lang="en"`.
8. **Valores por variante:** cantidades y símbolos se conservan. Si el valor contiene lenguaje natural, se considera campo localizable y aplica resolución/fallback; los placeholders y cifras no se traducen ni alteran.
9. **Perk fijo:** nombre y descripción siguen las mismas reglas que una opción seleccionable; las notas, si se muestran para este tipo en la implementación final, también deben entrar en cobertura.
10. **Checkbox de completado:** label de UI localizado; estado, foco y acción no cambian al alternar idioma.
11. **Enlace de fuente:** label de UI localizado, URL canónica preservada.

## 4. Fallback y D-04

### Decisión

Se confirma como adecuado el valor por defecto de **D-04: no mostrar badge, alerta, icono ni nota visual por cada fallback**.

Justificación:

- el fallback es continuidad de contenido, no un error accionable para el usuario;
- un badge repetido en nombres, desafíos, descripciones y notas introduciría ruido y perjudicaría especialmente la vista móvil;
- la cobertura faltante ya debe ser observable para mantenimiento en el informe de generación y en pruebas;
- la procedencia no se oculta: se mantiene el enlace/atribución de fuente, pero no se confunde con un estado operativo de la tarjeta.

Tratamiento obligatorio sin indicador visual:

1. Nunca dejar huecos ni mostrar `undefined`, claves o IDs como sustituto de un texto localizado obligatorio.
2. No aplicar fallback por bloque, tarjeta, tier o arma: solo al campo concreto que falla.
3. Mantener la jerarquía tipográfica del campo; el texto EN no debe parecer deshabilitado, error ni contenido secundario por ser fallback.
4. Marcar semánticamente cada fragmento EN fallback con `lang="en"` para pronunciación correcta. Este metadato no genera badge ni texto adicional.
5. No añadir tooltip: no funciona de forma equivalente con teclado/táctil y no resuelve una necesidad del usuario final.
6. Si en el futuro se solicita hacer visible la cobertura, será una decisión observable nueva y deberá volver a UX/spec; no debe improvisarse durante implementación.

## 5. Reutilización y componentes

### Patrones existentes que se conservan

- Acordeón por arma y sus estados plegado/desplegado.
- `EditorialPageHeader`, `EmptyState`, `ExternalLink` y `ProgressMiniBar`.
- `EvolutionTierCard`, tarjetas de variante, badges textuales de estado y numerales decorativos.
- `fieldset`/`legend`, radios nativos y checkbox de completado.
- `SegmentedControl` de Configuración como único control de idioma.
- Reglas `reflow-chain`/`reflow-text`, wrapping existente y grid móvil primero.

### Componentes visuales nuevos

**Ninguno.** La necesidad se cubre resolviendo el contenido antes de renderizarlo y aplicando semántica de idioma al fragmento. Arquitectura puede definir una utilidad o tipo no visual reutilizable, pero no se justifica un componente visual de fallback.

## 6. Accesibilidad y usabilidad — WCAG 2.1 AA

1. Conservar navegación completa por teclado, orden de foco y foco visible de acordeones, radios, checkbox, enlace y control segmentado.
2. Conservar `aria-expanded`, `aria-controls`, jerarquía de headings, `fieldset`/`legend` y labels nativos; el cambio de idioma no debe regenerar IDs DOM de forma que rompa relaciones accesibles.
3. Aplicar `lang="en"` al nodo textual que usa fallback dentro de una página ES. En frases mixtas, separar prefijo UI y valor de catálogo en nodos para que cada idioma tenga pronunciación correcta.
4. No usar color, icono o estilo como única señal de estado. Los estados completado/pendiente y las fracciones de progreso continúan acompañados de texto.
5. Permitir reflow sin scroll horizontal a 320 CSS px y mantener operabilidad en el caso extremo ya contemplado por la vista. Nombres, desafíos, descripciones y notas deben envolver sin truncado que oculte mecánicas.
6. No forzar mayúsculas en el dato fuente mediante transformación de la cadena; si el estilo visual actual usa `text-transform`, el nombre accesible debe conservar texto comprensible.
7. No se requiere `aria-live` para anunciar cada sustitución de idioma o fallback. El selector ya comunica su opción elegida; anuncios masivos serían verbosos. El estado de carga existente conserva su `aria-live`.
8. El nombre accesible de cada radio debe seguir incluyendo nombre, descripción, valores y notas visibles según la semántica nativa del label, también cuando haya fragmentos con distinto `lang`.

## 7. Criterios de QA UX/UI

1. **ES con cobertura completa:** en resumen y detalle aparecen ES para arma, variante, desafío, perk, descripción y notas; no aparecen equivalentes EN en esos campos.
2. **EN:** los mismos puntos muestran siempre EN canónico y el documento queda en `lang="en"`.
3. **Fallback aislado:** con solo una descripción ES ausente, nombre y resto permanecen ES, la descripción aparece EN con `lang="en"` y no existe indicador visual.
4. **Fallback en cada clase de campo:** repetir para arma, variante, desafío, nombre de perk, descripción, notas y valor con lenguaje natural; no hay vacío, clave ni error.
5. **Frase mixta:** `Desafío:` permanece ES y solo la condición fallback se identifica como EN en el DOM.
6. **Cambio ES→EN→ES:** conservar exactamente perk seleccionado, checkbox completado e instalaciones; si la vista permanece montada, conservar además acordeón, foco y scroll.
7. **Resumen/detalle consistentes:** el mismo perk o desafío resuelve al mismo valor/idioma en ambos estados del acordeón.
8. **Responsive:** revisar 320 px, móvil habitual y escritorio con cadenas largas EN/ES y mezcla puntual; sin solapamiento, clipping ni scroll horizontal.
9. **Teclado/lector de pantalla:** operar acordeón, radios y checkbox; comprobar cambio de pronunciación en fragmentos fallback y ausencia de anuncios repetitivos.
10. **Offline:** alternar idioma y abrir resumen/detalle sin solicitudes de traducción o contenido.
11. **Regresión visual-semántica:** badges de estado conservan texto, minibarra conserva fracción, y enlace/atribución permanecen disponibles.

## 8. Riesgos, supuestos y trade-offs

- **Mezcla ES/EN puntual:** es un trade-off aprobado para evitar huecos; se mitiga por campo y con `lang` semántico, sin ruido visual.
- **Cadenas traducidas más largas:** pueden aumentar altura de filas/tarjetas; se acepta crecimiento vertical y wrapping antes que truncado.
- **Resolución sin metadato de idioma:** devolver solo una cadena impediría distinguir una traducción ES idéntica a EN de un fallback real y dificultaría aplicar `lang` correctamente.
- **Remontaje por claves textuales:** si un texto localizado se usa como `key`, cambiar idioma podría perder foco/estado local. Las claves deben seguir basadas exclusivamente en IDs estables.
- **Fallback defensivo a IDs:** la vista actual contempla `variant?.name ?? variantId`; arquitectura/implementación debe asegurar que un catálogo válido no llegue a ese estado. Un ID no sustituye al fallback EN contractual.
- **Notas del perk fijo:** la vista actual no muestra sus notas. La feature no exige rediseñar la tarjeta, pero cualquier nota que Evoluciones renderice ahora o durante esta implementación debe pasar por resolución localizada.

## 9. Handover a architect-agent

Arquitectura debe concretar un contrato de resolución que permita a UI obtener, por cada campo, al menos:

- valor final no vacío;
- idioma efectivo del valor (`es` o `en`), independiente del idioma solicitado;
- identidad estable de entidad/campo, sin derivarla del texto mostrado;
- opcionalmente una marca de fallback para pruebas/telemetría offline, no para renderizar un badge.

El contrato debe soportar resolución individual de nombre de arma, variante, condición, nombre/descripción/notas de perk y valores con lenguaje natural; EN obligatorio, ES opcional; sin duplicar entidades. Debe permitir componer prefijos de UI y datos de catálogo en nodos separados y aplicar `lang="en"` solo al fragmento fallback. Cambiar idioma no debe escribir en progreso ni alterar las referencias por ID.

La implementación posterior debe inventariar todos los accesos visibles indicados en la sección 3 y demostrar CA-12. QA debe usar la matriz de la sección 7. No queda decisión UX bloqueante abierta.
