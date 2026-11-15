# VØRAX — THE LAST SIGNAL

**Estado actual: juego 3D con arte Blender r4, manos animadas y dirección holográfica aprobada por el usuario.** Despertar → Opportunity → InSight → baliza → cubierta de observación → Rescue One → exposición blanca → THE END. La extensión de interfaces y el final pasaron la verificación automatizada; revisión humana final pendiente. El proyecto sigue siendo local.

```sh
npm ci       # si faltan dependencias
npm run dev -- --host 127.0.0.1
```

Abrir http://127.0.0.1:5173/. WASD, ratón o flechas, Shift sprint, F linterna, E interacción, J diario, Esc pausa. Tab recorre la interfaz; flechas/Espacio eligen tarjetas y Enter confirma. Para probar la compilación de producción: `npm run build`, después `npm run preview -- --host 127.0.0.1`, y abrir http://127.0.0.1:4173/.

Estado, capturas y pruebas actuales: [CINEMATIC_OVERHAUL.md](CINEMATIC_OVERHAUL.md). Fuentes editables y precauciones de continuación: [ART_HANDOFF.md](ART_HANDOFF.md). No ejecutar `assets/blender/scripts/build_station.py`: regenera arte anterior. [PROGRESS.md](PROGRESS.md) conserva la verificación histórica de gameplay.

## Historial de planificación

El texto siguiente conserva la propuesta original. Su restricción de implementación fue superada por las autorizaciones posteriores; no describe el estado actual del código.

Paquete de planificación v1.0 · 14 de noviembre de 2026 · Idioma de planificación: español. Juego y entrega al concurso: inglés.

**Estado histórico al cerrar la planificación: IMPLEMENTACIÓN NO AUTORIZADA TODAVÍA.** En aquella fase no existía una compilación ni una prueba de ejecución del juego.

La propuesta es una experiencia de suspense psicológico en primera persona, de 8–12 minutos, dentro de un solo archivo espacial ficticio. Dos casos científicos —InSight y Opportunity— sostienen dos acertijos y un desenlace sobre la preservación de sus registros. La viabilidad depende del tiempo, el equipo disponible y las comprobaciones P0; no se promete calidad de producción AAA durante un hackathon.

## Documentos solicitados

| Documento | Función |
| --- | --- |
| [PROJECT_BRIEF.md](PROJECT_BRIEF.md) | Decisión recomendada, alcance, viabilidad y riesgos principales |
| [GAME_DESIGN_DOCUMENT.md](GAME_DESIGN_DOCUMENT.md) | Controles, reglas, acertijos completos, aprendizaje y accesibilidad |
| [NARRATIVE_BIBLE.md](NARRATIVE_BIBLE.md) | Tres direcciones, argumento recomendado, guion y frontera ciencia/ficción |
| [LEVEL_DESIGN.md](LEVEL_DESIGN.md) | Planta, medidas, recorrido escena por escena y puertas |
| [ART_DIRECTION.md](ART_DIRECTION.md) | Materiales, luz, sombras, sonido, interfaz y presupuestos |
| [ASSET_MANIFEST.md](ASSET_MANIFEST.md) | Inventario previsto, proveedores, derechos y alternativas |
| [TECH_STACK.md](TECH_STACK.md) | Comparación tecnológica y elección razonada |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Sistemas, contratos, estados, guardado y despliegue previsto |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | P0–P5, estimaciones, dependencias y aceptación |
| [NASA_DATA_VALIDATION.md](NASA_DATA_VALIDATION.md) | Hechos comprobados, recursos elegibles y trazabilidad científica |
| [QA_PLAN.md](QA_PLAN.md) | Pruebas futuras, evidencias exigidas y criterios de salida |
| [RISK_REGISTER.md](RISK_REGISTER.md) | Riesgos, señales de alarma, mitigación y recortes |
| [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) | Reglas verificadas, pendientes y preparación de entrega |

## Documentos de apoyo

- [SOURCES.md](SOURCES.md): fuentes primarias consultadas y método de verificación.
- [COLLABORATION_PLAN.md](COLLABORATION_PLAN.md): propiedad de archivos, traspasos y habilidades propuestas para Claude Fable 5.2 y Codex.
- [AGENTS.md](AGENTS.md) y [CLAUDE.md](CLAUDE.md): instrucciones efectivas del repositorio, incluida la pausa antes de implementar.
- [AI_USE_DISCLOSURE.md](AI_USE_DISCLOSURE.md): contribución real de IA en esta planificación; campos futuros sin rellenar.
- [PLANNING_REVIEW.md](PLANNING_REVIEW.md): revisión efectivamente ejecutada del paquete. No sustituye QA del juego.

## Orden de lectura y aprobación

Leer PROJECT_BRIEF, NASA_DATA_VALIDATION, NARRATIVE_BIBLE e IMPLEMENTATION_PLAN; después revisar arquitectura y QA. La aprobación solicitada al terminar este trabajo es para comenzar P0/P1 con este alcance. Publicación, envío al concurso y aceptación de sus términos quedan fuera de esta fase.

Las reglas generales pudieron leerse directamente; aún faltan datos del equipo y del evento, revisión de originalidad y uso de IA, y derechos de los archivos finales. El checklist conserva esos puntos abiertos. Los objetivos de rendimiento y duración son metas de diseño, no resultados medidos.
