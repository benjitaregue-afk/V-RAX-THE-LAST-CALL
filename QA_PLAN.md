# QA PLAN

## Revisión activa — narrativa del superviviente

La implementación está autorizada y existen pruebas ejecutables. Los resultados/build/evidencias actuales están en [PROGRESS.md](PROGRESS.md); el apartado v1 de abajo es histórico.

`npm test`, `npm run typecheck`, `npm run build`, luego **una sola** ejecución `npm run test:e2e`. `VORAX_HEADED=1` ejecuta Chrome visible y añade al recorrido comprobación de eventos nativos de voz para radio y respuesta; requiere voces de sistema disponibles. No sustituye escucha humana.

| Escenario vigente | Observación requerida |
| --- | --- |
| Prólogo | Vista negra→recuperada, Awaken→StandUp, manos visibles, altura .24→1.65, WASD bloqueado; Skip recupera control |
| Controles | WASD/mouse, Shift más rápido con tiempo real medido, paredes/puerta bloquean también sprint, F, pérdida de foco y Esc |
| Historia científica | PZ-00→Opportunity/PZ-02→CHAPTER II→InSight/PZ-01→PZ-03; respuesta errónea/pista no bloquean; citas/false-color visibles |
| Persistencia | Recarga en InSight/monólogo reanuda de forma segura; saltar reflexión concede OBSERVATION, nunca COMPLETE |
| Rescate | Caminar por conector este hasta Z≥25; nave visible con posición cambiante, foco hacia jugador, radio exacta, “I'm here.”, fundido/THE END, créditos y reinicio |
| Sustitución visual | GLB local real de QA sustituye visual sin alterar spawn/estado; recurso ausente conserva greybox |

Pendientes manuales: oír mezcla/voz sin distorsión, comodidad del despertar y mouse físico, repetición fresca en Safari/Firefox/Edge/laptop mínima, tres partidas humanas para duración/aprendizaje y recorrido en URL pública sin login. Repetir imágenes/colisiones/misiones/rescate al recibir los GLB finales. No contabilizar la geometría de QA como validación de esos modelos.

## Historial v1 — planificación

V1.0 · Pruebas diseñadas. **Estado de todas las pruebas del juego: NOT RUN.** No hay build ni URL. La única verificación ejecutada ahora es documental, registrada en PLANNING_REVIEW.

## Política de evidencia

Cada resultado registra ID, fecha, responsable, commit/build, URL o servidor local, navegador/versión, SO/hardware, pasos, resultado observado y captura/log/trace. `PASS` requiere ejecución y observación. `NOT RUN`, `BLOCKED` y `FAIL` no se transforman en PASS por inspeccionar código o porque otro agente lo afirme.

Un resultado de WebKit automatizado no es una prueba en Safari real. Un navegador headless con render por software no demuestra rendimiento de una laptop. Una prueba que cambia el estado por debug no cuenta como partida completa.

## Verificación automatizada prevista

| ID | Prueba | Evidencia / aceptación |
| --- | --- | --- |
| A01 | TypeScript y build de producción | Comandos con exit 0, sin módulos faltantes; tamaños del output |
| A02 | Reducer y prerrequisitos | Camino ARRIVAL→COMPLETE; eventos adelantados rechazados; repetidos idempotentes; ayudas/errores no revierten etapas |
| A03 | Respuestas de puzzles | Probar las 27 combinaciones de PZ-01, las 27 de PZ-02 y las 27 de PZ-03 contra las soluciones de GDD; una válida por puzzle; incompletas rechazadas |
| A04 | Guardado y settings | Serialización/restauración de seis etapas; JSON corrupto, versión desconocida, escritura bloqueada; no destruye sesión actual |
| A05 | Ciencia y assets | IDs únicos, fuentes y créditos no vacíos, referencias existentes, imágenes con alt text, FICTION separado, archivos/hash/licencia coherentes |
| A06 | Proyección del mundo | D0/D1/D2 corresponden a etapa; rehidratar no deja puertas imposibles; no segunda apertura/efecto por doble evento |
| A07 | E2E de UI y progreso | Abrir inicio, terminales, responder, usar una pista, confirmar final por UI real; screenshot de COMPLETE y consola capturada |
| A08 | Carga y fallos | Imagen ausente activa texto; audio rechazado permite continuar; guardado bloqueado avisa; error de recurso esencial produce recuperación clara |

Vitest para lógica pura; Playwright para build servido. La suite puede usar guardados de prueba para casos de recuperación, pero debe distinguirlos de la partida fresca sin mutadores. Datos de prueba derivan de contratos de GDD, no se copian del resultado del validador. No se generan snapshots grandes como sustituto de revisar comportamiento.

## Pruebas manuales obligatorias

| ID | Procedimiento mínimo | Criterio observable |
| --- | --- | --- |
| M01 — Boot | Perfil limpio, cargar build, iniciar por botón; repetir con caché fría | Aparece entorno 3D, no pantalla negra ni error crítico |
| M02 — First person | Caminar W/A/S/D, diagonal, mirar con ratón; cambiar sensibilidad/invertir Y; probar flechas | Movimiento coherente, diagonal no más rápida, mirada sin girar cuerpo al abrir UI |
| M03 — Walls | Empujar cada pared, esquina y marco, de frente y diagonal; mantener W al pausar; repetir a baja tasa de cuadros | No atravesar ni quedar atrapado; reanudar no produce salto de posición |
| M04 — Doors | Intentar D1/D2 antes y después de requisitos; permanecer cerca durante apertura; recargar | Apertura correcta, sin crush, sin puerta cerrada detrás de un checkpoint avanzado |
| M05 — Interactions | Enfocar a 1 m y fuera de 2.2 m; probar a través de pared; mantener E | Solo objeto cercano visible; un evento por pulsación |
| M06 — Puzzles | Resolver cada uno, fallar al menos dos campos, resetear respuesta, pedir solución guiada | Siempre hay reintento; respuesta de GDD funciona; cada feedback explica el error |
| M07 — Softlocks | Visitar puerta equivocada, cerrar terminal a mitad, volver atrás, usar pistas, cargar cada etapa, saltar final | Todavía se puede llegar a COMPLETE; ningún objeto esencial se consume |
| M08 — Science | Abrir cada expediente y comparar con N01/N02/N08/N09/N10 | Fuente y crédito correctos; Pancam no confundida con MI; hechos y ficción distinguibles; datos locales visibles sin red externa |
| M09 — Audio | Iniciar sin gesto, luego habilitar; mover emisores; master=0; cambiar buses; reiniciar y cambiar pestaña | Nada se reproduce antes de permiso de audio; mute silencia todo; no duplicación; captions suficientes |
| M10 — UI/access | Teclado en todos los paneles, texto 150%, 1280×720, menor intensidad, FOV extremos | Sin controles recortados; foco visible; la misma historia puede completarse sin audio ni sobresaltos |
| M11 — Save | Recargar tras cada etapa, denegar almacenamiento, corromper save de prueba, New game y Recenter | Checkpoint válido o recuperación explicada; reset solo borra claves propias |
| M12 — Console/network | Mantener consola y log de red durante partida fresca | Cero excepciones críticas; cero recursos obligatorios ausentes; ningún login/API clave/dependencia remota de misión |
| M13 — Complete run | Desde perfil limpio, sin debug ni salto de etapas, hasta final | Inicio, dos acertijos científicos, clasificación, final y créditos observados |
| M14 — Production | URL publicada desde ventana privada y otro navegador/dispositivo; partida fresca | Sin registro, permiso o sesión; misma versión que candidato probado; COMPLETE en URL real |

## Navegadores y hardware

Objetivo desktop con teclado y ratón. No se promete móvil, VR, gamepad ni navegador integrado de mensajería.

| Plataforma de referencia | Cobertura requerida antes de anunciar soporte |
| --- | --- |
| Windows, Intel i5-1135G7 / Iris Xe, 8 GB o laptop integrada comparable | Chromium/Chrome actual: recorrido completo, colisión y rendimiento |
| macOS, Apple M1 8 GB o comparable | Safari real actual: recorrido completo, captura, audio y guardado |
| Firefox desktop actual en hardware disponible | Recorrido completo y controles; si no se ejecuta, no anunciar soporte verificado |
| Edge desktop | Smoke + recorrido si se incluye expresamente en compatibilidad publicada |

Registrar modelo real y diferencias de la máquina disponible; no inventar haber usado una de estas referencias. Automatización en Chromium/Firefox/WebKit complementa, no reemplaza estas observaciones. Mínimo de lanzamiento recomendado: dos recorridos completos en Chrome y Safari reales; cualquier plataforma adicional se etiqueta según pruebas efectivas.

## Rendimiento y carga

Preset bajo, viewport 1280×720, DPR 1, alimentación estable, sin throttling artificial para medir rendimiento. Calentar 30 s y registrar tres minutos que incluyan ambos terminales, regreso al hub y sombra activa. Una prueba de throttling separada verifica colisión/responsividad, no se mezcla con medición normal.

- Meta aceptable en laptop de referencia: mediana ≥45 fps y percentil 95 del intervalo de frames ≤33.3 ms. Aspiración de 60 fps; no garantía.
- Carga inicial: ≤10 s con descarga limitada a 10 Mbps y latencia 150 ms, caché fría; presupuesto comprimido inicial ≤6 MiB y total núcleo ≤12 MiB.
- Presupuestos de escena: ART_DIRECTION; registrar draw calls de pase principal y total con sombras, triángulos y texturas estimadas.
- Estabilidad: dos partidas y tres reinicios sin crecimiento sostenido atribuible a listeners/nodos/texturas; objetivo orientativo de heap JS ≤160 MiB en Chrome tras calentamiento. Medir tendencia, no solo un número instantáneo.
- Navegabilidad: no pausas observadas >200 ms durante movimiento normal tras carga; si hay, investigar y registrar antes de aceptar.

Si solo hay una máquina potente, consignar la limitación; no convertirla en prueba de “laptop típica”. Una reducción de calidad se vuelve a medir y debe conservar sombra, iluminación, 3D y texto legible.

## Duración y aprendizaje

Tres personas nuevas como mínimo, familiaridad con controles registrada; medir desde Enter archive hasta COMPLETE, sin cronómetro de menú y sin coaching verbal externo. Guardar tiempos, ayudas y puntos de confusión.

Criterio de duración: mediana 8–12 minutos; objetivo de que al menos dos de tres entren en ese intervalo y ninguna quede bloqueada a los 15 minutos sin una ayuda disponible. No se penaliza que una persona explore más tiempo. Ajustar y volver a observar si falla; no afirmar duración validada con cronómetro de autor.

Al final, pedir a cada persona que explique instrumento/medición/propósito de InSight, qué evidencia de Opportunity sostiene agua pasada y qué parte era ficción. Meta de diseño: al menos dos de tres distinguen los tres puntos sin mirar la respuesta. Es un control de comprensión pequeño, no una demostración estadística de eficacia educativa.

## Severidad y salida

Bloqueante: no arranca, atraviesa rutas críticas, no se puede acabar, ciencia/atribución esencial incorrecta, acceso con login o violación de derechos no resuelta. Alta: fallo repetible de control/guardado que pierde progreso, texto esencial ilegible, audio/settings que impiden jugar, rendimiento bajo umbral. Media/baja: defecto cosmético sin pérdida de información.

Lanzamiento recomendado con cero bloqueantes/altas, evidencia de M13/M14 y P0 cerrado. Cualquier limitación residual se declara en compatibilidad/entrega; no se etiqueta PASS por haberla documentado. La demo debe mostrar comportamiento real del build, no una animación que suplante su funcionamiento.

## Plantilla de registro futuro

`ID | NOT RUN/PASS/FAIL/BLOCKED | fecha | build/commit | URL | SO/hardware/browser | pasos | observado | evidencia | incidencia/resolución`

Los archivos de evidencia se crearán después de aprobación. En esta fase no existen logs, capturas ni resultados de ejecución del juego.

## R4 executed visual checkpoint — 2026-11-15

Executed results/evidence: CINEMATIC_OVERHAUL.md. Portal z-fighting was reproduced and compared across multiple angles; existing UV/material/topology counts were preserved by the physical repair. Authored hands passed geometry/weight/clip binary checks, deformed-floor checks, source-library reopening, real keyboard locomotion/gesture/pause/journal/reduced-intensity scenarios, and the original survivor-route/browser regression suite. User approved the first hand direction. Posed art captures and native canvas demo are explicitly separate from the accelerated normal-input gameplay route. Human comfort/contact/duration review, minimum hardware and Safari/Firefox remain NOT RUN. First mission/archive UI prototype must receive actual readability/keyboard verification and the second user visual approval before wider rollout; final white rescue ending and integrated acceptance still follow.

## Witness in Stone redesign checkpoint — 2026-11-15

The user rejected the first dashboard-like visual design. The revised PZ-02 projection is tested independently and must STOP for renewed visual approval; this does not authorize rollout to other screens. Evidence and exact execution details: CINEMATIC_OVERHAUL.md, output/playwright/overhaul/hologram/. Actual normal controls reach the physical terminal; no story/save injection or camera posing is used. Development QA compares all four rendered records to every original scientific field, explanation, citation, credit, condition and claim ID. Radio-card validation, retained choices, native keyboard arrows, H focus, modal boundaries, large text, reduced motion, opening hand and return to exploration are reviewed alongside the existing browser suite. Header/frame decoration may extend a few pixels outside its panel; scientific content regions must have no horizontal overflow. Full production suite: 16/16 PASS; unit tests: 90/90 PASS; production build/typecheck: PASS. Human visual approval, comfort and Safari/Firefox remain unverified.
