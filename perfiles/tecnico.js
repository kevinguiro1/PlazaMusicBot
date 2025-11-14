// perfiles/tecnico.js - Manejador del Perfil Técnico
import {
  obtenerPlaylist,
  eliminarCancionDePlaylist,
  limpiarPlaylist,
  agregarCancionAPlaylist,
  buscarCancionEnSpotify,
  pausarReproduccion,
  reanudarReproduccion,
  subirVolumen,
  bajarVolumen,
  siguienteCancion,
  cancionAnterior,
  obtenerReproduccionActual
} from '../conexion/spotify.js';
import { obtenerMenuTecnico } from '../core/menus.js';
import { generarReporte } from '../core/monitoring.js';
import { log } from '../utils/logger.js';
import { manejarUsuarioNormal } from './usuario.js';

/**
 * Manejar perfil Técnico
 */
export async function manejarTecnico(usuario, mensaje, estado) {
  const texto = mensaje.trim();

  // Si no está en contexto Técnico, verificar si quiere acceder al panel
  if (!usuario.contexto || usuario.contexto === 'menu_tecnico') {
    const opcion = parseInt(texto);

    switch (opcion) {
      case 7:
        usuario.contexto = 'menu_tecnico';
        return obtenerMenuTecnico();

      default:
        // Usar funcionalidad de usuario normal
        return await manejarUsuarioNormal(usuario, mensaje, estado);
    }
  }

  // Contexto de menú DJ
  if (usuario.contexto === 'menu_tecnico') {
    return await manejarMenuDJ(usuario, texto, estado);
  }

  // Por defecto, funcionalidad normal
  return await manejarUsuarioNormal(usuario, mensaje, estado);
}

/**
 * Manejar menú Técnico
 */
async function manejarMenuDJ(usuario, texto, estado) {
  const opcion = parseInt(texto);

  switch (opcion) {
    case 1:
      return await togglePausaReproduccion();

    case 2:
      return await controlarVolumen('subir');

    case 3:
      return await controlarVolumen('bajar');

    case 4:
      return await saltarSiguiente();

    case 5:
      return await volverAnterior();

    case 6:
      return await verColaCompleta();

    case 7:
      usuario.contexto = 'tecnico_eliminar_cancion';
      return await verColaParaEliminar();

    case 8:
      usuario.contexto = 'tecnico_agregar_prioritaria';
      return '🎵 *AGREGAR CANCIÓN PRIORITARIA*\n\n' +
             'Escribe el nombre de la canción que quieres agregar al inicio de la cola.\n\n' +
             '0️⃣ Volver';

    case 9:
      usuario.contexto = 'tecnico_confirmar_limpieza';
      return '⚠️ *¿ESTÁS SEGURO?*\n\n' +
             '¿Quieres limpiar toda la playlist?\n' +
             'Esta acción no se puede deshacer.\n\n' +
             '1️⃣ Sí, limpiar playlist\n' +
             '0️⃣ No, cancelar';

    case 10:
      return generarReporte(estado);

    case 11:
      return await verEstadoReproduccion();

    case 0:
      usuario.contexto = null;
      const { obtenerMenuPrincipal } = await import('../core/menus.js');
      return obtenerMenuPrincipal(usuario);

    default:
      return '❌ Opción inválida.\n\n' + obtenerMenuTecnico();
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

    log(`⏭️ Canción saltada por Técnico: ${cancionActual.name}`, 'info');

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

/**
 * Pausar/Reanudar reproducción
 */
async function togglePausaReproduccion() {
  try {
    const estado = await obtenerReproduccionActual();

    if (!estado) {
      return '❌ No hay dispositivo de reproducción activo.\n\n' +
             '💡 Asegúrate de que Spotify esté reproduciendo en algún dispositivo.';
    }

    if (estado.is_playing) {
      await pausarReproduccion();
      return '⏸️ *REPRODUCCIÓN PAUSADA*\n\n' +
             '✅ La música se ha pausado correctamente.';
    } else {
      await reanudarReproduccion();
      return '▶️ *REPRODUCCIÓN REANUDADA*\n\n' +
             '✅ La música continúa.';
    }
  } catch (error) {
    log(`❌ Error en togglePausaReproduccion: ${error.message}`, 'error');
    return '❌ Error controlando la reproducción.';
  }
}

/**
 * Controlar volumen
 */
async function controlarVolumen(accion) {
  try {
    let resultado;
    const estado = await obtenerReproduccionActual();

    if (!estado || !estado.device) {
      return '❌ No hay dispositivo de reproducción activo.';
    }

    const volumenActual = estado.device.volume_percent || 50;

    if (accion === 'subir') {
      resultado = await subirVolumen();
      const nuevoVolumen = Math.min(100, volumenActual + 10);
      return resultado
        ? `🔊 *VOLUMEN AUMENTADO*\n\n` +
          `Volumen: ${volumenActual}% → ${nuevoVolumen}%`
        : '❌ Error subiendo el volumen.';
    } else if (accion === 'bajar') {
      resultado = await bajarVolumen();
      const nuevoVolumen = Math.max(0, volumenActual - 10);
      return resultado
        ? `🔉 *VOLUMEN REDUCIDO*\n\n` +
          `Volumen: ${volumenActual}% → ${nuevoVolumen}%`
        : '❌ Error bajando el volumen.';
    }

    return '❌ Acción de volumen inválida.';
  } catch (error) {
    log(`❌ Error en controlarVolumen: ${error.message}`, 'error');
    return '❌ Error controlando el volumen.';
  }
}

/**
 * Saltar a siguiente canción
 */
async function saltarSiguiente() {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      return '❌ No hay canciones en la cola.';
    }

    const cancionActual = playlist[0].track;
    const siguienteCancion = playlist.length > 1 ? playlist[1].track : null;

    await eliminarCancionDePlaylist(cancionActual.uri);

    log(`⏭️ Canción saltada por Técnico: ${cancionActual.name}`, 'info');

    let mensaje = `⏭️ *CANCIÓN SALTADA*\n\n`;
    mensaje += `🎵 Se omitió: ${cancionActual.name}\n`;
    mensaje += `🎤 ${cancionActual.artists.map(a => a.name).join(', ')}\n\n`;

    if (siguienteCancion) {
      mensaje += `▶️ *Siguiente:*\n`;
      mensaje += `🎵 ${siguienteCancion.name}\n`;
      mensaje += `🎤 ${siguienteCancion.artists.map(a => a.name).join(', ')}`;
    } else {
      mensaje += `ℹ️ No hay más canciones en la cola.`;
    }

    return mensaje;
  } catch (error) {
    log(`❌ Error en saltarSiguiente: ${error.message}`, 'error');
    return '❌ Error saltando la canción.';
  }
}

/**
 * Volver a canción anterior
 */
async function volverAnterior() {
  try {
    const resultado = await cancionAnterior();

    if (resultado) {
      return '⏮️ *CANCIÓN ANTERIOR*\n\n' +
             '✅ Volviendo a la canción anterior.';
    } else {
      return '❌ No se pudo volver a la canción anterior.\n\n' +
             '💡 Asegúrate de que haya una canción anterior en el historial.';
    }
  } catch (error) {
    log(`❌ Error en volverAnterior: ${error.message}`, 'error');
    return '❌ Error volviendo a la canción anterior.';
  }
}

/**
 * Ver estado de reproducción
 */
async function verEstadoReproduccion() {
  try {
    const estado = await obtenerReproduccionActual();

    if (!estado) {
      return 'ℹ️ *ESTADO DE REPRODUCCIÓN*\n\n' +
             '❌ No hay dispositivo activo de reproducción.\n\n' +
             '💡 Abre Spotify en algún dispositivo para ver el estado.';
    }

    const track = estado.item;
    const artistas = track ? track.artists.map(a => a.name).join(', ') : 'N/A';
    const dispositivo = estado.device ? estado.device.name : 'Desconocido';
    const volumen = estado.device ? estado.device.volume_percent : 0;
    const estadoReproduccion = estado.is_playing ? '▶️ Reproduciendo' : '⏸️ Pausado';

    // Calcular progreso
    const progresoMs = estado.progress_ms || 0;
    const duracionMs = track ? track.duration_ms : 0;
    const progreso = duracionMs > 0
      ? Math.floor((progresoMs / duracionMs) * 100)
      : 0;

    let mensaje = `ℹ️ *ESTADO DE REPRODUCCIÓN*\n\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `${estadoReproduccion}\n\n`;

    if (track) {
      mensaje += `🎵 *${track.name}*\n`;
      mensaje += `🎤 ${artistas}\n`;
      mensaje += `⏱️ ${formatearDuracion(progresoMs)} / ${formatearDuracion(duracionMs)}\n`;
      mensaje += `📊 Progreso: ${progreso}%\n\n`;
    }

    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `📱 Dispositivo: ${dispositivo}\n`;
    mensaje += `🔊 Volumen: ${volumen}%\n`;
    mensaje += `🔀 Aleatorio: ${estado.shuffle_state ? 'Sí' : 'No'}\n`;
    mensaje += `🔁 Repetir: ${estado.repeat_state === 'off' ? 'No' : estado.repeat_state}\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━`;

    return mensaje;
  } catch (error) {
    log(`❌ Error en verEstadoReproduccion: ${error.message}`, 'error');
    return '❌ Error obteniendo el estado de reproducción.';
  }
}
