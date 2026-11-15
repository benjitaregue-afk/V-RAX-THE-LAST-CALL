# ART DIRECTION

V1.0 · Dirección y presupuestos propuestos. Ningún rendimiento o asset final ha sido medido todavía.

## Identidad visual

Archivo espacial utilitario, envejecido por abandono de mantenimiento, con formas claras y superficies mates. El lenguaje visual será geométrico y contenido: paneles, marcos, juntas grandes, polvo moderado y unos pocos objetos reconocibles. Se busca una imagen memorable mediante composición y luz, sin depender de detalle fotorrealista.

El punto de referencia propio es “la ciencia conservada en un lugar que casi ha dejado de funcionar”. Las áreas científicas tienen superficies claras para lectura; los mecanismos periféricos dejan zonas de ambigüedad. Las maquetas son ilustrativas y llevan ese rótulo. No se harán criaturas ni recreaciones complejas de vehículos completos.

## Paleta y materiales

| Uso | Color de referencia | Tratamiento |
| --- | --- | --- |
| Fondo / huecos | `#080D12` | Azul casi negro; nunca sustituye señalización |
| Paneles | `#26323B` | Metal pintado, roughness aproximada 0.7–0.9 |
| Equipamiento | `#8B979C` | Gris desaturado, variaciones de valor grandes |
| Orientación / InSight | `#71D4D6` | Cian moderado; acompañado por texto/icono |
| Polvo / Opportunity | `#BA7652` | Óxido cálido; sin recolorear fotografías científicas |
| Estado de alerta | `#E0A35A` | Ámbar lento, sin flashes |
| Cierre / preservación | `#D8C6A5` | Luz cálida gradual y mayor visibilidad |

Parámetros iniciales de PBR: metal pintado metallic 0.15–0.35; metal expuesto 0.7–0.9; goma 0; roughness ≥0.45 para evitar ruido especular. Son valores artísticos para ajustar. Compartir materiales; los logos de fabricante y detalles diminutos no aportan al recorrido.

## Kit modular

Grid de 1 m; panel principal 2×3.4 m; módulos de suelo/techo 2×2 m. Doce familias: suelo, techo, pared lisa, pared con inserto, esquina, marco, hoja de puerta, zócalo, canal de cable, consola, rack y pedestal. Las piezas se producen con boxes/cilindros y mallas sencillas; instancias donde comparten geometría/material. Las colisiones son proxies independientes y más simples.

Los únicos objetos de énfasis son un domo estilizado, un fragmento de rueda/panel y el mecanismo del relay. Un render de IA 2D puede servir como referencia si se autoriza después; **no se asume que sea una malla 3D utilizable**. El núcleo no requiere generar imágenes ni usar text-to-3D.

## Luz y sombras en tiempo real

Luz ambiental tenue para orientación, luces de techo localizadas y emisivos de señalización. Limitar a cuatro luces activas que afecten a una misma malla. Una luz de acento de la zona activa tiene sombra dinámica: mapa 1024×1024 en preset estándar, 512×512 en bajo, con hasta 20 objetos que proyectan sombra. El preset bajo conserva al menos una sombra real, requisito del juego.

Linterna como spotlight sin consumo; sombras de linterna son opcionales y nunca requieren un segundo mapa en el núcleo. La luz de acento conserva el efecto de sombra aunque la linterna esté apagada. Evitar sombras de partículas, textos y pequeños cables. Probar bias y separación de superficies para evitar acne y fugas.

Cambios de escena por interpolación de intensidad y color, normalmente ≥0.5 segundos. No se depende de apagar toda la escena para ocultar un cambio. Las fuentes de evidencia tienen un plano de lectura estable y no parpadean.

## Cámara, atmósfera y animación

- FOV y alturas de GAME_DESIGN_DOCUMENT. Sin roll, zoom inesperado, motion blur ni head bob. Retícula discreta, ajustable en contraste.
- Niebla lineal ligera, inicialmente entre 12 y 32 m. El terminal HTML no queda cubierto por niebla.
- Partículas de polvo: opcionales, máximo 120 visibles, un material y área pequeña; se eliminan primero si hay coste de transparencias.
- Animaciones: puertas deslizantes, ventilador lento, brazo mecánico simple y pulso de consola. No hay rigging de personajes. Ninguna animación controla por sí sola un bloqueo de progreso.
- Un máximo de tres eventos de suspense según la narrativa. Menor intensidad sustituye efectos por el mismo diagnóstico textual.

## Audio

Audio ambiente continuo de baja intensidad y tres emisores localizados como máximo: ventilación, relé y puerta. Pasos propios y botones cortos refuerzan orientación. El patrón narrativo de tres pulsos será una síntesis original, identificado como sonido ficticio del archivo.

No hay música constante obligatoria; una textura tonal original puede evolucionar al final. Evitar picos repentinos, clips saturados y voces indistintas superpuestas a expedientes. Master, ambience y effects tienen controles; mute real silencia todos los buses. Captions informan posición aproximada del sonido cuando importe.

[Kenney Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds) es una fuente CC0 candidata para mecanismos. Los archivos concretos aún no se han escuchado ni seleccionado. Una sonificación auténtica de SEIS sería opcional y mantendría su crédito y procesamiento descrito en N06; el núcleo puede usar solo texto y audio ilustrativo claramente etiquetado. No reutilizar música de vídeos NASA ni Golden Record sin verificar derechos.

## UI, HUD y transiciones

HUD: retícula, interacción y objetivo breve; sin barras de salud o “cordura”. Interfaz HTML sobre canvas para menús, expedientes, opciones y captions. Panel oscuro sólido, texto claro y foco visible; contraste objetivo ≥4.5:1 para texto normal, por medir. Sistema tipográfico local del navegador, sin dependencia de fuentes externas.

Cada expediente muestra título, tipo de evidencia, cuerpo breve, fuente y crédito. La capa de ficción usa encabezado explícito diferente. El ID y la explicación de datos son útiles para el aprendizaje; rutas de código, métricas y nombres de herramientas de desarrollo no aparecen en el flujo del jugador.

Transiciones con fade corto de hasta 0.4 s al cambiar a presentación, sin vídeo precargado obligatorio. El final funciona con cámara en primera persona detenida y texto; se puede continuar o saltar. No se exige cámara animada que provoque mareo.

## Presupuesto de referencia

| Métrica | Núcleo estándar | Reducción permitida |
| --- | ---: | --- |
| Triángulos visibles | ≤150,000 | ≤80,000 eliminando decoración |
| Draw calls de escena principal | ≤120, más un pase de sombras acotado | ≤80; medir total real con el pase |
| Draw calls totales, incluida sombra | ≤150 | ≤110 |
| Materiales compartidos | ≤16 | ≤10 |
| Texturas residentes, estimación decodificada | ≤32 MiB con mipmaps | ≤20 MiB |
| Shadow maps simultáneos | 1 a 1024² | 1 a 512² |
| DPR | Máximo 1.5 | 1.0, resolución interna ajustable |
| Descarga inicial comprimida | ≤6 MiB | Geometría y datos locales primero |
| Descarga total núcleo | ≤12 MiB | Audio corto; dos imágenes ≤1 MiB cada una |
| Canales audio activos | ≤8 | ≤4 |

Se prevé un techo de trabajo de unas 128 MiB de memoria GPU estimada incluyendo targets; no es una lectura universal disponible en navegadores. QA utiliza contadores de escena, tamaño de archivos y perfiles reales. El objetivo de fluidez y el hardware de aceptación están definidos en QA_PLAN, que prevalece ante cifras duplicadas.

## Evaluación de proveedores

**Poly Haven:** materiales CC0 de buena resolución, útiles para un suelo o desgaste. La [licencia](https://polyhaven.com/license) está revisada; no conviene importar texturas 4K/8K ni modelos pesados para este interior pequeño. Candidato concreto: [Concrete Floor](https://polyhaven.com/a/concrete_floor), localizado en el catálogo; falta inspeccionar sus mapas. Alternativa preferida de base: color/roughness procedural.

**Kenney:** [Space Kit](https://kenney.nl/assets/space-kit) ofrece un estilo geométrico compatible con la producción rápida, pero su apariencia puede requerir ajuste de materiales. Se usaría un subconjunto de props tras inspección, sin intentar mezclar varios kits. Modular Space Kit queda como candidato sin inspección de pack. La geometría procedural conserva el camino de entrega si la importación lleva más tiempo del previsto.
