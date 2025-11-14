// perfiles/usuario.js - Manejador de Usuarios Normales (Free, Premium, VIP)
import {
  puedePedirCancion,
  mensajeLimiteAlcanzado,
  obtenerPerfil
} from '../core/profiles.js';
import {
  obtenerMenuPrincipal,
  obtenerMenuBusqueda,
  obtenerMenuArtista,
  obtenerMenuResultados
} from '../core/menus.js';
import {
  buscarCancionEnSpotify,
  buscarArtistaEnSpotify,
  topTracksDeArtista,
  agregarCancionAPlaylist,
  calcularTiempoParaTrack,
  obtenerPlaylist
} from '../conexion/spotify.js';
import { obtenerCancionesFiltradas } from '../utils/filtrosCanciones.js';
import { log } from '../utils/logger.js';

/**
 * Manejar usuario normal
 */
export async function manejarUsuarioNormal(usuario, mensaje, estado) {
  const texto = mensaje.trim();
  const perfil = obtenerPerfil(usuario);

  // Manejar opciones del menú principal
  if (!usuario.contexto) {
    const opcion = parseInt(texto);

    switch (opcion) {
      case 1:
        usuario.contexto = 'buscar_cancion';
        return obtenerMenuBusqueda();

      case 2:
        usuario.contexto = 'buscar_artista';
        return obtenerMenuArtista();

      case 3:
        return await mostrarProximas5Canciones();

      case 4:
        if (perfil.puedeVerCola) {
          return await mostrarCola();
        }
        return '❌ Esta opción no está disponible para tu perfil.';

      case 5:
        if (perfil.puedeVerEstadisticas) {
          return mostrarEstadisticasUsuario(usuario);
        }
        return '❌ Esta opción no está disponible para tu perfil.';

      case 6:
        if (perfil.puedeVerEstadisticas) {
          const { obtenerResumenPerfil } = await import('../core/profiles.js');
          return obtenerResumenPerfil(usuario);
        }
        return '❌ Esta opción no está disponible para tu perfil.';

      case 0:
        return `👋 Hasta pronto ${usuario.nombre}!\n\nEscribe "menu" cuando quieras volver.`;

      default:
        // Búsqueda libre
        usuario.contexto = 'buscar_cancion';
        return await buscarCancion(usuario, texto, estado);
    }
  }

  // Manejar contextos
  if (usuario.contexto === 'buscar_cancion') {
    if (texto === '0') {
      usuario.contexto = null;
      return obtenerMenuPrincipal(usuario);
    }

    return await buscarCancion(usuario, texto, estado);
  }

  if (usuario.contexto === 'buscar_artista') {
    if (texto === '0') {
      usuario.contexto = null;
      return obtenerMenuPrincipal(usuario);
    }

    return await buscarPorArtista(usuario, texto, estado);
  }

  if (usuario.contexto === 'seleccionar_cancion') {
    return await seleccionarCancion(usuario, texto, estado);
  }

  // Por defecto, mostrar menú
  usuario.contexto = null;
  return obtenerMenuPrincipal(usuario);
}

/**
 * Buscar canción
 */
async function buscarCancion(usuario, query, estado) {
  try {
    // Verificar límite
    if (!puedePedirCancion(usuario)) {
      usuario.contexto = null;
      return mensajeLimiteAlcanzado(usuario);
    }

    const resultados = await buscarCancionEnSpotify(query, 10);

    if (resultados.length === 0) {
      return `❌ No encontré canciones con "${query}".\n\n` +
             `💡 Intenta con otro nombre o artista.\n` +
             `📝 Escribe "0" para volver al menú.`;
    }

    // Filtrar canciones
    const filtradas = await obtenerCancionesFiltradas(resultados);

    if (filtradas.length === 0) {
      return `❌ No encontré canciones apropiadas con "${query}".\n\n` +
             `💡 Las canciones pueden estar filtradas por contenido explícito.\n` +
             `📝 Escribe "0" para volver al menú.`;
    }

    // Guardar resultados en el contexto del usuario
    usuario.ultimaSugerencia = {
      canciones: filtradas.slice(0, 10)
    };
    usuario.contexto = 'seleccionar_cancion';

    return obtenerMenuResultados(usuario.ultimaSugerencia.canciones, usuario);
  } catch (error) {
    log(`❌ Error en buscarCancion: ${error.message}`, 'error');
    return '❌ Ocurrió un error buscando la canción. Intenta nuevamente.';
  }
}

/**
 * Buscar por artista
 */
async function buscarPorArtista(usuario, query, estado) {
  try {
    const artista = await buscarArtistaEnSpotify(query);

    if (!artista) {
      return `❌ No encontré al artista "${query}".\n\n` +
             `💡 Verifica el nombre e intenta nuevamente.\n` +
             `📝 Escribe "0" para volver al menú.`;
    }

    const topTracks = await topTracksDeArtista(artista.id);
    const filtradas = await obtenerCancionesFiltradas(topTracks);

    if (filtradas.length === 0) {
      return `❌ No hay canciones disponibles de ${artista.name}.\n\n` +
             `📝 Escribe "0" para volver al menú.`;
    }

    usuario.ultimaSugerencia = {
      canciones: filtradas.slice(0, 10),
      artista: artista.name
    };
    usuario.contexto = 'seleccionar_cancion';

    let respuesta = `🎤 *${artista.name}*\n\n`;
    respuesta += `Top canciones:\n\n`;
    respuesta += obtenerMenuResultados(usuario.ultimaSugerencia.canciones, usuario);

    return respuesta;
  } catch (error) {
    log(`❌ Error en buscarPorArtista: ${error.message}`, 'error');
    return '❌ Ocurrió un error buscando el artista. Intenta nuevamente.';
  }
}

/**
 * Seleccionar canción de los resultados
 */
async function seleccionarCancion(usuario, texto, estado) {
  try {
    if (texto === '0') {
      usuario.contexto = null;
      usuario.ultimaSugerencia = null;
      return obtenerMenuPrincipal(usuario);
    }

    if (texto.toLowerCase() === 'nueva' || texto.toLowerCase() === 'nuevo') {
      usuario.contexto = 'buscar_cancion';
      usuario.ultimaSugerencia = null;
      return obtenerMenuBusqueda();
    }

    const opcion = parseInt(texto);

    if (isNaN(opcion) || opcion < 1 || opcion > usuario.ultimaSugerencia.canciones.length) {
      return `❌ Opción inválida.\n\n` +
             `📝 Escribe un número del 1 al ${usuario.ultimaSugerencia.canciones.length}`;
    }

    const cancionSeleccionada = usuario.ultimaSugerencia.canciones[opcion - 1];

    // Verificar si ya agregó esta canción hoy
    if (usuario.agregadasHoy.includes(cancionSeleccionada.uri)) {
      return `⚠️ Ya agregaste "${cancionSeleccionada.name}" hoy.\n\n` +
             `💡 Selecciona otra canción o vuelve mañana.`;
    }

    // Verificar límite nuevamente
    if (!puedePedirCancion(usuario)) {
      usuario.contexto = null;
      usuario.ultimaSugerencia = null;
      return mensajeLimiteAlcanzado(usuario);
    }

    // Agregar a playlist con prioridad según perfil
    const perfil = obtenerPerfil(usuario);
    const posicion = perfil.prioridad >= 3 ? 0 : null; // VIP+ va al inicio

    await agregarCancionAPlaylist(cancionSeleccionada.uri, posicion);

    // Actualizar estadísticas del usuario
    usuario.cancionesPedidasHoy++;
    usuario.cancionesPedidas++;
    usuario.agregadasHoy.push(cancionSeleccionada.uri);
    usuario.estadisticas.totalCanciones++;

    // Actualizar artistas favoritos
    const artista = cancionSeleccionada.artists[0].name;
    usuario.estadisticas.artistasFavoritos[artista] =
      (usuario.estadisticas.artistasFavoritos[artista] || 0) + 1;

    // Calcular tiempo estimado
    const { minutos, segundos } = await calcularTiempoParaTrack(cancionSeleccionada.uri);

    // Limpiar contexto
    usuario.contexto = null;
    usuario.ultimaSugerencia = null;

    const artistas = cancionSeleccionada.artists.map(a => a.name).join(', ');

    let respuesta = `✅ *¡Canción agregada!*\n\n`;
    respuesta += `🎵 ${cancionSeleccionada.name}\n`;
    respuesta += `🎤 ${artistas}\n\n`;

    if (minutos > 0 || segundos > 0) {
      respuesta += `⏱️ Sonará en aproximadamente: ${minutos}m ${segundos}s\n\n`;
    }

    respuesta += `📊 Canciones pedidas hoy: ${usuario.cancionesPedidasHoy}/${perfil.limiteCanciones}\n\n`;
    respuesta += `💡 Escribe "menu" para pedir más canciones.`;

    log(
      `✅ ${usuario.nombre} agregó: ${cancionSeleccionada.name}`,
      'info'
    );

    return respuesta;
  } catch (error) {
    log(`❌ Error en seleccionarCancion: ${error.message}`, 'error');
    return '❌ Ocurrió un error agregando la canción. Intenta nuevamente.';
  }
}

/**
 * Mostrar cola de reproducción
 */
async function mostrarCola() {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      return '📜 *COLA DE REPRODUCCIÓN*\n\n' +
             '🎵 La cola está vacía.\n\n' +
             '💡 Sé el primero en agregar una canción!';
    }

    let mensaje = `📜 *COLA DE REPRODUCCIÓN*\n\n`;
    mensaje += `🎵 Canciones en cola: ${playlist.length}\n\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const mostrar = Math.min(playlist.length, 15);

    for (let i = 0; i < mostrar; i++) {
      const track = playlist[i].track;
      const artistas = track.artists.map(a => a.name).join(', ');
      const numero = i === 0 ? '▶️' : `${i + 1}️⃣`;

      mensaje += `${numero} *${track.name}*\n`;
      mensaje += `   🎤 ${artistas}\n\n`;
    }

    if (playlist.length > mostrar) {
      mensaje += `... y ${playlist.length - mostrar} más\n\n`;
    }

    mensaje += `━━━━━━━━━━━━━━━━━━━━━`;

    return mensaje;
  } catch (error) {
    log(`❌ Error mostrando cola: ${error.message}`, 'error');
    return '❌ Error obteniendo la cola de reproducción.';
  }
}

/**
 * Mostrar estadísticas del usuario
 */
function mostrarEstadisticasUsuario(usuario) {
  let mensaje = `📊 *TUS ESTADÍSTICAS*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `🎵 Total canciones pedidas: ${usuario.estadisticas.totalCanciones}\n`;
  mensaje += `📅 Canciones hoy: ${usuario.cancionesPedidasHoy}\n\n`;

  // Top 5 artistas
  const topArtistas = Object.entries(usuario.estadisticas.artistasFavoritos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topArtistas.length > 0) {
    mensaje += `🎤 *Tus artistas favoritos:*\n`;
    topArtistas.forEach(([artista, cantidad], index) => {
      mensaje += `${index + 1}. ${artista} (${cantidad} canciones)\n`;
    });
  }

  mensaje += `\n━━━━━━━━━━━━━━━━━━━━━`;

  return mensaje;
}

/**
 * Mostrar próximas 5 canciones en la cola
 */
async function mostrarProximas5Canciones() {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      return '📜 *PRÓXIMAS CANCIONES*\n\n' +
             '🎵 La cola está vacía.\n\n' +
             '💡 ¡Sé el primero en agregar una canción!';
    }

    let mensaje = `📜 *PRÓXIMAS 5 CANCIONES*\n\n`;

    const mostrar = Math.min(playlist.length, 5);
    let tiempoAcumulado = 0;

    for (let i = 0; i < mostrar; i++) {
      const track = playlist[i].track;
      const artistas = track.artists.map(a => a.name).join(', ');
      const duracion = formatearDuracion(track.duration_ms);

      // Calcular tiempo estimado
      const minutos = Math.floor(tiempoAcumulado / 60000);
      const segundos = Math.floor((tiempoAcumulado % 60000) / 1000);

      if (i === 0) {
        mensaje += `▶️ *SONANDO AHORA*\n`;
      } else {
        mensaje += `${i + 1}. `;
      }

      mensaje += `*${track.name}*\n`;
      mensaje += `   🎤 ${artistas}\n`;
      mensaje += `   ⏱️ Duración: ${duracion}\n`;

      if (i > 0) {
        mensaje += `   ⏰ Sonará en: ${minutos}m ${segundos}s\n`;
      }

      mensaje += `\n`;

      tiempoAcumulado += track.duration_ms;
    }

    if (playlist.length > 5) {
      mensaje += `... y ${playlist.length - 5} canciones más en cola\n\n`;
    }

    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `💡 Usa esta información para decidir cuándo pedir tu canción.`;

    return mensaje;
  } catch (error) {
    log(`❌ Error mostrando próximas canciones: ${error.message}`, 'error');
    return '❌ Error obteniendo las próximas canciones.';
  }
}

/**
 * Formatear duración (helper para mostrarProximas5Canciones)
 */
function formatearDuracion(ms) {
  const minutos = Math.floor(ms / 60000);
  const segundos = Math.floor((ms % 60000) / 1000);
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}
