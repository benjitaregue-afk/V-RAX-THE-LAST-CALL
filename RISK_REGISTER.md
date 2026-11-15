# RISK REGISTER

V1.0 · Valoración cualitativa de planificación. Probabilidades no medidas; “alta/media/baja” expresan juicio del alcance supuesto. Los responsables humanos deben asignarse al aprobar.

## Riesgos principales

| ID | Riesgo / probabilidad / impacto | Señal observable | Control y responsable propuesto | Contingencia / criterio de escalada |
| --- | --- | --- | --- | --- |
| **R01** | Elegibilidad, autoría/IA, equipo, evento o derechos no resueltos · media · crítico para concurso | No se conoce evento/Team Owner/plazo; ideación IA sin decisión; asset sin condiciones | P0 con Team Owner, investigador y revisor humano; conservar fuentes y disclosure | No declarar elegibilidad ni enviar hasta resolver. Retirar material dudoso; duda de interpretación la plantea el equipo a organizadores |
| **R02** | Producción supera tiempo disponible · alta · crítico para terminar | P2 tarda más de H10; se diseñan planetas, enemigos o modelos completos | Director/integrador congela alcance; una escena y dos casos; final primero | Aplicar recortes D−18/D−12 de IMPLEMENTATION_PLAN; volver a medir duración y describir alcance real |
| **R03** | Navegador bloquea control, recorrido o rendimiento · media · crítico | Fallo de captura sin recuperación, paso por pared, puerta imposible, frame time alto | Codex/integrador prueba vertical slice y QA manual temprana en hardware real | Geometría simple, presets, teclado auxiliar y recuperación; si persiste no marcar plataforma compatible |

Estas son las tres amenazas más importantes: una buena imagen no compensa una entrega inelegible, una historia sin final o una partida que no puede jugarse.

## Riesgos adicionales

| ID | Riesgo / probabilidad / impacto | Señal / responsable | Mitigación y alternativa |
| --- | --- | --- | --- |
| R04 | Ciencia alterada por dramatización · media · alta | “Voces”, vida o telemetría ficticia rotulada NASA; revisor de ciencia | Tabla Fxx y capas obligatorias; no corromper evidencia; corregir y repetir M08 |
| R05 | Lista de recursos o reglas cambia · media · alta | Nueva versión de guía o diferencia entre discusión y guía; Team Owner | Releer C01–C05 antes de enviar; conservar fecha y usar condición específica de Resources |
| R06 | Assets NASA/terceros mal atribuidos o no redistribuibles · media · alta | Crédito genérico o licencia solo supuesta; responsable de assets | Manifiesto por archivo; NASA/JPL/Cornell para PIA05584; texto/original como alternativa |
| R07 | Horror excluye al público escolar/casual · media · media/alta | Pruebas abandonadas por intensidad o mareo; dirección narrativa/QA | Sin gore ni gritos; modo menor intensidad, sin bob y cámara estable; eliminar evento que distraiga ciencia |
| R08 | Puzzles ambiguos o demasiado triviales · media · alta | Se adivina sin interpretar o se necesita explicación verbal externa; diseño/QA | Mostrar evidencia suficiente, errores útiles y pistas; pruebas con tres personas; cambiar presentación antes que inventar hechos |
| R09 | Estado o save deja bloqueo permanente · media · alta | Checkpoint avanzado con puerta cerrada, versión incompatible; Codex | Etapas monotónicas, puertas derivadas, spawn seguro; fallback memoria si guardar falla |
| R10 | Audio autoplay o formato falla · media · media | Silencio tras iniciar, doble loop o mute incompleto; Codex/audio | Gesto explícito, un contexto, formatos probados y captions; síntesis original de respaldo |
| R11 | Cambios concurrentes causan regresión · media · alta | Dos agentes editan reducer/JSON/lockfile simultáneamente; integrador | Propiedad explícita, traspasos y un merge por vez; no lanzar otro agente sin asignación acordada |
| R12 | Dependencias/tooling consumen el hackathon · media · alta | Upgrade de motor, física o paquetes de compresión a mitad; integrador | Stack mínimo y versiones fijadas; no física externa ni KTX/Draco obligatorios; congelar dependencias |
| R13 | Hosting o enlaces requieren login · media · alta | Funciona solo en sesión del dueño; Team Owner/deploy | Host estático público, prueba privada y URL real; proveedor alternativo comprobado con autorización |
| R14 | No hay hardware/revisores suficientes · media · alta | Solo se prueba en equipo potente o por el autor; QA lead | Reclutar personas dentro del equipo/evento, declarar límites; no inventar pruebas de Safari/laptop |
| R15 | Modelo/servicio IA no disponible en cuenta · media · media | Claude Fable 5.2 inaccesible o cuota agotada; coordinación | El modelo está documentado por Anthropic, acceso local no probado; seguir con trabajo humano/Codex autorizado y mismo contrato, sin cambiar nombres en disclosure |
| R16 | Material en español enlazado como entrega incumple inglés · media · media/alta | Documentos internos españoles usados como única documentación pública; Team Owner | Preparar paquete público en inglés; traducir documentos que se enlacen como material de entrega |

## Orden de simplificación

1. Omitir Apollo opcional, español y doblaje; mantener inglés y subtítulos.
2. Sustituir imports, texturas externas y sonificación real por geometría/síntesis originales identificadas.
3. Eliminar partículas y efectos; reducir decoración/DPR conservando sombra y lectura.
4. Reducir texto y transiciones; mantener causas, hallazgos y final explícito.
5. Solo si el final peligra, usar el rescate de un acertijo definido en IMPLEMENTATION_PLAN; actualizar contratos y evaluación de duración.

No recortar una prueba fallida del informe para aparentar estabilidad. No sustituir el juego anunciado por un vídeo sin reconocer el cambio. Si el tiempo real ya no permite los requisitos mínimos, informar qué no se logró y entregar el estado real.

## Revisión de riesgos

Revisar en P0, después de P2, al congelar P3 y antes de publicar. Registrar para cada riesgo abierto una evidencia, una acción y un dueño. Reestimaciones de tiempo y recortes son decisiones humanas de alcance; ninguna métrica de este documento se presenta como resultado ejecutado.
