// perfiles/dj.js - Manejador del Perfil DJ
import {
  obtenerPlaylist,
  eliminarCancionDePlaylist,
  limpiarPlaylist,
  agregarCancionAPlaylist,
  buscarCancionEnSpotify
} from '../conexion/spotify.js';
import { obtenerMenuDJ } from '../core/menus.js';
import { generarReporte } from '../core/monitoring.js';
import { log } from '../utils/logger.js';
import { manejarUsuarioNormal } from './usuario.js';

/**
 * Manejar perfil DJ
 */
export async function manejarDJ(usuario, mensaje, estado) {
  const texto = mensaje.trim();

  // Si no está en contexto DJ, verificar si quiere acceder al panel
  if (!usuario.contexto || usuario.contexto === 'menu_dj') {
    const opcion = parseInt(texto);

    switch (opcion) {
      case 6:
        usuario.contexto = 'menu_dj';
        return obtenerMenuDJ();

      default:
        // Usar funcionalidad de usuario normal
        return await manejarUsuarioNormal(usuario, mensaje, estado);
    }
  }

  // Contexto de menú DJ
  if (usuario.contexto === 'menu_dj') {
    return await manejarMenuDJ(usuario, texto, estado);
  }

  // Por defecto, funcionalidad normal
  return await manejarUsuarioNormal(usuario, mensaje, estado);
}

/**
 * Manejar menú DJ
 */
async function manejarMenuDJ(usuario, texto, estado) {
  const opcion = parseInt(texto);

  switch (opcion) {
    case 1:
      return await verColaCompleta();

    case 2:
      return await saltarCancion();

    case 3:
      usuario.contexto = 'dj_eliminar_cancion';
      return await verColaParaEliminar();

    case 4:
      return '🔄 Función de reordenar en desarrollo.\n\n' +
             '💡 Próximamente podrás cambiar el orden de las canciones.';

    case 5:
      return generarReporte(estado);

    case 6:
      usuario.contexto = 'dj_agregar_prioritaria';
      return '🎵 *AGREGAR CANCIÓN PRIORITARIA*\n\n' +
             'Escribe el nombre de la canción que quieres agregar al inicio de la cola.\n\n' +
             '0️⃣ Volver';

    case 7:
      usuario.contexto = 'dj_confirmar_limpieza';
      return '⚠️ *¿ESTÁS SEGURO?*\n\n' +
             '¿Quieres limpiar toda la playlist?\n' +
             'Esta acción no se puede deshacer.\n\n' +
             '1️⃣ Sí, limpiar playlist\n' +
             '0️⃣ No, cancelar';

    case 0:
      usuario.contexto = null;
      const { obtenerMenuPrincipal } = await import('../core/menus.js');
      return obtenerMenuPrincipal(usuario);

    default:
      return '❌ Opción inválida.\n\n' + obtenerMenuDJ();
  }
}

/**
 * Ver cola completa
 */
async function verColaCompleta() {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      return '📜 *COLA DE REPRODUCCIÓN*\n\n' +
             '🎵 La cola está vacía.';
    }

    let mensaje = `📜 *COLA COMPLETA DE REPRODUCCIÓN*\n\n`;
    mensaje += `Total: ${playlist.length} canciones\n\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    playlist.forEach((item, index) => {
      const track = item.track;
      const artistas = track.artists.map(a => a.name).join(', ');
      const duracion = formatearDuracion(track.duration_ms);
      const numero = index === 0 ? '▶️' : `${index + 1}`;

      mensaje += `${numero}. *${track.name}*\n`;
      mensaje += `   🎤 ${artistas} | ⏱️ ${duracion}\n\n`;
    });

    mensaje += `━━━━━━━━━━━━━━━━━━━━━`;

    return mensaje;
  } catch (error) {
    log(`❌ Error en verColaCompleta: ${error.message}`, 'error');
    return '❌ Error obteniendo la cola.';
  }
}

/**
 * Saltar canción actual
 */
async function saltarCancion() {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      return '❌ No hay canciones en la cola para saltar.';
    }

    const cancionActual = playlist[0].track;
    await eliminarCancionDePlaylist(cancionActual.uri);

    log(`⏭️ Canción saltada por DJ: ${cancionActual.name}`, 'info');

    return `⏭️ *Canción saltada*\n\n` +
           `🎵 ${cancionActual.name}\n` +
           `🎤 ${cancionActual.artists.map(a => a.name).join(', ')}\n\n` +
           `✅ Siguiente canción en reproducción.`;
  } catch (error) {
    log(`❌ Error en saltarCancion: ${error.message}`, 'error');
    return '❌ Error saltando la canción.';
  }
}

/**
 * Ver cola para eliminar
 */
async function verColaParaEliminar() {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      return '❌ No hay canciones en la cola.';
    }

    let mensaje = `🗑️ *ELIMINAR CANCIÓN*\n\n`;
    mensaje += `Selecciona el número de la canción a eliminar:\n\n`;

    const mostrar = Math.min(playlist.length, 20);

    for (let i = 0; i < mostrar; i++) {
      const track = playlist[i].track;
      const artistas = track.artists.map(a => a.name).join(', ');

      mensaje += `${i + 1}. ${track.name} - ${artistas}\n`;
    }

    mensaje += `\n0️⃣ Cancelar`;

    return mensaje;
  } catch (error) {
    log(`❌ Error en verColaParaEliminar: ${error.message}`, 'error');
    return '❌ Error obteniendo la cola.';
  }
}

/**
 * Formatear duración
 */
function formatearDuracion(ms) {
  const minutos = Math.floor(ms / 60000);
  const segundos = Math.floor((ms % 60000) / 1000);
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}
