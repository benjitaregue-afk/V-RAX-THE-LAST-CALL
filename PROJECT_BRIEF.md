# PROJECT BRIEF — VØRAX — THE LAST SIGNAL

Versión 1.0 · 2026-11-14 · Propuesta pendiente de aprobación.

## Decisión principal

Construir **The Preservation Loop**, una historia de suspense científico en un único archivo orbital ficticio, con Babylon.js, TypeScript y Vite. El jugador restaura la interpretación de dos expedientes, descubre que la supuesta llamada es una reproducción local y preserva el conocimiento generado por máquinas que siguen en Marte.

Elegimos un entorno conectado porque permite invertir en iluminación, composición, claridad y pruebas de principio a fin. La calidad AAA sirve como referencia de disciplina y coherencia; el objetivo entregable es un juego breve de alcance independiente. La elección de motor es un juicio de ingeniería, desarrollado en [TECH_STACK.md](TECH_STACK.md), no un benchmark ejecutado.

## Relación con el reto

El [reto oficial de 2026](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/) pide conectar equipos dejados fuera de la Tierra con su propósito y su ciencia, para público escolar y casual. Una experiencia web interactiva es un formato admitido. Se seleccionan dos misiones marcianas para el recorrido principal; cubrir simultáneamente Luna y Marte no es una obligación del enunciado. La Luna aparece solamente como ampliación opcional investigada.

El núcleo usa campos reales del catálogo NSSDCA en las decisiones del jugador. Los registros se empaquetarán localmente y se citarán dentro del juego. Una lista de enlaces en los créditos sería insuficiente para nuestro criterio de integración. La verificación documental está en [NASA_DATA_VALIDATION.md](NASA_DATA_VALIDATION.md); todavía no hay integración ejecutada.

## Promesa al jugador

“A signal has returned. The machines have not.”

Explorar, observar un artefacto estilizado, consultar su expediente real, relacionar instrumento y evidencia, recibir una revelación narrativa, y volver al espacio común. El terror nace de la anticipación y de reconocer sonidos repetidos. La explicación final conserva el valor de las misiones y no presenta actividad paranormal como descubrimiento de NASA.

## Alcance recomendado

| Incluido en el núcleo | Fuera del núcleo |
| --- | --- |
| Una escena 3D; cinco espacios conectados | Superficies planetarias explorables, viajes entre niveles |
| WASD, mouse-look, colisiones, linterna | Combate, persecución, IA enemiga, saltos o plataformas |
| Dos acertijos científicos y una clasificación final | Inventario físico, crafting, simulación de ingeniería real |
| Un principio, un misterio y un final único | Finales ramificados, muerte o reinicio punitivo |
| Iluminación y al menos una sombra dinámica | Ray tracing, reflejos por cámara, fluidos o niebla volumétrica |
| Sonido espacial, subtítulos, modo de menor intensidad | Captura de movimiento, personajes animados, doblaje obligatorio |
| Inglés; guardado local pequeño si supera QA | Cuentas, backend, streaming de datos, servicios de IA en ejecución |

Objetivo temporal: mediana de primeras partidas de 8–12 minutos, sin tiempos de espera artificiales. La validación con personas y el tratamiento de extremos están en QA_PLAN.

## Público y tono

Adolescentes y público casual interesado en exploración espacial; orientación editorial aproximada de 13 años en adelante, sin afirmar clasificación oficial. Sin violencia gráfica ni sobresaltos de volumen. El modo de menor intensidad conserva todos los objetivos y la misma historia. La experiencia seguirá siendo visual y espacial; los terminales tendrán navegación por teclado, pero no se promete accesibilidad no visual completa del entorno FPS.

## Viabilidad y supuestos

Se estima una base de **60 horas-persona**, incluida reserva, para tres participantes con unas 20 horas productivas cada uno y al menos una persona con experiencia práctica en 3D web. Es una estimación de planificación sin prototipo que la respalde. Dos personas pueden necesitar recortes; una persona tendría alto riesgo de no lograr este acabado y todas las verificaciones durante el evento. Las herramientas de IA no cuentan como miembros humanos ni reemplazan la observación de QA.

Hay dos pruebas de viabilidad tempranas: control/collision en P1 y acertijo científico completo en P2. Si fallan, se detiene la expansión artística y se aplica la alternativa ya definida, sin cambiar de motor a mitad del evento salvo que la escena básica ni siquiera pueda arrancar.

## Tres riesgos que más amenazan terminar

1. **Elegibilidad y procedencia:** requisitos del equipo/evento, interpretación de la restricción de ideación con IA y derechos de archivos finales. El control es P0 documentado; no se declara elegibilidad global todavía.
2. **Exceso de producción:** intentar múltiples planetas, modelos fieles y cinematografía compleja consumiría el tiempo del final y QA. El control es una escena modular, dos exhibiciones sencillas y congelación de alcance tras P2.
3. **Fallo del recorrido en navegador:** pérdida de pointer lock, colisiones, cargas, guardado o rendimiento pueden impedir completar la historia. El control es probar una partida completa pronto y repetirla en la URL final, con hardware real.

Los detonantes, responsables y alternativas concretas figuran en [RISK_REGISTER.md](RISK_REGISTER.md).

## Si falta tiempo

Recortar primero Apollo opcional, español, voz, meshes importados y efectos de cámara. Después reducir decoración, mantener un solo preset gráfico y hacer la restauración de Opportunity más corta. El plan de rescate con un solo acertijo mantiene el expediente de Opportunity como exhibición y la clasificación final; exige actualizar los documentos, volver a medir duración y reconocer que cambia el alcance recomendado. Nunca recortar controles 3D, ciencia atribuida, final, sombras/sonido mínimos ni pruebas de finalización.

## Estado de autorización

Solo se autoriza este paquete de planificación. No se ha iniciado implementación, adquisición de assets para el juego, publicación ni envío. Tras su revisión se espera aprobación explícita antes de comenzar.
