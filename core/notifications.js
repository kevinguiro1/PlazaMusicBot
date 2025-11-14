// core/notifications.js - Sistema de Notificaciones Proactivas
import { obtenerPlaylist } from '../conexion/spotify.js';
import { enviarMensaje } from '../conexion/whatsapp.js';
import { log } from '../utils/logger.js';
import { PERFILES } from './profiles.js';

// Almacenar notificaciones enviadas y timeouts
const notificacionesEnviadas = new Map(); // uri -> { numero, timestamp, timeout }
const contextoNotificacion = new Map(); // numero -> { uri, cancion }

/**
 * Iniciar el monitor de notificaciones
 */
export function iniciarMonitorNotificaciones(estado, sock) {
  log('📢 Iniciando monitor de notificaciones', 'info');

  // Ejecutar cada 30 segundos
  setInterval(async () => {
    await verificarNotificaciones(estado, sock);
  }, 30000); // 30 segundos
}

/**
 * Verificar si hay que enviar notificaciones
 */
async function verificarNotificaciones(estado, sock) {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length < 3) {
      return; // No hay suficientes canciones para notificar
    }

    // Obtener la canción en posición 3 (índice 2)
    // Esto significa que quedan 2 canciones antes de que suene
    const cancionEnPosicion3 = playlist[2];
    const track = cancionEnPosicion3.track;

    // Verificar si ya enviamos notificación para esta canción
    if (notificacionesEnviadas.has(track.uri)) {
      return; // Ya se notificó
    }

    // Buscar quién pidió esta canción
    const usuario = encontrarUsuarioQuePidioCancion(estado, track.uri);

    if (!usuario) {
      log(`⚠️ No se encontró usuario para canción: ${track.name}`, 'warn');
      return;
    }

    // Calcular tiempo estimado
    const tiempoEstimado = calcularTiempoHasta(playlist, 2);

    // Enviar notificación
    await enviarNotificacionProxima(
      sock,
      usuario,
      track,
      tiempoEstimado,
      estado
    );

    // Marcar como notificada
    notificacionesEnviadas.set(track.uri, {
      numero: usuario.numero,
      timestamp: Date.now(),
      cancion: track
    });

    // Configurar timeout de 3 minutos para limpiar
    setTimeout(() => {
      notificacionesEnviadas.delete(track.uri);
      contextoNotificacion.delete(usuario.numero);
    }, 180000); // 3 minutos

  } catch (error) {
    log(`❌ Error en verificarNotificaciones: ${error.message}`, 'error');
  }
}

/**
 * Encontrar usuario que pidió una canción
 */
function encontrarUsuarioQuePidioCancion(estado, trackUri) {
  // Buscar en el historial reciente de usuarios
  for (const numero in estado.usuarios) {
    const usuario = estado.usuarios[numero];
    if (usuario.agregadasHoy && usuario.agregadasHoy.includes(trackUri)) {
      return usuario;
    }
  }

  return null;
}

/**
 * Calcular tiempo hasta una posición en la playlist
 */
function calcularTiempoHasta(playlist, posicion) {
  let tiempoTotal = 0;

  for (let i = 0; i < posicion; i++) {
    if (playlist[i] && playlist[i].track) {
      tiempoTotal += playlist[i].track.duration_ms;
    }
  }

  const minutos = Math.floor(tiempoTotal / 60000);
  const segundos = Math.floor((tiempoTotal % 60000) / 1000);

  return { minutos, segundos };
}

/**
 * Enviar notificación de canción próxima
 */
async function enviarNotificacionProxima(sock, usuario, track, tiempo, estado) {
  const artistas = track.artists.map(a => a.name).join(', ');

  let mensaje = `🔔 *¡TU CANCIÓN ESTÁ PRÓXIMA!*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `🎵 *${track.name}*\n`;
  mensaje += `🎤 ${artistas}\n\n`;
  mensaje += `⏱️ Sonará en aproximadamente: ${tiempo.minutos}m ${tiempo.segundos}s\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `¿Vas a poder escucharla?\n\n`;

  // VIP no puede cancelar
  if (usuario.perfil === PERFILES.VIP) {
    mensaje += `ℹ️ Tu canción tiene prioridad VIP y no puede cancelarse.`;
  } else {
    mensaje += `1️⃣ Sí, estaré ahí ✅\n`;
    mensaje += `2️⃣ No, cancélala ❌\n\n`;
    mensaje += `💡 Si no respondes, asumiremos que sí estarás.`;

    // Guardar contexto para manejar respuesta
    contextoNotificacion.set(usuario.numero, {
      uri: track.uri,
      cancion: track,
      timestamp: Date.now()
    });
  }

  await enviarMensaje(sock, usuario.numero, mensaje);

  log(`📢 Notificación enviada a ${usuario.nombre}: ${track.name}`, 'info');
}

/**
 * Manejar respuesta de notificación
 */
export async function manejarRespuestaNotificacion(usuario, mensaje, estado, sock) {
  const contexto = contextoNotificacion.get(usuario.numero);

  if (!contexto) {
    return null; // No hay notificación pendiente
  }

  const respuesta = mensaje.trim();

  // Opción 1: Sí, estaré ahí
  if (respuesta === '1' || respuesta.toLowerCase().includes('sí') || respuesta.toLowerCase().includes('si')) {
    contextoNotificacion.delete(usuario.numero);

    return `✅ *¡PERFECTO!*\n\n` +
           `Tu canción seguirá en la cola.\n\n` +
           `🎵 ${contexto.cancion.name}\n` +
           `🎤 ${contexto.cancion.artists.map(a => a.name).join(', ')}\n\n` +
           `¡Disfrútala! 🎶`;
  }

  // Opción 2: No, cancélala
  if (respuesta === '2' || respuesta.toLowerCase().includes('no') || respuesta.toLowerCase().includes('cancel')) {
    // VIP no puede cancelar
    if (usuario.perfil === PERFILES.VIP) {
      return `⚠️ Como usuario VIP, tu canción tiene prioridad y no puede cancelarse.\n\n` +
             `Si no puedes estar, tu canción sonará de todas formas.`;
    }

    // Eliminar la canción
    const { eliminarCancionDePlaylist } = await import('../conexion/spotify.js');
    await eliminarCancionDePlaylist(contexto.uri);

    // Actualizar estadísticas
    usuario.cancionesPedidasHoy--;
    const index = usuario.agregadasHoy.indexOf(contexto.uri);
    if (index > -1) {
      usuario.agregadasHoy.splice(index, 1);
    }

    contextoNotificacion.delete(usuario.numero);
    notificacionesEnviadas.delete(contexto.uri);

    log(`❌ Usuario ${usuario.nombre} canceló su canción: ${contexto.cancion.name}`, 'info');

    return `❌ *CANCIÓN CANCELADA*\n\n` +
           `Se eliminó de la cola:\n` +
           `🎵 ${contexto.cancion.name}\n` +
           `🎤 ${contexto.cancion.artists.map(a => a.name).join(', ')}\n\n` +
           `Puedes pedir otra canción cuando quieras. 🎶`;
  }

  // Respuesta inválida
  return `⚠️ *Respuesta no válida*\n\n` +
         `Por favor responde:\n` +
         `1️⃣ para confirmar que estarás ahí\n` +
         `2️⃣ para cancelar la canción`;
}

/**
 * Verificar si usuario tiene notificación pendiente
 */
export function tieneNotificacionPendiente(numero) {
  return contextoNotificacion.has(numero);
}

/**
 * Limpiar notificaciones antiguas (llamar periódicamente)
 */
export function limpiarNotificacionesAntiguas() {
  const ahora = Date.now();
  const TIEMPO_EXPIRACION = 180000; // 3 minutos

  // Limpiar notificaciones enviadas
  for (const [uri, data] of notificacionesEnviadas.entries()) {
    if (ahora - data.timestamp > TIEMPO_EXPIRACION) {
      notificacionesEnviadas.delete(uri);
    }
  }

  // Limpiar contextos de notificación
  for (const [numero, data] of contextoNotificacion.entries()) {
    if (ahora - data.timestamp > TIEMPO_EXPIRACION) {
      contextoNotificacion.delete(numero);
    }
  }
}

// Limpiar notificaciones antiguas cada 5 minutos
setInterval(limpiarNotificacionesAntiguas, 300000);
