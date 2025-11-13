// perfiles/admin.js - Manejador del Perfil Admin
import {
  promoverUsuario,
  PERFILES,
  CONFIG_PERFILES
} from '../core/profiles.js';
import { obtenerMenuAdmin } from '../core/menus.js';
import { generarReporte } from '../core/monitoring.js';
import { limpiarDatosAntiguos } from '../core/dataManager.js';
import { enviarBroadcast } from '../conexion/whatsapp.js';
import { log } from '../utils/logger.js';
import { manejarUsuarioNormal } from './usuario.js';

/**
 * Manejar administrador
 */
export async function manejarAdministrador(usuario, mensaje, estado) {
  const texto = mensaje.trim();

  // Comandos que empiezan con /
  if (texto.startsWith('/')) {
    return await procesarComandoAdmin(usuario, texto, estado);
  }

  // Si está en contexto admin, manejar menú
  if (usuario.contexto === 'menu_admin') {
    return await manejarMenuAdmin(usuario, texto, estado);
  }

  // Por defecto, funcionalidad normal
  return await manejarUsuarioNormal(usuario, mensaje, estado);
}

/**
 * Procesar comandos de administrador
 */
async function procesarComandoAdmin(usuario, comando, estado) {
  const partes = comando.slice(1).split(' ');
  const cmd = partes[0].toLowerCase();
  const args = partes.slice(1);

  switch (cmd) {
    case 'bloquear':
      return await bloquearUsuario(args[0], estado);

    case 'desbloquear':
      return await desbloquearUsuario(args[0], estado);

    case 'promover':
      return await promoverUsuarioCmd(args[0], args[1], estado);

    case 'degradar':
      return await degradarUsuarioCmd(args[0], estado);

    case 'stats':
    case 'estadisticas':
      return generarReporte(estado);

    case 'usuarios':
      return listarUsuarios(estado);

    case 'bloqueados':
      return listarBloqueados(estado);

    case 'limpiar':
      const dias = parseInt(args[0]) || 90;
      const resultado = await limpiarDatosAntiguos(dias);
      return `🧹 *Limpieza completada*\n\n` +
             `Usuarios eliminados: ${resultado.usuariosEliminados}\n` +
             `Antigüedad: ${dias} días`;

    case 'broadcast':
      usuario.contexto = 'admin_broadcast';
      return `📢 *ENVIAR MENSAJE MASIVO*\n\n` +
             `Escribe el mensaje que quieres enviar a todos los usuarios.\n\n` +
             `0️⃣ Cancelar`;

    case 'help':
    case 'ayuda':
      return obtenerAyudaAdmin();

    case 'menu':
      usuario.contexto = 'menu_admin';
      return obtenerMenuAdmin();

    default:
      return `❌ Comando no reconocido: /${cmd}\n\n` +
             `Usa /help para ver comandos disponibles.`;
  }
}

/**
 * Bloquear usuario
 */
async function bloquearUsuario(numero, estado) {
  if (!numero) {
    return '❌ Uso: /bloquear [número]';
  }

  if (estado.bloqueados[numero]) {
    return `⚠️ El usuario ${numero} ya está bloqueado.`;
  }

  estado.bloqueados[numero] = {
    fecha: new Date().toISOString(),
    razon: 'bloqueado_por_admin'
  };

  log(`🚫 Usuario bloqueado por admin: ${numero}`, 'info');

  return `🚫 *Usuario bloqueado*\n\n` +
         `Número: ${numero}\n` +
         `Fecha: ${new Date().toLocaleString('es-MX')}`;
}

/**
 * Desbloquear usuario
 */
async function desbloquearUsuario(numero, estado) {
  if (!numero) {
    return '❌ Uso: /desbloquear [número]';
  }

  if (!estado.bloqueados[numero]) {
    return `⚠️ El usuario ${numero} no está bloqueado.`;
  }

  delete estado.bloqueados[numero];

  log(`✅ Usuario desbloqueado por admin: ${numero}`, 'info');

  return `✅ *Usuario desbloqueado*\n\n` +
         `Número: ${numero}\n` +
         `Fecha: ${new Date().toLocaleString('es-MX')}`;
}

/**
 * Promover usuario
 */
async function promoverUsuarioCmd(numero, perfil, estado) {
  if (!numero || !perfil) {
    return '❌ Uso: /promover [número] [perfil]\n\n' +
           `Perfiles disponibles: ${Object.values(PERFILES).join(', ')}`;
  }

  const usuario = estado.usuarios[numero];

  if (!usuario) {
    return `❌ Usuario ${numero} no encontrado.`;
  }

  const perfilLower = perfil.toLowerCase();
  if (!Object.values(PERFILES).includes(perfilLower)) {
    return `❌ Perfil inválido: ${perfil}\n\n` +
           `Perfiles disponibles: ${Object.values(PERFILES).join(', ')}`;
  }

  promoverUsuario(usuario, perfilLower);

  const config = CONFIG_PERFILES[perfilLower];

  return `✅ *Usuario promovido*\n\n` +
         `👤 ${usuario.nombre} (${numero})\n` +
         `${config.emoji} Nuevo perfil: ${config.nombre}\n` +
         `🎵 Límite: ${config.limiteCanciones} canciones/día`;
}

/**
 * Degradar usuario
 */
async function degradarUsuarioCmd(numero, estado) {
  if (!numero) {
    return '❌ Uso: /degradar [número]';
  }

  const usuario = estado.usuarios[numero];

  if (!usuario) {
    return `❌ Usuario ${numero} no encontrado.`;
  }

  promoverUsuario(usuario, PERFILES.NORMAL);

  return `⬇️ *Usuario degradado*\n\n` +
         `👤 ${usuario.nombre} (${numero})\n` +
         `🎵 Nuevo perfil: Normal\n` +
         `🎵 Límite: 3 canciones/día`;
}

/**
 * Listar usuarios
 */
function listarUsuarios(estado) {
  const usuarios = Object.values(estado.usuarios);

  if (usuarios.length === 0) {
    return '❌ No hay usuarios registrados.';
  }

  // Agrupar por perfil
  const porPerfil = {};
  for (const perfil of Object.values(PERFILES)) {
    porPerfil[perfil] = usuarios.filter(u => u.perfil === perfil);
  }

  let mensaje = `👥 *USUARIOS REGISTRADOS*\n\n`;
  mensaje += `Total: ${usuarios.length}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  for (const [perfil, lista] of Object.entries(porPerfil)) {
    if (lista.length > 0) {
      const config = CONFIG_PERFILES[perfil];
      mensaje += `${config.emoji} *${config.nombre}*: ${lista.length}\n`;

      const mostrar = lista.slice(0, 5);
      for (const u of mostrar) {
        mensaje += `   • ${u.nombre} (${u.numero.substring(0, 10)}...)\n`;
      }

      if (lista.length > 5) {
        mensaje += `   ... y ${lista.length - 5} más\n`;
      }

      mensaje += `\n`;
    }
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━`;

  return mensaje;
}

/**
 * Listar bloqueados
 */
function listarBloqueados(estado) {
  const bloqueados = Object.entries(estado.bloqueados);

  if (bloqueados.length === 0) {
    return '✅ No hay usuarios bloqueados.';
  }

  let mensaje = `🚫 *USUARIOS BLOQUEADOS*\n\n`;
  mensaje += `Total: ${bloqueados.length}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const mostrar = bloqueados.slice(0, 20);

  for (const [numero, info] of mostrar) {
    const fecha = new Date(info.fecha).toLocaleDateString('es-MX');
    mensaje += `📱 ${numero}\n`;
    mensaje += `   📅 ${fecha}\n`;
    mensaje += `   📝 ${info.razon || 'Sin razón'}\n\n`;
  }

  if (bloqueados.length > 20) {
    mensaje += `... y ${bloqueados.length - 20} más\n\n`;
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━`;

  return mensaje;
}

/**
 * Manejar menú admin
 */
async function manejarMenuAdmin(usuario, texto, estado) {
  const opcion = parseInt(texto);

  switch (opcion) {
    case 1:
      return listarUsuarios(estado);

    case 2:
      usuario.contexto = 'admin_bloquear';
      return '🚫 *BLOQUEAR USUARIO*\n\n' +
             'Escribe el número del usuario a bloquear.\n\n' +
             '0️⃣ Cancelar';

    case 3:
      usuario.contexto = 'admin_desbloquear';
      return '✅ *DESBLOQUEAR USUARIO*\n\n' +
             'Escribe el número del usuario a desbloquear.\n\n' +
             '0️⃣ Cancelar';

    case 4:
      usuario.contexto = 'admin_promover';
      return '⭐ *PROMOVER USUARIO*\n\n' +
             'Formato: número perfil\n' +
             'Ejemplo: 5218661165921 premium\n\n' +
             `Perfiles: ${Object.values(PERFILES).join(', ')}\n\n` +
             '0️⃣ Cancelar';

    case 5:
      usuario.contexto = 'admin_degradar';
      return '⬇️ *DEGRADAR USUARIO*\n\n' +
             'Escribe el número del usuario a degradar a NORMAL.\n\n' +
             '0️⃣ Cancelar';

    case 6:
      return generarReporte(estado);

    case 7:
      return '📜 *LOGS RECIENTES*\n\n' +
             'Ver logs en la consola del servidor.';

    case 8:
      return listarBloqueados(estado);

    case 9:
      const resultado = await limpiarDatosAntiguos(90);
      return `🧹 *LIMPIEZA COMPLETADA*\n\n` +
             `Usuarios eliminados: ${resultado.usuariosEliminados}`;

    case 10:
      usuario.contexto = 'admin_broadcast';
      return `📢 *MENSAJE MASIVO*\n\n` +
             `Escribe el mensaje a enviar a todos los usuarios.\n\n` +
             `0️⃣ Cancelar`;

    case 11:
      usuario.contexto = 'admin_anuncio';
      return `📣 *ANUNCIO*\n\n` +
             `Escribe el anuncio a enviar.\n\n` +
             `0️⃣ Cancelar`;

    case 0:
      usuario.contexto = null;
      const { obtenerMenuPrincipal } = await import('../core/menus.js');
      return obtenerMenuPrincipal(usuario);

    default:
      return '❌ Opción inválida.\n\n' + obtenerMenuAdmin();
  }
}

/**
 * Ayuda para administradores
 */
function obtenerAyudaAdmin() {
  return `👤 *COMANDOS DE ADMINISTRADOR*\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n` +
         `*USUARIOS*\n` +
         `/bloquear [número] - Bloquear usuario\n` +
         `/desbloquear [número] - Desbloquear usuario\n` +
         `/promover [número] [perfil] - Promover usuario\n` +
         `/degradar [número] - Degradar a NORMAL\n` +
         `/usuarios - Listar usuarios\n` +
         `/bloqueados - Ver bloqueados\n\n` +
         `*SISTEMA*\n` +
         `/stats - Ver estadísticas\n` +
         `/limpiar [días] - Limpiar datos antiguos\n` +
         `/broadcast - Enviar mensaje masivo\n` +
         `/menu - Abrir menú admin\n` +
         `/help - Esta ayuda\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n` +
         `💡 Los comandos distinguen mayúsculas`;
}
