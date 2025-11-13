// core/profiles.js - Sistema de Perfiles de Usuario
import { log } from '../utils/logger.js';

/**
 * Tipos de perfiles disponibles
 */
export const PERFILES = {
  NORMAL: 'normal',
  PREMIUM: 'premium',
  VIP: 'vip',
  TECNICO: 'tecnico',
  ADMINISTRADOR: 'administrador'
};

/**
 * Configuración de cada perfil
 */
export const CONFIG_PERFILES = {
  [PERFILES.NORMAL]: {
    nombre: 'Usuario Normal',
    emoji: '🎵',
    limiteCanciones: parseInt(process.env.LIMITE_CANCIONES_NORMAL) || 3,
    prioridad: 1,
    puedeVerCola: false,
    puedeVerEstadisticas: false,
    requiereUbicacion: true,
    validarUbicacion: true, // Debe estar en la plaza
    cooldownMinutos: 60,
    costo: 0, // Gratis
    permisos: ['pedir_cancion', 'ver_menu']
  },
  [PERFILES.PREMIUM]: {
    nombre: 'Usuario Premium',
    emoji: '⭐',
    limiteCanciones: parseInt(process.env.LIMITE_CANCIONES_PREMIUM) || 3,
    prioridad: 2,
    puedeVerCola: true,
    puedeVerEstadisticas: false,
    requiereUbicacion: true,
    validarUbicacion: true, // Debe estar en la plaza
    cooldownMinutos: 30,
    costo: 10, // 10 pesos por 3 canciones
    permisos: ['pedir_cancion', 'ver_menu', 'ver_cola', 'sugerir_artista']
  },
  [PERFILES.VIP]: {
    nombre: 'Usuario VIP',
    emoji: '💎',
    limiteCanciones: parseInt(process.env.LIMITE_CANCIONES_VIP) || 1,
    prioridad: 3,
    puedeVerCola: true,
    puedeVerEstadisticas: true,
    requiereUbicacion: true, // Siempre pide ubicación
    validarUbicacion: false, // Pero no valida que esté en la plaza
    cooldownMinutos: 0,
    costo: 100, // 100 pesos por 1 canción
    permisos: ['pedir_cancion', 'ver_menu', 'ver_cola', 'sugerir_artista', 'ver_estadisticas', 'prioridad_alta']
  },
  [PERFILES.TECNICO]: {
    nombre: 'Técnico',
    emoji: '🔧',
    limiteCanciones: 999,
    prioridad: 4,
    puedeVerCola: true,
    puedeVerEstadisticas: true,
    requiereUbicacion: true,
    validarUbicacion: true, // Debe estar en la plaza
    cooldownMinutos: 0,
    permisos: [
      'pedir_cancion',
      'ver_menu',
      'ver_cola',
      'sugerir_artista',
      'ver_estadisticas',
      'gestionar_cola',
      'eliminar_cancion',
      'prioridad_maxima'
    ]
  },
  [PERFILES.ADMINISTRADOR]: {
    nombre: 'Administrador',
    emoji: '👑',
    limiteCanciones: 999,
    prioridad: 5,
    puedeVerCola: true,
    puedeVerEstadisticas: true,
    requiereUbicacion: false,
    cooldownMinutos: 0,
    permisos: [
      'pedir_cancion',
      'ver_menu',
      'ver_cola',
      'sugerir_artista',
      'ver_estadisticas',
      'gestionar_cola',
      'eliminar_cancion',
      'bloquear_usuario',
      'desbloquear_usuario',
      'promover_usuario',
      'ver_usuarios',
      'enviar_mensajes_masivos',
      'limpiar_playlist',
      'gestionar_bots',
      'acceso_total'
    ]
  }
};

/**
 * Crear nuevo usuario con perfil
 */
export function crearUsuario(numero, nombre = null, perfil = PERFILES.NORMAL) {
  const config = CONFIG_PERFILES[perfil];

  return {
    numero,
    nombre,
    perfil,
    fechaRegistro: new Date().toISOString(),
    ultimaActividad: new Date().toISOString(),
    cancionesPedidas: 0,
    cancionesPedidasHoy: 0,
    agregadasHoy: [],
    ultimaSugerencia: null,
    contexto: null,
    ubicacionVerificada: false,
    ultimaUbicacion: null,
    estadisticas: {
      totalCanciones: 0,
      cancionesPorDia: {},
      artistasFavoritos: {},
      generosFavoritos: {}
    },
    configuracion: {
      notificaciones: true,
      idioma: 'es'
    },
    limiteDiario: config.limiteCanciones,
    prioridad: config.prioridad,
    permisos: config.permisos
  };
}

/**
 * Verificar si un usuario tiene un permiso específico
 */
export function tienePermiso(usuario, permiso) {
  if (!usuario || !usuario.permisos) return false;
  return usuario.permisos.includes(permiso) || usuario.permisos.includes('acceso_total');
}

/**
 * Obtener perfil de usuario
 */
export function obtenerPerfil(usuario) {
  return CONFIG_PERFILES[usuario.perfil] || CONFIG_PERFILES[PERFILES.NORMAL];
}

/**
 * Promover usuario a nuevo perfil
 */
export function promoverUsuario(usuario, nuevoPerfil) {
  if (!CONFIG_PERFILES[nuevoPerfil]) {
    throw new Error(`Perfil inválido: ${nuevoPerfil}`);
  }

  const config = CONFIG_PERFILES[nuevoPerfil];
  usuario.perfil = nuevoPerfil;
  usuario.limiteDiario = config.limiteCanciones;
  usuario.prioridad = config.prioridad;
  usuario.permisos = config.permisos;

  log(`👤 Usuario ${usuario.numero} promovido a ${config.nombre}`, 'info');

  return usuario;
}

/**
 * Resetear contador diario de usuario
 */
export function resetearContadorDiario(usuario) {
  const hoy = new Date().toISOString().split('T')[0];
  const ultimaFecha = usuario.ultimaActividad?.split('T')[0];

  if (hoy !== ultimaFecha) {
    usuario.cancionesPedidasHoy = 0;
    usuario.agregadasHoy = [];

    // Actualizar estadísticas por día
    if (!usuario.estadisticas.cancionesPorDia[hoy]) {
      usuario.estadisticas.cancionesPorDia[hoy] = 0;
    }
  }

  usuario.ultimaActividad = new Date().toISOString();
  return usuario;
}

/**
 * Verificar si usuario puede pedir más canciones
 */
export function puedePedirCancion(usuario) {
  resetearContadorDiario(usuario);
  const perfil = obtenerPerfil(usuario);

  if (perfil.limiteCanciones === 999) return true;

  return usuario.cancionesPedidasHoy < perfil.limiteCanciones;
}

/**
 * Obtener mensaje de límite alcanzado
 */
export function mensajeLimiteAlcanzado(usuario) {
  const perfil = obtenerPerfil(usuario);

  return `⚠️ ${usuario.nombre}, has alcanzado tu límite de ${perfil.limiteCanciones} canciones por día.\n\n` +
         `💡 Mejora a Premium o VIP para más canciones.\n` +
         `Vuelve mañana para seguir disfrutando!`;
}

/**
 * Verificar si es administrador
 */
export function esAdmin(numero) {
  const admins = (process.env.ADMIN_NUMBERS || '').split(',').map(n => n.trim());
  return admins.includes(numero);
}

/**
 * Verificar si es técnico
 */
export function esTecnico(numero) {
  const tecnicos = (process.env.TECNICO_NUMBERS || '').split(',').map(n => n.trim());
  return tecnicos.includes(numero);
}

/**
 * Obtener resumen de perfil
 */
export function obtenerResumenPerfil(usuario) {
  const perfil = obtenerPerfil(usuario);
  resetearContadorDiario(usuario);

  return `${perfil.emoji} *${perfil.nombre}*\n` +
         `👤 ${usuario.nombre}\n` +
         `🎵 Canciones hoy: ${usuario.cancionesPedidasHoy}/${perfil.limiteCanciones}\n` +
         `📊 Total pedidas: ${usuario.estadisticas.totalCanciones}\n` +
         `📅 Miembro desde: ${new Date(usuario.fechaRegistro).toLocaleDateString()}`;
}
