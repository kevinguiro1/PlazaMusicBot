// core/history.js - Sistema de Historial de Canciones Tocadas
import { log } from '../utils/logger.js';

// Historial de canciones tocadas (URI -> timestamp)
const historialCanciones = new Map();

// Tiempo de bloqueo: 1 hora (en milisegundos)
const TIEMPO_BLOQUEO = 60 * 60 * 1000; // 1 hora

/**
 * Registrar que una canción fue tocada/agregada
 * @param {string} trackUri - URI de la canción en Spotify
 * @param {string} agregadoPor - Número del usuario que la agregó
 */
export function registrarCancionTocada(trackUri, agregadoPor = null) {
  historialCanciones.set(trackUri, {
    timestamp: Date.now(),
    agregadoPor: agregadoPor
  });

  log(`📝 Canción registrada en historial: ${trackUri}`, 'debug');
}

/**
 * Verificar si una canción está en periodo de bloqueo (menos de 1 hora)
 * @param {string} trackUri - URI de la canción
 * @returns {Object} - { bloqueada: boolean, minutosRestantes: number, minutosTranscurridos: number }
 */
export function verificarCancionBloqueada(trackUri) {
  const registro = historialCanciones.get(trackUri);

  if (!registro) {
    return {
      bloqueada: false,
      minutosRestantes: 0,
      minutosTranscurridos: 0
    };
  }

  const ahora = Date.now();
  const tiempoTranscurrido = ahora - registro.timestamp;
  const bloqueada = tiempoTranscurrido < TIEMPO_BLOQUEO;

  if (bloqueada) {
    const tiempoRestante = TIEMPO_BLOQUEO - tiempoTranscurrido;
    const minutosRestantes = Math.ceil(tiempoRestante / 60000);
    const minutosTranscurridos = Math.floor(tiempoTranscurrido / 60000);

    return {
      bloqueada: true,
      minutosRestantes,
      minutosTranscurridos
    };
  }

  return {
    bloqueada: false,
    minutosRestantes: 0,
    minutosTranscurridos: Math.floor(tiempoTranscurrido / 60000)
  };
}

/**
 * Obtener información de cuándo fue tocada una canción
 * @param {string} trackUri - URI de la canción
 * @returns {Object|null} - Información del registro o null si no existe
 */
export function obtenerInfoCancion(trackUri) {
  const registro = historialCanciones.get(trackUri);

  if (!registro) {
    return null;
  }

  const ahora = Date.now();
  const tiempoTranscurrido = ahora - registro.timestamp;
  const minutosTranscurridos = Math.floor(tiempoTranscurrido / 60000);

  return {
    timestamp: registro.timestamp,
    agregadoPor: registro.agregadoPor,
    minutosTranscurridos,
    fecha: new Date(registro.timestamp).toISOString()
  };
}

/**
 * Limpiar canciones antiguas del historial (más de 2 horas)
 */
export function limpiarHistorialAntiguo() {
  const ahora = Date.now();
  const TIEMPO_EXPIRACION = 2 * 60 * 60 * 1000; // 2 horas
  let eliminadas = 0;

  for (const [uri, registro] of historialCanciones.entries()) {
    if (ahora - registro.timestamp > TIEMPO_EXPIRACION) {
      historialCanciones.delete(uri);
      eliminadas++;
    }
  }

  if (eliminadas > 0) {
    log(`🧹 Historial limpiado: ${eliminadas} canciones antiguas eliminadas`, 'info');
  }

  return eliminadas;
}

/**
 * Obtener tamaño del historial
 * @returns {number} - Cantidad de canciones en historial
 */
export function obtenerTamanoHistorial() {
  return historialCanciones.size;
}

/**
 * Exportar historial para persistencia
 * @returns {Array} - Array con datos del historial
 */
export function exportarHistorial() {
  return Array.from(historialCanciones.entries()).map(([uri, data]) => ({
    uri,
    ...data
  }));
}

/**
 * Importar historial desde persistencia
 * @param {Array} datos - Array con datos del historial
 */
export function importarHistorial(datos) {
  if (!Array.isArray(datos)) return;

  datos.forEach(item => {
    const { uri, timestamp, agregadoPor } = item;
    if (uri && timestamp) {
      historialCanciones.set(uri, {
        timestamp,
        agregadoPor
      });
    }
  });

  log(`📥 Historial importado: ${datos.length} canciones`, 'info');
}

/**
 * Obtener canciones bloqueadas actualmente
 * @returns {Array} - Array de canciones bloqueadas con info
 */
export function obtenerCancionesBloqueadas() {
  const bloqueadas = [];
  const ahora = Date.now();

  for (const [uri, registro] of historialCanciones.entries()) {
    const tiempoTranscurrido = ahora - registro.timestamp;
    if (tiempoTranscurrido < TIEMPO_BLOQUEO) {
      const tiempoRestante = TIEMPO_BLOQUEO - tiempoTranscurrido;
      const minutosRestantes = Math.ceil(tiempoRestante / 60000);

      bloqueadas.push({
        uri,
        agregadoPor: registro.agregadoPor,
        minutosRestantes,
        timestamp: registro.timestamp
      });
    }
  }

  return bloqueadas.sort((a, b) => b.minutosRestantes - a.minutosRestantes);
}

// Limpiar historial antiguo cada 30 minutos
setInterval(limpiarHistorialAntiguo, 30 * 60 * 1000);

log('✅ Sistema de historial de canciones inicializado', 'info');
