# SOURCE REGISTER

Consulta: **14 de noviembre de 2026**, fecha del cliente, zona America/La_Paz. Solo se utilizan fuentes primarias para reglas, ciencia y capacidades técnicas. Las decisiones creativas y los presupuestos son propuestas del equipo, no afirmaciones de estas fuentes.

## Método y límites

El lector web devolvió 502 en varias páginas de Space Apps y rechazó el tipo XML de NSSDCA. Se recuperaron esas páginas con `curl`, validación TLS normal, HTTP 200. Se leyeron los campos de texto del HTML y los fragmentos de contenido serializados por Next.js, sin ejecutar el JavaScript de esas páginas. Así se leyó realmente el reto, su pestaña Resources, las guías y los dos registros NSSDCA. No se tomaron los snippets de búsqueda como prueba definitiva.

Las páginas de guías mostraban fecha 2026-11-13. El reto exponía `lastPublishedAt: 2026-11-13T03:46:21.392788Z`. Esto describe las respuestas leídas, no asegura que no cambien. Revalidar antes del envío. Las respuestas originales están en caché temporal de investigación; no se incluyen como assets ni son una dependencia de este paquete.

## Reglas y reto

| ID | Fuente primaria y lectura | Uso |
| --- | --- | --- |
| C01 | [Reto y Resources oficiales](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources) · HTTP 200, contenido leído | Público, formatos, alcance y lista de recursos |
| C02 | [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/) · HTTP 200, leído | Fechas, equipos, preparación y uso declarado de IA/SI |
| C03 | [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) · HTTP 200, leído | Campos, demo, inglés, acceso público y condiciones de IA/SI |
| C04 | [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/) · HTTP 200, leído | Elegibilidad y rúbrica |
| C05 | [Participant Terms & Conditions](https://www.spaceappschallenge.org/legal/) · HTTP 200, leído | Licencias, referencias y derechos de materiales |
| C06 | [Space Apps Brand](https://www.spaceappschallenge.org/brand/) · HTTP 200, leído | Recursos oficiales de marca; no se incorpora ningún logo |
| C07 | [NASA Images and Media Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) · lector web, leído | Uso educativo factual, terceros, créditos y ausencia de respaldo |
| C08 | [GO Team, aclaración de trabajo previo, discusión 1813](https://github.com/nasa/spaceapps/discussions/1813) · respuesta oficial leída mediante búsqueda | Preparación permitida y comienzo del trabajo en el evento |
| C09 | [Aclaración de recursos, discusión 1849](https://github.com/nasa/spaceapps/discussions/1849) · página leída | Al menos un recurso NASA de la lista del reto para premios globales |
| C10 | [Aclaración específica, discusión 1947](https://github.com/nasa/spaceapps/discussions/1947) · página leída | Fotos históricas, IA y necesidad de uso significativo de datos |
| C11 | [JPL Image Use Policy](https://www.jpl.nasa.gov/jpl-image-use-policy/) · página leída | Condiciones y restricciones por archivo/tercero |

Las guías generales más recientes prevalecen sobre respuestas anteriores cuando difieran. C03 dice al menos un recurso NASA; C09/C10 precisan que debe pertenecer a Resources del reto. El proyecto adopta la condición más específica. Esto no reemplaza una decisión de los organizadores.

### Inventario exacto de enlaces de Resources, C01

Estos son enlaces observados en el reto, no una certificación de haber estudiado cada misión ni de que todos sus archivos tengan idénticos derechos.

| Rótulo del recurso | Destino publicado por el reto |
| --- | --- |
| NSSDCA | [Catálogo](https://nssdc.gsfc.nasa.gov/) |
| Apollo Lunar Modules | [1969-059C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C) |
| Lunar Roving Vehicles | [1971-063C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C) |
| ALSEP Scientific Packages | [1969-099C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C) |
| Surveyor Landers | [Surveyor 3](https://science.nasa.gov/mission/surveyor-3/) |
| Sojourner Rover | [Mars Pathfinder](https://science.nasa.gov/mission/mars-pathfinder/) |
| Spirit & Opportunity | [MER overview](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/) |
| Viking 1 & 2 Landers | [Viking 1](https://science.nasa.gov/mission/viking-1/) |
| Phoenix & InSight Landers | [InSight](https://science.nasa.gov/mission/insight/) |
| Dawn Spacecraft | [Dawn](https://science.nasa.gov/mission/dawn/) |
| NEAR Shoemaker | [NEAR](https://science.nasa.gov/mission/near-shoemaker/) |
| Pioneer 10 & 11 | [Pioneer 10](https://science.nasa.gov/mission/pioneer-10/) |
| Ingenuity Helicopter | [Ingenuity](https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/) |
| Kepler Space Telescope | [Kepler](https://science.nasa.gov/mission/kepler/) |

## Ciencia y artefactos

| ID | Fuente primaria | Estado y aplicación |
| --- | --- | --- |
| N01 | [NSSDCA Opportunity, 2003-032A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A) | HTTP 200, leído; identidad, objetivos y hardware |
| N02 | [NSSDCA InSight, 2018-042A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A) | HTTP 200, leído; instrumentos, objetivos, energía y cronología |
| N03 | [NASA Science: Opportunity](https://science.nasa.gov/mission/mer-opportunity/) | Leído; fechas de contacto y final de misión |
| N04 | [NASA Science: InSight](https://science.nasa.gov/mission/insight/) | Leído; recurso enlazado directamente por el reto |
| N05 | [NASA retires InSight](https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/) | Leído; resultados, pérdida de energía y limitación de HP³ |
| N06 | [JPL: InSight “Hears” Peculiar Sounds](https://www.jpl.nasa.gov/news/nasas-insight-hears-peculiar-sounds-on-mars/) | Leído; sonificación, SEIS, CNES y procesamiento de audio |
| N07 | [One of InSight's Last Images](https://science.nasa.gov/resource/one-of-insights-last-images/) | Leído; imagen de 2022-12-11, sol 1436, crédito y descarga |
| N08 | [MER Science Instruments](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-instruments/) | Leído; funciones de Pancam, MB, APXS y otros instrumentos |
| N09 | [PIA05584: Berries and Rock Share Common Origins](https://science.nasa.gov/photojournal/berries-and-rock-share-common-origins/) | Leído; Pancam, color falso, sedimentos y esférulas |
| N10 | [NASA Astrobiology: Iron Blueberries](https://astrobiology.nasa.gov/news/check-type-iron-blueberries/) | Leído; hematita y contexto de evidencias de agua |
| N11 | [Retroreflectors: From Apollo to Mars](https://www.nasa.gov/image-article/retroreflectors-from-apollo-mars/) | Leído; propuesta lunar opcional, principio de medición |
| N12 | [NASA/ILRS: Apollo and Luna Reflectors](https://ilrs.cddis.eosdis.nasa.gov/missions/satellite_missions/current_missions/ap11_general.html) | Leído; persistencia del valor científico de reflectores pasivos |
| N13 | [PDS Geosciences: InSight DOIs](https://pds-geosciences.wustl.edu/missions/insight/insight_dois.htm) | Leído; SEIS bundle `urn:nasa:pds:insight_seis`, DOI `10.17189/1517570`; candidato posterior |
| N14 | [Spirit & Opportunity overview](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/) | URL verificada en Resources de C01; no se usa su contenido no leído para hechos adicionales |

N13 es un catálogo de datos archivados con identificador comprobado, no una selección ya descargada de productos. No se ha inspeccionado ni convertido una serie sísmica cruda; esa tarea queda fuera del núcleo.

## Assets y tecnología

| ID | Fuente primaria | Decisión informada |
| --- | --- | --- |
| A01 | [Poly Haven Asset License](https://polyhaven.com/license) | Assets CC0; seleccionar archivos pequeños después de aprobación |
| A02 | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | Página leída; 3D CC0, candidato secundario |
| A03 | [Kenney Modular Space Kit](https://kenney.nl/assets/modular-space-kit) | Página localizada en índice oficial; lectura directa restringida; no pack inspeccionado |
| A04 | [Kenney Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds) | Página leída; CC0, efectos mecánicos candidatos |
| A05 | [Poly Haven Concrete Floor](https://polyhaven.com/a/concrete_floor) | Producto localizado en catálogo oficial; mapas/archivo no inspeccionados |
| T01 | [Babylon Camera Collisions](https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions/) | Colisión por elipsoide; advertencia sobre gravedad simplificada de cámara |
| T02 | [Babylon ES6 / Tree Shaking](https://doc.babylonjs.com/setup/frameworkPackages/es6Support/) | Paquetes modulares, core y loaders |
| T03 | [Three.js: Making a Game](https://threejs.org/manual/pages/game.html) | Distingue biblioteca 3D y sistemas de juego adicionales |
| T04 | [React Three Fiber introduction](https://r3f.docs.pmnd.rs/getting-started/introduction) | Renderer React sobre Three.js |
| T05 | [Godot 4: Exporting for the Web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html) | Requisitos, Compatibility, exportación sin hilos y límites C# |
| T06 | [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html) | `dist`, build y preview local |
| T07 | [MDN Pointer Lock](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API) | Gesto de usuario, escape, errores y pérdida de captura |
| T08 | [MDN Autoplay / Web Audio](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) | Desbloqueo del audio tras interacción |
| T09 | [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) | Guardado local condicionado al navegador/origen |
| T10 | [Babylon.js license](https://github.com/BabylonJS/Babylon.js/blob/master/license.md) | Apache-2.0; conservar avisos en la compilación |
| G01 | [OpenAI: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Instrucciones persistentes de proyecto |
| G02 | [Anthropic: Claude Fable 5.2](https://www.anthropic.com/claude/fable) | Nombre y disponibilidad publicados; no confirma acceso de esta cuenta |
| G03 | [Claude Code: project memory](https://code.claude.com/docs/en/memory) | Convenciones CLAUDE.md e importación de instrucciones |

No se infieren garantías de rendimiento, tiempos de desarrollo ni disponibilidad de una cuenta a partir de la publicidad de motores o modelos.

## Identificación de las respuestas recuperadas por shell

SHA-256 del HTML recibido; los tamaños son bytes de esas respuestas, no tamaños del futuro juego.

| Fuente | Bytes | SHA-256 |
| --- | ---: | --- |
| C01 | 78,909 | `443252c41889c6c0ef40792245ddb5752551357b5ec501fa5a8f08c5d19385fb` |
| C02 | 155,202 | `cff7b6c3897f4ee9ba077793313b7a5f325927fb7de9fbfd0df8e1684faa9069` |
| C03 | 177,564 | `99a4335862889b80d0c4c64aeeafd0e73c8bfb55487669574b11b24848752b3d` |
| C04 | 140,294 | `73fa312ee1769233edbd3929d0e82f5b9d5b3a6a4cea16eb3944876ca9b2a17e` |
| C05 | 97,616 | `f3977ecd0c62d537e6b87e953fc324974f90e5d6c8cce14cf3cddb5a0ae891d8` |
| C06 | 98,410 | `bb81b12734d4d112c3b09c4ef56b58526bb40d649bd4cfd4fd49efa5264e3f4d` |
| N01 | 17,153 | `a3070bfb48aa5d005a9f885c45a25df5f4a57e8a37b4b39a2ce059002f04692c` |
| N02 | 11,361 | `3bae2c2d59500450a379c3c94dda4509c34da53dccc83ff4ab321012542fe5a8` |
