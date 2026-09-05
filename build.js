#!/usr/bin/env node
/**
 * Generador estático de la web homenaje a Fulgencio Romera Asensio.
 *
 * Qué hace:
 *   1. Lee cada archivo /contenido/*.md (cabecera de campos + texto).
 *   2. Rellena /paneles/plantilla.html con esos datos y escribe
 *      /paneles/<id>.html — una página por panel.
 *   3. Rellena /plantillas/portada.html con una tarjeta por cada uno de
 *      los 6 bloques cronológicos (enlazando al primer panel de cada uno)
 *      y escribe /index.html en la raíz.
 *
 * No usa dependencias externas (solo módulos incluidos en Node.js), para
 * que este proyecto siga funcionando dentro de muchos años sin mantenimiento.
 *
 * Uso: node build.js
 *
 * Los 6 bloques cronológicos son parte fija de la estructura del proyecto
 * (no cambian cuando se añade contenido), así que viven aquí, no en /contenido.
 */

const fs = require("fs");
const path = require("path");

const RAIZ = __dirname;
const DIR_CONTENIDO = path.join(RAIZ, "contenido");
const DIR_PANELES = path.join(RAIZ, "paneles");
const PLANTILLA_PANEL = path.join(DIR_PANELES, "plantilla.html");
const PLANTILLA_PORTADA = path.join(RAIZ, "plantillas", "portada.html");
const SALIDA_INDEX = path.join(RAIZ, "index.html");

const BLOQUES = [
  {
    numero: 1,
    nombre: "Infancia y raíces",
    rango: "1923–1936",
    descripcion: "Sus primeros años, su familia y el pueblo que lo vio crecer.",
    // PRUEBA VISUAL, NO DEFINITIVA: foto real usada solo para ver cómo se
    // ve el diseño con fotografías reales. La ficha de este capítulo en la
    // portada usa esta foto en vez de la del panel de ejemplo a propósito
    // (para probar dos fotos reales distintas a la vez); la asignación
    // final de qué foto va en cada capítulo puede cambiar más adelante.
    fotoPrueba: "media/fotos/foto-confirmacion-infancia.jpg",
    fotoPruebaAlt:
      "Fotografía histórica en blanco y negro de una ceremonia de confirmación, con un sacerdote entregando algo a un joven arrodillado.",
  },
  {
    numero: 2,
    nombre: "Guerra Civil y posguerra",
    rango: "1936–1945",
    descripcion: "Los años difíciles que marcaron su juventud y forjaron su carácter.",
  },
  {
    numero: 3,
    nombre: "La vocación de maestro",
    rango: "1945–1954",
    descripcion: "El camino que lo llevó a convertirse en maestro y fundar su propia academia.",
  },
  {
    numero: 4,
    nombre: "Toda una vida enseñando",
    rango: "1954–1978",
    descripcion: "Décadas de aulas, alumnos y una academia que fue mucho más que una escuela.",
  },
  {
    numero: 5,
    nombre: "Los últimos años en activo",
    rango: "1978–1988",
    descripcion: "La recta final de su carrera, sin perder nunca su vocación por enseñar.",
  },
  {
    numero: 6,
    nombre: "El legado",
    rango: "1988–2021",
    descripcion: "El recuerdo que dejó en generaciones de alumnos y en todo un pueblo.",
  },
];

// El aviso de "contenido provisional" NO se muestra como elemento visual al
// usuario final (rompía la estética de archivo histórico) — solo queda un
// comentario en el HTML y un console.log(), visibles únicamente para quien
// abra las herramientas de desarrollo.
const AVISO_PROVISIONAL_HTML =
  '<!-- CONTENIDO PROVISIONAL: pendiente de sustituir por contenido real -->\n' +
  '<script>console.log("%c\\u26A0 Contenido provisional: pendiente de sustituir por contenido real.", "color:#9A7441;font-weight:bold;");</script>';

function numeroCapitulo(numero) {
  return String(numero).padStart(2, "0");
}

function leerCamposYCuerpo(texto, nombreArchivo) {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  if (lineas[0].trim() !== "---") {
    throw new Error(`${nombreArchivo}: debe empezar con una línea "---" (cabecera de campos)`);
  }
  const campos = {};
  let i = 1;
  for (; i < lineas.length; i++) {
    const linea = lineas[i];
    if (linea.trim() === "---") {
      i++;
      break;
    }
    const idx = linea.indexOf(":");
    if (idx === -1) continue;
    const clave = linea.slice(0, idx).trim();
    const valor = linea.slice(idx + 1).trim();
    campos[clave] = valor;
  }
  const cuerpo = lineas.slice(i).join("\n").trim();
  return { campos, cuerpo };
}

function escaparHtml(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function markdownAParrafos(texto) {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `    <p>${escaparHtml(p).replace(/\n/g, " ")}</p>`)
    .join("\n");
}

function rellenarPlantilla(plantilla, valores) {
  let resultado = plantilla;
  for (const [clave, valor] of Object.entries(valores)) {
    resultado = resultado.split(`{{${clave}}}`).join(valor);
  }
  return resultado;
}

function cargarPaneles() {
  if (!fs.existsSync(DIR_CONTENIDO)) return [];
  const archivos = fs.readdirSync(DIR_CONTENIDO).filter((f) => f.endsWith(".md"));
  return archivos.map((archivo) => {
    const ruta = path.join(DIR_CONTENIDO, archivo);
    const { campos, cuerpo } = leerCamposYCuerpo(fs.readFileSync(ruta, "utf8"), archivo);
    if (!campos.id) throw new Error(`${archivo}: falta el campo "id"`);
    if (!campos.bloque) throw new Error(`${archivo}: falta el campo "bloque"`);
    return {
      archivo,
      id: campos.id,
      bloque: parseInt(campos.bloque, 10),
      orden: campos.orden ? parseInt(campos.orden, 10) : 999,
      titulo: campos.titulo || "(sin título)",
      foto: campos.foto || "",
      fotoAlt: campos.foto_alt || "",
      audio: campos.audio || "",
      audioFuente: campos.audio_fuente || "",
      cita: campos.cita || "",
      placeholder: (campos.placeholder || "").toLowerCase() === "true",
      contexto: cuerpo,
    };
  });
}

function calcularPosiciones(paneles) {
  // Orden canónico del recorrido completo: por bloque y luego por orden
  // dentro del bloque. Sirve para el indicador "N / total" de cada panel.
  const ordenados = [...paneles].sort((a, b) => a.bloque - b.bloque || a.orden - b.orden);
  const posiciones = new Map();
  ordenados.forEach((p, i) => posiciones.set(p.id, i + 1));
  return { posiciones, total: ordenados.length };
}

function generarPaneles(paneles) {
  const plantillaPanel = fs.readFileSync(PLANTILLA_PANEL, "utf8");
  const { posiciones, total } = calcularPosiciones(paneles);

  for (const panel of paneles) {
    const bloqueInfo = BLOQUES.find((b) => b.numero === panel.bloque);
    const etiquetaBloque = bloqueInfo
      ? `Capítulo ${numeroCapitulo(bloqueInfo.numero)} · ${bloqueInfo.nombre} (${bloqueInfo.rango})`
      : `Capítulo ${numeroCapitulo(panel.bloque)}`;

    const html = rellenarPlantilla(plantillaPanel, {
      TITULO: escaparHtml(panel.titulo),
      FOTO: `../${panel.foto}`,
      FOTO_ALT: escaparHtml(panel.fotoAlt),
      AUDIO: `../${panel.audio}`,
      AUDIO_FUENTE: escaparHtml(panel.audioFuente),
      CITA: escaparHtml(panel.cita),
      CONTEXTO_HTML: markdownAParrafos(panel.contexto),
      BLOQUE_ETIQUETA: escaparHtml(etiquetaBloque),
      AVISO_PROVISIONAL: panel.placeholder ? AVISO_PROVISIONAL_HTML : "",
      POSICION: String(posiciones.get(panel.id)),
      TOTAL: String(total),
    });

    const rutaSalida = path.join(DIR_PANELES, `${panel.id}.html`);
    fs.writeFileSync(rutaSalida, html, "utf8");
    console.log("Panel generado:", path.relative(RAIZ, rutaSalida));
  }
}

function generarTarjetaBloque(bloque, paneles) {
  const panelesBloque = paneles
    .filter((p) => p.bloque === bloque.numero)
    .sort((a, b) => a.orden - b.orden);
  const primerPanel = panelesBloque[0];

  const cifra = numeroCapitulo(bloque.numero);
  const numeroHtml = `    <div class="ficha-capitulo-numero">
      <span class="ficha-capitulo-numero-etiqueta">Capítulo</span>
      <span class="ficha-capitulo-numero-cifra">${cifra}</span>
    </div>`;

  if (!primerPanel) {
    return `  <div class="ficha-capitulo vacia">
    <div class="ficha-capitulo-foto ficha-capitulo-foto-apagada">
      <img src="media/fotos/placeholder.svg" alt="Fotografía de ejemplo en blanco y negro, contenido provisional" />
    </div>
    <div class="ficha-capitulo-info">
${numeroHtml}
      <h2 class="ficha-capitulo-titulo">${escaparHtml(bloque.nombre)}</h2>
      <span class="ficha-capitulo-periodo">${escaparHtml(bloque.rango)}</span>
      <p class="ficha-capitulo-descripcion">${escaparHtml(bloque.descripcion)}</p>
      <span class="ficha-capitulo-proximamente">Próximamente</span>
    </div>
  </div>`;
  }

  // PRUEBA VISUAL: si el bloque define fotoPrueba, se usa esa foto para la
  // ficha de la portada en vez de la foto propia del panel (ver comentario
  // junto a BLOQUES más arriba). Quitar `fotoPrueba` del bloque cuando se
  // decida la asignación definitiva de fotos por capítulo.
  const fotoTarjeta = bloque.fotoPrueba || primerPanel.foto;
  const fotoTarjetaAlt = bloque.fotoPrueba ? bloque.fotoPruebaAlt || "" : primerPanel.fotoAlt;

  return `  <a class="ficha-capitulo" href="paneles/${primerPanel.id}.html">
    <div class="ficha-capitulo-foto">
      <img src="${fotoTarjeta}" alt="${escaparHtml(fotoTarjetaAlt)}" />
    </div>
    <div class="ficha-capitulo-info">
${numeroHtml}
      <h2 class="ficha-capitulo-titulo">${escaparHtml(bloque.nombre)}</h2>
      <span class="ficha-capitulo-periodo">${escaparHtml(bloque.rango)}</span>
      <p class="ficha-capitulo-descripcion">${escaparHtml(bloque.descripcion)}</p>
      <span class="ficha-capitulo-cta">Explorar capítulo →</span>
    </div>
  </a>`;
}

function generarPortada(paneles) {
  const plantillaPortada = fs.readFileSync(PLANTILLA_PORTADA, "utf8");
  const tarjetas = BLOQUES.map((b) => generarTarjetaBloque(b, paneles)).join("\n");
  const hayPlaceholder = paneles.some((p) => p.placeholder);

  const html = rellenarPlantilla(plantillaPortada, {
    TARJETAS_BLOQUES: tarjetas,
    AVISO_PROVISIONAL: hayPlaceholder ? AVISO_PROVISIONAL_HTML : "",
  });

  fs.writeFileSync(SALIDA_INDEX, html, "utf8");
  console.log("Portada generada:", path.relative(RAIZ, SALIDA_INDEX));
}

function main() {
  const paneles = cargarPaneles();
  if (paneles.length === 0) {
    console.warn("Aviso: no se encontró ningún archivo en /contenido/*.md");
  }
  generarPaneles(paneles);
  generarPortada(paneles);
  console.log(`\nListo. ${paneles.length} panel(es) procesado(s).`);
}

main();
