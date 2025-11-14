// perfiles/vip.js - Manejador de Usuarios VIP
import {
  obtenerMenuVIP,
  obtenerMenuTipoBusqueda,
  obtenerMenuBusqueda,
  obtenerMenuArtista,
  obtenerMenuResultados,
  obtenerMenuConfirmacion,
  obtenerMenuColaYTiempos,
  obtenerMenuLetraActual,
  obtenerMenuCompraVIP,
  obtenerMenuInfoCompraVIP,
  obtenerMenuPrivilegiosVIP,
  obtenerMenuBeneficiosVIP,
  obtenerMenuHistorialVIP,
  obtenerMensajeCooldownVIP
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

// Cooldown de 1 hora para VIP (en milisegundos)
const COOLDOWN_VIP = 60 * 60 * 1000; // 1 hora

/**
 * Manejar usuario VIP
 */
export async function manejarUsuarioVIP(usuario, mensaje, estado) {
  const texto = mensaje.trim();

  // Manejar opciones del menú principal VIP
  if (!usuario.contexto) {
    const opcion = parseInt(texto);

    switch (opcion) {
      case 1:
        // Pedir canción VIP - verificar cooldown
        return await verificarCooldownYMostrarMenu(usuario);

      case 2:
        // Ver cola y tiempos
        return await mostrarColaYTiempos();

      case 3:
        // Ver letra actual
        return await mostrarLetraActual();

      case 4:
        // Comprar otra canción VIP
        usuario.contexto = 'compra_vip';
        return obtenerMenuCompraVIP();

      case 5:
        // Mis privilegios VIP
        usuario.contexto = 'privilegios_vip';
        return obtenerMenuPrivilegiosVIP();

      case 0:
        return `👋 Gracias por ser VIP en Plaza Music.\n\nEscribe "Hola" cuando quieras pedir música.`;

      default:
        return '❌ Opción inválida.\n\n' + obtenerMenuVIP(usuario);
    }
  }

  // Manejar tipo de búsqueda
  if (usuario.contexto === 'tipo_busqueda_vip') {
    const opcion = parseInt(texto);

    if (opcion === 0) {
      usuario.contexto = null;
      return obtenerMenuVIP(usuario);
    }

    if (opcion === 1) {
      usuario.contexto = 'buscar_cancion_vip';
      return obtenerMenuBusqueda();
    }

    if (opcion === 2) {
      usuario.contexto = 'buscar_artista_vip';
      return obtenerMenuArtista();
    }

    return '❌ Opción inválida.\n\n' + obtenerMenuTipoBusqueda();
  }

  // Manejar búsqueda de canción VIP
  if (usuario.contexto === 'buscar_cancion_vip') {
    if (texto === '0') {
      usuario.contexto = null;
      return obtenerMenuVIP(usuario);
    }

    return await buscarCancionVIP(usuario, texto, estado);
  }

  // Manejar búsqueda por artista VIP
  if (usuario.contexto === 'buscar_artista_vip') {
    if (texto === '0') {
      usuario.contexto = null;
      return obtenerMenuVIP(usuario);
    }

    return await buscarPorArtistaVIP(usuario, texto, estado);
  }

  // Manejar selección de canción VIP
  if (usuario.contexto === 'seleccionar_cancion_vip') {
    return await seleccionarCancionVIP(usuario, texto, estado);
  }

  // Manejar confirmación de canción VIP
  if (usuario.contexto === 'confirmar_cancion_vip') {
    return await confirmarCancionVIP(usuario, texto, estado);
  }

  // Manejar menú de compra VIP
  if (usuario.contexto === 'compra_vip') {
    return await manejarCompraVIP(usuario, texto, estado);
  }

  // Manejar menú de privilegios VIP
  if (usuario.contexto === 'privilegios_vip') {
    return await manejarPrivilegiosVIP(usuario, texto, estado);
  }

  // Por defecto, mostrar menú VIP
  usuario.contexto = null;
  return obtenerMenuVIP(usuario);
}

/**
 * Verificar cooldown y mostrar menú de búsqueda o mensaje de cooldown
 */
async function verificarCooldownYMostrarMenu(usuario) {
  if (!usuario.ultimaCancionVIP) {
    // Primera canción VIP, no hay cooldown
    usuario.contexto = 'tipo_busqueda_vip';
    return obtenerMenuTipoBusqueda();
  }

  const ahora = Date.now();
  const tiempoTranscurrido = ahora - usuario.ultimaCancionVIP;

  if (tiempoTranscurrido < COOLDOWN_VIP) {
    // Cooldown activo
    const minutosRestantes = Math.ceil((COOLDOWN_VIP - tiempoTranscurrido) / 60000);
    return obtenerMensajeCooldownVIP(minutosRestantes);
  }

  // Cooldown terminado, puede pedir canción
  usuario.contexto = 'tipo_busqueda_vip';
  return obtenerMenuTipoBusqueda();
}

/**
 * Buscar canción VIP
 */
async function buscarCancionVIP(usuario, query, estado) {
  try {
    const resultados = await buscarCancionEnSpotify(query, 10);

    if (resultados.length === 0) {
      return `❌ No encontré canciones con "${query}".\n\n` +
             `💡 Intenta con otro nombre o artista.\n` +
             `📝 Escribe "0" para volver al menú.`;
    }

    // Filtrar canciones (VIP tiene filtros más flexibles)
    const filtradas = await obtenerCancionesFiltradas(resultados);

    if (filtradas.length === 0) {
      return `❌ No encontré canciones apropiadas con "${query}".\n\n` +
             `💡 Las canciones pueden estar filtradas por contenido extremo.\n` +
             `📝 Escribe "0" para volver al menú.`;
    }

    // Guardar resultados en el contexto del usuario
    usuario.ultimaSugerencia = {
      canciones: filtradas.slice(0, 10)
    };
    usuario.contexto = 'seleccionar_cancion_vip';

    let mensaje = `🎵 *TOP 10 COINCIDENCIAS*\n\n`;
    mensaje += obtenerMenuResultados(usuario.ultimaSugerencia.canciones, usuario);

    return mensaje;
  } catch (error) {
    log(`❌ Error en buscarCancionVIP: ${error.message}`, 'error');
    return '❌ Ocurrió un error buscando la canción. Intenta nuevamente.';
  }
}

/**
 * Buscar por artista VIP
 */
async function buscarPorArtistaVIP(usuario, query, estado) {
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
    usuario.contexto = 'seleccionar_cancion_vip';

    let respuesta = `🎤 *${artista.name}*\n\n`;
    respuesta += `Top canciones:\n\n`;
    respuesta += obtenerMenuResultados(usuario.ultimaSugerencia.canciones, usuario);

    return respuesta;
  } catch (error) {
    log(`❌ Error en buscarPorArtistaVIP: ${error.message}`, 'error');
    return '❌ Ocurrió un error buscando el artista. Intenta nuevamente.';
  }
}

/**
 * Seleccionar canción de los resultados VIP
 */
async function seleccionarCancionVIP(usuario, texto, estado) {
  try {
    if (texto === '0') {
      usuario.contexto = null;
      usuario.ultimaSugerencia = null;
      return obtenerMenuVIP(usuario);
    }

    if (texto.toLowerCase() === 'nueva' || texto.toLowerCase() === 'nuevo') {
      usuario.contexto = 'buscar_cancion_vip';
      usuario.ultimaSugerencia = null;
      return obtenerMenuBusqueda();
    }

    const opcion = parseInt(texto);

    if (isNaN(opcion) || opcion < 1 || opcion > usuario.ultimaSugerencia.canciones.length) {
      return `❌ Opción inválida.\n\n` +
             `📝 Escribe un número del 1 al ${usuario.ultimaSugerencia.canciones.length}`;
    }

    const cancionSeleccionada = usuario.ultimaSugerencia.canciones[opcion - 1];

    // Guardar canción seleccionada y pedir confirmación
    usuario.cancionParaAgregar = cancionSeleccionada;
    usuario.contexto = 'confirmar_cancion_vip';

    return obtenerMenuConfirmacion(cancionSeleccionada);
  } catch (error) {
    log(`❌ Error en seleccionarCancionVIP: ${error.message}`, 'error');
    return '❌ Ocurrió un error agregando la canción. Intenta nuevamente.';
  }
}

/**
 * Confirmar canción seleccionada VIP
 */
async function confirmarCancionVIP(usuario, texto, estado) {
  const opcion = parseInt(texto);

  if (opcion === 2 || texto === '0') {
    // No agregar
    usuario.contexto = 'seleccionar_cancion_vip';
    delete usuario.cancionParaAgregar;
    return obtenerMenuResultados(usuario.ultimaSugerencia.canciones, usuario);
  }

  if (opcion !== 1) {
    return '❌ Opción inválida.\n\n' + obtenerMenuConfirmacion(usuario.cancionParaAgregar);
  }

  // Opción 1: Sí, agregar
  const cancion = usuario.cancionParaAgregar;

  try {
    // Agregar a playlist con prioridad VIP (posición 0 - después de la canción actual)
    await agregarCancionAPlaylist(cancion.uri, 0);

    // Actualizar estadísticas del usuario
    usuario.cancionesPedidas++;
    usuario.estadisticas.totalCanciones++;
    usuario.ultimaCancionVIP = Date.now();

    // Guardar nombre de la canción para historial
    const nombreCancion = `${cancion.name} - ${cancion.artists[0].name}`;
    usuario.estadisticas.ultimaCancionVIP = nombreCancion;

    // Actualizar artistas favoritos
    const artista = cancion.artists[0].name;
    usuario.estadisticas.artistasFavoritos[artista] =
      (usuario.estadisticas.artistasFavoritos[artista] || 0) + 1;

    // Limpiar contexto
    usuario.contexto = null;
    usuario.ultimaSugerencia = null;
    delete usuario.cancionParaAgregar;

    const artistas = cancion.artists.map(a => a.name).join(', ');

    log(`✅ VIP ${usuario.nombre} agregó con prioridad: ${cancion.name}`, 'info');

    return `👑 *¡CANCIÓN VIP AGREGADA!*\n\n` +
           `🎵 ${cancion.name}\n` +
           `🎤 ${artistas}\n\n` +
           `━━━━━━━━━━━━━━━━━━━━━\n\n` +
           `Tu canción VIP será agregada inmediatamente después de la que está sonando.\n\n` +
           `Te avisaremos cuando falten 2 canciones antes de que inicie.\n\n` +
           `━━━━━━━━━━━━━━━━━━━━━\n\n` +
           `💡 Escribe "menu" para volver al menú principal.`;
  } catch (error) {
    log(`❌ Error confirmando canción VIP: ${error.message}`, 'error');
    usuario.contexto = null;
    delete usuario.cancionParaAgregar;
    return '❌ Error agregando la canción. Intenta nuevamente.';
  }
}

/**
 * Manejar menú de compra VIP
 */
async function manejarCompraVIP(usuario, texto, estado) {
  const opcion = parseInt(texto);

  if (opcion === 0 || opcion === 3 || texto.toLowerCase() === 'volver') {
    usuario.contexto = null;
    return obtenerMenuVIP(usuario);
  }

  if (opcion === 1) {
    // Ver código QR de pago
    try {
      const { generarPagoOXXO } = await import('../core/payments.js');
      const { PERFILES } = await import('../core/profiles.js');

      const datosPago = await generarPagoOXXO(usuario, PERFILES.VIP);

      usuario.contexto = 'upgrade_esperando_comprobante';
      usuario.pagoEnProceso = {
        perfil: PERFILES.VIP,
        referencia: datosPago.referencia,
        tipo: 'OXXO',
        esCompraAdicional: true
      };

      let mensaje = `💳 *PAGO CANCIÓN VIP - OXXO*\n\n`;
      mensaje += `Aquí tienes tu código QR para pagar tu canción VIP:\n\n`;
      mensaje += `[QR CANCIÓN VIP]\n\n`;
      mensaje += `💰 Monto: $${datosPago.monto} pesos\n\n`;
      mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensaje += `Después de pagar, envía la foto del comprobante.\n\n`;
      mensaje += `📋 Referencia: ${datosPago.referencia}\n\n`;
      mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensaje += `💡 Una vez aprobado, podrás agregar tu canción VIP adicional.`;

      return mensaje;
    } catch (error) {
      log(`❌ Error generando pago VIP: ${error.message}`, 'error');
      usuario.contexto = null;
      return `❌ Error generando el pago. Intenta nuevamente.\n\n` +
             obtenerMenuVIP(usuario);
    }
  }

  if (opcion === 2) {
    // ¿Cómo funciona la compra VIP?
    return obtenerMenuInfoCompraVIP();
  }

  return '❌ Opción inválida.\n\n' + obtenerMenuCompraVIP();
}

/**
 * Manejar menú de privilegios VIP
 */
async function manejarPrivilegiosVIP(usuario, texto, estado) {
  const opcion = parseInt(texto);

  if (opcion === 0 || texto.toLowerCase() === 'volver') {
    usuario.contexto = null;
    return obtenerMenuVIP(usuario);
  }

  switch (opcion) {
    case 1:
      // Ver beneficios completos
      return obtenerMenuBeneficiosVIP();

    case 2:
      // Ver historial VIP
      return obtenerMenuHistorialVIP(usuario);

    case 3:
      // Solicitar soporte directo con administrador
      log(`📞 Usuario VIP ${usuario.nombre} solicitó soporte directo`, 'info');
      return `🛠️ *SOPORTE DIRECTO*\n\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n\n` +
             `Envié tu solicitud al administrador.\n\n` +
             `Te contactará en breve.\n\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n\n` +
             `0️⃣ Volver`;

    default:
      return '❌ Opción inválida.\n\n' + obtenerMenuPrivilegiosVIP();
  }
}

/**
 * Mostrar cola y tiempos
 */
async function mostrarColaYTiempos() {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      return '📊 *PRÓXIMAS 5 CANCIONES*\n\n' +
             '🎵 La cola está vacía.\n\n' +
             '💡 ¡Sé el primero en agregar una canción!\n\n' +
             '0️⃣ Volver';
    }

    return obtenerMenuColaYTiempos(playlist);
  } catch (error) {
    log(`❌ Error mostrando cola y tiempos: ${error.message}`, 'error');
    return '❌ Error obteniendo la cola de reproducción.';
  }
}

/**
 * Mostrar letra actual
 */
async function mostrarLetraActual() {
  try {
    // Obtener reproducción actual
    const { obtenerReproduccionActual } = await import('../conexion/spotify.js');
    const estado = await obtenerReproduccionActual();

    if (!estado || !estado.item) {
      return `📜 *LETRA ACTUAL*\n\n` +
             `No hay ninguna canción sonando actualmente.\n\n` +
             `0️⃣ Volver`;
    }

    const cancion = estado.item;

    // Por ahora, sin letra (implementación futura)
    // En producción se conectaría a API de letras (Genius, Musixmatch, etc.)
    return obtenerMenuLetraActual(cancion, null);
  } catch (error) {
    log(`❌ Error mostrando letra: ${error.message}`, 'error');
    return '❌ Error obteniendo la letra.';
  }
}
