# VØRAX — progreso técnico

## Revisión activa — ampliación narrativa del superviviente

2026-11-14. Se continuó el mismo checkout autorizado; no se reinició el proyecto, no se descartaron cambios y no se generó arte Blender final. La dirección activa es **despertar → Opportunity → InSight → baliza → monólogo → caminar a observación → rescate 3D → THE END**. El historial anterior se conserva debajo y sus resultados no deben confundirse con esta revisión.

### Funcionalidad actual

- Prólogo con pantalla negra, recuperación gradual de vista, alarma/respiración/ringing sintéticos y filtro de audio. Cámara tendida que se levanta; manos provisionales Awaken/StandUp. Movimiento bloqueado durante secuencias, con Continue/Skip accesibles.
- Capítulo I identifica el abandono con Opportunity. La misión restaura potencia auxiliar y recupera el manifiesto ficticio. Capítulo II devuelve luz brevemente, produce impacto metálico/apagón y revela por qué el superviviente fue omitido. InSight restaura la ruta de escucha/baliza.
- Preguntas, respuestas, imágenes, identificadores científicos y citas NASA conservados. Solo cambiaron prerrequisitos para el orden Opportunity→InSight; la emergencia y el rescate están rotulados como ficción.
- PZ-03 mantiene la clasificación de procedencia. La baliza inicia contacto y el monólogo solicitado; terminar o saltar el monólogo solo habilita **REACH THE OBSERVATION DECK.** No concede COMPLETE.
- Nueva cubierta conectada físicamente por el este del Relay. Ventanal con barrera de colisión, espacio/estrellas, nave 3D que se aproxima y SpotLight real apuntando al jugador. Transmisión exacta de Rescue One, “I'm here.”, fundido, THE END, RESTART y CREDITS.
- Sprint Shift a 3.2 m/s frente a 1.8 m/s caminando, mismo paso fijo y colisión. Linterna F conservada. Gestos distintos de manos para E/terminal/switch/puerta; la acción dispone de reintento E y no depende de un callback del modelo.
- Voz provisional Web Speech cuando el navegador dispone de ella; captions y audio de radio sintetizado de respaldo. Pausa/foco detienen las secuencias. La llamada a observación espera a recuperar control, evitando voz mientras se solicita recapturar el ratón.
- Guardado `.2` conserva awakening/capítulos y reanuda secuencias interrumpidas. Un save `.1` incompatible se rechaza con explicación. Geometría, interacción y colisión continúan separadas del manifiesto GLB.

### Verificación de esta revisión

- Auditoría inicial: **73/73 unit tests PASS** y typecheck PASS antes de modificar.
- Suite ampliada: **85/85 unit tests PASS**, ocho archivos; incluye transiciones/guardas, rehidratación, ciencia/assets y manos ejecutadas con Babylon NullEngine. TypeScript y build de producción pasaron.
- Se ejecutaron recorridos reales de teclado/UI en Chrome sin saltos de estado ni teletransporte de pruebas. La primera suite ampliada pasó 12/12. Una repetición posterior detectó una medición frágil de sprint: comparaba distancias con latencias diferentes; ahora usa tiempos reales del navegador, exige desplazamiento, Shift activo y velocidad >1.3×. El recheck de controles pasó.
- `VORAX_HEADED=1 npm run test:e2e -- --output=output/playwright/final-narrative-headed`: **12/12 PASS**, 3.0 min, Chrome 157 visible sobre producción local 4173, un worker. Recorrido físico y todos los puzzles, error/pista, recargas, monólogo completo por UI, objetivo/caminata obligatorios, nave en movimiento/foco, radio/respuesta, THE END, créditos/reinicio, sprint/muros, mouse nativo, despertar, settings/audio/fallos y GLB de QA. Log: `output/playwright/final-narrative-headed.log`.
- Cero `pageerror`/`console.error` en recorrido sano y controles. Los casos de archivos/storage/pointer rechazados son fallos inyectados separados.
- Voz: smoke headed del prólogo con 180 voces del sistema, estado speaking sin error. El recorrido headed también exige aumento del contador real `SpeechSynthesisUtterance.onstart` en la transmisión exacta de Rescue One y “I'm here.” No equivale a escucha humana ni disponibilidad de voces en otros equipos.
- Perfil headed Apple M4/ANGLE Metal, 1280×720/baja, vestíbulo estacionario: 1,793 frames / 30,006.8 ms, mediana 16.7 ms / P95 17.7 ms, 13,078 triángulos activos / 300 meshes. Es un smoke de 30 s, no aceptación de laptop mínima. `output/playwright/render-profile.json` corresponde al build `d4cf53430729b84a51386ca6f402b7c8c770dc1270a428e36e58510754b02a21`, previo al ajuste final de fondo de THE END.
- Se inspeccionaron visualmente capturas del despertar, evidencia Opportunity, transición, rescate y THE END. Las manos de apoyo se subieron para aparecer en cámara y se mejoró legibilidad del casco/foco. Contacto anatómico/floor-contact y acabado siguen pendientes del rig final de Claude.
- Ajuste final: mantener fondo negro en THE END/créditos después del fundido. TypeScript/build PASS; **2/2 PASS**, 1.8 min, en revalidación headed del recorrido completo y controles sobre ese build final. Se comprobó fondo negro por CSS y captura, radio/respuesta nativas, créditos/reinicio y cero errores de consola en ruta sana. Log: `output/playwright/final-ending-check.log`. Son dos escenarios repetidos de los doce, no catorce escenarios diferentes. Build final `dist/index.html` SHA-256: `77212aeee330305deced07fde81ce955234d41136d33b68200acc80ffc30747d`. Logs de unit/build: `output/playwright/final-narrative-unit.log` y `final-narrative-build.log`.

### Límites y siguiente entrega

Pendientes: final GLB/rig/materiales/VFX/interpretación vocal de Claude, escucha y comodidad humanas, partidas de personas nuevas para medir 8–12 min, laptop mínima y Safari/Firefox/Edge reales. No hay URL pública nueva, publicación ni envío. La prueba Chrome no acredita esas coberturas.

Claude: seguir [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md). Primero manos/awakening, shell dañado sin obstruir rutas, terminales, cubierta/ventanal, RescueOne y VFX/mezcla. Registrar licencias/créditos/hashes y activar solo exports existentes en `public/visual-assets.json`; repetir typecheck/build/tests y recorrido después de sustituir arte. `ART_DIRECTION.md`, NASA originales y script Blender preservados.

Sin bloqueo funcional conocido tras estas pruebas. Se cerraron los servidores y el navegador de QA propios al terminar. Para continuar: `npm run dev -- --host 127.0.0.1`. No interpretar la falta de errores en Chrome como validación de los pendientes anteriores.

## Historial — primera continuación técnica

Actualizado: 2026-11-14 (America/La_Paz). Continuación autorizada por el usuario sobre la misma carpeta. **Fundamento greybox jugable; arte final reservado a Claude.** No se ha publicado ni enviado al concurso.

## Auditoría de partida

- Se conservaron los 53 archivos preexistentes en una comparación de hashes realizada durante la sesión; no se eliminó ninguno. Todo estaba sin commit en Git, sin un HEAD histórico con el que comparar. No se hizo reset, limpieza ni nueva copia del proyecto.
- Baseline ejecutado: **69 tests: 67 PASS y 2 FAIL**. Los fallos exigían 14 GLB registrados pero ausentes. TypeScript pasó; build falló porque `src/main.ts` no existía.
- Claude había completado contratos, datos/citas/imágenes NASA, narrativa, definiciones de puzzles, reducer/proyección, layout y guardado unitariamente probado. Faltaban motor/control/render/UI/audio y la integración jugable.
- Solo existía `assets/blender/scripts/build_kit.py` (811 líneas, sintaxis Python válida). No había `.blend`, `.glb` ni `export_kit.py`. No se ejecutó el script: purga escena y sobrescribe salidas.
- Los hashes de los dos originales NASA y los dos archivos servidos coincidieron. Se conservaron íntegros ciencia, narrativa, fuentes, imágenes y script Blender.

Respecto al plan original, no podía darse P1 por aceptado (faltaba el arranque 3D); P2 tenía contenido/validadores pero no una interacción ejecutable; P3 tenía reducer/narrativa pero no un recorrido o final observado. No había exports Blender que acreditaran producción visual final.

## Estado por prioridad de esta continuación

| Prioridad solicitada | Estado observado |
| --- | --- |
| P0 — preservar/auditar | Completado técnicamente; requisitos humanos de concurso abiertos |
| P1 — motor/control/colisión/interacción | Implementado y probado en Chrome |
| P2 — progresión/ciencia/historia/final | Recorrido completo observado por UI y movimiento reales |
| P3 — menú/audio/save/errores/build | Implementado; pruebas funcionales y de degradación aprobadas |
| P4 — QA/rendimiento/integración | Chrome y GLB de QA verificados; falta matriz de hardware/navegadores y duración humana |
| P5 — handoff | PROGRESS y CLAUDE_HANDOFF creados; arte final reservado |

## Implementado en esta continuación

- Engine Babylon WebGL2, escena única con las nueve regiones del layout: cinco espacios más conectores; posición y escala originales.
- Cámara FPS, WASD a 1.8 m/s, diagonal normalizada, ratón con pointer lock, flechas auxiliares, F linterna, E raycast con alcance/oclusores, J diario y Esc pausa. Input se limpia al perder foco o abrir UI.
- Colisiones de elipsoide a altura fija, muros/marcos/props y puertas; checkpoints seguros. Puertas se derivan del progreso y no dependen de animación.
- Los cuatro puzzles existentes, feedback, pistas, registros citados, fichas de legado, diagnóstico ficticio, presentación y final COMPLETE. Recorrido sin teletransportes de pruebas o intervención de desarrollador.
- Menú, pausa, controles, todos los settings existentes, journal/mapa/log, fuentes, créditos, divulgación precisa y alternativas textuales para imágenes ausentes.
- Guardado local versionado, continuar/reiniciar/recentrar; rechazo explícito de versiones de contenido incompatibles y degradación en memoria cuando el almacenamiento falla.
- Audio original sintetizado, buses de volumen, pasos/pulsos espaciales, silencio al pausar/mute y fin del pulso al preservar. No se presenta como grabación de NASA.
- Loading, comprobación WebGL2, recuperación de pérdida de contexto/error y degradación de assets opcionales.
- Geometría y luz **temporales** con rótulo permanente. Layout, colisiones y targets independientes de visuales. `public/visual-assets.json` permite GLB por slot o shell completo; manifiesto vacío evita solicitar modelos inexistentes.

## Cambios mínimos en archivos anteriores

1. `src/content/assets.ts`: `ASSETS` admite únicamente imágenes realmente presentes; `MODEL_ASSETS` conserva las propuestas de Claude pendientes de exportar. No se cambiaron los hechos científicos ni hashes.
2. `src/save/save.ts` y `tests/unit/save.test.ts`: validación/regresión de `contentVersion` incompatible.
3. `.gitignore`: ignorar evidencia local de QA, no assets de producción.
4. `vite.config.ts`: excluir traces/HTML de QA del watcher para evitar recargas involuntarias del juego dev.
5. `AI_USE_DISCLOSURE.md`: apéndice cronológico de esta continuación, sin borrar el registro anterior.

Todos los demás archivos anteriores, incluidos ART_DIRECTION.md y los documentos de planificación, se conservaron. Las instrucciones antiguas de “planning only” fueron superadas por la autorización explícita de esta conversación; los documentos se mantienen como historial, no como descripción del estado actual.

## Verificación ejecutada

- `npm test`: **73/73 PASS**, siete archivos; incluye integridad de ciencia/assets, combinaciones de puzzles, reducer, proyección, layout, guardado y rutas admitidas del manifiesto visual.
- `npm run typecheck`: PASS.
- `npm run build`: PASS. `dist/index.html` SHA-256: `c3cd87890b2e39fd91b2730cdcb46fdaf46f986680880e9bb98417837cc035d0`. Aproximadamente 8.63 MB sin comprimir / 2.28 MB como suma gzip de archivos; no equivale a una medición de transferencia por red.
- `npm run test:e2e -- --output=output/playwright/final-suite`: **9/9 PASS**, un worker, 1.7 min, Chrome real sobre el build servido en 4173. Recorrido físico completo, colisiones, alcance, pistas, imagen/atribución, pausa/linterna/diario, recarga intermedia, final interrumpido y Skip, settings, fallos inyectados de captura/storage/imagen, Web Audio real y GLB de prueba interceptado.
- Recorrido limpio y controles: cero `console.error`/`pageerror` capturados. Las pruebas que inyectan archivos ausentes se evalúan aparte del recorrido sano.
- Se arrancó Vite dev en 5173 y preview de producción en 4173. Se observó el juego con Playwright headed y se inspeccionaron las capturas de entorno, evidencia y final. Se corrigieron rótulos espejados y warnings de propiedades de instancias.
- Primera ejecución de suites paralelas sufrió un fallo de archivo de trazas por limpiar el mismo directorio; no se contó como PASS. La ejecución serial de nueve pruebas indicada arriba resolvió esa interferencia sin alterar las aserciones del juego.
- `VORAX_HEADED=1 npm run test:e2e -- tests/e2e/input-profile.spec.ts --output=output/playwright/input-profile`: **2/2 PASS**, 39.5 s, mismo build. Confirmó pointer lock nativo, cambio de yaw por movimiento real del ratón automatizado y liberación/pausa con Esc. El segundo caso recogió 30 s de frames reales sin afirmar aceptación en laptop mínima. Total de pruebas de navegador ejecutadas: **11 PASS en dos invocaciones**, no una sola corrida combinada.
- Perfil headed: Apple M4 / 16 GiB, macOS 26.5.2, Chrome 157, ANGLE Metal, viewport 1280×720, calidad baja, vestíbulo estacionario. 1,801 frames en 30,003.6 ms; mediana 16.7 ms y P95 17.7 ms (aproximadamente 60 fps). No reemplaza recorrido representativo de tres minutos ni baseline Windows. Registro: `output/playwright/render-profile.json`.

Evidencias locales: `output/playwright/e2e-airlock.png`, `e2e-opportunity-evidence.png`, `e2e-complete.png`; resultados/trazas según directorio indicado. Son archivos locales de QA, no assets servidos.

## Límites, pendientes y bloqueos reales

- Arte, GLB Blender, materiales, composición cinematográfica y mezcla final pendientes de Claude; no confundir este greybox completo con un acabado final.
- No se validaron laptop mínima Windows, Firefox, Edge ni Safari real; Chrome/WebGL2 de esta máquina no demuestra esa cobertura. Tampoco se hizo el protocolo de tres personas para duración/comprensión de 8–12 min. El recorrido automatizado rápido no mide duración humana.
- No se realizó escucha humana/calibración acústica ni simulación real de desconexión GPU. Sí se observaron estado del AudioContext, suspensión y ganancias de mute.
- La integración GLB se probó con una geometría mínima de QA interceptada por el navegador. Los GLB finales reales y su rendimiento/colisión visual deben revisarse al recibirlos.
- Build emite una advertencia no bloqueante de import dinámico de `sceneLoader` ya incluido en el grafo de Babylon. Node también emite un aviso experimental de localStorage al importar Babylon en tests; no corresponde a un error de consola del juego.
- C01/Submission/Judging se releyeron en esta sesión. Recursos NASA siguen incluyendo NSSDCA, MER e InSight; reglas de demo/inglés/acceso/IA se conservan. Evento/equipo/plazo aplicable, interpretación de ideación/branding IA, licencias finales y envío siguen siendo tareas del Team Owner.
- No hay URL de producción pública verificada. El objetivo actual es readiness local; publicación y envío no se ejecutaron.
- F15/F16 están en el registro científico de código heredado y sus fuentes, mientras el documento histórico de validación enumera F01–F14. No se borraron ni renumeraron.

## Próximos pasos exactos

Claude: leer CLAUDE_HANDOFF.md; producir/exportar assets de forma no destructiva; registrar derechos/hash, activar slots del manifiesto; reemplazar solo visuales; repetir tests y recorrido. Después medir duración con personas, compatibilidad/hardware y rendimiento representativo; cerrar P0 administrativo y desplegar cuando corresponda.

## Comprobación manual pendiente para la entrega final

1. Ejecutar dev, abrir Chrome normal, seleccionar Mouse capture y Enter archive; mover ratón físicamente, recorrer esquinas con WASD, pulsar Esc y volver a capturar. La automatización headed sí pasó el mecanismo; falta evaluar comodidad humana.
2. Con auriculares/altavoces, comprobar niveles, paneo, mute y captions; detener si un efecto resulta molesto y ajustar la mezcla provisional.
3. Repetir partida fresca en Safari real y laptop integrada; medir la ruta representativa, no extrapolar del Mac M4.
4. Obtener tres partidas de personas nuevas y medir duración/aprendizaje; no interpretar la prueba automatizada de un minuto como duración de la experiencia.
5. Tras integrar arte, ejecutar nuevamente typecheck/build y E2E, inspeccionar screenshots, validar créditos/hashes y completar una partida en la URL pública sin login.

## Corrección final del flujo de desarrollo

El log de Vite mostró recargas causadas por HTML copiado dentro de las trazas de QA. Se excluyeron `output`, `test-results`, `.playwright-cli` y `playwright-report` del watcher. Después pasaron typecheck/build y un smoke en Chrome que arrancó dev, escribió un HTML de QA y comprobó cero navegaciones/recargas. No cambia el runtime de producción; el SHA-256 de dist/index.html continúa siendo el registrado arriba.

Los servidores y la sesión de navegador abiertos para QA se cerraron al finalizar. Para jugar o continuar el trabajo hay que ejecutar el comando de arranque del handoff.
