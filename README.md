# Winter Evolution · Opella × Nadro — Edición definitiva + vista previa social

Sitio estático para GitHub Pages: `https://opella-review.github.io/revista1.1/`.

## Qué contiene esta actualización

- `preview-social.jpg`: vista previa horizontal **1200 × 630 px** realizada con la portada **auténtica e íntegra** sobre fondo azul. La revista no ha sido rediseñada ni se ha alterado su PDF.
- `index.html`: añade las etiquetas Open Graph y Twitter/X Cards que permiten a plataformas compatibles mostrar la imagen, el título y la descripción al compartir el enlace.
- Elimina también el párrafo introductorio de la sección «Explora la nueva edición», tal como se solicitó anteriormente.
- Archivos del lector, PDF definitivo (10 páginas), imágenes y miniaturas conservados. El paquete completo omite los sobrantes `page-11.webp` a `page-16.webp` y el antiguo `assets/mockup.png`, que no se utilizan.

## La forma más segura de publicar solo la vista previa

Si el sitio de GitHub ya contiene otros cambios posteriores a este ZIP de origen, **no reemplaces todo el repositorio**. Usa `Opella_Actualizacion_Minima_Redes.zip`: contiene solamente `index.html` y `preview-social.jpg`. Antes de sustituir `index.html`, comprueba si hay cambios recientes en el archivo publicado; en ese caso, transfiere únicamente las etiquetas sociales del `<head>` a tu versión vigente para no perder ajustes.

Para publicar este paquete completo, descomprímelo y reemplaza el contenido de la raíz que utiliza GitHub Pages (`index.html`, `.nojekyll`, carpetas `assets`, `css`, `js`, `pages`, `thumbs`, `revista` y `robots.txt`), eliminando los archivos sobrantes de la edición antigua. No crees una carpeta adicional que altere la ruta pública.

## Verificar las tarjetas sociales

1. Tras publicar, abre directamente `https://opella-review.github.io/revista1.1/preview-social.jpg`. Debe cargar el JPG.
2. En el código fuente publicado, confirma las etiquetas `og:image`, `og:title`, `twitter:card` y `twitter:image` dentro de `<head>`.
3. Prueba el enlace normal `https://opella-review.github.io/revista1.1/` en WhatsApp, LinkedIn o Facebook y usa sus herramientas de inspección/depuración para actualizar posibles vistas previas antiguas.
4. El resultado final varía según la plataforma; las publicaciones normales de Instagram no convierten automáticamente una URL en una tarjeta de enlace.

El sitio no necesita npm, servidor de aplicación ni compilación: GitHub Pages sirve los archivos tal cual. No se cambió el JavaScript ni el CSS del lector.
