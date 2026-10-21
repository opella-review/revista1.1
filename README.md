# Winter Evolution · Opella × Nadro — Edición actualizada

**Sitio estático listo para GitHub Pages, basado en el PDF definitivo proporcionado** (`Revista Opella Nadro 1.pdf`). Sustituye COMPLETAMENTE los archivos de la versión anterior: el diseño antiguo tenía 16 páginas y una proporción distinta, así que no conviene mezclar carpetas viejas con las nuevas.

## Publicación en GitHub Pages

1. Descomprime este ZIP.
2. En la rama que usa GitHub Pages, sustituye **todo el contenido** anterior por el contenido de esta carpeta (sube `index.html`, `.nojekyll`, `css/`, `js/`, `assets/`, `pages/`, `thumbs/`, `revista/` y `robots.txt` a la **raíz** publicada, no una subcarpeta adicional).
3. **Elimina** del repositorio `pages/page-11.webp` hasta `pages/page-16.webp`, y sus equivalentes en `thumbs/`, además del mockup anterior si aún existe.
4. Haz commit y espera la publicación normal de Pages. Recarga con Ctrl+F5 si ves archivos en caché. No requiere servidor, npm ni compilación.

Si conservas el enlace y configuración actuales de GitHub Pages, la dirección pública no cambia. Se mantiene `.nojekyll` para publicación estática.

## Qué se actualizó

- PDF final sin alterar, en `revista/revista-opella-winter-evolution.pdf` (mismo enlace interno que antes para evitar links rotos).
- 10 imágenes de páginas completas y 10 miniaturas, generadas del PDF nuevo.
- Portada de la web reemplazada por el arte **real** de la nueva edición; ya no aparece el mockup anterior.
- Colores, textos de inicio y metadatos acordes al diseño azul de la nueva revista.
- Lector ajustado a páginas verticales de proporción aproximada 3:4.
- Secuencia correcta en escritorio: **1 → 2–3 → 4–5 → 6–7 → 8–9 → 10**. En móvil: **1 → 2 → … → 10**.
- Miniaturas, contador, descripción accesible, descarga de PDF y caché CSS/JS actualizados (`v=4`).
- Se conservan navegación por flechas y deslizamiento, zoom, pantalla completa y transición de página; sólo se precarga el primer pliego para ahorrar datos móviles.

**Nota de contenido:** las cifras, textos, legales, precios y posibles marcadores provisionales que figuran en el PDF se reproducen fielmente. Revísalos con el equipo responsable antes de difundir la versión definitiva; no se han corregido ni inventado afirmaciones publicitarias.
