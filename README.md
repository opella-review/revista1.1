# Opella Winter Evolution — Mobile Fix V3

Corrección del lector de pliego para iPhone, Android y navegadores embebidos.

## Qué corrige

- Centrado completo de la página en móvil.
- Elimina el desplazamiento que dejaba media página fuera de la pantalla.
- Mantiene lectura página por página en móvil.
- Mantiene pliegos y giro de la hoja derecha en computadora.
- La página siguiente se carga y decodifica antes de animar.
- Al terminar el giro móvil, la página destino se "commitea" debajo de la animación para evitar flashes de la página anterior.
- CSS/JS versionados con `?v=3` para evitar caché vieja.

## Para actualizar un repositorio existente

Sólo necesitas reemplazar:

- `index.html`
- `css/styles-spread.css`
- `js/reader-spread.js`

No hace falta volver a subir `pages/`, `thumbs/`, `assets/` ni el PDF.
