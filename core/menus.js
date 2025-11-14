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

  // Menú para usuarios NORMAL
  if (usuario.perfil === PERFILES.NORMAL) {
    const disponibles = perfil.limiteCanciones - (usuario.cancionesPedidasHoy || 0);
    menu += `1️⃣ 🎵 Pedir canción (${disponibles}/${perfil.limiteCanciones} disponibles hoy)\n`;
    menu += `2️⃣ 📊 Ver cola y tiempos\n`;
    menu += `3️⃣ 💎 Hacerme Premium/VIP\n`;
    menu += `4️⃣ 📜 Ver letra actual\n`;
    menu += `\n0️⃣ 🚪 Salir\n`;
  }
  // Menú para usuarios PREMIUM
  else if (usuario.perfil === PERFILES.PREMIUM) {
    const disponibles = perfil.limiteCanciones - (usuario.cancionesPedidasHoy || 0);
    menu += `⭐ MENÚ PREMIUM\n\n`;
    menu += `Hola ${usuario.nombre}. Tienes acceso Premium.\n`;
    menu += `Canciones disponibles hoy: ${usuario.cancionesPedidasHoy || 0}/${perfil.limiteCanciones}\n\n`;
    menu += `1️⃣ 🎵 Pedir canción\n`;
    menu += `2️⃣ 📊 Ver cola y tiempos\n`;
    menu += `3️⃣ 👑 Actualizar a VIP\n`;
    menu += `4️⃣ 📜 Ver letra actual\n`;
    menu += `5️⃣ 💳 Gestionar mi membresía\n`;
    menu += `\n0️⃣ 🚪 Salir\n`;
  }
  // Menú para usuarios VIP (usar menú VIP dedicado)
  else if (usuario.perfil === PERFILES.VIP) {
    return obtenerMenuVIP(usuario);
  }
  // Menú para Técnico
  else if (usuario.perfil === PERFILES.TECNICO) {
    menu += `1️⃣ 🎵 Pedir canción\n`;
    menu += `2️⃣ 📊 Ver cola y tiempos\n`;
    menu += `3️⃣ 🎧 Panel Técnico\n`;
    menu += `4️⃣ 📜 Ver letra actual\n`;
    menu += `\n0️⃣ 🚪 Salir\n`;
  }
  // Menú para Admin
  else if (usuario.perfil === PERFILES.ADMINISTRADOR) {
    menu += `1️⃣ 🎵 Pedir canción\n`;
    menu += `2️⃣ 📊 Ver cola y tiempos\n`;
    menu += `3️⃣ 👤 Panel Admin\n`;
    menu += `4️⃣ 📜 Ver letra actual\n`;
    menu += `\n0️⃣ 🚪 Salir\n`;
  }

  menu += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  menu += `💡 Escribe el número de opción`;

  return menu;
}

/**
 * Menú de tipo de búsqueda
 */
export function obtenerMenuTipoBusqueda() {
  return `🎵 *PEDIR CANCIÓN*\n\n` +
         `¿Cómo quieres buscar tu canción?\n\n` +
         `1️⃣ Por nombre\n` +
         `2️⃣ Por artista\n\n` +
         `0️⃣ Volver\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n` +
         `💡 Escribe el número`;
}

/**
 * Menú de búsqueda de canciones
 */
export function obtenerMenuBusqueda() {
  return `🔍 *BÚSQUEDA POR NOMBRE*\n\n` +
         `Escribe el nombre de la canción:\n\n` +
         `💡 Ejemplos:\n` +
         `• "Bohemian Rhapsody"\n` +
         `• "Despacito"\n` +
         `• "Un x100to"\n\n` +
         `0️⃣ Volver`;
}

/**
 * Menú de búsqueda por artista
 */
export function obtenerMenuArtista() {
  return `🎤 *BÚSQUEDA POR ARTISTA*\n\n` +
         `Escribe el nombre del artista:\n\n` +
         `💡 Ejemplos:\n` +
         `• "Queen"\n` +
         `• "Bad Bunny"\n` +
         `• "Ed Sheeran"\n\n` +
         `0️⃣ Volver`;
}

/**
 * Menú de resultados de búsqueda (TOP 10)
 */
export function obtenerMenuResultados(canciones, usuario) {
  let menu = `🎵 *TOP 10 ENCONTRADO*\n\n`;

  const mostrar = Math.min(canciones.length, 10);

  for (let i = 0; i < mostrar; i++) {
    const cancion = canciones[i];
    const artistas = cancion.artists.map(a => a.name).join(', ');
    menu += `${i + 1}️⃣ ${cancion.name}\n`;
    menu += `   🎤 ${artistas}\n\n`;
  }

  menu += `━━━━━━━━━━━━━━━━━━━━━\n`;
  menu += `📝 Escribe el número (1-${mostrar})\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

/**
 * Menú de confirmación de canción
 */
export function obtenerMenuConfirmacion(cancion) {
  const artistas = cancion.artists.map(a => a.name).join(', ');

  return `🎵 *CONFIRMACIÓN*\n\n` +
         `¿Agregar esta canción?\n\n` +
         `🎵 ${cancion.name}\n` +
         `🎤 ${artistas}\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n\n` +
         `1️⃣ Sí\n` +
         `2️⃣ No\n\n` +
         `💡 Escribe el número`;
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
 * Menú de upgrade de perfil (simplificado)
 */
export function obtenerMenuUpgrade(usuario) {
  let mensaje = `💎 *OPCIONES DE MEMBRESÍA*\n\n`;

  // Solo mostrar upgrades disponibles
  if (usuario.perfil === PERFILES.NORMAL) {
    mensaje += `1️⃣ 💎 *PREMIUM* - $10 pesos\n`;
    mensaje += `   • 3 canciones/día\n`;
    mensaje += `   • Prioridad media\n`;
    mensaje += `   • Vigencia: 24 horas\n\n`;

    mensaje += `2️⃣ 👑 *VIP* - $100 por canción\n`;
    mensaje += `   • 1 canción\n`;
    mensaje += `   • Prioridad máxima\n\n`;
  } else if (usuario.perfil === PERFILES.PREMIUM) {
    mensaje += `1️⃣ 👑 *VIP* - $100 por canción\n`;
    mensaje += `   • 1 canción\n`;
    mensaje += `   • Prioridad máxima\n\n`;
  }

  mensaje += `3️⃣ 💳 Ver métodos de pago\n\n`;
  mensaje += `0️⃣ Volver\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `💡 Escribe el número`;

  return mensaje;
}

/**
 * Menú de métodos de pago (solo OXXO QR)
 */
export function obtenerMenuMetodosPago() {
  return `💳 *MÉTODO DE PAGO DISPONIBLE*\n\n` +
         `1️⃣ Pago vía QR OXXO\n\n` +
         `0️⃣ Volver\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n` +
         `💡 Escribe el número`;
}

/**
 * Menú de cola y tiempos
 */
export function obtenerMenuColaYTiempos(canciones) {
  let mensaje = `📊 *COLA Y TIEMPOS*\n\n`;
  mensaje += `Estas son las próximas 5 canciones:\n\n`;

  const mostrar = Math.min(canciones.length, 5);
  let tiempoAcumulado = 0;

  for (let i = 0; i < mostrar; i++) {
    const track = canciones[i].track;
    const artistas = track.artists.map(a => a.name).join(', ');
    const minutos = Math.floor(tiempoAcumulado / 60000);

    mensaje += `${i + 1}️⃣ ${track.name}\n`;
    mensaje += `   🎤 ${artistas}\n`;
    mensaje += `   ⏳ ${minutos} min\n\n`;

    tiempoAcumulado += track.duration_ms;
  }

  const tiempoTotalMin = Math.floor(tiempoAcumulado / 60000);
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `⏱️ Tiempo total estimado: ${tiempoTotalMin} min\n\n`;
  mensaje += `0️⃣ Volver`;

  return mensaje;
}

/**
 * Menú de letra actual
 */
export function obtenerMenuLetraActual(cancion, letra = null) {
  const artistas = cancion ? cancion.artists.map(a => a.name).join(', ') : 'N/A';

  if (!cancion) {
    return `📜 *LETRA ACTUAL*\n\n` +
           `No hay ninguna canción sonando actualmente.\n\n` +
           `0️⃣ Volver`;
  }

  if (!letra) {
    return `📜 *LETRA ACTUAL*\n\n` +
           `🎵 ${cancion.name}\n` +
           `🎤 ${artistas}\n\n` +
           `Esta canción no tiene letra disponible.\n\n` +
           `0️⃣ Volver`;
  }

  return `📜 *LETRA ACTUAL*\n\n` +
         `🎵 ${cancion.name}\n` +
         `🎤 ${artistas}\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n\n` +
         `${letra}\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n\n` +
         `0️⃣ Volver`;
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

/**
 * Menú de gestión de membresía Premium
 */
export function obtenerMenuGestionarMembresia(usuario) {
  const perfil = CONFIG_PERFILES[usuario.perfil];
  const fechaRegistro = new Date(usuario.fechaRegistro);
  const fechaFin = new Date(fechaRegistro);
  fechaFin.setMonth(fechaFin.getMonth() + 1); // Membresía de 1 mes

  const disponibles = perfil.limiteCanciones - (usuario.cancionesPedidasHoy || 0);

  let mensaje = `💳 *TU MEMBRESÍA PREMIUM*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `Estado: ✅ Activa\n`;
  mensaje += `Vigencia: ${fechaFin.toLocaleDateString()}\n`;
  mensaje += `Canciones por día: ${perfil.limiteCanciones}\n`;
  mensaje += `Usadas hoy: ${usuario.cancionesPedidasHoy || 0}\n`;
  mensaje += `Disponibles: ${disponibles}\n`;
  mensaje += `Saldo pendiente: $0\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `1️⃣ Ver beneficios Premium\n`;
  mensaje += `2️⃣ Renovar Premium\n`;
  mensaje += `3️⃣ Ver QR de pago\n`;
  mensaje += `4️⃣ Cancelar membresía\n\n`;
  mensaje += `0️⃣ Volver\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `💡 Escribe el número`;

  return mensaje;
}

/**
 * Menú de beneficios Premium
 */
export function obtenerMenuBeneficiosPremium() {
  let mensaje = `⭐ *BENEFICIOS PREMIUM*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `✅ 3 canciones por día\n`;
  mensaje += `✅ Pedir música sin estar en la plaza\n`;
  mensaje += `✅ Ver cola de reproducción completa\n`;
  mensaje += `✅ Búsqueda avanzada por artista\n`;
  mensaje += `✅ Sin cooldown entre canciones\n`;
  mensaje += `✅ Notificaciones personalizadas\n`;
  mensaje += `✅ Soporte prioritario\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `💰 *PRECIO:* $10 pesos\n`;
  mensaje += `📅 *DURACIÓN:* 30 días\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `💎 *¿QUIERES MÁS?*\n\n`;
  mensaje += `Actualiza a *VIP* y obtén:\n`;
  mensaje += `👑 1 canción exclusiva por día\n`;
  mensaje += `🚀 Prioridad máxima en la cola\n`;
  mensaje += `📊 Estadísticas avanzadas\n`;
  mensaje += `🎵 Tu música suena primero\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `0️⃣ Volver`;

  return mensaje;
}

/**
 * Menú de renovación Premium
 */
export function obtenerMenuRenovarPremium(usuario) {
  const fechaRegistro = new Date(usuario.fechaRegistro);
  const fechaFin = new Date(fechaRegistro);
  fechaFin.setMonth(fechaFin.getMonth() + 1);

  const diasRestantes = Math.ceil((fechaFin - new Date()) / (1000 * 60 * 60 * 24));

  let mensaje = `🔄 *RENOVAR PREMIUM*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `Tu membresía actual:\n`;
  mensaje += `📅 Vence: ${fechaFin.toLocaleDateString()}\n`;
  mensaje += `⏰ Días restantes: ${diasRestantes}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `💰 Renovación: $10 pesos\n`;
  mensaje += `📅 Duración: 30 días adicionales\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `¿Cómo quieres renovar?\n\n`;
  mensaje += `1️⃣ Pagar con OXXO\n`;
  mensaje += `2️⃣ Ver otros métodos\n\n`;
  mensaje += `0️⃣ Cancelar\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `💡 La renovación se suma a tu tiempo actual`;

  return mensaje;
}

/**
 * Menú de cancelación de membresía
 */
export function obtenerMenuCancelarMembresia(usuario) {
  const fechaRegistro = new Date(usuario.fechaRegistro);
  const fechaFin = new Date(fechaRegistro);
  fechaFin.setMonth(fechaFin.getMonth() + 1);

  let mensaje = `⚠️ *CANCELAR MEMBRESÍA*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `Si cancelas tu membresía Premium:\n\n`;
  mensaje += `❌ Perderás acceso a 3 canciones/día\n`;
  mensaje += `❌ No podrás pedir música fuera de la plaza\n`;
  mensaje += `❌ Perderás acceso a búsqueda avanzada\n`;
  mensaje += `❌ No verás la cola completa\n`;
  mensaje += `❌ Volverás a tener cooldown\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `📅 Tu membresía actual vence: ${fechaFin.toLocaleDateString()}\n\n`;
  mensaje += `💡 Si cancelas ahora, mantendrás tus beneficios hasta la fecha de vencimiento.\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `¿Estás seguro que quieres cancelar?\n\n`;
  mensaje += `1️⃣ Sí, cancelar membresía\n`;
  mensaje += `2️⃣ No, mantener Premium\n\n`;
  mensaje += `0️⃣ Volver\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `⚠️ Esta acción no se puede deshacer`;

  return mensaje;
}

/**
 * Menú principal VIP
 */
export function obtenerMenuVIP(usuario) {
  let mensaje = `👑 *MENÚ VIP*\n\n`;
  mensaje += `Hola ${usuario.nombre}. Bienvenido usuario VIP.\n\n`;
  mensaje += `Tus beneficios:\n`;
  mensaje += `• Canciones inmediatas\n`;
  mensaje += `• No requiere ubicación\n`;
  mensaje += `• Avisos especiales\n`;
  mensaje += `• 1 canción por hora\n`;
  mensaje += `• Permite música exclusiva\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `1️⃣ 🎵 Pedir canción VIP\n`;
  mensaje += `2️⃣ 📊 Ver cola y tiempos\n`;
  mensaje += `3️⃣ 📜 Ver letra de la canción actual\n`;
  mensaje += `4️⃣ 💎 Comprar otra canción VIP\n`;
  mensaje += `5️⃣ 👑 Mis privilegios VIP\n\n`;
  mensaje += `0️⃣ 🚪 Salir\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `💡 Elige una opción:`;

  return mensaje;
}

/**
 * Menú de compra de canción VIP adicional
 */
export function obtenerMenuCompraVIP() {
  let mensaje = `🎶 *COMPRA DE CANCIÓN VIP — $100*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `1️⃣ Ver código QR de pago\n`;
  mensaje += `2️⃣ ¿Cómo funciona la compra VIP?\n`;
  mensaje += `3️⃣ Volver\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `💡 Elige una opción:`;

  return mensaje;
}

/**
 * Menú de información de compra VIP
 */
export function obtenerMenuInfoCompraVIP() {
  let mensaje = `📘 *¿CÓMO FUNCIONA?*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `• Cada canción VIP cuesta $100\n`;
  mensaje += `• Va primero en la cola, después de la canción actual\n`;
  mensaje += `• Puedes comprar varias al día\n`;
  mensaje += `• Cada compra requiere comprobante\n`;
  mensaje += `• No necesitas estar dentro de la plaza\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `0️⃣ Volver`;

  return mensaje;
}

/**
 * Menú de privilegios VIP
 */
export function obtenerMenuPrivilegiosVIP() {
  let mensaje = `👑 *TUS PRIVILEGIOS VIP*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `• Prioridad máxima\n`;
  mensaje += `• No requiere ubicación\n`;
  mensaje += `• Canciones inmediatas\n`;
  mensaje += `• Letra disponible siempre que Spotify la tenga\n`;
  mensaje += `• Filtros flexibles (puede escuchar más géneros)\n`;
  mensaje += `• Tiempos reducidos\n`;
  mensaje += `• Acceso anticipado a nuevas funciones\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `1️⃣ Ver beneficios completos\n`;
  mensaje += `2️⃣ Ver historial VIP\n`;
  mensaje += `3️⃣ Solicitar soporte directo con administrador\n\n`;
  mensaje += `0️⃣ Volver\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `💡 Elige una opción:`;

  return mensaje;
}

/**
 * Menú de beneficios completos VIP
 */
export function obtenerMenuBeneficiosVIP() {
  let mensaje = `⭐ *BENEFICIOS COMPLETOS VIP*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `• Saltas la cola de todos\n`;
  mensaje += `• No requieres ubicación\n`;
  mensaje += `• 1 canción por hora incluida\n`;
  mensaje += `• Canciones adicionales compradas por QR\n`;
  mensaje += `• Acceso a música exclusiva\n`;
  mensaje += `• Estadísticas personalizadas\n`;
  mensaje += `• Notificaciones prioritarias\n`;
  mensaje += `• Soporte directo con administrador\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `0️⃣ Volver`;

  return mensaje;
}

/**
 * Menú de historial VIP
 */
export function obtenerMenuHistorialVIP(usuario) {
  const cancionesCompradas = usuario.estadisticas?.cancionesVIPCompradas || 0;
  const ultimaCompra = usuario.estadisticas?.ultimaCompraVIP || 'N/A';
  const ultimaCancion = usuario.estadisticas?.ultimaCancionVIP || 'N/A';
  const canceladasPorUsuario = usuario.estadisticas?.cancionesCanceladas || 0;

  let mensaje = `📄 *HISTORIAL VIP*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `• Canciones compradas: ${cancionesCompradas}\n`;
  mensaje += `• Última compra: ${ultimaCompra}\n`;
  mensaje += `• Última canción agregada: ${ultimaCancion}\n`;
  mensaje += `• Veces que tus canciones fueron canceladas por ti: ${canceladasPorUsuario}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `0️⃣ Volver`;

  return mensaje;
}

/**
 * Mensaje de cooldown VIP
 */
export function obtenerMensajeCooldownVIP(minutosRestantes) {
  let mensaje = `⏳ *COOLDOWN ACTIVO*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `Solo puedes poner 1 canción por hora.\n\n`;
  mensaje += `Faltan ${minutosRestantes} minutos para volver a pedir.\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `💡 Mientras esperas:\n`;
  mensaje += `• Puedes ver la cola (opción 2)\n`;
  mensaje += `• Ver letra actual (opción 3)\n`;
  mensaje += `• Comprar canción adicional (opción 4)\n\n`;
  mensaje += `0️⃣ Volver`;

  return mensaje;
}

/**
 * Mensaje de canción bloqueada por repetición (VIP)
 */
export function obtenerMensajeCancionBloqueadaVIP(cancion, minutosRestantes) {
  const artistas = cancion.artists.map(a => a.name).join(', ');

  let mensaje = `⛔ *CANCIÓN BLOQUEADA TEMPORALMENTE*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `🎵 ${cancion.name}\n`;
  mensaje += `🎤 ${artistas}\n\n`;
  mensaje += `Esta canción ya fue tocada recientemente.\n\n`;
  mensaje += `Por políticas del sistema solo puede repetirse después de 1 hora.\n\n`;
  mensaje += `⏱️ Faltan ${minutosRestantes} minutos para poder volver a ponerla.\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `💡 Intenta con otra canción.\n\n`;
  mensaje += `0️⃣ Volver`;

  return mensaje;
}

/**
 * Mensaje de canción bloqueada por repetición (Normal/Premium)
 */
export function obtenerMensajeCancionBloqueada(cancion, minutosRestantes) {
  const artistas = cancion.artists.map(a => a.name).join(', ');

  let mensaje = `⛔ *CANCIÓN NO DISPONIBLE*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `🎵 ${cancion.name}\n`;
  mensaje += `🎤 ${artistas}\n\n`;
  mensaje += `Esta canción no puede repetirse hasta dentro de ${minutosRestantes} minutos.\n\n`;
  mensaje += `Intenta con otra, por favor.\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `0️⃣ Volver`;

  return mensaje;
}

/**
 * Mensaje de advertencia para Admin/Técnico sobre canción bloqueada
 */
export function obtenerMensajeAdvertenciaAdmin(cancion, minutosTranscurridos) {
  const artistas = cancion.artists.map(a => a.name).join(', ');

  let mensaje = `⚠️ *ADVERTENCIA - CANCIÓN REPETIDA*\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `🎵 ${cancion.name}\n`;
  mensaje += `🎤 ${artistas}\n\n`;
  mensaje += `Esta canción fue tocada hace ${minutosTranscurridos} minutos.\n\n`;
  mensaje += `Solo puede repetirse cada hora.\n\n`;
  mensaje += `Pero como administrador/técnico puedes saltar esta restricción.\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `¿Deseas agregarla?\n\n`;
  mensaje += `1️⃣ Sí, agregar de todos modos\n`;
  mensaje += `2️⃣ No, cancelar\n\n`;
  mensaje += `0️⃣ Volver`;

  return mensaje;
}
