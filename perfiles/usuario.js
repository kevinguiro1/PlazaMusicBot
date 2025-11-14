// perfiles/usuario.js - Manejador de Usuarios Normales (Free, Premium, VIP)
import {
  puedePedirCancion,
  mensajeLimiteAlcanzado,
  obtenerPerfil
} from '../core/profiles.js';
import {
  obtenerMenuPrincipal,
  obtenerMenuTipoBusqueda,
  obtenerMenuBusqueda,
  obtenerMenuArtista,
  obtenerMenuResultados,
  obtenerMenuConfirmacion,
  obtenerMenuColaYTiempos,
  obtenerMenuLetraActual,
  obtenerMenuGestionarMembresia,
  obtenerMenuBeneficiosPremium,
  obtenerMenuRenovarPremium,
  obtenerMenuCancelarMembresia
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
        // Pedir canción - mostrar tipo de búsqueda
        usuario.contexto = 'tipo_busqueda';
        return obtenerMenuTipoBusqueda();

      case 2:
        // Ver cola y tiempos
        return await mostrarColaYTiempos();

      case 3:
        // Hacerme Premium/VIP (solo si no es VIP)
        if (usuario.perfil === 'vip') {
          return '✨ Ya tienes el perfil VIP, no puedes mejorarlo más.';
        }
        // Redirigir al flujo de upgrade
        usuario.contexto = 'upgrade_inicio';
        const { manejarUpgrade } = await import('./payments-handler.js');
        return await manejarUpgrade(usuario, 'inicio', estado);

      case 4:
        // Ver letra actual
        return await mostrarLetraActual();

      case 5:
        // Gestionar membresía (solo Premium)
        if (usuario.perfil === 'premium') {
          usuario.contexto = 'gestionar_membresia';
          return obtenerMenuGestionarMembresia(usuario);
        }
        return '❌ Opción inválida.\n\n' + obtenerMenuPrincipal(usuario);

      case 0:
        return `👋 Hasta pronto ${usuario.nombre}!\n\nEscribe "menu" cuando quieras volver.`;

      default:
        return '❌ Opción inválida.\n\n' + obtenerMenuPrincipal(usuario);
    }
  }

  // Manejar tipo de búsqueda
  if (usuario.contexto === 'tipo_busqueda') {
    const opcion = parseInt(texto);

    if (opcion === 0) {
      usuario.contexto = null;
      return obtenerMenuPrincipal(usuario);
    }

    if (opcion === 1) {
      usuario.contexto = 'buscar_cancion';
      return obtenerMenuBusqueda();
    }

    if (opcion === 2) {
      usuario.contexto = 'buscar_artista';
      return obtenerMenuArtista();
    }

    return '❌ Opción inválida.\n\n' + obtenerMenuTipoBusqueda();
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

  if (usuario.contexto === 'confirmar_cancion') {
    return await confirmarCancion(usuario, texto, estado);
  }

  // Gestionar membresía Premium
  if (usuario.contexto === 'gestionar_membresia') {
    return await manejarGestionMembresia(usuario, texto, estado);
  }

  if (usuario.contexto === 'renovar_premium') {
    return await manejarRenovacionPremium(usuario, texto, estado);
  }

  if (usuario.contexto === 'cancelar_membresia') {
    return await manejarCancelacionMembresia(usuario, texto, estado);
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

    // Guardar canción seleccionada y pedir confirmación
    usuario.cancionParaAgregar = cancionSeleccionada;
    usuario.contexto = 'confirmar_cancion';

    return obtenerMenuConfirmacion(cancionSeleccionada);
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

/**
 * Confirmar canción seleccionada
 */
async function confirmarCancion(usuario, texto, estado) {
  const opcion = parseInt(texto);

  if (opcion === 2 || texto === '0') {
    // No agregar
    usuario.contexto = 'seleccionar_cancion';
    delete usuario.cancionParaAgregar;
    return obtenerMenuResultados(usuario.ultimaSugerencia.canciones, usuario);
  }

  if (opcion !== 1) {
    return '❌ Opción inválida.\n\n' + obtenerMenuConfirmacion(usuario.cancionParaAgregar);
  }

  // Opción 1: Sí, agregar
  const cancion = usuario.cancionParaAgregar;

  try {
    // Agregar a playlist con prioridad según perfil
    const perfil = obtenerPerfil(usuario);
    const posicion = perfil.prioridad >= 3 ? 0 : null; // VIP+ va al inicio

    await agregarCancionAPlaylist(cancion.uri, posicion);

    // Actualizar estadísticas del usuario
    usuario.cancionesPedidasHoy++;
    usuario.cancionesPedidas++;
    usuario.agregadasHoy.push(cancion.uri);
    usuario.estadisticas.totalCanciones++;

    // Actualizar artistas favoritos
    const artista = cancion.artists[0].name;
    usuario.estadisticas.artistasFavoritos[artista] =
      (usuario.estadisticas.artistasFavoritos[artista] || 0) + 1;

    // Calcular tiempo estimado
    const { minutos, segundos } = await calcularTiempoParaTrack(cancion.uri);

    // Limpiar contexto
    usuario.contexto = null;
    usuario.ultimaSugerencia = null;
    delete usuario.cancionParaAgregar;

    const artistas = cancion.artists.map(a => a.name).join(', ');
    const disponibles = perfil.limiteCanciones - usuario.cancionesPedidasHoy;

    log(`✅ ${usuario.nombre} agregó: ${cancion.name}`, 'info');

    return `✅ *¡Canción agregada!*\n\n` +
           `🎵 ${cancion.name}\n` +
           `🎤 ${artistas}\n\n` +
           `⏱️ Sonará en aproximadamente: ${minutos}m ${segundos}s\n\n` +
           `📊 Canciones disponibles hoy: ${disponibles}/${perfil.limiteCanciones}\n\n` +
           `💡 Escribe "menu" para volver al menú principal.`;
  } catch (error) {
    log(`❌ Error confirmando canción: ${error.message}`, 'error');
    usuario.contexto = null;
    delete usuario.cancionParaAgregar;
    return '❌ Error agregando la canción. Intenta nuevamente.';
  }
}

/**
 * Mostrar cola y tiempos
 */
async function mostrarColaYTiempos() {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      return '📊 *COLA Y TIEMPOS*\n\n' +
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
      return obtenerMenuLetraActual(null);
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

/**
 * Manejar menú de gestión de membresía
 */
async function manejarGestionMembresia(usuario, texto, estado) {
  const opcion = parseInt(texto);

  if (opcion === 0 || texto.toLowerCase() === 'volver') {
    usuario.contexto = null;
    return obtenerMenuPrincipal(usuario);
  }

  switch (opcion) {
    case 1:
      // Ver beneficios Premium
      return obtenerMenuBeneficiosPremium();

    case 2:
      // Renovar Premium
      usuario.contexto = 'renovar_premium';
      return obtenerMenuRenovarPremium(usuario);

    case 3:
      // Ver QR de pago
      return await mostrarQRPagoActual(usuario);

    case 4:
      // Cancelar membresía
      usuario.contexto = 'cancelar_membresia';
      return obtenerMenuCancelarMembresia(usuario);

    default:
      return '❌ Opción inválida.\n\n' + obtenerMenuGestionarMembresia(usuario);
  }
}

/**
 * Manejar renovación Premium
 */
async function manejarRenovacionPremium(usuario, texto, estado) {
  const opcion = parseInt(texto);

  if (opcion === 0 || texto.toLowerCase() === 'cancelar') {
    usuario.contexto = 'gestionar_membresia';
    return obtenerMenuGestionarMembresia(usuario);
  }

  if (opcion === 1) {
    // Pagar con OXXO - generar pago
    try {
      const { generarPagoOXXO } = await import('../core/payments.js');
      const { PERFILES } = await import('../core/profiles.js');

      const datosPago = await generarPagoOXXO(usuario, PERFILES.PREMIUM);

      usuario.contexto = 'upgrade_esperando_comprobante';
      usuario.pagoEnProceso = {
        perfil: PERFILES.PREMIUM,
        referencia: datosPago.referencia,
        tipo: 'OXXO',
        esRenovacion: true
      };

      let mensaje = `💳 *RENOVACIÓN PREMIUM - OXXO*\n\n`;
      mensaje += `Escanea el siguiente código QR:\n`;
      mensaje += `[QR RENOVACIÓN PREMIUM]\n\n`;
      mensaje += `💰 Monto: $${datosPago.monto} pesos\n\n`;
      mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensaje += `Una vez que pagues, envía foto del ticket.\n\n`;
      mensaje += `¿Ya realizaste el pago?\n\n`;
      mensaje += `1️⃣ Sí, enviar comprobante\n`;
      mensaje += `2️⃣ Ver QR nuevamente\n\n`;
      mensaje += `0️⃣ Cancelar`;

      return mensaje;
    } catch (error) {
      log(`❌ Error generando renovación: ${error.message}`, 'error');
      usuario.contexto = 'gestionar_membresia';
      return `❌ Error generando el pago. Intenta nuevamente.\n\n` +
             obtenerMenuGestionarMembresia(usuario);
    }
  }

  if (opcion === 2) {
    // Ver otros métodos
    const { obtenerMenuMetodosPago } = await import('../core/menus.js');
    return obtenerMenuMetodosPago();
  }

  return '❌ Opción inválida.\n\n' + obtenerMenuRenovarPremium(usuario);
}

/**
 * Manejar cancelación de membresía
 */
async function manejarCancelacionMembresia(usuario, texto, estado) {
  const opcion = parseInt(texto);

  if (opcion === 0 || texto.toLowerCase() === 'volver') {
    usuario.contexto = 'gestionar_membresia';
    return obtenerMenuGestionarMembresia(usuario);
  }

  if (opcion === 2) {
    // No, mantener Premium
    usuario.contexto = null;
    return `✅ *MEMBRESÍA MANTENIDA*\n\n` +
           `Tu membresía Premium sigue activa.\n\n` +
           `¡Gracias por seguir con nosotros! 🎵\n\n` +
           `💡 Escribe "menu" para continuar.`;
  }

  if (opcion === 1) {
    // Sí, cancelar membresía
    const { promoverUsuario, PERFILES } = await import('../core/profiles.js');

    const fechaRegistro = new Date(usuario.fechaRegistro);
    const fechaFin = new Date(fechaRegistro);
    fechaFin.setMonth(fechaFin.getMonth() + 1);

    // Degradar a usuario normal
    promoverUsuario(usuario, PERFILES.NORMAL);

    usuario.contexto = null;

    log(`⚠️ Usuario ${usuario.nombre} canceló su membresía Premium`, 'warn');

    return `✅ *MEMBRESÍA CANCELADA*\n\n` +
           `━━━━━━━━━━━━━━━━━━━━━\n\n` +
           `Tu membresía Premium ha sido cancelada.\n\n` +
           `Tus beneficios estuvieron activos hasta: ${fechaFin.toLocaleDateString()}\n\n` +
           `Ahora tienes perfil *Normal* con:\n` +
           `• 3 canciones por día\n` +
           `• Requiere estar en la plaza\n\n` +
           `━━━━━━━━━━━━━━━━━━━━━\n\n` +
           `💡 Puedes volver a Premium cuando quieras.\n\n` +
           `Escribe "menu" para continuar.`;
  }

  return '❌ Opción inválida.\n\n' + obtenerMenuCancelarMembresia(usuario);
}

/**
 * Mostrar QR de pago actual (si existe un pago en proceso)
 */
async function mostrarQRPagoActual(usuario) {
  if (usuario.pagoEnProceso && usuario.pagoEnProceso.referencia) {
    const perfilNombre = usuario.pagoEnProceso.perfil === 'premium' ? 'PREMIUM' : 'VIP';
    const monto = usuario.pagoEnProceso.perfil === 'premium' ? '10' : '100';

    let mensaje = `💳 *PAGO ${perfilNombre} - OXXO*\n\n`;
    mensaje += `Escanea el siguiente código QR:\n`;
    mensaje += `[QR ${perfilNombre}]\n\n`;
    mensaje += `💰 Monto: $${monto} pesos\n`;
    mensaje += `📋 Referencia: ${usuario.pagoEnProceso.referencia}\n\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `Una vez que pagues, envía foto del ticket.\n\n`;
    mensaje += `0️⃣ Volver`;

    return mensaje;
  } else {
    return `⚠️ *NO HAY PAGO PENDIENTE*\n\n` +
           `No tienes ningún pago en proceso.\n\n` +
           `💡 Inicia una renovación o upgrade para generar un código QR.\n\n` +
           `0️⃣ Volver`;
  }
}
