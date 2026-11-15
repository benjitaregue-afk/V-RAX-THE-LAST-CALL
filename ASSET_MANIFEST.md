# ASSET MANIFEST

V1.0 · Inventario de producción previsto, no biblioteca ya descargada. **Stock actual: documentos y referencias verificadas; cero archivos de producción adquiridos.** Ningún tamaño de esta tabla es una medición de un asset final.

## Reglas de admisión

Registrar origen, autor/titular, URL del producto, licencia o condiciones exactas, crédito, fecha de adquisición, hash SHA-256 del original y derivado, modificaciones y destinos. Conservar el archivo de licencia/aviso. Una etiqueta genérica “NASA” no cubre automáticamente derechos de terceros.

Para trabajo original se propone MIT, pendiente de adopción al implementar; no se ha añadido una licencia global que relicencie materiales ajenos. Dependencias conservan sus licencias. CC0 no exige atribución, pero el proyecto dará crédito y el concurso exige citar recursos. Assets de pago, no redistribuibles, “editorial only” ambiguos o de autor desconocido quedan fuera del núcleo.

## Inventario por objeto

Las rutas son propuestas futuras. `ORIGINAL` = pendiente de producir; `CANDIDATE` = fuente localizada, archivo no inspeccionado; `SOURCE READ` = página/registro leído, archivo o integración pendientes.

| ID / prioridad | Objeto y cantidad | Ruta prevista | Formato / techo propio | Fuente y derechos | Estado / alternativa |
| --- | --- | --- | --- | --- | --- |
| GEO01 / núcleo | 12 familias de módulos; hasta 100 instancias | `src/world/modules/` | Geometría en código; ≤40k tris únicos | Original procedural; MIT propuesto | ORIGINAL; boxes planos como mínimo |
| GEO02 / núcleo | 3 puertas con marcos | `src/world/doors/` | Geometría + animación; ≤6k tris total | Original; MIT propuesto | ORIGINAL; apertura instantánea si falla animación |
| GEO03 / núcleo | 4 consolas, 6 racks, 2 pedestales | `src/world/props/` | ≤30k tris total | Original; Kenney opcional A02 CC0 | ORIGINAL; siluetas simples |
| GEO04 / núcleo | Domo SEIS y fragmento solar ilustrativos | `src/world/exhibits/insight.ts` | ≤8k tris | Original, basado en rasgos documentados N02/N07; sin logos | ORIGINAL; rótulo de representación |
| GEO05 / núcleo | Rueda/panel y relieve ilustrativos | `src/world/exhibits/opportunity.ts` | ≤10k tris | Original; referencias N01; sin detalle certificado | ORIGINAL; no se presenta como muestra real |
| GEO06 / núcleo | Relé, brazo y ventilador | `src/world/props/relay.ts` | ≤8k tris | Original; MIT propuesto | ORIGINAL; sin rig complejo |
| TEX01 / opcional | Un material de suelo | `public/assets/textures/floor/` | Mapas ≤1024²; paquete ≤1 MiB transferido | [Poly Haven Concrete Floor](https://polyhaven.com/a/concrete_floor), [CC0](https://polyhaven.com/license); autor del producto por registrar | CANDIDATE; material procedural sin mapas |
| TEX02 / núcleo | Materiales de metal, goma, panel y emisivo | `src/world/materials.ts` | ≤16 compartidos; sin mapas obligatorios | Original; MIT propuesto | ORIGINAL |
| DATA01 / núcleo | Registro InSight y fichas F07–F13 | `src/content/science/insight.json` | JSON ≤40 KiB | [N02](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A), NASA/NSSDCA; condiciones NASA | SOURCE READ; copiar valores revisados, no telemetría inventada |
| DATA02 / núcleo | Registro Opportunity y fichas F01–F06 | `src/content/science/opportunity.json` | JSON ≤40 KiB | [N01](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A), N08/N10; condiciones NASA | SOURCE READ |
| IMG01 / núcleo con fallback textual | PIA05584 | `public/assets/nasa/pia05584.jpg` | JPEG original o reducción; ≤1 MiB | [N09](https://science.nasa.gov/photojournal/berries-and-rock-share-common-origins/); **NASA/JPL/Cornell**; revisar restricciones del archivo | SOURCE READ; sin crop científico ni cambio de color; descripción textual si falla |
| IMG02 / opcional visual | InSight sol 1436 | `public/assets/nasa/insight-sol1436.webp` | Derivado ≤1024², ≤1 MiB | [N07](https://science.nasa.gov/resource/one-of-insights-last-images/); **NASA/JPL-Caltech** | SOURCE READ; original PNG 1024² indicado por página; reducción/transcodificación declarada |
| SFX01 / núcleo | Ambiente y patrón de tres pulsos | `src/audio/synthesis.ts` | Síntesis Web Audio; sin descarga de muestras | Original; declarar asistencia IA si se genera código | ORIGINAL; señal ficticia, no grabación de Marte |
| SFX02 / núcleo | Pasos, botón y relay | `public/assets/audio/original/` o síntesis | Hasta 6 efectos cortos; ≤1 MiB total | Original y documentado | ORIGINAL; si se graba, autor y autorización por registrar |
| SFX03 / opcional | Hasta 4 mecanismos | `public/assets/audio/kenney/` | OGG + MP3 si hace falta; ≤1 MiB total | [Kenney Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds), CC0; crédito Kenney | CANDIDATE; nombres exactos pendientes de escuchar; síntesis de respaldo |
| SFX04 / opcional | Sonificación real SEIS | `public/assets/nasa/seis/` | Extracto ≤20 s; ≤500 KiB | [N06](https://www.jpl.nasa.gov/news/nasas-insight-hears-peculiar-sounds-on-mars/); crédito exacto por archivo pendiente | CANDIDATE; omitida del núcleo; no extraer de un vídeo con música |
| MUS01 / opcional | Textura tonal final | `src/audio/synthesis.ts` | Síntesis ligera o muestra ≤1 MiB | Original | ORIGINAL; el ambiente basta si se recorta |
| UI01 / núcleo | HUD, iconos, menú, captions | `src/ui/` | HTML/CSS y SVG original simple | Original; fuentes del sistema sin archivo distribuido | ORIGINAL; ningún logo NASA generado |
| TXT01 / núcleo | Guion, pistas y créditos en inglés | `src/content/narrative/`, `src/content/locales/en.json` | Narrativa + ciencia obligatoria ≤1,000 palabras como objetivo | Original asistido por IA, con citas científicas separadas | BORRADOR en documentos; revisión humana pendiente |
| EXTRA01 / P5 | Ficha Apollo/retroreflector | `src/content/science/apollo.json` | Texto ≤200 palabras; sin sala nueva | N11/N12, condiciones NASA | SOURCE READ; fuera del recorrido de aceptación |

Los máximos geométricos son por grupos, no permiso para exceder los 150k triángulos visibles de ART_DIRECTION. Los presupuestos de audio opcionales no se suman automáticamente: el paquete completo debe seguir bajo 12 MiB.

## Proveedores y uso recomendado

Poly Haven: seleccionar como máximo un material y usar mapas de 1K o menores; evitar HDRIs y escaneos pesados. Verificado CC0 a nivel del servicio, falta registrar autor y archivo específico. Kenney: solo props compatibles después de comparar escala, pivote y licencia dentro del ZIP. [Space Kit](https://kenney.nl/assets/space-kit) fue leído; [Modular Space Kit](https://kenney.nl/assets/modular-space-kit) no se ha inspeccionado. Ningún pack está certificado como integrado.

No se necesitan meshes externos NASA. La fidelidad científica vive en los expedientes y en la explicación del instrumento; una maqueta simplificada debe reconocer su simplificación. Las texturas o imágenes generadas no sustituyen datos reales.

## Pipeline después de aprobación

1. Elegir el archivo desde la página de producto; comprobar licencia/credit y restricciones, guardar comprobante y hash.
2. Mantener original de investigación separado del asset servido; registrar toda conversión.
3. Para meshes opcionales: convertir a GLB, aplicar escala, limitar materiales, eliminar geometría oculta y crear colisión propia. No depender de Blender en el núcleo.
4. Para imágenes de evidencia: preservar encuadre, proporción y leyenda; añadir alt text y crédito en la interfaz. El color falso se identifica como tal.
5. Para audio: escuchar, comprobar clipping y derechos, producir formatos necesarios y captions. Escuchar el derivado en navegador, no solo reproducirlo fuera del juego.
6. Actualizar manifiesto con archivos reales, tamaños, hashes y prueba. Incluir avisos en `public/credits/` y en la entrega del repositorio.

## Marcas y divulgación

Usar VØRAX como texto original. No generar ni alterar logos, banderas, parches o identificadores gráficos NASA. Los nombres/IDs de misión se muestran como referencias factuales de fuentes originales, separados de material ficticio. La amplitud de la prohibición de identificadores en contenido IA requiere revisión P0; no se asume una exención automática para cada uso.

Si se añaden imágenes/vídeos generados, llevarán marca visible de generación según la guía 2026. Audio, código y datos asistidos tendrán declaración descriptiva y metadatos. El render del juego y su vídeo de demostración llevarán una divulgación conservadora de asistencia IA, sin aplicarla sobre la fotografía NASA original como si esta fuese sintética.

## Qué impide admitir un asset

Falta de origen o permiso, formato que requiere un servicio remoto, peso que rompe presupuesto, necesidad de corregir una malla durante horas, atribución dudosa o contenido que confunde ficción con evidencia. Sustituirlo por geometría/síntesis original o texto factual; nunca omitir el problema del registro.

## Ampliación narrativa provisional — 2026-11-14

No se generaron archivos de arte final. Se añadieron en código un rig de manos temporal, paneles dañados, estrellas, ventanal y nave/foco de rescate ficticios. Los assets finales de Claude se activan por slots `hands` y `rescue`; véase CLAUDE_HANDOFF. Registrar crédito, licencia y hash antes de admitir archivos reales. La voz provisional es la del navegador cuando está disponible; no es audio de NASA ni una interpretación final grabada.

## Entrega artística r3 — 2026-11-15

Hito de profundidad exterior completado sobre la estación r2 existente. Fuente editable: `assets/blender/vorax_station.blend`; script no destructivo: `assets/blender/scripts/station_exterior.py`. Se añaden 2.396 triángulos y dos materiales para una pluma de servicio, radiador y borde de casco, con mallas repetidas enlazadas. Entrega dentro de `public/assets/models/environment.glb` (12.930.216 bytes); SHA-256 `26e6e7472cc8d7592b296712b1e976d08fc8eabd504b43fa82054a5b12a57d16`. Crédito de r3: VØRAX team — exterior authored in Blender 5.3 through Blender MCP with Codex assistance. La autoría anterior se conserva en `src/content/assets.ts`; no se invocó Claude en esta sesión.

Se reutilizan los mapas de metal ya acreditados en `assets/textures/polyhaven/SOURCES.json`, con UV proyectadas de 2 m, color por vértice, exportación GLB Y-up y texturas WebP embebidas. No hubo nuevas adquisiciones. Los 110 grupos de geometría interior y las 24 imágenes embebidas originales se conservan idénticos; los otros 26 assets servidos conservan sus hashes. Licencia del arte original: MIT propuesta, todavía sin adopción; las fuentes Poly Haven conservan CC0. Pruebas y límites de la entrega: `ART_HANDOFF.md`, informe geométrico `assets/blender/exterior-report.json`. El rig de manos sigue pendiente.

## Entrega r4 — reparación de marcos y manos

La geometría existente de los revestimientos de cuatro portales se separó 15 mm de las caras estructurales coplanares. Topología, UV, materiales y lightmaps conservados. GLB de entorno: d5d2589b1177cc5457f6b81aaf1032b746e31dbdaaaffd338d2cf53b508eadd0. Se añade `public/assets/models/player-hands.glb`: 1.525.964 bytes, SHA-256 c17d52a85683ddfb21418eb98ab3ec7aa976ce3f9ed8fafb3c008ca7671b4ddc, 23.504 triángulos, 35 huesos, cuatro materiales, diez clips. Fuente editable y mapas originales: `assets/blender/hands/`; script `assets/blender/scripts/build_hands.py`. Crédito: VØRAX team — original glove geometry, textures and animations authored with Codex through Blender MCP. Sin adquisiciones ni copia de assets de las referencias externas. La licencia propuesta del arte original sigue pendiente de decisión humana. Métodos, hashes, aprobación visual y límites documentados en CINEMATIC_OVERHAUL.md.
