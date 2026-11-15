# NARRATIVE BIBLE

## Revisión vigente: superviviente y rescate (2026-11-14)

La dirección autorizada ahora es una persona superviviente herida durante una evacuación, que despierta en una nave dañada. La tripulación salió creyendo que estaba vacía. Aislamiento, legado científico y búsqueda de contacto forman una misma historia. La estación, el accidente, los pensamientos, el manifiesto de evacuación, la baliza y Rescue One son ficción explícita.

Prólogo: oscuridad, alarma amortiguada, respiración/tono sintéticos, mano levantada, apoyo y subida de cámara desde 0.24 a 1.65 m. Chapter I, THE FORGOTTEN: Opportunity permite recuperar la ruta eléctrica auxiliar y el manifiesto. Chapter II, BENEATH THE SILENCE: retorno de energía, golpe metálico, apagón y revelación de un sensor médico offline; InSight permite recuperar la ruta de la baliza. PZ-03 sigue verificando procedencia antes de activarla.

El epílogo NOT FORGOTTEN incluye contacto inicial, el monólogo solicitado, el objetivo REACH THE OBSERVATION DECK y desplazamiento real. Rescue One se aproxima ante el ventanal, orienta un foco hacia el jugador y transmite confirmación visual. La respuesta “I'm here.” precede al fundido y THE END, con RESTART y CREDITS. El monólogo y radio no son citas de NASA.

Texto ejecutable: `src/content/story.ts`. Ciencia y preguntas existentes permanecen en sus archivos originales; solo cambió su orden/prerrequisito. El audio hablado provisional usa Web Speech cuando el navegador dispone de voz; captions y señales sintéticas permanecen disponibles. Las interpretaciones/animaciones finales son tarea de Claude.

Los apartados v1 que siguen se conservan como historial y no definen el orden o desenlace actual.

V1.0 · Borrador creativo asistido por IA, sujeto a selección y edición humanas. [AI_USE_DISCLOSURE.md](AI_USE_DISCLOSURE.md) conserva la procedencia y el punto de cumplimiento pendiente.

## Tres direcciones posibles

| Dirección | Premisa y revelación | Beneficio | Coste o riesgo |
| --- | --- | --- | --- |
| **A. The Preservation Loop — recomendada** | Un archivo automatizado reproduce solicitudes antiguas. Al restaurar las fuentes, el jugador descubre que la “presencia” es su rutina local de continuidad. | La comprobación de procedencia resuelve el misterio; necesita una escena y dos exhibiciones | El guion debe anticipar el bucle sin hacerlo obvio ni prometer una criatura |
| B. The Last Curator | Un curador dejó instrucciones para preservar misiones antes de evacuar. Su última grabación parece contestar al jugador, pero es un montaje secuencial. | Más emoción humana y propósito claro | Exige voz o retratos convincentes; riesgo de atribuir palabras inventadas a personal real |
| C. Echoes Beneath the Dust | Un simulador de museo interpreta señales como una presencia bajo Marte; el jugador separa ruido, observación e inferencia. | Buen potencial de alfabetización sobre datos | Exigiría señales reales bien procesadas y más validación; riesgo de insinuar vida o de sonar a diagnóstico científico real |

Elegimos A porque el acto de leer, interpretar y preservar registros produce el desenlace. La estación puede sentirse extraña con geometría simple, luz y sonido. Ninguna máquina histórica necesita hablar con voz humana. La historia tendrá un único final positivo y completo.

Estas alternativas refinan la visión proporcionada por el usuario. La guía 2026 limita el uso de IA para originar la solución: no se debe presentar esta ideación asistida como autoría humana exclusiva. La elección humana y, si corresponde, una aclaración de organizadores siguen pendientes; aprobar este documento no certifica elegibilidad.

## Mundo y personajes

**Lugar:** un archivo orbital ficticio de una época futura sin fecha concreta. No es una instalación oficial de NASA. Sus objetos son maquetas y representaciones digitales de equipos que permanecen fuera de la Tierra. El interior tiene gravedad artificial como convención de ficción.

**Jugador:** técnico de preservación sin nombre, cuerpo visible ni biografía obligatoria. Ha entrado para revisar una repetición de señal antes de que el sistema cierre una sesión archivística. El cierre no es una cuenta atrás jugable.

**VØRAX:** título del proyecto y nombre ficticio del sistema de archivo. No es una inteligencia de una misión NASA ni una tecnología real. Su rutina trata cada registro sin validar como una solicitud pendiente y repite alertas. La avería parece intención; termina siendo un problema de contexto y procedencia.

**Presencia:** no existe un enemigo oculto. Ruidos, sombra y mensajes son elementos de la estación. La explicación nunca diagnostica al jugador ni asocia enfermedad mental con peligro.

## Argumento completo

**Inicio:** el jugador llega al vestíbulo oscuro, activa respaldo y ve una pantalla que indica una solicitud recurrente. El hub muestra dos expedientes incompletos. Las etiquetas visibles aclaran qué es sistema ficticio y qué es archivo NASA, aunque todavía no se conoce por qué el sistema repite la solicitud.

**Desarrollo:** restaurar la relación entre instrumento, medición y propósito en InSight permite reinterpretar una señal como información de un instrumento, no como voz. En Opportunity, el jugador distingue evidencia de apariencia e inferencia. Durante el regreso reconoce el mismo patrón mecánico y encuentra un diagnóstico que apunta al origen local.

**Final:** el relay solicita clasificar afirmaciones según procedencia. Queda claro que ninguna transmisión nueva desde los artefactos ha ocurrido en esta historia. El jugador preserva los expedientes y cancela la repetición local. El archivo recupera una luz cálida; los equipos no vuelven a operar, pero su conocimiento sigue disponible.

## Guion de los hitos obligatorios

Texto de pantalla propuesto en inglés. `SYSTEM` y `FICTION` no son metadatos NASA. Los textos de evidencia se derivarán de F01–F14 y se revisarán separadamente.

| ID / disparador | Texto o acción | Capa |
| --- | --- | --- |
| L00 / menú | “A fictional archive. Real mission records. Quiet tension, darkness and mechanical sounds.” | Declaración editorial |
| L01 / entrada | “LOCAL ARCHIVE — request repeated. Restore backup power.” | FICTIONAL ARCHIVE SYSTEM |
| L02 / PZ-00 | “Two records remain unverified. Begin with the listening station.” | FICTIONAL ARCHIVE SYSTEM |
| L03 / terminal InSight | “What was listening? Match the instrument to its measurement and purpose.” | Instrucción del acertijo |
| L04 / PZ-01 | “Record restored. A measurement is not a voice.” | Comentario editorial; enlaza F08 |
| L05 / vuelta al hub | Caption: “[A mechanical click repeats behind you.]” Un brazo de mantenimiento se mueve al fondo. | FICTION, nunca sonido NASA |
| L06 / terminal Opportunity | “An image shows appearance. Another instrument tests composition. What can the evidence support?” | Instrucción del acertijo |
| L07 / PZ-02 | “Record restored. Keep the observation. Check the conclusion.” | Comentario editorial |
| L08 / acceso a relay | “REMOTE UPLINK: OFFLINE. REPLAY SOURCE: LOCAL QUEUE.” | Diagnóstico FICTION |
| L09 / PZ-03 | “Preserve what the records support.” | Instrucción |
| L10 / confirmación | “No new call. A request waiting to be understood.” | FICTION |
| L11 / final | “The machines remain. Their discoveries travel on.” | Cierre editorial |
| L12 / créditos | “Fictional setting and events. Historical mission information is attributed in the archive. This is not an official NASA product; NASA does not endorse this project.” | Declaración editorial |

La ficha de legado de cada misión debe contestar cuatro preguntas: qué objeto era, por qué se envió, cómo obtenía información y qué conocimiento hizo posible. Esas respuestas se apoyan en los IDs científicos; no se improvisan como voz de un astronauta o un ingeniero real.

## Ritmo y presagios

El terminal inicial y el relay comparten el mismo patrón de tres pulsos, creado para el juego. La primera vez suena como llamada; en el regreso se observa el mecanismo que lo produce. El objeto que proyecta la sombra siempre estuvo presente. El mapa y la colisión permanecen constantes. Se cambia la interpretación, no la historia de NASA.

Máximo tres eventos de suspense, reproducidos una vez por sesión/checkpoint y separados de lectura. El jugador puede detenerse, pedir pistas y volver a consultar las fuentes sin que lo interrumpa una animación o un audio obligatorio. No se altera el volumen de la evidencia para producir miedo.

## Política de escritura y ciencia

- Narración breve: aproximadamente 300–450 palabras originales de sistema/historia; expedientes obligatorios aproximadamente 400–550 palabras en total. Son presupuestos ajustables tras medir lectura.
- Evitar jerga sin explicación: “seismometer — an instrument that measures ground motion”. Revisar el inglés con lectura humana.
- No atribuir últimas palabras, intenciones, emociones o citas inventadas a una misión. Cualquier personificación opcional necesita etiqueta de ficción.
- “Retirado”, “sin comunicación” y “dejado en la superficie” tienen significados distintos. Apollo opcional ejemplifica que un objeto dejado atrás puede seguir aportando ciencia.
- No presentar “NASA hid the truth”, colonias humanas reales en Marte, viajes de rescate ni descubrimientos biológicos inexistentes.
- No utilizar nombres, caras ni voces de empleados reales. La recomendación actual prescinde de voz; si se añade, será original y autorizada.

## Final alternativo por falta de tiempo

No se añade otro final. Se conserva el mismo guion causal y se reducen transiciones y eventos de suspense. Si se activa el rescate de un solo acertijo, Opportunity pasa a una exhibición breve antes del relay; sus hechos y atribución siguen presentes y el cambio se documenta en todos los contratos.
