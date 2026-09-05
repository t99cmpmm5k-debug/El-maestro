# Web homenaje a Fulgencio Romera Asensio

Versión digital de la exposición física homenaje a Fulgencio Romera Asensio
(1923–2021). Cada panel físico de la sala tiene un código QR que enlaza a
su página correspondiente en esta web.

## Cómo funciona (para quien mantenga esto en el futuro)

El contenido (texto, fotos, audio) está separado del diseño y la lógica.
Para añadir o cambiar un panel **nunca hace falta tocar HTML, CSS ni JS**:
basta con editar un archivo de texto en `/contenido/` y volver a generar
la web con un comando.

```
/
├── index.html              ← portada (GENERADA, no editar a mano)
├── recuerdos.html          ← muro de recuerdos (estática, se edita a mano)
├── libro.html              ← libro homenaje "El Maestro" (estática, se edita a mano)
├── galeria.html            ← galería de fotos (estática, se edita a mano)
├── build.js                ← script que genera index.html y paneles/*.html
├── contenido/
│   └── bloqueN-panelM.md   ← un archivo por panel: aquí se edita el contenido
├── paneles/
│   ├── plantilla.html      ← plantilla base de panel (diseño, no tocar por panel)
│   └── bloqueN-panelM.html ← página de cada panel (GENERADA)
├── plantillas/
│   └── portada.html        ← plantilla base de la portada (diseño)
├── media/
│   ├── fotos/               ← fotos de cada panel
│   └── audio/               ← fragmentos de audio de cada panel
└── css/estilo.css           ← estilo visual único para toda la web
```

### Secciones adicionales (`recuerdos.html`, `libro.html`, `galeria.html`)

A diferencia de la portada y los paneles, estas tres páginas **no se generan**
con `build.js`: no tienen contenido variable por elemento (no hay un archivo
por recuerdo, por foto de galería, etc.), así que son HTML estático de toda
la vida que se edita directamente en el propio archivo. Todas usan el mismo
`css/estilo.css`, así que comparten colores, tipografía y estilo de tarjeta
con el resto de la web.

- **`recuerdos.html`** — Formulario "Comparte tu recuerdo de Fulgencio" (aún
  sin backend: el botón muestra un aviso "Función pendiente de conectar";
  hay un comentario en el propio HTML indicando dónde conectar un servicio
  como [Formspree](https://formspree.io) más adelante) y, debajo, un muro
  con tarjetas de recuerdos ya aprobados — de momento 3 de ejemplo,
  claramente marcadas como PLACEHOLDER, con el estilo de nota de papel
  antiguo (rotación ligera, chincheta, sombra, firma en cursiva).
- **`libro.html`** — Página de espera para el libro digitalizado "El
  Maestro" (~55 relatos de antiguos alumnos). Deja preparado un contenedor
  (`.lector-libro-placeholder`) con un comentario indicando dónde iría el
  lector de páginas (flipbook) cuando el libro esté digitalizado; todavía
  no está implementado.
- **`galeria.html`** — Grid de miniaturas de fotos históricas, agrupadas por
  década a modo de ejemplo ("Años 20-30", etc.). Usa el mismo placeholder
  de foto (`media/fotos/placeholder.svg`) que las tarjetas de bloque de la
  portada, mientras no haya fotos reales organizadas.

La portada enlaza a las tres desde la sección "Más allá de su historia", al
final del recorrido (después de los 6 capítulos), como una lista sencilla de
enlaces con descripción breve — deliberadamente más discreta que las fichas
de capítulo, para no competir con la narrativa cronológica principal.

### Por qué esta solución (y no Jekyll u otro framework)

GitHub Pages puede generar sitios automáticamente con Jekyll, pero eso añade
"magia" (plugins, layouts, Liquid) que complica entender y tocar la web
dentro de 10 años. En su lugar, `build.js` es un script de Node.js muy corto,
sin ninguna dependencia externa (solo usa módulos incluidos en Node: `fs` y
`path`), que hace exactamente una cosa: leer `/contenido/*.md` y rellenar
las dos plantillas HTML. El resultado son archivos HTML corrientes que
GitHub Pages sirve tal cual, sin ningún paso de compilación en el servidor.

Se eligió Node.js (en vez de, por ejemplo, Python) porque ya está instalado
en este ordenador; el script no usa ninguna característica moderna rara,
así que seguirá funcionando con cualquier versión de Node razonablemente
reciente.

## Cómo añadir un panel nuevo

1. Añade la foto a `media/fotos/` y el audio a `media/audio/`.
2. Crea un archivo `contenido/bloqueN-panelM.md` (usa el número de bloque
   y un número de orden dentro del bloque). Formato:

   ```
   ---
   id: bloque2-panel1
   bloque: 2
   orden: 1
   titulo: Título del panel
   foto: media/fotos/nombre-foto.jpg
   foto_alt: Descripción breve de la foto para accesibilidad
   audio: media/audio/nombre-audio.mp3
   audio_fuente: Entrevista grabada en 1998, minuto 12:30
   cita: La cita textual destacada que se muestra en grande.
   placeholder: false
   ---

   Primer párrafo de contexto histórico-social.

   Segundo párrafo, si hace falta. Cada párrafo separado por una línea
   en blanco se convierte en un <p> independiente.
   ```

   Campos:
   - `id`: identificador único: será el nombre del archivo generado
     (`paneles/<id>.html`) y el que debe usarse en la URL de cada QR.
   - `bloque`: número de bloque cronológico (1 al 6, ver más abajo).
   - `orden`: orden del panel dentro de su bloque en la portada.
   - `titulo`, `foto`, `foto_alt`, `audio`, `audio_fuente`, `cita`: como
     en el ejemplo. Las rutas de `foto` y `audio` son siempre relativas
     a la raíz del proyecto (empiezan por `media/...`).
   - `placeholder`: pon `true` mientras el contenido de ese panel sea
     provisional; `false` (o quita el campo) cuando el contenido sea el
     definitivo. El aviso de "contenido provisional" ya no se muestra como
     elemento visual al usuario final (rompía la estética de archivo
     histórico) — solo queda un comentario en el HTML generado y un
     `console.log()`, visibles únicamente para quien abra las herramientas
     de desarrollo.
   - El texto debajo de la segunda línea `---` es el contexto histórico-social.

3. Ejecuta `node build.js` desde la raíz del proyecto.
4. Comprueba el resultado en local (ver más abajo).
5. Haz commit de **todo**: el `.md` nuevo y también los archivos generados
   (`index.html` y `paneles/<id>.html`), y haz push.

Los 6 bloques cronológicos (nombre, rango de fechas y descripción breve)
son parte fija de la estructura del proyecto y están definidos dentro de
`build.js` (constante `BLOQUES`). Si algún día cambian las fechas, el
nombre o la descripción de un bloque, se edita ahí — no hace falta tocar
el contenido de cada panel.

Internamente (nombres de archivo, campo `bloque` del `.md`, la propia
constante `BLOQUES`) se sigue llamando "bloque", pero en todo lo que ve el
usuario final se muestra como "Capítulo 01", "Capítulo 02"... — es un
cambio solo de nomenclatura pública, decidido para que la web se sienta
como un archivo histórico y no como una web con secciones administrativas.

### Cómo navega la portada

La portada muestra una ficha de archivo por capítulo (no una por panel).
Cada ficha enlaza al **primer panel** de ese capítulo (el de `orden` más
bajo). Si un capítulo tiene más de un panel, los siguientes solo son
accesibles desde su propio código QR físico, no desde la portada — cada
panel además muestra en su cabecera un indicador "N / total" con la
posición de ese panel dentro del recorrido completo (calculado
automáticamente por `build.js` según cuántos paneles existan en cada
momento).

## Cómo sustituir un panel de ejemplo/placeholder por contenido real

1. Sustituye la foto/audio de ejemplo en `media/` por los definitivos
   (puedes usar el mismo nombre de archivo o uno nuevo).
2. Edita el `.md` de ese panel en `/contenido/` con el texto, la cita y
   la fuente del audio reales, y cambia `placeholder: true` a
   `placeholder: false`.
3. Ejecuta `node build.js` y comprueba el resultado en local.
4. Commit y push.

## Cómo probarlo en local

Este proyecto no necesita instalar nada para verse (es HTML/CSS/JS
corriente), pero conviene servirlo con un pequeño servidor local en vez de
abrir los archivos directamente con doble clic, para que se comporte igual
que en GitHub Pages:

```bash
node build.js                 # genera index.html y paneles/*.html
npx serve .                   # o: python -m http.server 8000
```

Luego abre en el navegador la URL que indique el comando (con `npx serve`
suele ser `http://localhost:3000`; con `python -m http.server 8000` sería
`http://localhost:8000`). Prueba especialmente desde el móvil (usando la
IP de tu ordenador en la misma red Wi-Fi) para comprobar el botón de
"un solo toque" tal y como lo usará la gente en la sala.

Actualmente hay dos paneles de ejemplo dentro del Capítulo 1
(`contenido/bloque1-panel1.md` y `bloque1-panel2.md`, con fotos reales de
prueba distintas) — el segundo solo existe para comprobar el diseño de foto
a pantalla completa con más de una fotografía; solo el primero es accesible
desde la portada (el de `orden` más bajo), el segundo solo se ve entrando
directamente en `paneles/bloque1-panel2.html`. Los demás capítulos aparecen
en la portada con su misma ficha de archivo (foto, número y descripción)
pero con la foto en tono apagado y un discreto "Próximamente" en vez de
"Explorar capítulo →", hasta que se añada contenido real.

En cada panel, la etiqueta del capítulo y el título viven **dentro** de la
foto a pantalla completa (superpuestos sobre el degradado oscuro de la
parte inferior), no debajo en el cuerpo de texto — así toda la pantalla
inicial es la fotografía, con el título, la etiqueta y el botón de audio
flotando encima.

## Desplegar en GitHub Pages

1. Sube este repositorio a GitHub.
2. En el repositorio: **Settings → Pages → Build and deployment → Source:
   "Deploy from a branch"**, rama `main`, carpeta `/ (root)`.
3. Cada vez que quieras publicar cambios: ejecuta `node build.js`, haz
   commit de los archivos generados y haz push a `main`. GitHub Pages
   se actualiza solo, sin ningún paso de compilación adicional (los
   archivos `.html` ya están generados en el propio repositorio).
