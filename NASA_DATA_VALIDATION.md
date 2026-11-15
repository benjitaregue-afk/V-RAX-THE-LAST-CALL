# NASA DATA VALIDATION

Revisión documental: 2026-11-14. **Hechos revisados; integración y revisión humana de la entrega pendientes.** No se afirma revisión o aprobación por personal de NASA.

## Recursos oficiales y selección

Se leyó la pestaña [Resources del reto 2026](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources). Enumera NSSDCA; módulos lunares Apollo; LRVs; ALSEP; Surveyor; Sojourner/Pathfinder; Spirit/Opportunity; Viking; Phoenix/InSight; Dawn; NEAR Shoemaker; Pioneer; Ingenuity; Kepler. Se conservan sus enlaces en [SOURCES.md](SOURCES.md). Algunos rótulos agrupan misiones bajo un único enlace: se debe verificar cada misión, no heredar hechos de su compañera.

**Ruta de elegibilidad seleccionada:** C01 → NSSDCA → registros N02 y N01 → campos locales visibles → decisiones PZ-01/PZ-02 → créditos y campo NASA Data. Además, InSight y el overview MER están enlazados directamente por C01. Esto justifica la selección documental; no prueba que un juego inexistente ya cumpla el requisito. La aclaración [1849](https://github.com/nasa/spaceapps/discussions/1849) requiere usar al menos una fuente NASA de Resources para premios globales.

## Registro de afirmaciones autorizadas

Los IDs siguientes serán referencias de contenido. `FACT` significa afirmación histórica respaldada; `MODEL` significa interpretación pedagógica simplificada; `FICTION` significa invención narrativa.

| ID | Afirmación que puede aparecer, en inglés en el juego | Evidencia primaria / límite |
| --- | --- | --- |
| F01 | Opportunity es MER-B; ID NSSDCA 2003-032A. Fue creado para investigaciones geológicas, incluidas pistas de agua pasada. | [N01](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A), Description |
| F02 | Sus paneles solares cargaban baterías; el brazo llevaba instrumentos como MB, APXS y MI. | N01, Spacecraft and Subsystems; no convertir potencia nominal en telemetría final |
| F03 | MB identifica minerales que contienen hierro; Pancam obtiene imágenes del entorno. | [N08](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-instruments/); una fotografía por sí sola no identifica químicamente un mineral |
| F04 | PIA05584 muestra sedimentos y esférulas, fue obtenida por Pancam y es una composición en color falso. | [N09](https://science.nasa.gov/photojournal/berries-and-rock-share-common-origins/); adición al archivo 2004-03-18, captura sol 50; no confundir ambas fechas |
| F05 | El estudio de las esférulas y del contexto mineralógico/sedimentario aportó evidencia de agua pasada. No equivale a detectar vida. | [N10](https://astrobiology.nasa.gov/news/check-type-iron-blueberries/) y N09; evitar “toda hematita prueba agua” |
| F06 | Última comunicación de Opportunity: 2018-06-10. Fin declarado de misión: 2019-02-13; el contexto fue la tormenta global de polvo y la disminución de energía solar. | [N03](https://science.nasa.gov/mission/mer-opportunity/), Key Dates e historia; contacto y cierre no son el mismo evento |
| F07 | InSight, ID 2018-042A, era un módulo estacionario para investigar el interior de Marte. | [N02](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A), Description |
| F08 | SEIS es un sismómetro: registra movimiento/vibraciones del suelo; las ondas ayudan a estudiar la estructura interior. No es un micrófono que escuche voces. | N02 y [N06](https://www.jpl.nasa.gov/news/nasas-insight-hears-peculiar-sounds-on-mars/); CNES y socios proporcionaron SEIS |
| F09 | InSight utilizaba paneles solares y baterías. Última transmisión: 2022-12-15; misión declarada terminada: 2022-12-21. | N02, Mission Profile |
| F10 | La acumulación de polvo redujo la energía; el conjunto de datos de SEIS permitió investigar corteza, manto y núcleo. NASA informó 1,319 marsquakes al cierre. | [N05](https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/); no usar esa cifra como detector actual ni inventar precisión del interior |
| F11 | HP³ no alcanzó la profundidad prevista para su objetivo de flujo térmico. | N05; distinguir propósito de instrumento y resultado conseguido |
| F12 | La fotografía N07 se tomó 2022-12-11, sol 1436; crédito NASA/JPL-Caltech. | [N07](https://science.nasa.gov/resource/one-of-insights-last-images/); no llamarla “la última transmisión” |
| F13 | Los audios divulgativos N06 aceleran y procesan señales de SEIS para hacerlas audibles. | N06; si se usan, rotular “processed seismic sonification”, no grabación directa de micrófono |
| F14 | Un retroreflector lunar devuelve pulsos enviados desde la Tierra; el tiempo de ida y vuelta permite medir distancia. Un dispositivo dejado allí puede seguir siendo útil sin producir radio. | [N11](https://www.nasa.gov/image-article/retroreflectors-from-apollo-mars/) y [N12](https://ilrs.cddis.eosdis.nasa.gov/missions/satellite_missions/current_missions/ap11_general.html); solo ampliación opcional |

## Uso significativo en los acertijos

| Experiencia | Campos/evidencias realmente necesarios | Decisión del jugador | Prueba de integración futura |
| --- | --- | --- | --- |
| PZ-01, Listening Chain | N02: host, instrumento SEIS, objetivo interior; F07/F08 | Relacionar instrumento, medición y propósito | Expediente visible; solución usa esos IDs; captura de la respuesta y de su fuente |
| PZ-02, Witness in Stone | N01/N08: instrumentos; N09: producto e instrumento; F03–F05 | Separar lo que muestra una imagen, lo que identifica MB y la inferencia sobre agua | Imagen/alternativa textual verificadas, etiquetas y decisiones rastreables |
| PZ-03, Provenance | F08 y diagnóstico ficticio rotulado | Separar evidencia de interpretación y ficción | Ninguna frase inventada puede recibir la etiqueta de hecho NASA |

No se inventarán espectros, sismogramas ni paquetes de telemetría para simular observaciones reales. Las animaciones de señal y el cableado del archivo serán `MODEL` o `FICTION` con etiqueta persistente.

## Datos y archivos para empaquetar después de aprobación

| Recurso | Selección concreta | Tratamiento y estado |
| --- | --- | --- |
| Catálogo NSSDCA | N01 / N02, IDs y campos indicados | Fuentes leídas; falta crear y revisar JSON local, hash y versión |
| Imagen Opportunity | N09, PIA05584, JPEG de la página del producto | Caption y proveedor leídos; archivo, derechos finales y hash pendientes |
| Imagen InSight | N07, PNG 1024×1024 | Contexto y crédito leídos; archivo y hash pendientes |
| Audio real de SEIS | N06, sonificaciones de sol 173 o 235 | Fuente estudiada; archivo directo y derechos no cerrados. Opcional, fuera del núcleo |
| Datos PDS | N13, `urn:nasa:pds:insight_seis`, DOI `10.17189/1517570` | Identificador comprobado; productos individuales no inspeccionados. No necesarios para terminar |

El catálogo es una fuente de datos estructurados de misión, no telemetría científica cruda. Se declarará exactamente eso. PDS sería una ampliación de análisis, no un requisito inventado del reto.

Cada ficha local deberá contener `sourceId`, URL del registro, ID de misión/producto, sección/campo, fecha de recuperación, texto original mínimo o valor literal, resumen editorial separado, `claimIds`, crédito, condiciones de uso y hash del archivo cuando exista. Las modificaciones serán explícitas: reducción de resolución, transcodificación o extracto de metadatos. Nunca aplicar glitch, reconstrucción generativa o recoloración a la evidencia original.

## Barrera ciencia / ficción

- `NASA ARCHIVAL RECORD`: valores y explicaciones vinculados a fuentes. Apariencia estable, fuente legible, URL y crédito a un clic.
- `EDUCATIONAL MODEL`: diagramas simplificados o sonido sintetizado. Explica qué se ha simplificado.
- `FICTIONAL ARCHIVE SYSTEM`: estación, VØRAX, mensajes, avería y reproducción local. Sucesos inventados, sin fecha histórica NASA simulada.
- `UNSUPPORTED CLAIM`: opción incorrecta presentada como hipótesis a evaluar, nunca como cita.

La estación contiene representaciones, no objetos recuperados de Marte. El final no reactiva rovers ni descubre vida. No se usa la frase viral atribuida a Opportunity sobre batería y oscuridad como una cita real.

## Protocolo de validación de ciencia

1. Releer la fuente primaria y registrar su campo; comprobar identidad, instrumento, fecha y huso horario.
2. Separar objetivo, mecanismo, hallazgo y causa de fin de misión. Un objetivo no demuestra que se alcanzó.
3. Vincular afirmación con evidencia en el manifiesto y el diálogo; revisar la traducción al inglés.
4. Una persona distinta del autor revisa la ficha y la respuesta correcta. Si no hay revisor, registrar la limitación y no afirmar validación independiente.
5. Ejecutar QA de la evidencia en el juego: legibilidad, atribución, accesibilidad sin red y separación de capas.

Normalizar fechas a ISO con UTC cuando se conviertan instantes. Opportunity aparece con fechas de lanzamiento/aterrizaje distintas en resúmenes locales y UTC; el núcleo no necesita preguntar esas conversiones. No extraer una pregunta de una fecha ambigua sin resolverla primero.

## Estado P0

Verificado documentalmente: reto 2026, recursos seleccionados, registros N01/N02 y hechos de la tabla. Pendiente: evento/equipo, tratamiento de IA y originalidad, licencias finales por archivo, implementación y evidencia de QA. Revisar [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) antes de declarar cumplimiento.
