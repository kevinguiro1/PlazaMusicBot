// utils/filtroContenido.js - Sistema avanzado de filtrado de contenido
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar palabras prohibidas
let palabrasProhibidas = null;

function cargarPalabrasProhibidas() {
  try {
    const rutaArchivo = path.join(__dirname, '../data/palabras-prohibidas.json');
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    palabrasProhibidas = JSON.parse(contenido);
    log(`✅ Palabras prohibidas cargadas: ${Object.keys(palabrasProhibidas.categorias).length} categorías`, 'info');
  } catch (error) {
    log(`❌ Error cargando palabras prohibidas: ${error.message}`, 'error');
    // Fallback a lista básica
    palabrasProhibidas = {
      categorias: {
        lenguaje_ofensivo: {
          severidad: 'medio',
          accion: 'advertencia',
          palabras: ['puto', 'puta', 'pendejo', 'cabron']
        }
      }
    };
  }
}

// Cargar palabras al iniciar
cargarPalabrasProhibidas();

/**
 * Normalizar texto (quitar acentos, convertir a minúsculas)
 */
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim();
}

/**
 * Verificar si un texto contiene palabras prohibidas
 */
export function filtrarContenido(texto) {
  if (!texto || typeof texto !== 'string') {
    return {
      permitido: true,
      categoriasDetectadas: [],
      palabrasDetectadas: []
    };
  }

  const textoNormalizado = normalizarTexto(texto);
  const categoriasDetectadas = [];
  const palabrasDetectadas = [];
  let severidadMaxima = 'bajo';

  // Verificar cada categoría
  for (const [categoriaKey, categoria] of Object.entries(palabrasProhibidas.categorias)) {
    for (const palabra of categoria.palabras) {
      const palabraNormalizada = normalizarTexto(palabra);

      // Buscar palabra completa o como parte de una frase
      const patron = new RegExp(`\\b${palabraNormalizada.replace(/\s+/g, '\\s+')}\\b`, 'i');

      if (patron.test(textoNormalizado)) {
        categoriasDetectadas.push({
          categoria: categoriaKey,
          nombre: categoria.nombre,
          severidad: categoria.severidad,
          accion: categoria.accion
        });

        palabrasDetectadas.push(palabra);

        // Actualizar severidad máxima
        if (compararSeveridad(categoria.severidad, severidadMaxima) > 0) {
          severidadMaxima = categoria.severidad;
        }

        log(`🚫 Palabra prohibida detectada: "${palabra}" (${categoria.nombre})`, 'warn');
      }
    }
  }

  // Determinar si se permite el mensaje
  const permitido = categoriasDetectadas.length === 0;

  return {
    permitido,
    categoriasDetectadas,
    palabrasDetectadas,
    severidad: severidadMaxima,
    accion: determinarAccion(categoriasDetectadas)
  };
}

/**
 * Comparar severidades
 */
function compararSeveridad(sev1, sev2) {
  const niveles = {
    'bajo': 1,
    'medio': 2,
    'alto': 3,
    'critico': 4
  };

  return niveles[sev1] - niveles[sev2];
}

/**
 * Determinar acción a tomar según las categorías detectadas
 */
function determinarAccion(categorias) {
  if (categorias.length === 0) {
    return null;
  }

  // Buscar la acción más severa
  const prioridad = {
    'advertencia': 1,
    'bloqueo_temporal': 2,
    'bloqueo_permanente': 3
  };

  let accionMaxima = 'advertencia';

  for (const cat of categorias) {
    if (prioridad[cat.accion] > prioridad[accionMaxima]) {
      accionMaxima = cat.accion;
    }
  }

  return accionMaxima;
}

/**
 * Obtener mensaje de rechazo según la acción
 */
export function obtenerMensajeRechazo(resultado) {
  if (!resultado || resultado.permitido) {
    return null;
  }

  const { accion, categoriasDetectadas } = resultado;
  const categorias = categoriasDetectadas.map(c => c.nombre).join(', ');

  switch (accion) {
    case 'advertencia':
      return `⚠️ *Advertencia de Contenido*\n\n` +
             `Tu mensaje contiene lenguaje inapropiado.\n\n` +
             `Categorías detectadas: ${categorias}\n\n` +
             `Por favor, evita este tipo de lenguaje. ` +
             `Reincidencias resultarán en bloqueo temporal.`;

    case 'bloqueo_temporal':
      return `🚫 *Bloqueo Temporal*\n\n` +
             `Tu mensaje ha sido bloqueado por contener contenido prohibido.\n\n` +
             `Categorías: ${categorias}\n\n` +
             `⏰ Bloqueo por 1 hora.\n` +
             `Nuevas infracciones resultarán en bloqueo permanente.`;

    case 'bloqueo_permanente':
      return `🚨 *Bloqueo Permanente*\n\n` +
             `Tu mensaje contiene contenido severamente prohibido.\n\n` +
             `Categorías: ${categorias}\n\n` +
             `❌ Has sido bloqueado permanentemente del sistema.\n` +
             `Contacta a un administrador si crees que es un error.`;

    default:
      return `🚫 Mensaje bloqueado por contenido inapropiado.`;
  }
}

/**
 * Recargar palabras prohibidas desde el archivo
 */
export function recargarPalabrasProhibidas() {
  cargarPalabrasProhibidas();
  return palabrasProhibidas;
}

/**
 * Agregar palabra prohibida
 */
export function agregarPalabraProhibida(categoria, palabra) {
  if (!palabrasProhibidas.categorias[categoria]) {
    throw new Error(`Categoría no existe: ${categoria}`);
  }

  const palabraNormalizada = normalizarTexto(palabra);

  if (!palabrasProhibidas.categorias[categoria].palabras.includes(palabraNormalizada)) {
    palabrasProhibidas.categorias[categoria].palabras.push(palabraNormalizada);
    guardarPalabrasProhibidas();
    log(`➕ Palabra agregada: "${palabra}" en categoría ${categoria}`, 'info');
    return true;
  }

  return false;
}

/**
 * Eliminar palabra prohibida
 */
export function eliminarPalabraProhibida(categoria, palabra) {
  if (!palabrasProhibidas.categorias[categoria]) {
    throw new Error(`Categoría no existe: ${categoria}`);
  }

  const palabraNormalizada = normalizarTexto(palabra);
  const index = palabrasProhibidas.categorias[categoria].palabras.indexOf(palabraNormalizada);

  if (index !== -1) {
    palabrasProhibidas.categorias[categoria].palabras.splice(index, 1);
    guardarPalabrasProhibidas();
    log(`➖ Palabra eliminada: "${palabra}" de categoría ${categoria}`, 'info');
    return true;
  }

  return false;
}

/**
 * Guardar palabras prohibidas al archivo
 */
function guardarPalabrasProhibidas() {
  try {
    const rutaArchivo = path.join(__dirname, '../data/palabras-prohibidas.json');
    palabrasProhibidas.ultimaActualizacion = new Date().toISOString().split('T')[0];
    fs.writeFileSync(rutaArchivo, JSON.stringify(palabrasProhibidas, null, 2), 'utf-8');
    log('💾 Palabras prohibidas guardadas', 'info');
  } catch (error) {
    log(`❌ Error guardando palabras prohibidas: ${error.message}`, 'error');
  }
}

/**
 * Obtener todas las categorías y palabras
 */
export function obtenerCategorias() {
  return palabrasProhibidas.categorias;
}

/**
 * Obtener estadísticas de palabras prohibidas
 */
export function obtenerEstadisticas() {
  const stats = {
    totalCategorias: Object.keys(palabrasProhibidas.categorias).length,
    totalPalabras: 0,
    porCategoria: {}
  };

  for (const [key, categoria] of Object.entries(palabrasProhibidas.categorias)) {
    const count = categoria.palabras.length;
    stats.totalPalabras += count;
    stats.porCategoria[key] = {
      nombre: categoria.nombre,
      cantidad: count,
      severidad: categoria.severidad
    };
  }

  return stats;
}
