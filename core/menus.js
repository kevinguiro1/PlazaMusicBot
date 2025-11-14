// core/menus.js - Sistema de Menús Interactivos por Perfil
import { PERFILES, obtenerPerfil, obtenerResumenPerfil } from './profiles.js';
import { obtenerSaludo } from '../utils/saludos.js';

/**
 * Menú principal según perfil de usuario
 */
export function obtenerMenuPrincipal(usuario) {
  const perfil = obtenerPerfil(usuario);
  const resumen = obtenerResumenPerfil(usuario);

  let menu = `━━━━━━━━━━━━━━━━━━━━━\n`;
  menu += `${perfil.emoji} *MÚSICA PLAZA* ${perfil.emoji}\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `${resumen}\n\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n`;
  menu += `📋 *MENÚ PRINCIPAL*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Opciones básicas para todos
  menu += `1️⃣ 🎵 Pedir canción\n`;
  menu += `2️⃣ 🎤 Buscar por artista\n`;
  menu += `3️⃣ 📜 Ver próximas 5 canciones\n`;

  // Opciones premium+
  if (perfil.puedeVerCola) {
    menu += `4️⃣ 📜 Ver cola completa\n`;
  }

  // Opciones VIP+
  if (perfil.puedeVerEstadisticas) {
    menu += `5️⃣ 📊 Ver estadísticas\n`;
    menu += `6️⃣ 👤 Mi perfil\n`;
  }

  // Opciones DJ
  if (usuario.perfil === PERFILES.TECNICO) {
    menu += `7️⃣ 🎧 Panel Técnico\n`;
  }

  // Opciones Admin
  if (usuario.perfil === PERFILES.ADMINISTRADOR || usuario.perfil === PERFILES.ADMINISTRADOR) {
    menu += `9️⃣ 👤 Panel Admin\n`;
  }

  menu += `\n0️⃣ ❌ Salir\n`;
  menu += `❓ ℹ️ Ayuda\n\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n`;
  menu += `💡 Escribe el número de opción`;

  return menu;
}

/**
 * Menú de búsqueda de canciones
 */
export function obtenerMenuBusqueda() {
  return `🔍 *BÚSQUEDA DE CANCIONES*\n\n` +
         `Escribe el nombre de la canción que deseas buscar.\n\n` +
         `💡 Ejemplos:\n` +
         `• "Bohemian Rhapsody"\n` +
         `• "Shape of You Ed Sheeran"\n` +
         `• "Despacito"\n\n` +
         `📝 Escribe el nombre o escribe "0" para volver al menú principal.`;
}

/**
 * Menú de búsqueda por artista
 */
export function obtenerMenuArtista() {
  return `🎤 *BÚSQUEDA POR ARTISTA*\n\n` +
         `Escribe el nombre del artista que te interesa.\n\n` +
         `💡 Ejemplos:\n` +
         `• "Queen"\n` +
         `• "Ed Sheeran"\n` +
         `• "Bad Bunny"\n\n` +
         `📝 Escribe el nombre o "0" para volver.`;
}

/**
 * Menú de resultados de búsqueda
 */
export function obtenerMenuResultados(canciones, usuario) {
  const perfil = obtenerPerfil(usuario);

  let menu = `🎵 *RESULTADOS DE BÚSQUEDA*\n\n`;

  canciones.forEach((cancion, index) => {
    const artistas = cancion.artists.map(a => a.name).join(', ');
    const duracion = formatearDuracion(cancion.duration_ms);
    menu += `${index + 1}️⃣ *${cancion.name}*\n`;
    menu += `   🎤 ${artistas}\n`;
    menu += `   ⏱️ ${duracion}\n\n`;
  });

  menu += `━━━━━━━━━━━━━━━━━━━━━\n`;
  menu += `📝 Escribe el número (1-${canciones.length}) para seleccionar\n`;
  menu += `0️⃣ Volver al menú\n`;
  menu += `🔄 "nueva" para nueva búsqueda`;

  return menu;
}

/**
 * Menú del panel Técnico
 */
export function obtenerMenuTecnico() {
  return `🎧 *PANEL TÉCNICO*\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n` +
         `*CONTROLES DE AUDIO*\n` +
         `1️⃣ ⏸️ Pausar/Reanudar\n` +
         `2️⃣ 🔊 Subir volumen\n` +
         `3️⃣ 🔉 Bajar volumen\n` +
         `4️⃣ ⏭️ Siguiente canción\n` +
         `5️⃣ ⏮️ Canción anterior\n\n` +
         `*GESTIÓN DE COLA*\n` +
         `6️⃣ 📜 Ver cola completa\n` +
         `7️⃣ 🗑️ Eliminar canción de cola\n` +
         `8️⃣ 🎵 Agregar canción prioritaria\n` +
         `9️⃣ 🧹 Limpiar playlist\n\n` +
         `*INFORMACIÓN*\n` +
         `🔟 📊 Ver estadísticas en vivo\n` +
         `1️⃣1️⃣ ℹ️ Estado de reproducción\n\n` +
         `0️⃣ ⬅️ Volver\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n` +
         `📝 Selecciona una opción`;
}

/**
 * Menú del panel de administración
 */
export function obtenerMenuAdmin() {
  return `👤 *PANEL DE ADMINISTRACIÓN*\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n` +
         `*USUARIOS*\n` +
         `1️⃣ 👥 Ver usuarios registrados\n` +
         `2️⃣ 🚫 Bloquear usuario\n` +
         `3️⃣ ✅ Desbloquear usuario\n` +
         `4️⃣ ⭐ Promover usuario\n` +
         `5️⃣ ⬇️ Degradar usuario\n\n` +
         `*SISTEMA*\n` +
         `6️⃣ 📊 Ver estadísticas generales\n` +
         `7️⃣ 📜 Ver logs recientes\n` +
         `8️⃣ 🔒 Ver usuarios bloqueados\n` +
         `9️⃣ 🧹 Limpiar datos antiguos\n\n` +
         `*COMUNICACIÓN*\n` +
         `🔟 📢 Enviar mensaje masivo\n` +
         `1️⃣1️⃣ 📣 Enviar anuncio\n\n` +
         `0️⃣ ⬅️ Volver\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n` +
         `📝 Selecciona una opción`;
}

/**
 * Menú de ayuda según perfil
 */
export function obtenerMenuAyuda(usuario) {
  const perfil = obtenerPerfil(usuario);

  let ayuda = `ℹ️ *AYUDA - MÚSICA PLAZA*\n\n`;
  ayuda += `━━━━━━━━━━━━━━━━━━━━━\n`;
  ayuda += `*TU PERFIL*\n`;
  ayuda += `${perfil.emoji} ${perfil.nombre}\n`;
  ayuda += `🎵 Límite diario: ${perfil.limiteCanciones} canciones\n`;
  ayuda += `⏰ Cooldown: ${perfil.cooldownMinutos} minutos\n\n`;

  ayuda += `━━━━━━━━━━━━━━━━━━━━━\n`;
  ayuda += `*CÓMO USAR EL BOT*\n\n`;

  ayuda += `1️⃣ *Pedir canciones*\n`;
  ayuda += `Escribe el nombre de la canción o usa el menú para buscar.\n\n`;

  ayuda += `2️⃣ *Buscar por artista*\n`;
  ayuda += `Explora las mejores canciones de tus artistas favoritos.\n\n`;

  if (perfil.puedeVerCola) {
    ayuda += `3️⃣ *Ver cola*\n`;
    ayuda += `Mira qué canciones están en la lista de reproducción.\n\n`;
  }

  ayuda += `━━━━━━━━━━━━━━━━━━━━━\n`;
  ayuda += `*COMANDOS RÁPIDOS*\n\n`;
  ayuda += `• "menu" - Volver al menú principal\n`;
  ayuda += `• "perfil" - Ver tu perfil\n`;
  ayuda += `• "ayuda" - Mostrar esta ayuda\n`;
  ayuda += `• "salir" - Cerrar sesión\n\n`;

  ayuda += `━━━━━━━━━━━━━━━━━━━━━\n`;
  ayuda += `*PERFILES DISPONIBLES*\n\n`;
  ayuda += `🎵 NORMAL - 3 canciones/día\n`;
  ayuda += `⭐ PREMIUM - 10 canciones/día\n`;
  ayuda += `💎 VIP - Canciones ilimitadas\n`;
  ayuda += `🎧 TÉCNICO - Control total de música\n\n`;

  ayuda += `━━━━━━━━━━━━━━━━━━━━━\n`;
  ayuda += `💡 ¿Necesitas ayuda? Contacta a un administrador.`;

  return ayuda;
}

/**
 * Menú de FAQ
 */
export function obtenerMenuFAQ() {
  return `❓ *PREGUNTAS FRECUENTES*\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n\n` +
         `*¿Cómo pido una canción?*\n` +
         `Simplemente escribe el nombre de la canción o usa el menú de búsqueda.\n\n` +
         `*¿Cuántas canciones puedo pedir?*\n` +
         `Depende de tu perfil:\n` +
         `• NORMAL: 3 por día\n` +
         `• PREMIUM: 10 por día\n` +
         `• VIP: Ilimitadas\n\n` +
         `*¿Cómo me hago Premium/VIP?*\n` +
         `Escribe "upgrade" para ver las opciones de pago.\n\n` +
         `*¿Por qué no encuentro una canción?*\n` +
         `Algunas canciones pueden estar filtradas por contenido explícito o no estar disponibles en Spotify.\n\n` +
         `*¿Cuánto tarda en sonar mi canción?*\n` +
         `Depende de la cola actual. Los usuarios VIP tienen prioridad.\n\n` +
         `*¿Puedo ver la cola de reproducción?*\n` +
         `Sí, si eres PREMIUM o superior.\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n` +
         `💡 Escribe "menu" para volver`;
}

/**
 * Menú de upgrade de perfil
 */
export function obtenerMenuUpgrade(usuario) {
  let mensaje = `⭐ *MEJORA TU PERFIL*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `Tu perfil actual: ${obtenerPerfil(usuario).nombre}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Solo mostrar upgrades disponibles
  if (usuario.perfil === PERFILES.NORMAL) {
    mensaje += `⭐ *PREMIUM* - $10 MXN\n`;
    mensaje += `• 10 canciones por día\n`;
    mensaje += `• Ver cola completa\n`;
    mensaje += `• Ver estadísticas\n`;
    mensaje += `• Prioridad media\n\n`;

    mensaje += `💎 *VIP* - $100 MXN\n`;
    mensaje += `• 1 canción por hora\n`;
    mensaje += `• Prioridad MÁXIMA\n`;
    mensaje += `• Pedir desde cualquier lugar\n`;
    mensaje += `• Estadísticas avanzadas\n`;
    mensaje += `• No puedes cancelar (garantizado)\n\n`;
  } else if (usuario.perfil === PERFILES.PREMIUM) {
    mensaje += `💎 *VIP* - $100 MXN\n`;
    mensaje += `• 1 canción por hora\n`;
    mensaje += `• Prioridad MÁXIMA\n`;
    mensaje += `• Pedir desde cualquier lugar\n`;
    mensaje += `• Estadísticas avanzadas\n`;
    mensaje += `• No puedes cancelar (garantizado)\n\n`;
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `*MÉTODOS DE PAGO*\n\n`;
  mensaje += `1️⃣ Pago en OXXO\n`;
  mensaje += `2️⃣ Transferencia SPEI\n\n`;
  mensaje += `0️⃣ Volver\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `💡 Selecciona un método de pago`;

  return mensaje;
}

/**
 * Menú de selección de perfil para upgrade
 */
export function obtenerMenuSeleccionPerfil(usuario) {
  let mensaje = `⭐ *SELECCIONA TU PERFIL*\n\n`;

  if (usuario.perfil === PERFILES.NORMAL) {
    mensaje += `1️⃣ PREMIUM - $10 MXN\n`;
    mensaje += `2️⃣ VIP - $100 MXN\n\n`;
  } else if (usuario.perfil === PERFILES.PREMIUM) {
    mensaje += `1️⃣ VIP - $100 MXN\n\n`;
  }

  mensaje += `0️⃣ Cancelar\n\n`;
  mensaje += `💡 Escribe el número`;

  return mensaje;
}

/**
 * Formatear información de pago OXXO
 */
export function formatearPagoOXXO(datosPago) {
  let mensaje = `🏪 *PAGO EN OXXO*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `💰 Monto: $${datosPago.monto} MXN\n`;
  mensaje += `📋 Referencia:\n*${datosPago.referencia}*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `*INSTRUCCIONES:*\n\n`;

  datosPago.instrucciones.forEach((instruccion, index) => {
    mensaje += `${instruccion}\n`;
  });

  mensaje += `\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `⏰ Válido por 24 horas\n\n`;
  mensaje += `💡 Después de pagar, envía una foto de tu comprobante a este chat.`;

  return mensaje;
}

/**
 * Formatear información de pago SPEI
 */
export function formatearPagoSPEI(datosPago) {
  let mensaje = `🏦 *TRANSFERENCIA SPEI*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `💰 Monto: $${datosPago.monto} MXN\n`;
  mensaje += `🏦 Banco: ${datosPago.banco}\n`;
  mensaje += `👤 Beneficiario:\n${datosPago.beneficiario}\n\n`;
  mensaje += `📋 CLABE:\n*${datosPago.clabe}*\n\n`;
  mensaje += `📝 Concepto:\n${datosPago.referencia}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `*INSTRUCCIONES:*\n\n`;

  datosPago.instrucciones.forEach((instruccion, index) => {
    mensaje += `${instruccion}\n`;
  });

  mensaje += `\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `⏰ Válido por 24 horas\n\n`;
  mensaje += `💡 Después de transferir, envía una foto de tu comprobante a este chat.`;

  return mensaje;
}

/**
 * Formatear duración de milisegundos a mm:ss
 */
function formatearDuracion(ms) {
  const minutos = Math.floor(ms / 60000);
  const segundos = Math.floor((ms % 60000) / 1000);
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

/**
 * Mensaje de bienvenida
 */
export function obtenerMensajeBienvenida() {
  const saludo = obtenerSaludo();

  return `${saludo}! 🎵\n\n` +
         `*¡BIENVENIDO A MÚSICA PLAZA!*\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n\n` +
         `Soy tu asistente musical para la plaza.\n` +
         `Puedo ayudarte a:\n\n` +
         `🎵 Pedir tus canciones favoritas\n` +
         `🎤 Descubrir música de artistas\n` +
         `📊 Ver estadísticas de reproducción\n` +
         `💎 Y mucho más...\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n\n` +
         `Para comenzar, por favor dime:\n` +
         `*¿Cómo te llamas?*`;
}

/**
 * Mensaje de solicitud de ubicación
 */
export function obtenerMensajeSolicitudUbicacion(nombre) {
  const saludo = obtenerSaludo();

  return `${saludo} ${nombre}! 👋\n\n` +
         `Para continuar, necesito verificar que estás en la plaza.\n\n` +
         `📍 Por favor, envía tu ubicación en tiempo real.\n\n` +
         `💡 En WhatsApp: 📎 → Ubicación → Ubicación en tiempo real`;
}

/**
 * Mensaje de ubicación verificada
 */
export function obtenerMensajeUbicacionVerificada(nombre) {
  return `✅ *¡Ubicación verificada!*\n\n` +
         `¡Perfecto ${nombre}! Ya puedes empezar a pedir música.\n\n` +
         `Escribe "menu" para ver todas las opciones disponibles.`;
}

/**
 * Mensaje de ubicación rechazada
 */
export function obtenerMensajeUbicacionRechazada(nombre) {
  return `❌ *Ubicación fuera de rango*\n\n` +
         `Lo siento ${nombre}, parece que no estás en la plaza.\n\n` +
         `Este bot solo funciona para personas que están físicamente en la plaza.\n\n` +
         `📍 Acércate a la plaza e intenta nuevamente.`;
}
