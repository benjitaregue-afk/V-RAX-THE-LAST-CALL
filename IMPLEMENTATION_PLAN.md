# IMPLEMENTATION PLAN

V1.0 · Secuencia para después de aprobación. **No se ejecuta ninguna fase de implementación en esta entrega.** La investigación documental de P0 ya tiene avances; el resto está pendiente.

## Presupuesto y calendario

Base estimada de 60 horas-persona: P0 3, P1 8, P2 6, P3 12, P4 8, QA final 10, entrega 4 y reserva 9. Total 60. P5 no tiene presupuesto garantizado. Supuesto: tres personas, unas 20 horas productivas cada una, con una responsable de integración y otra de ciencia/QA. Los agentes ayudan dentro de esas tareas; no cuentan como participantes.

La secuencia de referencia utiliza aproximadamente 30 horas de reloj tras aprobación y hasta 6 horas adicionales de reserva. Algunas tareas humanas de contenido/QA ocurren junto a la implementación, en archivos distintos. No es una promesa de terminar en ese tiempo. Si la ventana restante no permite estas fases, se aplica un recorte antes de empezar.

Las reglas consultadas sitúan el envío general al final del 15 de noviembre de 2026, según el evento. Si se tratara del Universal Event y su Team Owner residiera en America/La_Paz, el cierre sería **15 de noviembre, 23:59 BOT (UTC−4)**. No se conoce el evento ni residencia del Team Owner; esta conversión es condicional. Confirmar horarios locales de evaluación que pueden ser anteriores. La fecha del ordenador no determina el plazo del equipo.

## Milestones

| Fase / ventana orientativa | Entregable concreto | Dependencias | Criterios medibles de aceptación | Alternativa si falla |
| --- | --- | --- | --- | --- |
| **P0 — Compliance**, H0–H2, 3 h-persona | Checklist con evento/equipo, fuentes elegibles, decisión sobre IA, derechos de recursos núcleo y alcance seleccionado | Aprobación para continuar; información del Team Owner | C01–C05 releídos; N01/N02 vinculados al puzzle; requisitos del equipo/plazo registrados; política IA/originalidad resuelta o escalada como bloqueo de entrega; ningún asset sin base de uso | Mantener solo datos revisados y recursos originales/CC0; resolver dudas concretas con organizadores por el equipo. No afirmar elegibilidad si siguen abiertas |
| **P1 — 3D playable**, H2–H6, 8 h-persona | Un build local con cinco espacios básicos, WASD/mirada, colisión, luz/sombra, audio mínimo y PZ-00 | P0 técnico/científico; versiones y contratos fijados | Arranque WebGL 2; 5 min de navegación observada; paredes/marcos bloquean; E activa interruptor a ≤2.2 m y nunca a través de pared; Esc/blur/terminal recuperables; sonido tras gesto; una sombra visible | Geometría de boxes, suelo plano y orientación por teclado si falla captura; conservar recuperación de mouse-look. No empezar decoración si movimiento falla |
| **P2 — Scientific vertical slice**, H6–H10, 6 h-persona | PZ-01 completo con expediente N02, pistas, crédito y apertura D1 | P1 estable; ficha revisada | Solución y dos errores observados; ayuda completa disponible; source visible; etiqueta de ficción/modelo; checkpoint si guardado ya existe; persona nueva puede deducir respuesta sin web externa | Quitar gráfico/audio científico opcional; mantener relación instrumento–medición–objetivo y fuente real |
| **P3 — Complete story**, H10–H18, 12 h-persona | PZ-02, PZ-03, final, diario, settings mínimos y guardado si viable | P2 aceptado; textos/imagen o fallback revisados | Partida fresca llega a COMPLETE; recarga en cada etapa no bloquea; errores y pistas no consumen evidencias; final saltable; créditos/ficción visibles; audio en mute no impide terminar | Usar final textual con luz; eliminar voz/imports. Si PZ-02 excede presupuesto, activar rescate documentado antes de congelar contenido |
| **P4 — Polish**, H18–H22, 8 h-persona | Arte modular coherente, mezcla, captions, eventos de suspense y presets | P3 terminado, primera partida grabada | Cumple presupuestos; textos legibles a 720p; menor intensidad conserva pistas; master/mute efectivos; no añade bloqueo; partida medida entra en objetivo tras ajustes | Eliminar partículas, textura externa, efecto de cámara y audio real; conservar atmósfera, sombra y ambiente mínimos |
| **QA final**, H22–H28, 10 h-persona | Registro de pruebas del build candidato y correcciones prioritarias | Congelación de features; build identificable | QA_PLAN sin bloqueantes; recorridos manuales reales; medición de rendimiento; fuentes/licencias revisadas; cero error crítico de consola | Recortar causante, volver a probar trayecto afectado y partida completa; no fingir compatibilidad |
| **Entrega**, H28–H30, 4 h-persona | Build público, documentación en inglés y demo ≤30 s o ≤7 slides | QA local; autorización posterior de publicación/envío | Acceso anónimo comprobado; partida final en URL real; enlaces públicos; formularios completos; recibo de envío si lo realiza el equipo | Hosting estático alternativo ya probado; demo es apoyo, nunca sustituto de un juego anunciado como jugable |
| **P5 — Optional**, solo con margen | Apollo, español, voz o exportación de referencias | Núcleo aceptado y reserva intacta | Cada extra tiene licencia, test y botón para desactivarlo; no rompe presupuesto ni plazo | Omitir |

P0 distingue bloqueos de ingeniería y de concurso: si falta una comprobación administrativa, solo se puede avanzar con un prototipo expresamente autorizado, registrando que no está listo para presentar. No se pospone una duda de derechos para ocultarla al final.

## Trabajo por subsistema

1. Codex fija contratos, arranque y controlador; Claude prepara únicamente las fichas/textos asignados. Una persona valida hechos contra fuentes.
2. Codex integra el vertical slice. Un revisor intenta resolverlo desde cero y documenta ambigüedades.
3. Claude entrega el contenido final y manifiesto; Codex añade PZ-02/PZ-03 usando los mismos adaptadores. Integración secuencial, sin editar juntos el reducer.
4. El equipo verifica un final temprano. Solo entonces se invierte el bloque de polish.
5. Congelar datos, dependencias y alcance; QA del mismo build que se va a publicar. Tras publicar, comprobar la versión exacta y jugarla.

La propiedad detallada y formato de traspaso están en [COLLABORATION_PLAN.md](COLLABORATION_PLAN.md).

## Reglas de recorte por tiempo restante

| Situación | Decisión obligatoria de alcance |
| --- | --- |
| Menos de unas 30 horas de reloj o menos de 50 h-persona disponibles al aprobar | Reestimar antes de prometer el núcleo; preferir assets originales y cero imports |
| D−18 h sin P2 | Quitar toda ampliación y polish no esencial; dedicar trabajo al acertijo y al final |
| D−12 h sin P3 | Activar rescate de un solo acertijo: PZ-02 se convierte en exhibición, su lectura habilita relay; mantener PZ-03 y el mismo final |
| D−6 h | Congelar contenido y dependencias; solo bloqueantes, ciencia, atribución y accesibilidad esencial |
| D−3 h | Publicar candidato estable con autorización y verificar acceso/demostración; no experimentar con hosting o motor |

`D` es el plazo real más temprano que afecte al equipo, aún por confirmar. El rescate requiere actualizar GDD, nivel, reducer, pruebas y descripción pública, y volver a medir duración. No se sigue diciendo que existen dos acertijos científicos si se eliminó uno. Si la duración medida queda fuera de 8–12 minutos, se informa y ajusta; no se añade una espera vacía.

## Soluciones de contingencia técnica

- Importación GLB difícil: sustituir por boxes/cilindros; no afecta datos científicos.
- Archivo de evidencia inaccesible: usar ficha textual validada con ID/fuente y reconocer ausencia de imagen; revisar PZ-02 y QA del fallback.
- Audio real sin derechos claros: omitir; ambiente sintético y captions cubren narración.
- Guardado inestable: conservar sesión en memoria, avisar que no habrá reanudación; repetir partida de principio a fin. Guardado es el único requisito expresamente condicionado a viabilidad.
- Poco rendimiento: bajar DPR, geometría, transparencias y shadow map a 512; mantener escena 3D y una sombra real.
- Pointer lock falla: reintento visible y mirada con teclado; resolver mouse-look en al menos el navegador objetivo antes de afirmar el requisito.
- Context loss: menú de recuperación y checkpoint; si se repite en laptop de referencia, sigue siendo fallo crítico, no se tapa con reinicios.
- Host exige login: no cumple acceso público; cambiar configuración/proveedor con autorización y repetir prueba anónima.

## Definición de terminado

Una persona nueva completa una historia coherente, entiende los vínculos hardware/ciencia, puede consultar fuentes y reconoce ficción. El build funciona en navegadores/hardware declarados, con criterios QA reales y URL accesible sin login. La entrega al concurso incluye procedencia y documentación requerida. Nada de eso se declara conseguido en esta fase de planificación.
