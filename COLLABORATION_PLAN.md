# COLLABORATION PLAN — Claude Fable 5.2 + Codex

V1.0 · Flujo propuesto para después de aprobación. No se han lanzado agentes Claude, subagentes ni trabajo paralelo de implementación en esta fase.

## Herramientas y funciones

[Anthropic documenta Claude Fable 5.2](https://www.anthropic.com/claude/fable); el acceso de esta cuenta no se ha probado. Se conserva el modelo solicitado, sin atribuirle trabajo que no hizo. Codex es el agente que produjo este paquete. Ningún modelo tiene autoridad para certificar ciencia, licencias o resultados sin evidencia.

Los diez roles del prompt se usan como responsabilidades de revisión, no como una afirmación de tener empleados de NASA o un equipo AAA contratado. Una misma persona puede cubrir varios roles, pero quien revisa un hecho debe consultar su fuente y registrar el resultado.

| Subsistema / decisión | Dueño de escritura | Revisor |
| --- | --- | --- |
| Dirección, alcance, fechas, aprobación, envío | Team Owner humano | Integrador + responsable ciencia/QA |
| Motor, movimiento, colisión, raycast, render | Codex | Claude revisa contrato; humano prueba controles |
| Reducer, puzzles, guardado, UI funcional, audio runtime | Codex | Claude revisa claridad; QA observa ejecución |
| Contenido científico, guion, pistas, captions, localización | Claude Fable 5.2 | Humano valida ciencia; Codex valida schema y compatibilidad |
| Arte técnico, geometría, iluminación y rendimiento | Codex | Claude propone ajustes por escrito; humano revisa imágenes/movimiento |
| Selección de assets y fichas de licencia | Claude Fable 5.2 | Humano revisa derechos; Codex integra archivos aceptados |
| Build, dependencias, tests automatizados, integración | Codex | QA humano reproduce checks relevantes |
| Recorridos, duración, comprensión y URL pública | QA humano | Codex conserva evidencias y corrige; segundo humano revisa alcance de resultados |

Las rutas concretas están en ARCHITECTURE. `package.json`, lockfile, configuración, reducer y contratos tienen siempre un único dueño: Codex como integrador. Una revisión de Claude produce comentarios o un parche separado acordado; no modifica el mismo archivo mientras su dueño trabaja.

## Convenciones de repositorio

AGENTS.md contiene reglas compartidas. CLAUDE.md importa ese archivo con `@AGENTS.md` y añade límites propios de contenido. Esta estrategia sigue las [guías de Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md) y [Claude Code](https://code.claude.com/docs/en/memory), evitando duplicar instrucciones divergentes.

Usar la copia actual para trabajo secuencial. Si después se autoriza trabajo concurrente, asignar tareas y archivos distintos y usar worktrees aislados creados con la herramienta disponible, con ramas `codex/...` salvo instrucción diferente. No crear otro chat o nuevos worktrees solo por costumbre. Worktrees evitan interferencia de checkout, pero no resuelven conflictos conceptuales en un mismo contrato.

No se debe lanzar trabajo paralelo de implementación porque este documento describa su posibilidad. La aprobación del usuario y una asignación concreta deben precederlo; este plan no inicia automáticamente agentes.

## Secuencia de colaboración

1. Team Owner aprueba alcance y resuelve pendientes P0. Registrar decisiones; no cambiar respuestas científicas por conveniencia.
2. Codex define contratos de datos y una fixture pequeña; Claude revisa formato sin tocar esos archivos. Congelar v1 del contrato.
3. Claude produce fichas narrativas/científicas en sus archivos; adjunta fuente por Fxx, cambios y derechos. Codex implementa escena/control en rutas propias.
4. Claude entrega un paquete cerrado; Codex valida schema, integra una vez y ejecuta los checks. No integrar contenido a medias desde archivos en edición.
5. Humano reproduce la interacción; los hallazgos se asignan a su dueño. Correcciones en archivos compartidos se hacen secuencialmente.
6. Tras P3, congelar features y depender de resultados QA, no del entusiasmo de los agentes. Un agente que no puede ejecutar una prueba la marca NOT RUN.

## Contrato de tarea y traspaso

Toda tarea identifica: objetivo observable, archivos que se pueden editar, archivos reservados, fuentes, dependencia de contrato, aceptación y límites de tiempo. Un cambio fuera de propiedad se propone al integrador antes de tocarlo.

Cada traspaso entrega:

- Lista de archivos y cambios, con IDs de contenido afectados.
- Fuente de cada afirmación nueva y estado de licencia de cada archivo añadido.
- Comandos realmente ejecutados, resultados y evidencia; lista explícita de NOT RUN.
- Cómo verificar manualmente y qué queda incierto.
- Cambios de contrato o alcance necesarios, sin introducirlos de forma silenciosa.

Ante conflicto: detener edición del archivo afectado, leer ambas intenciones y resolver una versión con el dueño. No sobrescribir trabajo humano ni utilizar reset destructivo para limpiar cambios. El resto de tareas independientes puede continuar.

## Verificación obligatoria por cambio

| Cambio | Verificación mínima |
| --- | --- |
| Movimiento/colisiones/input | Build y recorrido headful en paredes/puertas; foco/pausa; unitarias pertinentes |
| Progreso/puzzle/save | Tests de etapas/respuestas/rehidratación; completar trayecto afectado; partida fresca si cambia el camino |
| Ciencia/diálogo | Comparar fuentes, revisar inglés y etiquetas; abrir el expediente real en juego |
| Asset/luz/audio | Derechos/hash; inspección visual o escucha en navegador; comprobar presupuesto y settings |
| Build/hosting | Mismo candidato probado localmente; URL anónima; partida y consola en producción |

En esta fase no hay comandos npm ejecutables porque no existe aplicación. No generar resultados de pruebas a partir del plan. Los comandos propuestos figuran en ARCHITECTURE y se concretarán en P1.

## Habilidades útiles que se propone crear

No se han instalado ni creado estas skills; son especificaciones para una fase posterior, con alcance estrecho.

| Skill propuesta | Entradas y resultado | Verificación / límite |
| --- | --- | --- |
| `babylon-fps-slice` | Layout + contrato → escena, cuerpo y un interactuable | Ejecutar colisión/input/blur; sin nuevas dependencias físicas por defecto |
| `nasa-evidence-check` | Afirmaciones Fxx + URLs → ficha de fuente, límites y crédito | Leer fuente primaria; diferenciar objetivo/hallazgo; no redactar resultados científicos no observados |
| `short-horror-narrative` | Beats + público + duración → guion/pistas/captions | Historia completa, sin bloqueo; ficción rotulada; prueba de lectura humana |
| `web-game-qa` | Build + ruta → pruebas, trace/capturas y fallos | Ejecución real, una partida limpia, console, foco, audio y guardado; prohibido inventar PASS |
| `asset-provenance-budget` | Archivo + producto/licencia → manifiesto y derivado admitido | Hash, licencia, tamaño y crédito; sin asumir que NASA o “free” cubre derechos |

La skill existente **OpenAI Docs** se usó para fundamentar las convenciones de Codex de esta planificación. Imagegen solo sería útil para referencias bitmap opcionales posteriores, nunca para convertir una imagen en una malla supuestamente terminada. No se usó generación de imágenes en esta entrega.

## Registro y responsabilidad

La revisión independiente humana de ciencia y la prueba humana del recorrido son tareas distintas. Si solo hay una persona, se declara esa limitación y se reduce alcance; no se simula tener revisores. La aprobación creativa no equivale a aprobación del concurso. El Team Owner decide publicación/envío dentro de la autorización real de la sesión.
