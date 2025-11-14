// perfiles/admin.js - Sistema Completo de Administración
import {
  promoverUsuario,
  PERFILES,
  CONFIG_PERFILES,
  esAdmin,
  esTecnico
} from '../core/profiles.js';
import { generarReporte } from '../core/monitoring.js';
import { limpiarDatosAntiguos } from '../core/dataManager.js';
import { log } from '../utils/logger.js';
import { manejarUsuarioNormal } from './usuario.js';
import {
  buscarCancionEnSpotify,
  buscarArtistaEnSpotify,
  agregarCancionAPlaylist,
  obtenerPlaylist,
  pausarReproduccion,
  reanudarReproduccion,
  siguienteCancion,
  subirVolumen,
  bajarVolumen,
  ajustarVolumen,
  obtenerReproduccionActual,
  limpiarPlaylist
} from '../conexion/spotify.js';
import {
  registrarCancionTocada,
  verificarCancionBloqueada,
  obtenerInfoCancion,
  obtenerCancionesBloqueadas
} from '../core/history.js';
import { verificarUbicacion, calcularDistancia, COORDENADAS_PLAZA } from '../utils/ubicacion.js';
import { aprobarSolicitudPago, rechazarSolicitudPago } from './payments-handler.js';

/**
 * Manejador principal del Administrador
 */
export async function manejarAdministrador(usuario, mensaje, estado) {
  const texto = mensaje.trim();

  // Comandos legacy que empiezan con / (mantener compatibilidad)
  if (texto.startsWith('/')) {
    return await procesarComandoLegacy(usuario, texto, estado);
  }

  // Enrutamiento según contexto
  const contexto = usuario.contexto;

  // Menú principal
  if (!contexto || contexto === 'admin_menu_principal') {
    return manejarMenuPrincipal(usuario, texto, estado);
  }

  // Sección 1: Gestión de usuarios
  if (contexto.startsWith('admin_usuarios_')) {
    return await manejarGestionUsuarios(usuario, texto, estado);
  }

  // Sección 2: Pagos / Premium / VIP
  if (contexto.startsWith('admin_pagos_')) {
    return await manejarPagos(usuario, texto, estado);
  }

  // Sección 3: Control de música y colas
  if (contexto.startsWith('admin_musica_')) {
    return await manejarControlMusica(usuario, texto, estado);
  }

  // Sección 4: Seguridad y palabras prohibidas
  if (contexto.startsWith('admin_seguridad_')) {
    return await manejarSeguridad(usuario, texto, estado);
  }

  // Sección 5: Ubicaciones y geocercas
  if (contexto.startsWith('admin_ubicaciones_')) {
    return await manejarUbicaciones(usuario, texto, estado);
  }

  // Sección 6: Configuración del sistema
  if (contexto.startsWith('admin_config_')) {
    return await manejarConfiguracion(usuario, texto, estado);
  }

  // Sección 7: Plantillas, QRs y mensajes
  if (contexto.startsWith('admin_plantillas_')) {
    return await manejarPlantillas(usuario, texto, estado);
  }

  // Sección 8: Gestión de bots (multi-bot)
  if (contexto.startsWith('admin_bots_')) {
    return await manejarBots(usuario, texto, estado);
  }

  // Sección 9: Estadísticas y reportes
  if (contexto.startsWith('admin_stats_')) {
    return await manejarEstadisticas(usuario, texto, estado);
  }

  // Por defecto, funcionalidad normal de usuario
  return await manejarUsuarioNormal(usuario, mensaje, estado);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * MENÚ PRINCIPAL DEL ADMINISTRADOR
 * ═══════════════════════════════════════════════════════════════
 */
function manejarMenuPrincipal(usuario, texto, estado) {
  const opcion = parseInt(texto);

  if (texto === '0' || texto.toLowerCase() === 'salir') {
    usuario.contexto = null;
    return '👋 Hasta pronto. Escribe "menu" para volver.';
  }

  switch (opcion) {
    case 1:
      usuario.contexto = 'admin_usuarios_menu';
      return obtenerMenuGestionUsuarios();

    case 2:
      usuario.contexto = 'admin_pagos_menu';
      return obtenerMenuPagos();

    case 3:
      usuario.contexto = 'admin_musica_menu';
      return obtenerMenuControlMusica();

    case 4:
      usuario.contexto = 'admin_seguridad_menu';
      return obtenerMenuSeguridad();

    case 5:
      usuario.contexto = 'admin_ubicaciones_menu';
      return obtenerMenuUbicaciones();

    case 6:
      usuario.contexto = 'admin_config_menu';
      return obtenerMenuConfiguracion();

    case 7:
      usuario.contexto = 'admin_plantillas_menu';
      return obtenerMenuPlantillas();

    case 8:
      usuario.contexto = 'admin_bots_menu';
      return obtenerMenuBots();

    case 9:
      usuario.contexto = 'admin_stats_menu';
      return obtenerMenuEstadisticas();

    default:
      return '❌ Opción inválida.\n\n' + obtenerMenuPrincipalAdmin();
  }
}

function obtenerMenuPrincipalAdmin() {
  let menu = `🛠️ *MENÚ ADMINISTRADOR*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ 👤 Gestión de usuarios\n`;
  menu += `2️⃣ 💰 Pagos / Premium / VIP\n`;
  menu += `3️⃣ 🎵 Control de música y colas\n`;
  menu += `4️⃣ 🛡️ Seguridad y palabras prohibidas\n`;
  menu += `5️⃣ 📍 Ubicaciones y geocercas\n`;
  menu += `6️⃣ 🧩 Configuración del sistema\n`;
  menu += `7️⃣ 🖼️ Plantillas, QRs y mensajes\n`;
  menu += `8️⃣ 🧰 Gestión de bots (multi-bot)\n`;
  menu += `9️⃣ 📊 Estadísticas y reportes\n\n`;
  menu += `0️⃣ Salir`;

  return menu;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * SECCIÓN 1: GESTIÓN DE USUARIOS
 * ═══════════════════════════════════════════════════════════════
 */
function obtenerMenuGestionUsuarios() {
  let menu = `👤 *GESTIÓN DE USUARIOS*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ Buscar usuario por número o nombre\n`;
  menu += `2️⃣ Ver todos los usuarios\n`;
  menu += `3️⃣ Cambiar tipo de usuario\n`;
  menu += `4️⃣ Activar usuario técnico\n`;
  menu += `5️⃣ Desactivar usuario técnico\n`;
  menu += `6️⃣ Ver usuarios bloqueados\n`;
  menu += `7️⃣ Desbloquear usuario\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

async function manejarGestionUsuarios(usuario, texto, estado) {
  const contexto = usuario.contexto;

  if (contexto === 'admin_usuarios_menu') {
    const opcion = parseInt(texto);

    if (texto === '0') {
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();
    }

    switch (opcion) {
      case 1:
        usuario.contexto = 'admin_usuarios_buscar';
        return `🔍 *BUSCAR USUARIO*\n\nEscribe el número o nombre del usuario:\n\n0️⃣ Cancelar`;

      case 2:
        return listarTodosLosUsuarios(estado);

      case 3:
        usuario.contexto = 'admin_usuarios_cambiar_tipo';
        return `🔄 *CAMBIAR TIPO DE USUARIO*\n\nFormato: [número] [tipo]\n\nEjemplo: 5218661165921 premium\n\nTipos disponibles: normal, premium, vip, tecnico\n\n0️⃣ Cancelar`;

      case 4:
        usuario.contexto = 'admin_usuarios_activar_tecnico';
        return `🛠️ *ACTIVAR TÉCNICO*\n\nEscribe el número del usuario:\n\n0️⃣ Cancelar`;

      case 5:
        usuario.contexto = 'admin_usuarios_desactivar_tecnico';
        return `🚫 *DESACTIVAR TÉCNICO*\n\nEscribe el número del técnico:\n\n0️⃣ Cancelar`;

      case 6:
        return listarBloqueados(estado);

      case 7:
        usuario.contexto = 'admin_usuarios_desbloquear';
        return `✅ *DESBLOQUEAR USUARIO*\n\nEscribe el número del usuario:\n\n0️⃣ Cancelar`;

      default:
        return '❌ Opción inválida.\n\n' + obtenerMenuGestionUsuarios();
    }
  }

  // Buscar usuario
  if (contexto === 'admin_usuarios_buscar') {
    if (texto === '0') {
      usuario.contexto = 'admin_usuarios_menu';
      return obtenerMenuGestionUsuarios();
    }

    return buscarUsuario(texto, estado);
  }

  // Cambiar tipo
  if (contexto === 'admin_usuarios_cambiar_tipo') {
    if (texto === '0') {
      usuario.contexto = 'admin_usuarios_menu';
      return obtenerMenuGestionUsuarios();
    }

    const partes = texto.split(' ');
    if (partes.length !== 2) {
      return `❌ Formato inválido.\n\nUsa: [número] [tipo]\n\n0️⃣ Cancelar`;
    }

    const [numero, tipo] = partes;
    return cambiarTipoUsuario(numero, tipo, estado, usuario);
  }

  // Activar técnico
  if (contexto === 'admin_usuarios_activar_tecnico') {
    if (texto === '0') {
      usuario.contexto = 'admin_usuarios_menu';
      return obtenerMenuGestionUsuarios();
    }

    return activarTecnico(texto, estado, usuario);
  }

  // Desactivar técnico
  if (contexto === 'admin_usuarios_desactivar_tecnico') {
    if (texto === '0') {
      usuario.contexto = 'admin_usuarios_menu';
      return obtenerMenuGestionUsuarios();
    }

    return desactivarTecnico(texto, estado, usuario);
  }

  // Desbloquear
  if (contexto === 'admin_usuarios_desbloquear') {
    if (texto === '0') {
      usuario.contexto = 'admin_usuarios_menu';
      return obtenerMenuGestionUsuarios();
    }

    return desbloquearUsuario(texto, estado, usuario);
  }

  return obtenerMenuGestionUsuarios();
}

function buscarUsuario(query, estado) {
  const usuarios = Object.values(estado.usuarios);

  // Buscar por número
  if (estado.usuarios[query]) {
    const u = estado.usuarios[query];
    const config = CONFIG_PERFILES[u.perfil];

    let info = `👤 *USUARIO ENCONTRADO*\n\n`;
    info += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    info += `📱 Número: ${u.numero}\n`;
    info += `👤 Nombre: ${u.nombre}\n`;
    info += `${config.emoji} Perfil: ${config.nombre}\n`;
    info += `🎵 Canciones pedidas: ${u.cancionesPedidas || 0}\n`;
    info += `🎵 Hoy: ${u.cancionesHoy || 0}/${u.limiteDiario}\n`;
    info += `📅 Registrado: ${new Date(u.fechaRegistro).toLocaleDateString('es-MX')}\n`;
    info += `⏰ Última actividad: ${new Date(u.ultimaActividad).toLocaleString('es-MX')}\n\n`;

    if (u.ubicacionVerificada && u.ultimaUbicacion) {
      info += `📍 Ubicación verificada\n`;
      const distancia = calcularDistancia(
        u.ultimaUbicacion.lat,
        u.ultimaUbicacion.lon,
        COORDENADAS_PLAZA.latitude,
        COORDENADAS_PLAZA.longitude
      );
      info += `📏 Distancia: ${Math.round(distancia)} metros\n\n`;
    }

    info += `━━━━━━━━━━━━━━━━━━━━━`;

    return info;
  }

  // Buscar por nombre (búsqueda parcial)
  const resultados = usuarios.filter(u =>
    u.nombre && u.nombre.toLowerCase().includes(query.toLowerCase())
  );

  if (resultados.length === 0) {
    return `❌ No se encontraron usuarios con: "${query}"`;
  }

  let mensaje = `🔍 *RESULTADOS DE BÚSQUEDA*\n\n`;
  mensaje += `Búsqueda: "${query}"\n`;
  mensaje += `Resultados: ${resultados.length}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  resultados.slice(0, 10).forEach(u => {
    const config = CONFIG_PERFILES[u.perfil];
    mensaje += `${config.emoji} ${u.nombre}\n`;
    mensaje += `   📱 ${u.numero}\n`;
    mensaje += `   🎵 ${u.cancionesPedidas || 0} canciones\n\n`;
  });

  if (resultados.length > 10) {
    mensaje += `... y ${resultados.length - 10} más\n\n`;
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━`;

  return mensaje;
}

function listarTodosLosUsuarios(estado) {
  const usuarios = Object.values(estado.usuarios);

  if (usuarios.length === 0) {
    return '❌ No hay usuarios registrados.';
  }

  // Agrupar por perfil
  const porPerfil = {};
  for (const perfil of Object.values(PERFILES)) {
    porPerfil[perfil] = usuarios.filter(u => u.perfil === perfil);
  }

  let mensaje = `👥 *TODOS LOS USUARIOS*\n\n`;
  mensaje += `Total: ${usuarios.length}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  for (const [perfil, lista] of Object.entries(porPerfil)) {
    if (lista.length > 0) {
      const config = CONFIG_PERFILES[perfil];
      mensaje += `${config.emoji} *${config.nombre}*: ${lista.length}\n\n`;

      const mostrar = lista.slice(0, 5);
      for (const u of mostrar) {
        mensaje += `   • ${u.nombre}\n`;
        mensaje += `     ${u.numero.substring(0, 13)}...\n`;
        mensaje += `     🎵 ${u.cancionesPedidas || 0} canciones\n\n`;
      }

      if (lista.length > 5) {
        mensaje += `   ... y ${lista.length - 5} más\n\n`;
      }
    }
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━`;

  return mensaje;
}

function cambiarTipoUsuario(numero, tipo, estado, admin) {
  const usuarioObj = estado.usuarios[numero];

  if (!usuarioObj) {
    admin.contexto = 'admin_usuarios_menu';
    return `❌ Usuario ${numero} no encontrado.\n\n` + obtenerMenuGestionUsuarios();
  }

  const tipoLower = tipo.toLowerCase();
  let perfilNuevo;

  switch (tipoLower) {
    case 'normal':
      perfilNuevo = PERFILES.NORMAL;
      break;
    case 'premium':
      perfilNuevo = PERFILES.PREMIUM;
      break;
    case 'vip':
      perfilNuevo = PERFILES.VIP;
      break;
    case 'tecnico':
    case 'técnico':
      perfilNuevo = PERFILES.TECNICO;
      break;
    default:
      return `❌ Tipo inválido: ${tipo}\n\nTipos: normal, premium, vip, tecnico\n\n0️⃣ Cancelar`;
  }

  promoverUsuario(usuarioObj, perfilNuevo);

  const config = CONFIG_PERFILES[perfilNuevo];

  admin.contexto = 'admin_usuarios_menu';

  let respuesta = `✅ *TIPO CAMBIADO*\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += `👤 ${usuarioObj.nombre}\n`;
  respuesta += `📱 ${numero}\n`;
  respuesta += `${config.emoji} Nuevo tipo: ${config.nombre}\n`;
  respuesta += `🎵 Límite: ${config.limiteCanciones} canciones/día\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += obtenerMenuGestionUsuarios();

  log(`👤 Admin cambió tipo de usuario: ${numero} -> ${config.nombre}`, 'info');

  return respuesta;
}

function activarTecnico(numero, estado, admin) {
  const usuarioObj = estado.usuarios[numero];

  if (!usuarioObj) {
    admin.contexto = 'admin_usuarios_menu';
    return `❌ Usuario ${numero} no encontrado.\n\n` + obtenerMenuGestionUsuarios();
  }

  promoverUsuario(usuarioObj, PERFILES.TECNICO);

  admin.contexto = 'admin_usuarios_menu';

  let respuesta = `✅ *TÉCNICO ACTIVADO*\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += `👤 ${usuarioObj.nombre}\n`;
  respuesta += `📱 ${numero}\n`;
  respuesta += `🛠️ Ahora es: TÉCNICO\n`;
  respuesta += `♾️ Canciones ilimitadas\n`;
  respuesta += `🎚️ Controles de reproducción\n`;
  respuesta += `🔊 Controles de volumen\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += obtenerMenuGestionUsuarios();

  log(`🛠️ Admin activó técnico: ${numero}`, 'info');

  return respuesta;
}

function desactivarTecnico(numero, estado, admin) {
  const usuarioObj = estado.usuarios[numero];

  if (!usuarioObj) {
    admin.contexto = 'admin_usuarios_menu';
    return `❌ Usuario ${numero} no encontrado.\n\n` + obtenerMenuGestionUsuarios();
  }

  if (usuarioObj.perfil !== PERFILES.TECNICO) {
    admin.contexto = 'admin_usuarios_menu';
    return `❌ ${usuarioObj.nombre} no es técnico.\n\n` + obtenerMenuGestionUsuarios();
  }

  // Degradar a normal o premium según historial
  const nuevoPerfil = usuarioObj.cancionesPedidas > 50 ? PERFILES.PREMIUM : PERFILES.NORMAL;
  promoverUsuario(usuarioObj, nuevoPerfil);

  admin.contexto = 'admin_usuarios_menu';

  const config = CONFIG_PERFILES[nuevoPerfil];

  let respuesta = `✅ *TÉCNICO DESACTIVADO*\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += `👤 ${usuarioObj.nombre}\n`;
  respuesta += `📱 ${numero}\n`;
  respuesta += `${config.emoji} Nuevo perfil: ${config.nombre}\n`;
  respuesta += `🎵 Límite: ${config.limiteCanciones} canciones/día\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += obtenerMenuGestionUsuarios();

  log(`🚫 Admin desactivó técnico: ${numero}`, 'info');

  return respuesta;
}

function listarBloqueados(estado) {
  const bloqueados = Object.entries(estado.bloqueados || {});

  if (bloqueados.length === 0) {
    return '✅ No hay usuarios bloqueados.\n\n' + obtenerMenuGestionUsuarios();
  }

  let mensaje = `🚫 *USUARIOS BLOQUEADOS*\n\n`;
  mensaje += `Total: ${bloqueados.length}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const mostrar = bloqueados.slice(0, 15);

  for (const [numero, info] of mostrar) {
    const fecha = new Date(info.fecha).toLocaleDateString('es-MX');
    const usuario = estado.usuarios[numero];
    const nombre = usuario ? usuario.nombre : 'Desconocido';

    mensaje += `📱 ${numero}\n`;
    mensaje += `   👤 ${nombre}\n`;
    mensaje += `   📅 ${fecha}\n`;
    mensaje += `   📝 ${info.razon || 'Sin razón'}\n`;

    if (info.categorias && info.categorias.length > 0) {
      mensaje += `   ⚠️ ${info.categorias.join(', ')}\n`;
    }

    mensaje += `\n`;
  }

  if (bloqueados.length > 15) {
    mensaje += `... y ${bloqueados.length - 15} más\n\n`;
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += obtenerMenuGestionUsuarios();

  return mensaje;
}

function desbloquearUsuario(numero, estado, admin) {
  if (!estado.bloqueados || !estado.bloqueados[numero]) {
    admin.contexto = 'admin_usuarios_menu';
    return `⚠️ El usuario ${numero} no está bloqueado.\n\n` + obtenerMenuGestionUsuarios();
  }

  const info = estado.bloqueados[numero];
  delete estado.bloqueados[numero];

  admin.contexto = 'admin_usuarios_menu';

  let respuesta = `✅ *USUARIO DESBLOQUEADO*\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += `📱 Número: ${numero}\n`;
  respuesta += `📝 Razón original: ${info.razon || 'Sin razón'}\n`;
  respuesta += `📅 Desbloqueado: ${new Date().toLocaleString('es-MX')}\n\n`;
  respuesta += `El usuario puede volver a usar el sistema.\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += obtenerMenuGestionUsuarios();

  log(`✅ Admin desbloqueó usuario: ${numero}`, 'info');

  return respuesta;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * SECCIÓN 2: PAGOS / PREMIUM / VIP
 * ═══════════════════════════════════════════════════════════════
 */
function obtenerMenuPagos() {
  let menu = `💰 *PAGOS / PREMIUM / VIP*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ Ver solicitudes pendientes de Premium\n`;
  menu += `2️⃣ Ver solicitudes pendientes de VIP\n`;
  menu += `3️⃣ Revisar comprobantes (QR OXXO)\n`;
  menu += `4️⃣ Aprobar pago\n`;
  menu += `5️⃣ Rechazar pago\n`;
  menu += `6️⃣ Configurar precios Premium / VIP\n`;
  menu += `7️⃣ Historial de pagos\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

async function manejarPagos(usuario, texto, estado) {
  const contexto = usuario.contexto;

  if (contexto === 'admin_pagos_menu') {
    const opcion = parseInt(texto);

    if (texto === '0') {
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();
    }

    switch (opcion) {
      case 1:
        return verSolicitudesPendientes('premium', estado);

      case 2:
        return verSolicitudesPendientes('vip', estado);

      case 3:
        return `📋 *COMPROBANTES PENDIENTES*\n\nPara revisar comprobantes, usa las opciones 1 o 2.\n\n` + obtenerMenuPagos();

      case 4:
        usuario.contexto = 'admin_pagos_aprobar';
        return `✅ *APROBAR PAGO*\n\nEscribe el número del usuario:\n\n0️⃣ Cancelar`;

      case 5:
        usuario.contexto = 'admin_pagos_rechazar';
        return `❌ *RECHAZAR PAGO*\n\nEscribe el número del usuario:\n\n0️⃣ Cancelar`;

      case 6:
        usuario.contexto = 'admin_pagos_precios';
        return `💵 *CONFIGURAR PRECIOS*\n\nFormato: [tipo] [precio]\n\nEjemplo: premium 150\n\nTipos: premium, vip\n\n0️⃣ Cancelar`;

      case 7:
        return verHistorialPagos(estado);

      default:
        return '❌ Opción inválida.\n\n' + obtenerMenuPagos();
    }
  }

  // Aprobar pago
  if (contexto === 'admin_pagos_aprobar') {
    if (texto === '0') {
      usuario.contexto = 'admin_pagos_menu';
      return obtenerMenuPagos();
    }

    return await aprobarPagoAdmin(texto, estado, usuario);
  }

  // Rechazar pago
  if (contexto === 'admin_pagos_rechazar') {
    if (texto === '0') {
      usuario.contexto = 'admin_pagos_menu';
      return obtenerMenuPagos();
    }

    return await rechazarPagoAdmin(texto, estado, usuario);
  }

  // Configurar precios
  if (contexto === 'admin_pagos_precios') {
    if (texto === '0') {
      usuario.contexto = 'admin_pagos_menu';
      return obtenerMenuPagos();
    }

    const partes = texto.split(' ');
    if (partes.length !== 2) {
      return `❌ Formato inválido.\n\nUsa: [tipo] [precio]\n\n0️⃣ Cancelar`;
    }

    const [tipo, precio] = partes;
    return configurarPrecio(tipo, precio, estado, usuario);
  }

  return obtenerMenuPagos();
}

function verSolicitudesPendientes(tipo, estado) {
  const solicitudes = Object.entries(estado.solicitudes || {}).filter(
    ([_, sol]) => sol.tipo === tipo && sol.estado === 'pendiente'
  );

  if (solicitudes.length === 0) {
    return `✅ No hay solicitudes pendientes de ${tipo.toUpperCase()}.\n\n` + obtenerMenuPagos();
  }

  let mensaje = `📋 *SOLICITUDES ${tipo.toUpperCase()} PENDIENTES*\n\n`;
  mensaje += `Total: ${solicitudes.length}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  solicitudes.slice(0, 10).forEach(([numero, sol]) => {
    const usuario = estado.usuarios[numero];
    const nombre = usuario ? usuario.nombre : 'Desconocido';
    const fecha = new Date(sol.fecha).toLocaleString('es-MX');

    mensaje += `👤 ${nombre}\n`;
    mensaje += `📱 ${numero}\n`;
    mensaje += `📅 ${fecha}\n`;
    mensaje += `💵 $${sol.monto} MXN\n`;
    mensaje += `📝 Método: ${sol.metodoPago || 'OXXO'}\n`;

    if (sol.comprobante) {
      mensaje += `📸 Comprobante: Sí\n`;
    }

    mensaje += `\n`;
  });

  if (solicitudes.length > 10) {
    mensaje += `... y ${solicitudes.length - 10} más\n\n`;
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += `Para aprobar: Opción 4\n`;
  mensaje += `Para rechazar: Opción 5\n\n`;
  mensaje += obtenerMenuPagos();

  return mensaje;
}

async function aprobarPagoAdmin(numero, estado, admin) {
  if (!estado.solicitudes || !estado.solicitudes[numero]) {
    admin.contexto = 'admin_pagos_menu';
    return `❌ No hay solicitud pendiente para ${numero}.\n\n` + obtenerMenuPagos();
  }

  const solicitud = estado.solicitudes[numero];

  if (solicitud.estado !== 'pendiente') {
    admin.contexto = 'admin_pagos_menu';
    return `❌ Esta solicitud ya fue ${solicitud.estado}.\n\n` + obtenerMenuPagos();
  }

  // Aprobar usando el handler de pagos
  const usuarioObj = estado.usuarios[numero];
  await aprobarSolicitudPago(usuarioObj, estado);

  admin.contexto = 'admin_pagos_menu';

  let respuesta = `✅ *PAGO APROBADO*\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += `👤 ${usuarioObj.nombre}\n`;
  respuesta += `📱 ${numero}\n`;
  respuesta += `💎 Tipo: ${solicitud.tipo.toUpperCase()}\n`;
  respuesta += `💵 Monto: $${solicitud.monto} MXN\n`;
  respuesta += `📅 Aprobado: ${new Date().toLocaleString('es-MX')}\n\n`;
  respuesta += `El usuario ha sido notificado.\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += obtenerMenuPagos();

  log(`✅ Admin aprobó pago: ${numero} -> ${solicitud.tipo}`, 'info');

  return respuesta;
}

async function rechazarPagoAdmin(numero, estado, admin) {
  if (!estado.solicitudes || !estado.solicitudes[numero]) {
    admin.contexto = 'admin_pagos_menu';
    return `❌ No hay solicitud pendiente para ${numero}.\n\n` + obtenerMenuPagos();
  }

  const solicitud = estado.solicitudes[numero];

  if (solicitud.estado !== 'pendiente') {
    admin.contexto = 'admin_pagos_menu';
    return `❌ Esta solicitud ya fue ${solicitud.estado}.\n\n` + obtenerMenuPagos();
  }

  // Rechazar usando el handler de pagos
  const usuarioObj = estado.usuarios[numero];
  await rechazarSolicitudPago(usuarioObj, 'Rechazado por administrador', estado);

  admin.contexto = 'admin_pagos_menu';

  let respuesta = `❌ *PAGO RECHAZADO*\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += `👤 ${usuarioObj.nombre}\n`;
  respuesta += `📱 ${numero}\n`;
  respuesta += `💎 Tipo: ${solicitud.tipo.toUpperCase()}\n`;
  respuesta += `💵 Monto: $${solicitud.monto} MXN\n`;
  respuesta += `📅 Rechazado: ${new Date().toLocaleString('es-MX')}\n\n`;
  respuesta += `El usuario ha sido notificado.\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += obtenerMenuPagos();

  log(`❌ Admin rechazó pago: ${numero} -> ${solicitud.tipo}`, 'info');

  return respuesta;
}

function configurarPrecio(tipo, precio, estado, admin) {
  const precioNum = parseInt(precio);

  if (isNaN(precioNum) || precioNum < 0) {
    return `❌ Precio inválido: ${precio}\n\n0️⃣ Cancelar`;
  }

  if (!estado.configuracion) {
    estado.configuracion = {};
  }

  if (!estado.configuracion.precios) {
    estado.configuracion.precios = {};
  }

  const tipoLower = tipo.toLowerCase();

  if (tipoLower !== 'premium' && tipoLower !== 'vip') {
    return `❌ Tipo inválido: ${tipo}\n\nTipos: premium, vip\n\n0️⃣ Cancelar`;
  }

  estado.configuracion.precios[tipoLower] = precioNum;

  admin.contexto = 'admin_pagos_menu';

  let respuesta = `✅ *PRECIO ACTUALIZADO*\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += `💎 Tipo: ${tipoLower.toUpperCase()}\n`;
  respuesta += `💵 Nuevo precio: $${precioNum} MXN\n\n`;
  respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  respuesta += obtenerMenuPagos();

  log(`💵 Admin configuró precio ${tipoLower}: $${precioNum}`, 'info');

  return respuesta;
}

function verHistorialPagos(estado) {
  const solicitudes = Object.entries(estado.solicitudes || {}).filter(
    ([_, sol]) => sol.estado !== 'pendiente'
  );

  if (solicitudes.length === 0) {
    return `📋 No hay historial de pagos.\n\n` + obtenerMenuPagos();
  }

  // Ordenar por fecha (más recientes primero)
  solicitudes.sort((a, b) => new Date(b[1].fecha) - new Date(a[1].fecha));

  let mensaje = `📋 *HISTORIAL DE PAGOS*\n\n`;
  mensaje += `Total: ${solicitudes.length}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const aprobados = solicitudes.filter(([_, sol]) => sol.estado === 'aprobado').length;
  const rechazados = solicitudes.filter(([_, sol]) => sol.estado === 'rechazado').length;

  mensaje += `✅ Aprobados: ${aprobados}\n`;
  mensaje += `❌ Rechazados: ${rechazados}\n\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  solicitudes.slice(0, 10).forEach(([numero, sol]) => {
    const usuario = estado.usuarios[numero];
    const nombre = usuario ? usuario.nombre : 'Desconocido';
    const fecha = new Date(sol.fecha).toLocaleDateString('es-MX');
    const estado_emoji = sol.estado === 'aprobado' ? '✅' : '❌';

    mensaje += `${estado_emoji} ${nombre} (${sol.tipo})\n`;
    mensaje += `   📱 ${numero}\n`;
    mensaje += `   💵 $${sol.monto} MXN\n`;
    mensaje += `   📅 ${fecha}\n\n`;
  });

  if (solicitudes.length > 10) {
    mensaje += `... y ${solicitudes.length - 10} más\n\n`;
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensaje += obtenerMenuPagos();

  return mensaje;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * SECCIÓN 3: CONTROL DE MÚSICA Y COLAS
 * ═══════════════════════════════════════════════════════════════
 */
function obtenerMenuControlMusica() {
  let menu = `🎵 *CONTROL DE MÚSICA Y COLAS*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ Ver cola completa\n`;
  menu += `2️⃣ Agregar canción manualmente\n`;
  menu += `3️⃣ Repetir canción (ignorar regla)\n`;
  menu += `4️⃣ Pausar música\n`;
  menu += `5️⃣ Reanudar música\n`;
  menu += `6️⃣ Siguiente canción\n`;
  menu += `7️⃣ Detener todo\n`;
  menu += `8️⃣ Subir volumen\n`;
  menu += `9️⃣ Bajar volumen\n`;
  menu += `🔟 Ajustar volumen específico (0-100)\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

async function manejarControlMusica(usuario, texto, estado) {
  const contexto = usuario.contexto;

  if (contexto === 'admin_musica_menu') {
    const opcion = parseInt(texto);

    if (texto === '0') {
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();
    }

    if (texto === '10') {
      usuario.contexto = 'admin_musica_volumen_exacto';
      return `🎚️ *AJUSTAR VOLUMEN*\n\nEscribe el nivel de volumen (0-100):\n\n0️⃣ Cancelar`;
    }

    switch (opcion) {
      case 1:
        return await verColaCompletaAdmin();

      case 2:
        usuario.contexto = 'admin_musica_agregar';
        return `➕ *AGREGAR CANCIÓN*\n\nEscribe el nombre de la canción o artista:\n\n0️⃣ Cancelar`;

      case 3:
        usuario.contexto = 'admin_musica_repetir';
        return `🔁 *REPETIR CANCIÓN*\n\nEscribe el nombre de la canción:\n\n0️⃣ Cancelar`;

      case 4:
        const pausado = await pausarReproduccion();
        return pausado ? `⏸️ Música pausada.\n\n` + obtenerMenuControlMusica() : `❌ Error al pausar.\n\n` + obtenerMenuControlMusica();

      case 5:
        const reanudado = await reanudarReproduccion();
        return reanudado ? `▶️ Música reanudada.\n\n` + obtenerMenuControlMusica() : `❌ Error al reanudar.\n\n` + obtenerMenuControlMusica();

      case 6:
        const saltado = await siguienteCancion();
        return saltado ? `⏭️ Siguiente canción.\n\n` + obtenerMenuControlMusica() : `❌ Error al saltar.\n\n` + obtenerMenuControlMusica();

      case 7:
        const limpiado = await limpiarPlaylist();
        return `🛑 *REPRODUCCIÓN DETENIDA*\n\n${limpiado} canciones eliminadas de la cola.\n\n` + obtenerMenuControlMusica();

      case 8:
        const subido = await subirVolumen();
        const estadoSubir = await obtenerReproduccionActual();
        const volumenActual = estadoSubir?.device?.volume_percent || 'desconocido';
        return subido ? `🔊 Volumen: ${volumenActual}%\n\n` + obtenerMenuControlMusica() : `❌ Error al subir volumen.\n\n` + obtenerMenuControlMusica();

      case 9:
        const bajado = await bajarVolumen();
        const estadoBajar = await obtenerReproduccionActual();
        const volumenBajo = estadoBajar?.device?.volume_percent || 'desconocido';
        return bajado ? `🔉 Volumen: ${volumenBajo}%\n\n` + obtenerMenuControlMusica() : `❌ Error al bajar volumen.\n\n` + obtenerMenuControlMusica();

      default:
        return '❌ Opción inválida.\n\n' + obtenerMenuControlMusica();
    }
  }

  // Agregar canción
  if (contexto === 'admin_musica_agregar') {
    if (texto === '0') {
      usuario.contexto = 'admin_musica_menu';
      return obtenerMenuControlMusica();
    }

    return await buscarYAgregarCancionAdmin(texto, usuario, estado);
  }

  // Repetir canción
  if (contexto === 'admin_musica_repetir') {
    if (texto === '0') {
      usuario.contexto = 'admin_musica_menu';
      return obtenerMenuControlMusica();
    }

    return await buscarYRepetirCancionAdmin(texto, usuario, estado);
  }

  // Seleccionar de resultados
  if (contexto === 'admin_musica_seleccionar') {
    if (texto === '0') {
      usuario.contexto = 'admin_musica_menu';
      delete usuario.ultimaSugerencia;
      return obtenerMenuControlMusica();
    }

    return await seleccionarCancionAdmin(texto, usuario, estado);
  }

  // Volumen exacto
  if (contexto === 'admin_musica_volumen_exacto') {
    if (texto === '0') {
      usuario.contexto = 'admin_musica_menu';
      return obtenerMenuControlMusica();
    }

    const volumen = parseInt(texto);

    if (isNaN(volumen) || volumen < 0 || volumen > 100) {
      return `❌ Volumen inválido. Debe ser 0-100.\n\n0️⃣ Cancelar`;
    }

    const ajustado = await ajustarVolumen(volumen);

    usuario.contexto = 'admin_musica_menu';

    return ajustado ? `🎚️ Volumen ajustado a ${volumen}%.\n\n` + obtenerMenuControlMusica() : `❌ Error al ajustar volumen.\n\n` + obtenerMenuControlMusica();
  }

  return obtenerMenuControlMusica();
}

async function verColaCompletaAdmin() {
  try {
    const playlist = await obtenerPlaylist();

    if (playlist.length === 0) {
      return `📊 *COLA VACÍA*\n\nNo hay canciones en la cola.\n\n` + obtenerMenuControlMusica();
    }

    let respuesta = `📊 *COLA COMPLETA*\n\n`;
    respuesta += `Total: ${playlist.length} canciones\n\n`;
    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Mostrar hasta 15 canciones
    for (let i = 0; i < Math.min(playlist.length, 15); i++) {
      const item = playlist[i];
      const cancion = item.track;
      const artistas = cancion.artists.map(a => a.name).join(', ');

      respuesta += `${i + 1}. ${cancion.name}\n`;
      respuesta += `   🎤 ${artistas}\n`;

      // Verificar si está en historial
      const info = obtenerInfoCancion(cancion.uri);
      if (info && info.minutosTranscurridos < 60) {
        respuesta += `   ⚠️ Repetida hace ${info.minutosTranscurridos} min\n`;
      }

      respuesta += `\n`;
    }

    if (playlist.length > 15) {
      respuesta += `... y ${playlist.length - 15} más\n\n`;
    }

    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += obtenerMenuControlMusica();

    return respuesta;
  } catch (error) {
    log(`❌ Error obteniendo cola admin: ${error.message}`, 'error');
    return `❌ Error al obtener la cola.\n\n` + obtenerMenuControlMusica();
  }
}

async function buscarYAgregarCancionAdmin(query, admin, estado) {
  try {
    const canciones = await buscarCancionEnSpotify(query, 10);

    if (canciones.length === 0) {
      return `❌ No se encontraron resultados para "${query}".\n\nIntenta de nuevo o escribe 0 para cancelar.`;
    }

    admin.ultimaSugerencia = {
      busqueda: query,
      canciones: canciones,
      accion: 'agregar'
    };

    admin.contexto = 'admin_musica_seleccionar';

    return obtenerMenuResultadosAdmin(canciones, query);
  } catch (error) {
    log(`❌ Error en búsqueda admin: ${error.message}`, 'error');
    return `❌ Error al buscar. Intenta de nuevo.\n\n0️⃣ Cancelar`;
  }
}

async function buscarYRepetirCancionAdmin(query, admin, estado) {
  try {
    const canciones = await buscarCancionEnSpotify(query, 10);

    if (canciones.length === 0) {
      return `❌ No se encontraron resultados para "${query}".\n\nIntenta de nuevo o escribe 0 para cancelar.`;
    }

    admin.ultimaSugerencia = {
      busqueda: query,
      canciones: canciones,
      accion: 'repetir'
    };

    admin.contexto = 'admin_musica_seleccionar';

    return obtenerMenuResultadosAdmin(canciones, query);
  } catch (error) {
    log(`❌ Error en búsqueda admin: ${error.message}`, 'error');
    return `❌ Error al buscar. Intenta de nuevo.\n\n0️⃣ Cancelar`;
  }
}

function obtenerMenuResultadosAdmin(canciones, busqueda) {
  let menu = `🎵 *RESULTADOS*\n\n`;
  menu += `Búsqueda: "${busqueda}"\n\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  canciones.slice(0, 10).forEach((cancion, index) => {
    const artistas = cancion.artists.map(a => a.name).join(', ');
    menu += `${index + 1}️⃣ ${cancion.name}\n`;
    menu += `   🎤 ${artistas}\n\n`;
  });

  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `Escribe el número de la canción\n\n`;
  menu += `0️⃣ Cancelar`;

  return menu;
}

async function seleccionarCancionAdmin(texto, admin, estado) {
  const opcion = parseInt(texto);

  if (isNaN(opcion) || opcion < 1 || opcion > admin.ultimaSugerencia.canciones.length) {
    return `❌ Opción inválida.\n\n` + obtenerMenuResultadosAdmin(admin.ultimaSugerencia.canciones, admin.ultimaSugerencia.busqueda);
  }

  const cancion = admin.ultimaSugerencia.canciones[opcion - 1];
  const accion = admin.ultimaSugerencia.accion;

  try {
    // Agregar a playlist con prioridad 0 (admin)
    await agregarCancionAPlaylist(cancion.uri, 0);

    // Registrar en historial (incluso si es repetida, admin puede hacerlo)
    registrarCancionTocada(cancion.uri, admin.numero);

    // Actualizar estadísticas
    estado.estadisticas.totalCanciones++;

    const artistas = cancion.artists.map(a => a.name).join(', ');

    admin.contexto = 'admin_musica_menu';
    delete admin.ultimaSugerencia;

    let respuesta = `✅ *CANCIÓN AGREGADA*\n\n`;
    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += `🎵 ${cancion.name}\n`;
    respuesta += `🎤 ${artistas}\n\n`;

    if (accion === 'repetir') {
      respuesta += `🔁 Repetición autorizada (Admin)\n\n`;
    }

    respuesta += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    respuesta += obtenerMenuControlMusica();

    log(`✅ Admin agregó canción: ${cancion.name}`, 'info');

    return respuesta;
  } catch (error) {
    log(`❌ Error agregando canción admin: ${error.message}`, 'error');
    admin.contexto = 'admin_musica_menu';
    return `❌ Error al agregar la canción.\n\n` + obtenerMenuControlMusica();
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * SECCIONES 4-9: PLACEHOLDERS (A IMPLEMENTAR)
 * ═══════════════════════════════════════════════════════════════
 */

function obtenerMenuSeguridad() {
  let menu = `🛡️ *SEGURIDAD Y PALABRAS PROHIBIDAS*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ Ver palabras prohibidas\n`;
  menu += `2️⃣ Agregar palabra prohibida\n`;
  menu += `3️⃣ Quitar palabra prohibida\n`;
  menu += `4️⃣ Ver lista negra\n`;
  menu += `5️⃣ Bloquear usuario manualmente\n`;
  menu += `6️⃣ Desbloquear usuario\n`;
  menu += `7️⃣ Ver intentos de ataque\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

async function manejarSeguridad(usuario, texto, estado) {
  const contexto = usuario.contexto;

  if (contexto === 'admin_seguridad_menu') {
    if (texto === '0') {
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();
    }

    usuario.contexto = 'admin_menu_principal';
    return `🚧 *SECCIÓN EN DESARROLLO*\n\nEsta funcionalidad estará disponible próximamente.\n\n` + obtenerMenuPrincipalAdmin();
  }

  return obtenerMenuSeguridad();
}

function obtenerMenuUbicaciones() {
  let menu = `📍 *UBICACIONES Y GEOCERCAS*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ Ver radio actual permitido\n`;
  menu += `2️⃣ Cambiar radio de la plaza\n`;
  menu += `3️⃣ Activar/desactivar validación\n`;
  menu += `4️⃣ Ver ubicaciones recientes\n`;
  menu += `5️⃣ Ver distancia de un usuario\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

async function manejarUbicaciones(usuario, texto, estado) {
  const contexto = usuario.contexto;

  if (contexto === 'admin_ubicaciones_menu') {
    if (texto === '0') {
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();
    }

    usuario.contexto = 'admin_menu_principal';
    return `🚧 *SECCIÓN EN DESARROLLO*\n\nEsta funcionalidad estará disponible próximamente.\n\n` + obtenerMenuPrincipalAdmin();
  }

  return obtenerMenuUbicaciones();
}

function obtenerMenuConfiguracion() {
  let menu = `🧩 *CONFIGURACIÓN DEL SISTEMA*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ Limitar canciones por perfil\n`;
  menu += `2️⃣ Activar/desactivar Premium\n`;
  menu += `3️⃣ Activar/desactivar VIP\n`;
  menu += `4️⃣ Saludos personalizados\n`;
  menu += `5️⃣ Filtros estrictos\n`;
  menu += `6️⃣ Bloquear artistas\n`;
  menu += `7️⃣ Bloquear canciones\n`;
  menu += `8️⃣ Quitar bloqueos\n`;
  menu += `9️⃣ Restaurar configuración\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

async function manejarConfiguracion(usuario, texto, estado) {
  const contexto = usuario.contexto;

  if (contexto === 'admin_config_menu') {
    if (texto === '0') {
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();
    }

    usuario.contexto = 'admin_menu_principal';
    return `🚧 *SECCIÓN EN DESARROLLO*\n\nEsta funcionalidad estará disponible próximamente.\n\n` + obtenerMenuPrincipalAdmin();
  }

  return obtenerMenuConfiguracion();
}

function obtenerMenuPlantillas() {
  let menu = `🖼️ *PLANTILLAS, QRS Y MENSAJES*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ Subir QR de pago OXXO\n`;
  menu += `2️⃣ Subir plantillas de mensajes\n`;
  menu += `3️⃣ Editar textos automáticos\n`;
  menu += `4️⃣ Vista previa de mensajes\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

async function manejarPlantillas(usuario, texto, estado) {
  const contexto = usuario.contexto;

  if (contexto === 'admin_plantillas_menu') {
    if (texto === '0') {
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();
    }

    usuario.contexto = 'admin_menu_principal';
    return `🚧 *SECCIÓN EN DESARROLLO*\n\nEsta funcionalidad estará disponible próximamente.\n\n` + obtenerMenuPrincipalAdmin();
  }

  return obtenerMenuPlantillas();
}

function obtenerMenuBots() {
  let menu = `🧰 *GESTIÓN DE BOTS (MULTI-BOT)*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ Ver todos los bots activos\n`;
  menu += `2️⃣ Agregar nuevo bot\n`;
  menu += `3️⃣ Editar bot existente\n`;
  menu += `4️⃣ Eliminar bot\n`;
  menu += `5️⃣ Configurar conexión WhatsApp\n`;
  menu += `6️⃣ Configurar tokens de Spotify\n`;
  menu += `7️⃣ Activar/desactivar validación GPS\n`;
  menu += `8️⃣ Configurar directorios\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

async function manejarBots(usuario, texto, estado) {
  const contexto = usuario.contexto;

  if (contexto === 'admin_bots_menu') {
    if (texto === '0') {
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();
    }

    usuario.contexto = 'admin_menu_principal';
    return `🚧 *SECCIÓN EN DESARROLLO*\n\nEsta funcionalidad estará disponible próximamente.\n\n` + obtenerMenuPrincipalAdmin();
  }

  return obtenerMenuBots();
}

function obtenerMenuEstadisticas() {
  let menu = `📊 *ESTADÍSTICAS Y REPORTES*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menu += `1️⃣ Canciones más reproducidas hoy\n`;
  menu += `2️⃣ Artistas más solicitados\n`;
  menu += `3️⃣ Horarios con más actividad\n`;
  menu += `4️⃣ Reportes por usuario\n`;
  menu += `5️⃣ Reportes por perfil\n`;
  menu += `6️⃣ Reportes generales del sistema\n\n`;
  menu += `0️⃣ Volver`;

  return menu;
}

async function manejarEstadisticas(usuario, texto, estado) {
  const contexto = usuario.contexto;

  if (contexto === 'admin_stats_menu') {
    const opcion = parseInt(texto);

    if (texto === '0') {
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();
    }

    if (opcion === 6) {
      return generarReporte(estado) + '\n\n' + obtenerMenuEstadisticas();
    }

    usuario.contexto = 'admin_menu_principal';
    return `🚧 *SECCIÓN EN DESARROLLO*\n\nEsta funcionalidad estará disponible próximamente.\n\n` + obtenerMenuPrincipalAdmin();
  }

  return obtenerMenuEstadisticas();
}

/**
 * ═══════════════════════════════════════════════════════════════
 * COMANDOS LEGACY (MANTENER COMPATIBILIDAD)
 * ═══════════════════════════════════════════════════════════════
 */
async function procesarComandoLegacy(usuario, comando, estado) {
  const partes = comando.slice(1).split(' ');
  const cmd = partes[0].toLowerCase();
  const args = partes.slice(1);

  switch (cmd) {
    case 'menu':
      usuario.contexto = 'admin_menu_principal';
      return obtenerMenuPrincipalAdmin();

    case 'help':
    case 'ayuda':
      return obtenerAyudaAdmin();

    case 'stats':
    case 'estadisticas':
      return generarReporte(estado);

    default:
      return `❌ Comando legacy no reconocido: /${cmd}\n\nUsa "menu" para acceder al menú principal.`;
  }
}

function obtenerAyudaAdmin() {
  return `👤 *AYUDA ADMINISTRADOR*\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n\n` +
         `Escribe *menu* para acceder al menú principal con todas las funciones administrativas.\n\n` +
         `*MENÚ PRINCIPAL*\n` +
         `1. Gestión de usuarios\n` +
         `2. Pagos / Premium / VIP\n` +
         `3. Control de música y colas\n` +
         `4. Seguridad y palabras prohibidas\n` +
         `5. Ubicaciones y geocercas\n` +
         `6. Configuración del sistema\n` +
         `7. Plantillas, QRs y mensajes\n` +
         `8. Gestión de bots (multi-bot)\n` +
         `9. Estadísticas y reportes\n\n` +
         `━━━━━━━━━━━━━━━━━━━━━\n\n` +
         `*COMANDOS RÁPIDOS*\n` +
         `/menu - Menú principal\n` +
         `/stats - Estadísticas rápidas\n` +
         `/help - Esta ayuda`;
}
