# TECH STACK

V1.0 · Decisión de planificación, sin instalaciones ni benchmark. Fuentes técnicas consultadas el 2026-11-14.

## Recomendación

**Babylon.js + TypeScript + Vite, UI HTML/CSS y Web Audio nativo.** La razón es reducir los sistemas adicionales que habrá que construir y depurar para un FPS corto en navegador. La escena y los datos viven en texto revisable; el equipo no depende de editar grandes escenas binarias ni de un backend.

Se elige WebGL 2 como objetivo de aceptación. WebGPU no es necesario para esta experiencia ni será un prerrequisito. La disponibilidad real se verifica en P1; no se promete compatibilidad de todos los navegadores o dispositivos.

## Comparación

| Opción | Ventajas relevantes | Costes para este proyecto | Decisión |
| --- | --- | --- | --- |
| Babylon.js + TS | Motor web integrado, escena, materiales, cámaras y colisiones; módulos npm | Hay que cuidar imports, ciclo de vida, física simplificada y coste de luces | **Recomendado** para una sola escena y control directo |
| Three.js + TS | Biblioteca flexible, control de render, integración web sencilla | Colisiones, organización de juego y otras capas quedan a cargo del equipo; su [manual](https://threejs.org/manual/pages/game.html) lo distingue de un motor de juego | Alternativa si el equipo ya tiene controlador FPS probado |
| React Three Fiber | Renderer React sobre Three.js; útil para equipos con experiencia React | Sigue necesitando sistemas de juego; añade React y coordinación de estado UI/frame | No aporta suficiente ventaja al alcance propuesto |
| Godot 4 | Editor, nodos y herramientas de juego; atractivo si ya existe experiencia en Godot | Export web requiere WebGL 2/Wasm y Compatibility; C# no exporta actualmente según [documentación estable](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html); revisar hosting/sonido | Viable en GDScript; segundo candidato si la experiencia del equipo favorece el editor |
| PlayCanvas u otro motor web | Puede ser apropiado con experiencia previa y un flujo ya preparado | Introducir un editor/servicio nuevo consume tiempo; no se ha evaluado una exportación concreta | No añadir un cuarto prototipo durante el hackathon |
| Unity/Unreal | Herramientas amplias para equipos que ya las usan | Cambiar de pipeline sin proyecto previo no reduce nuestra incertidumbre de navegador | Fuera de esta evaluación práctica; no se afirma imposibilidad técnica |

Esta comparación es una evaluación de adecuación al equipo y alcance supuesto. No afirma superioridad universal de Babylon ni velocidades medidas. Godot admite exportación sin hilos y no exige siempre aislamiento de origen; no se descartó por una restricción que ya tenga alternativa.

## Dependencias previstas

| Categoría | Paquetes | Política |
| --- | --- | --- |
| Runtime base | `@babylonjs/core` | Imports modulares; versión exacta compatible elegida en P1 |
| Runtime condicional | `@babylonjs/loaders` | Solo si se acepta al menos un GLB; misma versión que core |
| Desarrollo | `typescript`, `vite` | Node LTS compatible con las versiones elegidas |
| QA | `vitest`, `@playwright/test` | Reducer/datos y pruebas de navegador; no distribuidos al jugador |
| Depuración opcional | Inspector Babylon | Solo desarrollo, nunca cargado en producción |

No React, framework de estado, física Wasm, backend, base de datos, SDK de IA ni librería de UI. Audio y persistencia usan APIs del navegador. El uso de [ES modules Babylon](https://doc.babylonjs.com/setup/frameworkPackages/es6Support/) permite seleccionar módulos; el ahorro real depende del bundle y se medirá.

No se fijan aquí números de versión sin haber instalado y probado la combinación. Al aprobar: registrar Node en `.node-version`, versiones exactas y `package-lock.json`; verificar requisitos Vite; no actualizar durante la congelación final. Conservar licencias de todas las dependencias y avisos Apache-2.0 de Babylon.

## Sistemas elegidos

- Render: un `Engine` WebGL, una `Scene`, PBR compartido, una sombra dinámica por zona activa y niebla sencilla.
- Jugador: `UniversalCamera` para orientación, cuerpo de colisión elipsoidal y desplazamiento controlado con timestep fijo. Sin gravedad duplicada del controlador de cámara.
- Interacción: raycast de hasta 2.2 m contra candidatos y oclusores; el impacto más cercano manda.
- Juego: reducer TypeScript puro y estados monotónicos; presentación derivada de hechos, no de un árbol de callbacks.
- Puzzles: definiciones de datos + validadores puros; respuestas y errores de GAME_DESIGN_DOCUMENT.
- Diálogo: secuencias breves identificadas, captions y “Continue”; sin sistema de conversación generativa.
- Audio: Web Audio con buses y emisores, desbloqueado tras gesto del usuario. Ausencia de audio no bloquea una respuesta.
- Assets: geometría base procedural; archivos estáticos locales con manifiesto. GLB y audio de proveedores solo cuando ahorren tiempo.
- Persistencia: `localStorage` versionado, checkpoints seguros y fallback de memoria.

Detalles y contratos: [ARCHITECTURE.md](ARCHITECTURE.md).

## Build y despliegue previstos

Tras implementación existirán scripts de typecheck, unit tests, build y prueba e2e. La salida Vite es `dist`; `vite preview` sirve para verificar localmente el build, no para hospedar producción. Esto está documentado en la [guía de despliegue Vite](https://vite.dev/guide/static-deploy.html).

Publicar como sitio estático HTTPS de acceso anónimo. Seleccionar proveedor después de confirmar la cuenta disponible; GitHub Pages o un host de archivos estáticos son candidatos, sin obligación de incorporar un servicio concreto. Verificar base path, MIME, caché, tamaño y acceso desde una ventana privada. Sin peticiones runtime a NASA, APIs con clave o dominios de assets remotos.

El dominio y proveedor finales no están elegidos, no existe URL y no se ha hecho despliegue. Si más adelante se solicita Sites, se leerá su skill y se verificará el acceso público correspondiente antes de adoptarlo. El núcleo no depende de Sites.
