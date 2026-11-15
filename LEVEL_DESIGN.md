# LEVEL DESIGN

Current PZ-02 presentation note (2026-11-15): Witness in Stone's original physical terminal, reach, collision, coordinates and prerequisites are unchanged. Its isolated optical reader is a screen-space projection with restrained perspective; it does not create world geometry, block another route or require a new interaction location. Other terminals and the journal retain their existing presentation pending visual approval. Actual tests and screenshots: CINEMATIC_OVERHAUL.md.

Approved rollout now extends the optical reader to other existing terminals and the journal. All physical terminal locations, routes, collision and prerequisites remain unchanged; the journal map is drawn directly from RECTS and clearly labelled fictional. The earlier presentation-only checkpoint was approved.

## Extensión vigente: observation deck

Se mantienen los cinco espacios anteriores, sus objetos y colisiones. Se añade la cubierta OBSERVATION, X −6…6 / Z 22…30, con suelo Y=0 y techo Y=3.4 m. Conector desde RELAY: X 1.8…4.8 / Z 19…22. El paso es lateral para evitar el núcleo del relay existente; ruta segura desde consola: (2.7,15) → (2.7,23.4) → (0,26).

Ventanal norte en Z=29.98: 10.5 m de ancho y 2.55 de alto, centro Y=1.65. El muro norte mantiene colisión completa como barrera de vidrio, mientras su visual opaco se reemplaza por el ventanal. Exterior y nave son 3D reales de la misma escena, inaccesibles al jugador.

El objetivo OBSERVATION nace después del monólogo; checkpoint permanece en RELAY. Entrar en OBSERVATION con Z≥25 dispara RESCUE. Checkpoints RESCUE/COMPLETE quedan en (0,26). No se puede terminar visitando esta sala antes de la etapa correcta. La duración debe medirse de nuevo con personas; el cronograma v1 siguiente ya no describe el epílogo extendido.

V1.0 · Una escena 3D continua, cinco espacios, sin cargas entre salas. Dimensiones y tiempos son especificaciones por comprobar.

## Planta y medidas

Coordenadas Babylon propuestas: metros, Y arriba, suelo Y=0; norte de la planta = +Z. Altura libre 3.4 m. Paredes/proxies de 0.25 m; límites exteriores aproximados 31×28 m. Las medidas interiores siguientes no incluyen espesor de pared.

| Zona | Límites interiores X / Z | Función | Terminal / checkpoint seguro (X,Z) |
| --- | --- | --- | --- |
| AIRLOCK | X −3…3; Z −8…−2 | Llegada y PZ-00 | Interruptor (1.8,−4); spawn (0,−6) |
| HUB | X −5…5; Z 0…10 | Orientación, retorno y diario | Plano (0,3); seguro (0,4) |
| INSIGHT | X −15…−7; Z 2…10 | Exhibición y PZ-01 | Terminal (−12,7); seguro (−9,6) |
| OPPORTUNITY | X 7…15; Z 2…10 | Evidencia geológica y PZ-02 | Terminal (12,7); seguro (9,6) |
| RELAY | X −5…5; Z 13…19 | PZ-03 y final | Terminal (0,16); seguro (0,14.5) |

Conectores: AIRLOCK↔HUB, X −1.5…1.5 / Z −2…0; HUB↔INSIGHT, X −7…−5 / Z 5…8; HUB↔OPPORTUNITY, X 5…7 / Z 5…8; HUB↔RELAY, X −1.5…1.5 / Z 10…13. Aberturas transitables de al menos 1.8 m de ancho y 2.4 m de alto; el resto del conector puede conservar 3 m de ancho.

```text
                              +Z
                     ┌────────────────┐
                     │ RELAY / PZ-03  │
                     └───────┬────────┘
                             D2
   ┌────────────────┐  ┌─────┴─────┐  ┌────────────────┐
   │ INSIGHT / PZ-01├──┤    HUB    ├D1┤OPPORTUNITY/PZ-02│
   └────────────────┘  └─────┬─────┘  └────────────────┘
                             D0
                     ┌───────┴────────┐
                     │AIRLOCK / PZ-00 │
                     └────────────────┘
```

El diagrama es topológico, no está a escala. El presupuesto es de una escena, no cinco niveles. Los proxies de colisión tienen huecos reales en puertas; no se coloca un box de pared completo detrás de una abertura.

## Puertas y seguridad de recorrido

| ID | Regla | Feedback cuando falta condición |
| --- | --- | --- |
| D0 | Abre al confirmar PZ-00 | “Restore backup power.” |
| D1 | Abre con `insightRestored` | “Restore the listening record.” |
| D2 | Abre con `opportunityRestored` | “Restore both mission records.” |

Todas abren una sola vez y permanecen abiertas. Se retira el proxy bloqueante al completar apertura; si la animación falla, un watchdog abre lógicamente la puerta. Las hojas se deslizan fuera del paso, nunca empujan o aplastan al jugador. Al restaurar una partida se derivan puertas de los hitos antes de ubicar al jugador. La zona no se rellena con props después de atravesarla.

## Recorrido recomendado, de principio a fin

| Escena | Tiempo objetivo | Acción y condición de salida | Ciencia / narración / accesibilidad |
| --- | --- | --- | --- |
| S00 — Menu | Fuera del cronómetro de partida | Ajustar intensidad/audio; Enter archive | Contenido ficticio y ciencia real declarados; control de brillo |
| S01 — Arrival | 0:00–1:00 | Aprender WASD/mirada, enfocar interruptor y resolver PZ-00 | Luz mínima siempre revela suelo y consola; caption L01 |
| S02 — Orientation | 1:00–2:00 | Ver dos exhibiciones desde hub y seguir luz cian al oeste | Plano sencillo; L02; D1 indica prerrequisito si se visita antes |
| S03 — Listening Station | 2:00–4:15 | Leer expediente, inspeccionar representación y resolver PZ-01 | F07–F10; ficha de legado; guardado seguro; L03/L04 |
| S04 — Return | 4:15–5:15 | Volver al hub, observar repetición y cruzar D1 | Evento de sombra/sonido opcional; menor intensidad usa diagnóstico escrito |
| S05 — Witness in Stone | 5:15–7:45 | Comparar evidencias y resolver PZ-02 | F01–F06; fuentes estables; ficha de legado; D2 abre |
| S06 — Relay | 7:45–9:15 | Leer diagnóstico, clasificar tarjetas PZ-03 y confirmar Preserve & Export | L08 revela origen local; ayudas siempre disponibles |
| S07 — Preservation | 9:15–10:00 | Ver cierre o continuar; llegar a COMPLETE | Luz cálida gradual; L10–L12; créditos y fuentes accesibles |

El tiempo se apoya en exploración, lectura y razonamiento, no en la longitud de pasillos. No se ralentiza al jugador para alcanzar diez minutos. Si personas nuevas terminan demasiado rápido, mejorar la interpretación y la presentación de evidencias; si tardan demasiado, reducir texto y hacer pistas más claras. Repetidores o jugadores que saltan presentación pueden terminar antes de ocho minutos.

## Composición de cada espacio

**AIRLOCK:** encuadre inicial sobre el interruptor, no sobre una pared. El punto de interacción cabe dentro de 2.2 m al aproximarse. Un cartel de controles puede releerse desde pausa. Sin objetos junto al punto seguro.

**HUB:** silueta de dos exhibiciones a través de huecos o paneles de vidrio opaco parcial; ningún reflejo en tiempo real es necesario. Los rótulos `Listening Station`, `Witness in Stone` y `Relay` funcionan sin distinguir color. Un cable luminoso guía al objetivo activo, sin invadir evidencias.

**INSIGHT:** pedestal con domo estilizado de SEIS y parte de panel solar, rotulado `Illustrative display — not recovered hardware`. Terminal a una altura visual cómoda; fotografía oficial opcional en la ficha. No reconstrucción dimensional certificada.

**OPPORTUNITY:** fragmento representativo de rueda/panel y un relieve geológico sencillo, ambos ilustrativos. El dato auténtico es el producto de imagen y su contexto; una piedra procedural no se presenta como muestra traída de Marte.

**RELAY:** consola y mecanismo de pulsos ya sugerido desde hub. La iluminación final dirige la vista al registro preservado. El final se controla por botones legibles y no requiere mirar a un punto exacto.

## Reglas espaciales para implementación

- Pasos principales libres de props; ancho útil ≥1.8 m, sin escaleras ni pendientes. Objetivos entre 0.9 y 1.7 m de altura cuando sea posible.
- Cámara con near plane aproximadamente 0.05 m, sujeto a verificación para no atravesar visualmente terminales. No resolver clipping quitando colisiones.
- Luces de orientación en suelo/pared mantienen navegabilidad aun con linterna apagada. El miedo no exige oscuridad total.
- Ocultar decoración distante por grupos; no descargar colisiones o terminales necesarios. Ninguna optimización puede hacer desaparecer una pared bloqueante.
- Último punto seguro se actualiza en espacios abiertos, nunca al lado de una hoja de puerta. “Recenter” no desbloquea contenido ni repite escenas ya vistas.

## Inspección requerida en P1/P3

Caminar contra todas las paredes, esquinas y marcos; probar movimiento diagonal, baja tasa de cuadros, pérdida de foco, entradas a terminal y carga desde cada checkpoint. Capturar planta y vista del jugador a altura real. Un diagrama revisado no demuestra que la colisión implementada funcione.

## R4 art integration — 2026-11-15

At D0/D1/D2/ARCH_W, existing steel/hazard trim now stands 15mm toward the opening and the header trim 15mm below its structural face, eliminating coplanar depth competition. No room, connector, collider, interactable stand point or gameplay coordinate changed. Hands use camera-local authored poses and bounded directional guidance; their render meshes do not participate in level collision or picking. The existing camera/contact envelope remains the authority.
