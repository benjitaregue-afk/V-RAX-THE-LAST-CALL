# AI USE DISCLOSURE

Registro real de esta fase · 2026-11-14 · Actualizar por contribución, sin sobrescribir la historia de uso.

## Trabajo efectivamente realizado

| Elemento | Procedencia y participación | Revisión/estado |
| --- | --- | --- |
| Visión inicial y restricciones | Proporcionadas por el usuario en el prompt | No se certifica aquí su autoría previa o elegibilidad |
| Investigación y síntesis | Codex consultó fuentes oficiales, contrastó documentos y preparó el registro | Revisión humana independiente pendiente |
| Diseño y variantes narrativas | Codex redactó alternativas, puzzles, arquitectura y secuencia de producción | Borradores asistidos por IA; decisión humana pendiente |
| Documentación y convenciones | Codex creó los archivos Markdown y realizó la revisión documental indicada en PLANNING_REVIEW | No son un juego implementado |
| Código de producción, modelos, texturas, música, voz, vídeo | No producidos en esta fase | No declarar estos elementos como existentes |
| Claude Fable 5.2 | Herramienta prevista para la fase siguiente; no invocada aquí | Acceso no probado; no atribuirle estos documentos |
| Image generation / text-to-3D | No utilizados | No hay imágenes o meshes generados para el juego |

El nombre exacto del backend/modelo de esta sesión Codex no se registró como dato verificable. No se inventa un número de versión. Los pequeños comandos de investigación y revisión documental no constituyen implementación del juego.

## Cuestión de concurso pendiente

La [guía 2026](https://www.spaceappschallenge.org/resources/project-submission-guide/) permite asistencia IA/SI, exige divulgarla y restringe su uso para originar la solución. La aportación inicial del usuario y la planificación asistida se distinguen arriba. La revisión del Team Owner y cualquier aclaración necesaria siguen abiertas. Seleccionar un borrador no garantiza por sí solo cumplir la cláusula de originalidad.

## Texto en inglés para describir esta fase

> The project vision and constraints were supplied in the user's initial prompt. Codex assisted with primary-source research, planning, technical architecture, draft narrative alternatives, puzzle design and documentation. These materials are planning drafts pending human selection and review. No production game code, models, audio or video were created during this phase. Claude Fable 5.2 is a planned collaborator and was not used to produce this package. Historical NASA records are attributed separately from fictional story elements.

Este texto describe el estado actual; **no es todavía la declaración final de un juego terminado**. No afirma aprobación NASA ni validación científica independiente.

## Registro que deberá mantenerse al implementar

Para cada contribución: fecha, herramienta/modelo realmente usado si se conoce, archivos/elementos, tipo de asistencia, fuente o input humano, transformaciones y persona que revisó. Mantener separado `archival source` de `AI-assisted extraction/editorial summary`; un valor extraído de NASA no es una medición sintética inventada.

Imagen/vídeo generado: marca visible de generación. Audio/código/datos asistidos: descripción y metadatos según la guía. Como decisión conservadora de producto, el render ficticio y la demo identificarán asistencia IA; el registro científico original conservará su crédito y no se presentará como generado. No se generarán ni alterarán elementos gráficos de marca NASA.

Antes del envío reemplazar este borrador por una declaración que cubra el proyecto real completo, conservando este registro de fase. No añadir herramientas, autores, pruebas ni revisores que no participaron.

## Continuación técnica autorizada — 2026-11-14

El usuario autorizó continuar la implementación que Claude había dejado en esta carpeta. Se conservaron sus registros científicos, narrativa, puzzles, layout, imágenes y script Blender; la identidad exacta del modelo que produjo ese trabajo anterior no se verificó en esta sesión.

Codex integró motor, controlador FPS, colisiones, UI, estados/ending, carga opcional GLB, audio sintético, guardado y pruebas. Se usaron agentes de apoyo para UI, síntesis de audio, revisión de contenido y QA, con archivos asignados. Las pruebas realizadas están en PROGRESS.md. El entorno actual utiliza geometría **greybox provisional**, no modelos Blender de producción. No se generó ni ejecutó arte Blender, imágenes generativas, voces o música externa. La pequeña geometría GLB de una prueba de navegador solo se sirvió mediante interceptación de QA; no es un asset del juego.

La interfaz muestra una divulgación actualizada de ese estado, sin usar la frase histórica de contenido que anticipaba modelos Blender terminados. Las fotos/registros NASA mantienen su crédito original. No hubo publicación, envío ni aceptación de términos por el usuario. Los checks humanos de elegibilidad/originalidad/licencias finales continúan abiertos.

## Ampliación narrativa autorizada — 2026-11-14

El usuario proporcionó la nueva premisa del superviviente, la estructura de capítulos, el monólogo y las frases del rescate. Codex y agentes de apoyo integraron estados, guion de conexión, UI de secuencias, movimiento sprint, manos provisionales, cubierta/actor/foco 3D y nuevas pruebas. El monólogo y la radio son ficción, no citas ni transmisiones de NASA. Los registros científicos, imágenes, preguntas y respuestas originales se conservaron.

Las manos, daño y nave actuales son geometría temporal en código. No se produjeron meshes o animaciones finales de Blender. La voz provisional utiliza Web Speech del navegador cuando está disponible, con captions como respaldo; no se generaron archivos de voz final ni se reutilizaron grabaciones NASA. Las verificaciones efectivamente realizadas y los límites constan en PROGRESS.md.

## Continuación artística r3 — 2026-11-15

El usuario autorizó a Codex continuar únicamente el siguiente hito pendiente de `ART_HANDOFF.md`, sobre la escena r2 existente. Codex utilizó Blender MCP y las habilidades de arte instaladas para añadir una pluma exterior de servicio, radiador y borde de casco a `vorax_station.blend`: 2.396 triángulos, dos materiales y mallas repetidas enlazadas. Se reutilizan texturas ya adquiridas y acreditadas de Poly Haven; no se adquirieron recursos nuevos ni se utilizó generación de imágenes o text-to-3D. El script de esta aportación es `assets/blender/scripts/station_exterior.py` y la entrega se incorpora a `public/assets/models/environment.glb`.

Codex añadió iluminación de presentación exclusiva para ese exterior y corrigió el cono visual de rescate para terminar fuera del vidrio. Un agente Codex de apoyo revisó la integración y editó únicamente `src/world/rescue.ts`. No se invocó Claude en esta sesión; las atribuciones anteriores de los assets se conservan como registro previo. No se modificaron fotografías, hechos científicos, identidad de fuentes NASA, puzzles ni progreso del juego. Las pruebas y límites de r3 constan en `ART_HANDOFF.md`. El rig de manos y las grabaciones de voz siguen pendientes, al igual que la revisión artística humana y la licencia propuesta del arte original.

## Cinematic overhaul r4 — 2026-11-15

Codex and supporting Codex agents diagnosed coplanar portal trim from the actual Blender/served GLB geometry, repaired only the existing trim coordinates, and created original articulated industrial glove meshes, woven/grime/scuff maps, a 35-bone rig, ten sampled animations and runtime blending/visibility/context integration. Blender MCP executed the authored Python in the user's real scene. Editable source, binary exports, provenance and executed QA evidence are in ART_HANDOFF.md / CINEMATIC_OVERHAUL.md. The supplied game screenshots were defect evidence; the supplied hand and Dead Space interfaces were external visual references only. No pixels, meshes, logos or interface assets were copied from those references. No image generation or text-to-3D service was used; no Claude invocation occurred in this continuation. NASA photos, claims, citations and question answers were preserved. The user approved the first hand direction and requested continuation to the first interface prototype. Overall artistic/hardware/competition acceptance is not implied by that approval.
