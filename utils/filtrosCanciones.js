// utils/filtrosCanciones.js - Filtros de Contenido
import { log } from './logger.js';

// Lista negra de términos sensibles (títulos/artistas)
const listaNegra = [
  'narco', 'violencia', 'muerte', 'asesino', 'asesinar',
  'matar', 'sexo', 'porn', 'verga', 'puta', 'puto',
  'culero', 'mierda', 'chingad', 'bélico', 'ak-47',
  'cuerno de chivo', 'sinaloa', 'cartel', 'droga',
  'cocaina', 'heroina', 'cristal', 'sicario'
];

/**
 * Filtrar un array de tracks de Spotify
 */
export async function obtenerCancionesFiltradas(canciones) {
  if (!Array.isArray(canciones)) {
    log('⚠️ obtenerCancionesFiltradas recibió un parámetro inválido', 'warn');
    return [];
  }

  const filtradas = canciones.filter(track => {
    if (!track || !track.name) return false;

    // 1) Quita las explícitas según Spotify
    if (track.explicit) {
      log(`🚫 Canción rechazada (explícita): ${track.name}`, 'debug');
      return false;
    }

    // 2) Quita si título o artista contiene palabra negra
    const texto = (
      track.name +
      ' ' +
      (track.artists?.map(a => a.name).join(' ') || '')
    ).toLowerCase();

    for (const palabra of listaNegra) {
      if (texto.includes(palabra)) {
        log(`🚫 Canción rechazada (palabra prohibida): ${track.name}`, 'debug');
        return false;
      }
    }

    // 3) Pasa todo lo demás
    return true;
  });

  log(`✅ Filtrado: ${filtradas.length}/${canciones.length} canciones aprobadas`, 'debug');

  return filtradas;
}

/**
 * Verificar si una canción es apropiada
 */
export function esCancionApropiada(cancion) {
  if (!cancion || !cancion.name) return false;

  // Verificar explícito
  if (cancion.explicit) return false;

  // Verificar palabras prohibidas
  const texto = (
    cancion.name +
    ' ' +
    (cancion.artists?.map(a => a.name).join(' ') || '')
  ).toLowerCase();

  for (const palabra of listaNegra) {
    if (texto.includes(palabra)) {
      return false;
    }
  }

  return true;
}
