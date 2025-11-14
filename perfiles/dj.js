// perfiles/dj.js - Manejador de Perfil Técnico
import { buscarCancionEnSpotify, buscarArtistaEnSpotify, topTracksDeArtista, agregarCancionAPlaylist, obtenerPlaylist, pausarReproduccion, reanudarReproduccion, siguienteCancion, subirVolumen, bajarVolumen, ajustarVolumen, obtenerReproduccionActual } from '../conexion/spotify.js';
import { registrarCancionTocada, verificarCancionBloqueada, obtenerInfoCancion } from '../core/history.js';
import { log } from '../utils/logger.js';
import { CONFIG_PERFILES } from '../core/profiles.js';

/**
 * Manejador principal del Técnico
 */
export async function manejarTecnico(usuario, mensaje, estado) {
  const contexto = usuario.contexto;

  // Si no hay contexto, mostrar menú principal
  if (!contexto || contexto === 'menu_tecnico') {
    return manejarMenuPrincipal(usuario, mensaje);
  }

  // Flujo de búsqueda de canción
  if (contexto === 'tecnico_buscar_cancion') {
    return await buscarCancionTecnico(usuario, mensaje, estado);
  }

  if (contexto === 'tecnico_tipo_busqueda') {
    return manejarTipoBusqueda(usuario, mensaje);
  }

  if (contexto === 'tecnico_seleccionar_cancion') {
    return await seleccionarCancionTecnico(usuario, mensaje);
  }

  if (contexto === 'tecnico_confirmar_cancion') {
    return await confirmarCancionTecnico(usuario, mensaje, estado);
  }

  if (contexto === 'tecnico_bypass_repeticion') {
    return await manejarBypassRepeticion(usuario, mensaje, estado);
  }

  // Control de reproducción
  if (contexto === 'tecnico_control_reproduccion') {
    return await manejarControlReproduccion(usuario, mensaje);
  }

  // Control de volumen
  if (contexto === 'tecnico_control_volumen') {
    return await manejarControlVolumen(usuario, mensaje);
  }

  if (contexto === 'tecnico_volumen_exacto') {
    return await ajustarVolumenExacto(usuario, mensaje);
  }

  // Ver cola completa
  if (contexto === 'tecnico_ver_cola') {
    return await verColaCompleta(usuario);
  }

  // Default
  return obtenerMenuPrincipalTecnico();
}

/**
 * Menú principal del técnico
 */
function manejarMenuPrincipal(usuario, mensaje) {
  const opcion = parseInt(mensaje);

  if (mensaje === '0' || mensaje.toLowerCase() === 'salir') {
    usuario.contexto = null;
    return '👋 Hasta pronto. Escribe "menu" para volver.';
  }

  switch (opcion) {
    case 1:
      usuario.contexto = 'tecnico_tipo_busqueda';
      return obtenerMenuTipoBusqueda();

    case 2:
      usuario.contexto = 'tecnico_control_reproduccion';
      return obtenerMenuControlReproduccion();

    case 3:
      usuario.contexto = 'tecnico_control_volumen';
      return obtenerMenuControlVolumen();

    case 4:
      return verColaCompleta(usuario);

    default:
      return '❌ Opción inválida.\n\n' + obtenerMenuPrincipalTecnico();
  }
}

/**
 * Obtener menú principal del técnico
 */
function obtenerMenuPrincipalTecnico() {
  let menu = `🛠️ *MENÚ TÉCNICO*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `Control total del sistema\n\n`;
  menu += `1️⃣ 🎵 Pedir canción (ilimitado)\n`;
  menu += `2️⃣ 🎚️ Control de reproducción\n`;
  menu += `3️⃣ 🔊 Control de volumen\n`;
  menu += `4️⃣ 📊 Ver cola completa\n\n`;
  menu += `0️⃣ Salir`;

  return menu;
}

/**
 * Menú de tipo de búsqueda
 */
function obtenerMenuTipoBusqueda() {
  let menu = `🔍 *BUSCAR MÚSICA*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `¿Cómo deseas buscar?\n\n`;
  menu += `1️⃣ 🎵 Por canción\n`;
  menu += `2️⃣ 🎤 Por artista\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

/**
 * Manejar tipo de búsqueda
 */
function manejarTipoBusqueda(usuario, mensaje) {
  const opcion = parseInt(mensaje);

  if (mensaje === '0') {
    usuario.contexto = 'menu_tecnico';
    return obtenerMenuPrincipalTecnico();
  }

  if (opcion === 1) {
    usuario.contexto = 'tecnico_buscar_cancion';
    usuario.tipoBusqueda = 'cancion';
    return '🎵 Escribe el nombre de la canción que buscas:';
  }

  if (opcion === 2) {
    usuario.contexto = 'tecnico_buscar_cancion';
    usuario.tipoBusqueda = 'artista';
    return '🎤 Escribe el nombre del artista:';
  }

  return '❌ Opción inválida.\n\n' + obtenerMenuTipoBusqueda();
}

/**
 * Buscar canción en Spotify (Técnico)
 */
async function buscarCancionTecnico(usuario, mensaje, estado) {
  if (mensaje === '0') {
    usuario.contexto = 'tecnico_tipo_busqueda';
    delete usuario.tipoBusqueda;
    return obtenerMenuTipoBusqueda();
  }

  try {
    let canciones = [];

    if (usuario.tipoBusqueda === 'artista') {
      const artista = await buscarArtistaEnSpotify(mensaje);

      if (!artista) {
        return `❌ No se encontró el artista "${mensaje}".\n\nIntenta con otro nombre o escribe *0* para volver.`;
      }

      canciones = await topTracksDeArtista(artista.id);

      if (canciones.length === 0) {
        return `❌ No se encontraron canciones del artista.\n\nIntenta con otro o escribe *0* para volver.`;
      }
    } else {
      canciones = await buscarCancionEnSpotify(mensaje, 10);

      if (canciones.length === 0) {
        return `❌ No se encontraron resultados para "${mensaje}".\n\nIntenta con otro término o escribe *0* para volver.`;
      }
    }

    // Guardar resultados
    usuario.ultimaSugerencia = {
      busqueda: mensaje,
      canciones: canciones,
      tipo: usuario.tipoBusqueda
    };

    usuario.contexto = 'tecnico_seleccionar_cancion';
    delete usuario.tipoBusqueda;

    return obtenerMenuResultadosTecnico(canciones, mensaje);
  } catch (error) {
    log(`❌ Error en búsqueda técnico: ${error.message}`, 'error');
    return '❌ Error al buscar. Intenta de nuevo o escribe *0* para volver.';
  }
}

/**
 * Menú de resultados de búsqueda (Técnico)
 */
function obtenerMenuResultadosTecnico(canciones, busqueda) {
  let menu = `🎵 *RESULTADOS TOP 10*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `Búsqueda: "${busqueda}"\n\n`;

  canciones.slice(0, 10).forEach((cancion, index) => {
    const artistas = cancion.artists.map(a => a.name).join(', ');
    const duracion = Math.floor(cancion.duration_ms / 1000 / 60);
    menu += `${index + 1}️⃣ ${cancion.name}\n`;
    menu += `   🎤 ${artistas}\n`;
    menu += `   ⏱️ ${duracion} min\n\n`;
  });

  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `Escribe el número de la canción\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

/**
 * Seleccionar canción de los resultados (Técnico)
 */
async function seleccionarCancionTecnico(usuario, mensaje) {
  const opcion = parseInt(mensaje);

  if (mensaje === '0') {
    usuario.contexto = 'tecnico_tipo_busqueda';
    delete usuario.ultimaSugerencia;
    return obtenerMenuTipoBusqueda();
  }

  if (isNaN(opcion) || opcion < 1 || opcion > usuario.ultimaSugerencia.canciones.length) {
    return '❌ Opción inválida.\n\n' + obtenerMenuResultadosTecnico(usuario.ultimaSugerencia.canciones, usuario.ultimaSugerencia.busqueda);
  }

  const cancion = usuario.ultimaSugerencia.canciones[opcion - 1];
  usuario.cancionParaAgregar = cancion;

  // Verificar si está en periodo de bloqueo
  const verificacion = verificarCancionBloqueada(cancion.uri);

  if (verificacion.bloqueada) {
    // Mostrar advertencia al técnico
    usuario.contexto = 'tecnico_bypass_repeticion';
    return obtenerMensajeAdvertenciaTecnico(cancion, verificacion.minutosTranscurridos);
  }

  // Si no está bloqueada, ir a confirmación normal
  usuario.contexto = 'tecnico_confirmar_cancion';
  return obtenerMenuConfirmacionTecnico(cancion);
}

/**
 * Mensaje de advertencia cuando técnico intenta repetir canción
 */
function obtenerMensajeAdvertenciaTecnico(cancion, minutosTranscurridos) {
  const artistas = cancion.artists.map(a => a.name).join(', ');

  let mensaje = `⚠️ *NOTA - CANCIÓN REPETIDA*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `🎵 ${cancion.name}\n`;
  mensaje += `🎤 ${artistas}\n\n`;
  mensaje += `Esta canción se reprodujo hace ${minutosTranscurridos} minutos.\n\n`;
  mensaje += `Como técnico PUEDES repetirla sin restricciones.\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `1️⃣ Agregar ahora\n`;
  mensaje += `0️⃣ Cancelar`;

  return mensaje;
}

/**
 * Manejar bypass de repetición (técnico)
 */
async function manejarBypassRepeticion(usuario, mensaje, estado) {
  const opcion = parseInt(mensaje);

  if (mensaje === '0') {
    usuario.contexto = 'tecnico_seleccionar_cancion';
    delete usuario.cancionParaAgregar;
    return obtenerMenuResultadosTecnico(usuario.ultimaSugerencia.canciones, usuario.ultimaSugerencia.busqueda);
  }

  if (opcion !== 1) {
    return '❌ Opción inválida.\n\n' + obtenerMensajeAdvertenciaTecnico(
      usuario.cancionParaAgregar,
      Math.floor((Date.now() - verificarCancionBloqueada(usuario.cancionParaAgregar.uri).timestamp) / 60000)
    );
  }

  // Confirmar que quiere agregar
  const cancion = usuario.cancionParaAgregar;

  try {
    // Agregar a playlist con prioridad 0 (técnico)
    await agregarCancionAPlaylist(cancion.uri, 0);

    // Registrar en historial
    registrarCancionTocada(cancion.uri, usuario.numero);

    // Actualizar estadísticas
    estado.estadisticas.totalCanciones++;

    const artistas = cancion.artists.map(a => a.name).join(', ');
    usuario.cancionesPedidas++;

    // Limpiar contexto
    usuario.contexto = 'menu_tecnico';
    delete usuario.cancionParaAgregar;
    delete usuario.ultimaSugerencia;

    let respuesta = `✅ *CANCIÓN AGREGADA (BYPASS)*\n\n`;
    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += `🎵 ${cancion.name}\n`;
    respuesta += `🎤 ${artistas}\n\n`;
    respuesta += `⚠️ Repetición autorizada por técnico\n\n`;
    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += obtenerMenuPrincipalTecnico();

    return respuesta;
  } catch (error) {
    log(`❌ Error agregando canción con bypass: ${error.message}`, 'error');
    usuario.contexto = 'menu_tecnico';
    return '❌ Error al agregar la canción. Intenta de nuevo.\n\n' + obtenerMenuPrincipalTecnico();
  }
}

/**
 * Menú de confirmación (Técnico)
 */
function obtenerMenuConfirmacionTecnico(cancion) {
  const artistas = cancion.artists.map(a => a.name).join(', ');
  const duracion = Math.floor(cancion.duration_ms / 1000 / 60);

  let menu = `✅ *CONFIRMAR CANCIÓN*\n\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `🎵 ${cancion.name}\n`;
  menu += `🎤 ${artistas}\n`;
  menu += `⏱️ ${duracion} min\n\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `¿Agregar a la cola?\n\n`;
  menu += `1️⃣ Sí, agregar\n`;
  menu += `2️⃣ No, buscar otra\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

/**
 * Confirmar canción (Técnico)
 */
async function confirmarCancionTecnico(usuario, mensaje, estado) {
  const opcion = parseInt(mensaje);

  if (opcion === 2 || mensaje === '0') {
    usuario.contexto = 'tecnico_seleccionar_cancion';
    delete usuario.cancionParaAgregar;
    return obtenerMenuResultadosTecnico(usuario.ultimaSugerencia.canciones, usuario.ultimaSugerencia.busqueda);
  }

  if (opcion !== 1) {
    return '❌ Opción inválida.\n\n' + obtenerMenuConfirmacionTecnico(usuario.cancionParaAgregar);
  }

  const cancion = usuario.cancionParaAgregar;

  try {
    // Agregar a playlist con prioridad 0 (técnico tiene prioridad alta)
    await agregarCancionAPlaylist(cancion.uri, 0);

    // Registrar en historial
    registrarCancionTocada(cancion.uri, usuario.numero);

    // Actualizar estadísticas
    estado.estadisticas.totalCanciones++;
    const artistas = cancion.artists.map(a => a.name).join(', ');
    usuario.cancionesPedidas++;

    // Limpiar contexto
    usuario.contexto = 'menu_tecnico';
    delete usuario.cancionParaAgregar;
    delete usuario.ultimaSugerencia;

    let respuesta = `✅ *CANCIÓN AGREGADA*\n\n`;
    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += `🎵 ${cancion.name}\n`;
    respuesta += `🎤 ${artistas}\n\n`;
    respuesta += `Agregada con prioridad técnico\n\n`;
    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += obtenerMenuPrincipalTecnico();

    return respuesta;
  } catch (error) {
    log(`❌ Error confirmando canción técnico: ${error.message}`, 'error');
    usuario.contexto = 'menu_tecnico';
    return '❌ Error al agregar la canción. Intenta de nuevo.\n\n' + obtenerMenuPrincipalTecnico();
  }
}

/**
 * Menú de control de reproducción
 */
function obtenerMenuControlReproduccion() {
  let menu = `🎚️ *CONTROL DE REPRODUCCIÓN*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ ⏸️ Pausar música\n`;
  menu += `2️⃣ ▶️ Reanudar música\n`;
  menu += `3️⃣ ⏭️ Saltar a siguiente\n`;
  menu += `4️⃣ 🔁 Repetir canción actual\n`;
  menu += `5️⃣ 📊 Estado actual\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

/**
 * Manejar control de reproducción
 */
async function manejarControlReproduccion(usuario, mensaje) {
  const opcion = parseInt(mensaje);

  if (mensaje === '0') {
    usuario.contexto = 'menu_tecnico';
    return obtenerMenuPrincipalTecnico();
  }

  try {
    let respuesta = '';

    switch (opcion) {
      case 1:
        const pausado = await pausarReproduccion();
        if (pausado) {
          respuesta = `⏸️ *MÚSICA PAUSADA*\n\n`;
          respuesta += `La reproducción ha sido pausada.\n\n`;
        } else {
          respuesta = `❌ No se pudo pausar la música.\n\n`;
        }
        break;

      case 2:
        const reanudado = await reanudarReproduccion();
        if (reanudado) {
          respuesta = `▶️ *MÚSICA REANUDADA*\n\n`;
          respuesta += `La reproducción ha sido reanudada.\n\n`;
        } else {
          respuesta = `❌ No se pudo reanudar la música.\n\n`;
        }
        break;

      case 3:
        const saltado = await siguienteCancion();
        if (saltado) {
          respuesta = `⏭️ *SALTANDO A SIGUIENTE*\n\n`;
          respuesta += `Pasando a la siguiente canción...\n\n`;
        } else {
          respuesta = `❌ No se pudo saltar a la siguiente canción.\n\n`;
        }
        break;

      case 4:
        // Repetir canción actual: obtener la actual y agregarla de nuevo
        const estadoActual = await obtenerReproduccionActual();
        if (estadoActual && estadoActual.item) {
          const cancionActual = estadoActual.item;
          await agregarCancionAPlaylist(cancionActual.uri, 0);
          registrarCancionTocada(cancionActual.uri, usuario.numero);

          respuesta = `🔁 *CANCIÓN REPETIDA*\n\n`;
          respuesta += `🎵 ${cancionActual.name}\n`;
          respuesta += `Se agregó nuevamente a la cola.\n\n`;
        } else {
          respuesta = `❌ No hay ninguna canción reproduciéndose actualmente.\n\n`;
        }
        break;

      case 5:
        const estado = await obtenerReproduccionActual();
        if (estado && estado.item) {
          const cancion = estado.item;
          const artistas = cancion.artists.map(a => a.name).join(', ');
          const progreso = Math.floor(estado.progress_ms / 1000);
          const duracion = Math.floor(cancion.duration_ms / 1000);
          const volumen = estado.device.volume_percent;

          respuesta = `📊 *ESTADO ACTUAL*\n\n`;
          respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
          respuesta += `🎵 ${cancion.name}\n`;
          respuesta += `🎤 ${artistas}\n`;
          respuesta += `⏱️ ${Math.floor(progreso / 60)}:${(progreso % 60).toString().padStart(2, '0')} / ${Math.floor(duracion / 60)}:${(duracion % 60).toString().padStart(2, '0')}\n`;
          respuesta += `🔊 Volumen: ${volumen}%\n`;
          respuesta += `${estado.is_playing ? '▶️ Reproduciendo' : '⏸️ Pausado'}\n\n`;
        } else {
          respuesta = `❌ No hay ninguna canción reproduciéndose.\n\n`;
        }
        break;

      default:
        respuesta = `❌ Opción inválida.\n\n`;
    }

    respuesta += obtenerMenuControlReproduccion();
    return respuesta;
  } catch (error) {
    log(`❌ Error en control de reproducción: ${error.message}`, 'error');
    return '❌ Error al controlar la reproducción.\n\n' + obtenerMenuControlReproduccion();
  }
}

/**
 * Menú de control de volumen
 */
function obtenerMenuControlVolumen() {
  let menu = `🔊 *CONTROL DE VOLUMEN*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ 🔊 Subir volumen (+10%)\n`;
  menu += `2️⃣ 🔉 Bajar volumen (-10%)\n`;
  menu += `3️⃣ 🎚️ Ajustar volumen exacto\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

/**
 * Manejar control de volumen
 */
async function manejarControlVolumen(usuario, mensaje) {
  const opcion = parseInt(mensaje);

  if (mensaje === '0') {
    usuario.contexto = 'menu_tecnico';
    return obtenerMenuPrincipalTecnico();
  }

  try {
    let respuesta = '';

    switch (opcion) {
      case 1:
        const subido = await subirVolumen();
        if (subido) {
          const estado = await obtenerReproduccionActual();
          const volumenActual = estado?.device?.volume_percent || 'desconocido';
          respuesta = `🔊 *VOLUMEN AUMENTADO*\n\n`;
          respuesta += `Nuevo volumen: ${volumenActual}%\n\n`;
        } else {
          respuesta = `❌ No se pudo subir el volumen.\n\n`;
        }
        break;

      case 2:
        const bajado = await bajarVolumen();
        if (bajado) {
          const estado = await obtenerReproduccionActual();
          const volumenActual = estado?.device?.volume_percent || 'desconocido';
          respuesta = `🔉 *VOLUMEN DISMINUIDO*\n\n`;
          respuesta += `Nuevo volumen: ${volumenActual}%\n\n`;
        } else {
          respuesta = `❌ No se pudo bajar el volumen.\n\n`;
        }
        break;

      case 3:
        usuario.contexto = 'tecnico_volumen_exacto';
        return `🎚️ *AJUSTAR VOLUMEN EXACTO*\n\nEscribe el nivel de volumen deseado (0-100):\n\n0️⃣ Cancelar`;

      default:
        respuesta = `❌ Opción inválida.\n\n`;
    }

    respuesta += obtenerMenuControlVolumen();
    return respuesta;
  } catch (error) {
    log(`❌ Error en control de volumen: ${error.message}`, 'error');
    return '❌ Error al controlar el volumen.\n\n' + obtenerMenuControlVolumen();
  }
}

/**
 * Ajustar volumen exacto
 */
async function ajustarVolumenExacto(usuario, mensaje) {
  if (mensaje === '0') {
    usuario.contexto = 'tecnico_control_volumen';
    return obtenerMenuControlVolumen();
  }

  const volumen = parseInt(mensaje);

  if (isNaN(volumen) || volumen < 0 || volumen > 100) {
    return `❌ Valor inválido. Debe ser un número entre 0 y 100.\n\nIntenta de nuevo o escribe *0* para cancelar.`;
  }

  try {
    const ajustado = await ajustarVolumen(volumen);

    if (ajustado) {
      usuario.contexto = 'tecnico_control_volumen';

      let respuesta = `🎚️ *VOLUMEN AJUSTADO*\n\n`;
      respuesta += `Nuevo volumen: ${volumen}%\n\n`;
      respuesta += obtenerMenuControlVolumen();

      return respuesta;
    } else {
      return `❌ No se pudo ajustar el volumen.\n\nIntenta de nuevo o escribe *0* para cancelar.`;
    }
  } catch (error) {
    log(`❌ Error ajustando volumen exacto: ${error.message}`, 'error');
    return `❌ Error al ajustar el volumen.\n\nIntenta de nuevo o escribe *0* para cancelar.`;
  }
}

/**
 * Ver cola completa con advertencias de repetición
 */
async function verColaCompleta(usuario) {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      let respuesta = `📊 *COLA VACÍA*\n\n`;
      respuesta += `No hay canciones en la cola actualmente.\n\n`;
      respuesta += obtenerMenuPrincipalTecnico();
      return respuesta;
    }

    let respuesta = `📊 *COLA COMPLETA DE REPRODUCCIÓN*\n`;
    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += `Total: ${playlist.length} canciones\n\n`;

    // Mostrar todas las canciones con advertencias
    for (let i = 0; i < playlist.length; i++) {
      const item = playlist[i];
      const cancion = item.track;
      const artistas = cancion.artists.map(a => a.name).join(', ');

      respuesta += `${i + 1}. ${cancion.name}\n`;
      respuesta += `   🎤 ${artistas}\n`;

      // Verificar si está en historial de repetición
      const info = obtenerInfoCancion(cancion.uri);
      if (info && info.minutosTranscurridos < 60) {
        respuesta += `   ⚠️ Repetida hace ${info.minutosTranscurridos} min\n`;
      }

      respuesta += `\n`;
    }

    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += obtenerMenuPrincipalTecnico();

    return respuesta;
  } catch (error) {
    log(`❌ Error obteniendo cola completa: ${error.message}`, 'error');
    return '❌ Error al obtener la cola.\n\n' + obtenerMenuPrincipalTecnico();
  }
}
