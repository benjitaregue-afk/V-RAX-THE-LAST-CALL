# GAME DESIGN DOCUMENT

## Revisión vigente: arco de supervivencia

Orden ejecutable: despertar → PZ-00 → Opportunity/PZ-02 → transición Chapter II → InSight/PZ-01 → procedencia/PZ-03 → baliza → monólogo → caminata al observation deck → rescate → THE END. Los IDs, preguntas, soluciones, evidencias y créditos se conservan; se modificaron únicamente sus prerrequisitos y el marco ficticio de recuperación de sistemas.

WASD mantiene 1.8 m/s; Shift corre a 3.2 m/s mediante los mismos pasos y solver de colisión. F conserva la linterna. E inicia una animación de mano provisional antes de abrir el terminal; pulsar E de nuevo puede completar el gesto sin esperar un callback. El gesto no determina si una respuesta es correcta.

El prólogo bloquea locomoción durante recuperación, muestra manos y cambia altura de cámara. Las secuencias tienen avance automático, Continue y Skip sequence. Saltar el monólogo no completa el juego: habilita el objetivo de observación; solo entrar físicamente en la cubierta durante OBSERVATION permite RESCUE. Reiniciar borra progreso propio y vuelve al despertar, conservando settings. El final ya no ofrece exploración libre.

Fuente activa: reducer/projection, story.ts y main.ts. A continuación se conserva el diseño v1 de las preguntas y controles; sus referencias al orden y final anterior quedan sustituidas por esta revisión.

V1.0 · Diseño propuesto, sin implementación. Autoridad de reglas: este documento; IDs científicos en [NASA_DATA_VALIDATION.md](NASA_DATA_VALIDATION.md).

## Experiencia y bucle

Explorar un archivo 3D en primera persona, identificar un objeto iluminado, abrir su expediente, interpretar evidencia real, resolver una restauración y ver cómo cambia el archivo. El cambio espacial recompensa el aprendizaje y hace avanzar el misterio. El jugador vuelve al hub dos veces y termina preservando los registros.

Duración objetivo: 8–12 minutos de primera partida; recorrido recomendado de 10 minutos en LEVEL_DESIGN. No hay límite de tiempo, enemigos, salud, muerte ni consumo de recursos. El fallo produce información, no pérdida de progreso. El objetivo inicial es “Trace the repeating signal”; el objetivo final es “Preserve the records”.

## Controles y modos

| Entrada predeterminada | Efecto |
| --- | --- |
| WASD | Movimiento relativo a la orientación horizontal; diagonales normalizadas |
| Ratón | Yaw/pitch con pointer lock; pitch limitado a ±85° |
| Flechas | Alternativa de giro de cámara con teclado, sin mover al jugador |
| E | Interactuar con el objeto enfocado a un máximo de 2.2 m y sin pared intermedia |
| F | Encender/apagar linterna; sin batería consumible |
| J | Diario y expedientes ya desbloqueados |
| Esc | Pausa; desde terminal/diario cierra la vista y deja el juego pausado |
| Tab, Shift+Tab, flechas, Enter | Navegar controles HTML y confirmar en menús/terminales |
| H en terminal o botón Hint | Mostrar el siguiente nivel de ayuda |

Velocidad: 1.8 m/s. Sin sprint, salto, agachado ni balanceo de cabeza. Altura de ojos: 1.65 m. FOV inicial 75°, regulable 60–90°. Los valores son metas para P1, ajustables tras observar comodidad y colisiones.

Inicio con botón explícito “Enter archive”: activa audio y pide captura del ratón. Un fallo de captura ofrece reintento y giro con teclado. Abrir un terminal suelta el ratón y congela el movimiento. Cerrar ofrece “Return to archive”; solo se vuelve a mover tras captura válida o selección explícita del modo teclado. Al perder foco se limpian las teclas activas y se pausa.

## Interacciones e inventario

Retícula pequeña; al apuntar a un objeto válido aparece `E — Inspect [name]`. El terminal es un objeto 3D con luz y colisión; su expediente legible aparece en una interfaz HTML al activarlo. El mundo y los desplazamientos permanecen en 3D.

No hay inventario transportable. El diario conserva expedientes, objetivo y pistas; no existen llaves que puedan caer o desaparecer. Los estados “restored” son permanentes en la sesión. Reexaminar un objeto nunca consume una evidencia.

## PZ-00 — Backup Power, tutorial

Ubicación AIRLOCK. Un interruptor tiene dos opciones claramente rotuladas: `OFF` y `ON`. Estado inicial OFF. E abre el control; elegir ON y confirmar restaura luz base y abre el acceso al hub. Es un interruptor del archivo ficticio, sin pretensión de simular una nave real.

- Éxito: `backupOn = true`; objetivo pasa al expediente InSight.
- OFF: “Backup circuit is still off.” Se puede volver a elegir; no penalización.
- Ayuda: “Set BACKUP POWER to ON, then confirm.”
- Recuperación: el interruptor sigue accesible desde el spawn y la puerta no puede cerrarse de nuevo.

## PZ-01 — Restore the Listening Chain

Ubicación INSIGHT. El expediente N02 está siempre disponible junto al acertijo; la consola informa `EDUCATIONAL MODEL — archive indexing, not spacecraft operation`. Se restaura una relación de catálogo, no se reparan instrumentos en Marte.

| Campo | Opciones visibles | Respuesta |
| --- | --- | --- |
| Instrument | SEIS / Mössbauer Spectrometer / Solar array | **SEIS** |
| What does it record? | Ground motion / Iron-bearing mineral composition / Electrical energy | **Ground motion** |
| Scientific purpose | Study Mars' interior / Study rock mineralogy / Supply spacecraft power | **Study Mars' interior** |

Los campos arrancan sin selección; no se confirma una respuesta incompleta. Las 27 combinaciones completas son válidas como entradas y solo la triple indicada resuelve el acertijo. La explicación usa F07/F08; el contexto de energía y cierre está en F09/F10. La selección correcta se deriva del expediente local revisado y sus `claimIds`.

Respuesta al error por campo: “SEIS is the seismometer listed in this record”; “A seismometer records ground motion”; “Follow the record's interior-structure objective”. Se conserva lo elegido, sin bloqueo ni espera. Al éxito: revelar ficha de legado, `insightRestored = true`, guardar checkpoint y abrir D1 hacia Opportunity.

Ayudas:

1. “Read the instrument and science-goal fields in the NASA catalog.”
2. “The sensor is SEIS. Follow what a seismometer measures.”
3. “Choose SEIS → Ground motion → Study Mars' interior.” Se permite rellenar la propuesta, pero el jugador aún confirma.

Objetivo de aprendizaje: relacionar hardware, medición y pregunta científica. No se pide reconocer quakes de oído. Sonificaciones y gráficos son opcionales; nunca determinan una respuesta oculta.

## PZ-02 — Witness in Stone

Ubicación OPPORTUNITY, tras PZ-01. Hay dos evidencias consultables: producto PIA05584 con su instrumento/crédito y ficha de funciones MER N08, acompañada de la síntesis F05. La imagen se muestra sin efectos y lleva la etiqueta `False-color composite`. **Es Pancam, no Microscopic Imager.**

| Campo | Opciones visibles | Respuesta |
| --- | --- | --- |
| Camera for this image | Pancam / SEIS / APXS | **Pancam** |
| Instrument for iron-bearing minerals | Mössbauer Spectrometer / Pancam / SEIS | **Mössbauer Spectrometer** |
| Supported conclusion from the combined evidence | Past water affected these deposits / Living organisms were confirmed / Liquid water is flowing here today | **Past water affected these deposits** |

27 combinaciones completas; una correcta. Imagen y espectrometría aportan evidencias diferentes: no se deduce hematita del color de los píxeles. El panel explica que la conclusión usa contexto geológico, sin presentar un espectro inventado ni afirmar que la fotografía prueba vida.

- Error de cámara: “Check this product's instrument label.”
- Error de composición: “A camera shows appearance; MB investigates iron-bearing minerals.”
- Error de conclusión: “Evidence of past water does not establish life or present flowing water.”
- Éxito: `opportunityRestored = true`, ficha de legado, checkpoint y apertura D2 hacia RELAY.
- Ayudas: consultar etiquetas → separar imagen y mineralogía → mostrar la triple respuesta.

Si el archivo de imagen falla, aparece una descripción textual revisada, el ID del producto y el campo de instrumento de la fuente. La misma respuesta sigue siendo deducible; la UI informa que la imagen no pudo cargarse. El fallback no inventa una fotografía ni aprueba la prueba de carga del asset.

## PZ-03 — Check the Provenance, desenlace

Ubicación RELAY, tras PZ-02. Tres tarjetas se clasifican con tres categorías repetibles: `NASA ARCHIVAL FACT`, `FICTIONAL ARCHIVE SYSTEM`, `UNSUPPORTED CLAIM`. No se fuerza una permutación de categorías; cada tarjeta se evalúa individualmente.

| Tarjeta | Clasificación correcta | Motivo visible tras responder |
| --- | --- | --- |
| “SEIS recorded ground motion to study Mars' interior.” | NASA ARCHIVAL FACT | F08, fuente real consultable |
| “This station is replaying its own queued archive request.” | FICTIONAL ARCHIVE SYSTEM | Diagnóstico de esta historia, no documento de NASA |
| “The transmission proves someone is alive on Mars.” | UNSUPPORTED CLAIM | No hay evidencia que sostenga esa deducción |

Hay 27 combinaciones completas; una correcta. El error señala la tarjeta que requiere revisar evidencia y permite reintento. Las ayudas explican las categorías y finalmente muestran la solución. Éxito: `provenanceChecked = true`; se habilita `Preserve & Export`. Se conserva siempre la distinción entre evidencia y texto inventado.

## Final y condiciones de completado

Solo tras PZ-00, PZ-01, PZ-02 y PZ-03 puede confirmarse Preserve & Export. La secuencia final cambia lentamente la iluminación, muestra el diagnóstico local y las fichas de legado, y ofrece “Continue” y “Skip presentation”. Ambos llegan a `COMPLETE`; ningún evento de animación es indispensable para avanzar.

Pantalla final con `Records preserved`, fuentes, créditos, explicación de ficción, divulgación de IA y opción de volver a explorar o reiniciar. “Export” significa preservación dentro de la ficción; no hace falta un servidor, enviar datos ni descargar un archivo. Un archivo opcional de referencias sería P5.

## Suspense y aprendizaje

Tres eventos únicos: sonido mecánico que parece una pisada; sombra de una pieza de la instalación; repetición de un mensaje del sistema. Se activan al alcanzar hitos, nunca durante lectura de evidencia. El regreso al hub ofrece un contexto nuevo, sin cambiar paredes o rutas transitables. El peligro percibido se resuelve como comportamiento del archivo.

No hay medidor de cordura. Los recursos NASA no se corrompen visualmente ni mienten. El sonido ficticio lleva caption de sistema; el lector puede revisar siempre hechos estables.

## Accesibilidad y asistencia

- Inglés completo; español solo después de estabilizar el núcleo. Ningún puzzle depende del idioma del sistema operativo.
- Subtítulos y captions para todos los mensajes y sonidos narrativamente necesarios; finalizar con audio silenciado debe ser posible.
- Opciones visibles antes de comenzar: menor intensidad, FOV, sensibilidad, invertir Y, volumen maestro/ambiente/efectos, texto 100/125/150%, calidad y brillo.
- Sin flashes rápidos; cambios de luz suaves. Menor intensidad elimina sombra sorpresiva, sonido de “pasos” y variación de pantalla, conservando pistas textuales.
- Pistas disponibles inmediatamente; tras 45 segundos activos en un terminal se sugiere el botón de ayuda. No se avanza el contador con el juego pausado. No hay logro por evitar ayudas.
- Controles HTML con foco visible y orden estable. El texto no depende solo del color. El diario permite releer y contiene soluciones guiadas solicitables.
- Recentrar desde pausa devuelve al último punto seguro sin borrar acertijos. El guardado fallido avisa con una línea discreta y mantiene la sesión jugable.

## Cambios de alcance

Las respuestas, IDs, prerrequisitos y eventos anteriores son contratos compartidos con LEVEL_DESIGN, ARCHITECTURE y QA_PLAN. Cualquier recorte que cambie un acertijo o su condición de salida exige actualizar los cuatro y repetir la prueba completa. No se cambia la respuesta para acomodar un asset incorrecto.

## R4 visual embodiment — 2026-11-15

The first authored industrial glove model and animation direction were approved by the user. The viewmodel is visual only: ten authored clips with .18 s transitions, restrained locomotion, bounded target guidance and wall retraction. Text panels and non-awakening dialogue hide the hands. The prologue uses the measured floor-support camera with zero roll and synchronized hand/standing time. E can still finish an interaction immediately; no skinning or animation callback changes story progression. Puzzles, prerequisites, reach, save format and scientific sources are unchanged. Current production/QA status: CINEMATIC_OVERHAUL.md.

## Witness in Stone optical prototype — pending visual approval

PZ-02 alone uses Archive log/Reconstruction modes, four original evidence records and native radio-card groups. Question labels, option IDs, answers and validation are unchanged. Tab/Shift+Tab, native arrow/Space selection, Enter confirmation, H hint and Esc pause remain available. E performs the existing contextual hand gesture before opening; scientific panels hide the hands. Perspective and decorative projection motion turn off with reduced intensity or OS reduced-motion; large text stacks the same evidence. This is a visual-review prototype, not approval to redesign other terminals, HUD or journal. Executed evidence: CINEMATIC_OVERHAUL.md.
