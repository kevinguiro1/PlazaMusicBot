// core/monitoring.js - Sistema de Monitoreo y Estadísticas
import { log } from '../utils/logger.js';

/**
 * Iniciar sistema de monitoreo
 */
export function iniciarMonitoreo(estado) {
  log('📊 Sistema de monitoreo iniciado', 'info');

  // Actualizar estadísticas cada hora
  setInterval(() => {
    actualizarEstadisticas(estado);
  }, 60 * 60 * 1000);

  // Mostrar estadísticas cada 6 horas
  setInterval(() => {
    mostrarEstadisticas(estado);
  }, 6 * 60 * 60 * 1000);

  return {
    actualizarEstadisticas: () => actualizarEstadisticas(estado),
    obtenerEstadisticas: () => obtenerEstadisticas(estado),
    mostrarEstadisticas: () => mostrarEstadisticas(estado)
  };
}

/**
 * Actualizar estadísticas del sistema
 */
function actualizarEstadisticas(estado) {
  try {
    const stats = estado.estadisticas;

    stats.totalUsuarios = Object.keys(estado.usuarios).length;
    stats.usuariosBloqueados = Object.keys(estado.bloqueados).length;

    // Calcular total de canciones
    let totalCanciones = 0;
    for (const usuario of Object.values(estado.usuarios)) {
      totalCanciones += usuario.estadisticas?.totalCanciones || 0;
    }
    stats.totalCanciones = totalCanciones;

    // Usuarios por perfil
    const usuariosPorPerfil = {};
    for (const usuario of Object.values(estado.usuarios)) {
      const perfil = usuario.perfil || 'free';
      usuariosPorPerfil[perfil] = (usuariosPorPerfil[perfil] || 0) + 1;
    }
    stats.usuariosPorPerfil = usuariosPorPerfil;

    // Usuarios activos hoy
    const hoy = new Date().toISOString().split('T')[0];
    let usuariosActivosHoy = 0;
    for (const usuario of Object.values(estado.usuarios)) {
      const ultimaActividad = usuario.ultimaActividad?.split('T')[0];
      if (ultimaActividad === hoy) {
        usuariosActivosHoy++;
      }
    }
    stats.usuariosActivosHoy = usuariosActivosHoy;

    stats.ultimaActualizacion = new Date().toISOString();

    log('📊 Estadísticas actualizadas', 'debug');
  } catch (error) {
    log(`❌ Error actualizando estadísticas: ${error.message}`, 'error');
  }
}

/**
 * Obtener estadísticas del sistema
 */
function obtenerEstadisticas(estado) {
  actualizarEstadisticas(estado);
  return estado.estadisticas;
}

/**
 * Mostrar estadísticas en consola
 */
function mostrarEstadisticas(estado) {
  const stats = obtenerEstadisticas(estado);

  console.log('\n' + '='.repeat(50));
  console.log('📊 ESTADÍSTICAS DEL SISTEMA');
  console.log('='.repeat(50));
  console.log(`👥 Total Usuarios: ${stats.totalUsuarios}`);
  console.log(`✅ Usuarios Activos Hoy: ${stats.usuariosActivosHoy}`);
  console.log(`🚫 Usuarios Bloqueados: ${stats.usuariosBloqueados}`);
  console.log(`🎵 Total Canciones Pedidas: ${stats.totalCanciones}`);

  if (stats.usuariosPorPerfil) {
    console.log('\n👤 Usuarios por Perfil:');
    for (const [perfil, cantidad] of Object.entries(stats.usuariosPorPerfil)) {
      console.log(`   ${perfil.toUpperCase()}: ${cantidad}`);
    }
  }

  console.log('='.repeat(50) + '\n');
}

/**
 * Generar reporte de estadísticas
 */
export function generarReporte(estado) {
  const stats = obtenerEstadisticas(estado);

  let reporte = `📊 *REPORTE DE ESTADÍSTICAS*\n\n`;
  reporte += `━━━━━━━━━━━━━━━━━━━━━\n`;
  reporte += `*USUARIOS*\n`;
  reporte += `👥 Total: ${stats.totalUsuarios}\n`;
  reporte += `✅ Activos hoy: ${stats.usuariosActivosHoy}\n`;
  reporte += `🚫 Bloqueados: ${stats.usuariosBloqueados}\n\n`;

  reporte += `*CANCIONES*\n`;
  reporte += `🎵 Total pedidas: ${stats.totalCanciones}\n\n`;

  if (stats.usuariosPorPerfil) {
    reporte += `*PERFILES*\n`;
    for (const [perfil, cantidad] of Object.entries(stats.usuariosPorPerfil)) {
      const emoji = {
        free: '🎵',
        premium: '⭐',
        vip: '💎',
        dj: '🎧',
        admin: '👤',
        super_admin: '👑'
      }[perfil] || '👤';
      reporte += `${emoji} ${perfil.toUpperCase()}: ${cantidad}\n`;
    }
  }

  reporte += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  reporte += `🕐 Actualizado: ${new Date(stats.ultimaActualizacion).toLocaleString('es-MX')}`;

  return reporte;
}

/**
 * Registrar evento
 */
export function registrarEvento(estado, tipo, datos) {
  try {
    if (!estado.estadisticas.eventos) {
      estado.estadisticas.eventos = [];
    }

    estado.estadisticas.eventos.push({
      tipo,
      datos,
      timestamp: new Date().toISOString()
    });

    // Mantener solo los últimos 1000 eventos
    if (estado.estadisticas.eventos.length > 1000) {
      estado.estadisticas.eventos = estado.estadisticas.eventos.slice(-1000);
    }

    log(`📝 Evento registrado: ${tipo}`, 'debug');
  } catch (error) {
    log(`❌ Error registrando evento: ${error.message}`, 'error');
  }
}
