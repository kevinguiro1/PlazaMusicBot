// utils/saludos.js - Saludos dinámicos según la hora

/**
 * Obtener saludo según la hora del día (zona horaria de México)
 */
export function obtenerSaludo() {
  // Configurar zona horaria de México (UTC-6)
  const fecha = new Date();
  const opciones = {
    timeZone: 'America/Mexico_City',
    hour: 'numeric',
    hour12: false
  };

  const horaStr = fecha.toLocaleString('es-MX', opciones);
  const hora = parseInt(horaStr.split(':')[0]);

  if (hora >= 6 && hora < 12) {
    return '🌅 Buenos días';
  } else if (hora >= 12 && hora < 20) {
    return '☀️ Buenas tardes';
  } else {
    return '🌙 Buenas noches';
  }
}

/**
 * Obtener emoji según la hora
 */
export function obtenerEmojiHora() {
  const fecha = new Date();
  const opciones = {
    timeZone: 'America/Mexico_City',
    hour: 'numeric',
    hour12: false
  };

  const horaStr = fecha.toLocaleString('es-MX', opciones);
  const hora = parseInt(horaStr.split(':')[0]);

  if (hora >= 6 && hora < 12) {
    return '🌅';
  } else if (hora >= 12 && hora < 20) {
    return '☀️';
  } else {
    return '🌙';
  }
}

/**
 * Obtener mensaje de bienvenida completo con saludo
 */
export function mensajeBienvenidaConSaludo(nombre = null) {
  const saludo = obtenerSaludo();

  if (nombre) {
    return `${saludo} ${nombre}! 🎵\n\n¡Bienvenido al Sistema de Música de la Plaza!`;
  } else {
    return `${saludo}! 🎵\n\n¡Bienvenido al Sistema de Música de la Plaza!\n\nPor favor, dime tu nombre:`;
  }
}
