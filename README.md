# Opella. Winter Evolution — versión de pliego

Versión alternativa del lector digital.

## Comportamiento

- **Computadora / pantallas mayores de 900 px**
  - Portada: sola.
  - Contenido: pliegos 2–3, 4–5, 6–7, 8–9, 10–11, 12–13 y 14–15.
  - Contraportada: sola.
  - Al avanzar entre pliegos, **únicamente la página derecha gira** hacia la izquierda.
  - El reverso de la hoja que gira muestra la siguiente página izquierda, como en una revista física.

- **Celular / pantallas de hasta 900 px**
  - Lectura página por página.
  - Swipe horizontal, pinch zoom y doble toque.

## Controles

- Flechas o teclado: navegación.
- `− 100% +`: zoom en escritorio.
- `+`, `-`, `0`: zoom por teclado.
- Arrastre con mouse cuando hay zoom.
- Pantalla completa.
- Miniaturas.
- Descarga del PDF original.

## Publicación

Sube **el contenido de esta carpeta** a la raíz de un repositorio de GitHub y activa:

`Settings → Pages → Deploy from a branch → main → /(root)`

Archivos específicos de esta versión:

- `css/styles-spread.css`
- `js/reader-spread.js`


## Corrección V2

- Precarga y decodifica la página destino antes de iniciar cada animación.
- La página izquierda se actualiza debajo de la hoja animada antes de retirar el giro, eliminando el flash de la página anterior.
- Ajuste específico para Safari/iPhone, Chrome/Android y navegadores embebidos (por ejemplo Teams).
- El escenario móvil se limita al viewport visual real para evitar recortes laterales.
- Modo lectura móvil usa `100dvh`, safe areas y bloqueo estable del scroll.
