// core/messageHandler.js - Procesador Principal de Mensajes
import {
  crearUsuario,
  esAdmin,
  esTecnico,
  PERFILES,
  CONFIG_PERFILES,
  resetearContadorDiario,
  tienePermiso
} from './profiles.js';
import {
  obtenerMenuPrincipal,
  obtenerMensajeBienvenida,
  obtenerMensajeSolicitudUbicacion,
  obtenerMensajeUbicacionVerificada,
  obtenerMensajeUbicacionRechazada,
  obtenerMenuAyuda,
  obtenerMenuFAQ
} from './menus.js';
import { manejarUsuarioNormal } from '../perfiles/usuario.js';
import { manejarAdministrador } from '../perfiles/admin.js';
import { manejarTecnico } from '../perfiles/dj.js';
import { verificarUbicacion } from '../utils/ubicacion.js';
import { filtrarContenido, obtenerMensajeRechazo } from '../utils/filtroContenido.js';
import { tieneNotificacionPendiente, manejarRespuestaNotificacion } from './notifications.js';
import { log } from '../utils/logger.js';

/**
 * Procesar mensaje entrante
 */
export async function procesarMensaje(sock, m, estado, sistemaSeguridad) {
  try {
    // Extraer información del mensaje
    const numero = m.key.remoteJid.split('@')[0];
    const mensaje = m.message?.conversation ||
                    m.message?.extendedTextMessage?.text ||
                    '';
    const ubicacion = m.message?.locationMessage;
    const tipoMensaje = ubicacion ? 'ubicacion' : 'texto';

    // Log del mensaje
    log(`📨 Mensaje de ${numero}: ${mensaje.substring(0, 50)}...`, 'debug');

    // Validar tipo de mensaje (rechazar fotos, videos, audios, reenvíos, etc.)
    const validacionTipo = sistemaSeguridad.validarTipoMensaje(m.message);
    if (!validacionTipo.valido) {
      if (validacionTipo.mensaje) {
        await enviarMensaje(sock, m.key.remoteJid, validacionTipo.mensaje);
      }
      log(`🚫 Tipo de mensaje rechazado de ${numero}: ${validacionTipo.razon}`, 'warn');
      return;
    }

    // Verificar seguridad (rate limit, flood, etc.)
    const seguridadCheck = sistemaSeguridad.verificarSeguridad(numero, mensaje);
    if (!seguridadCheck.permitido) {
      if (seguridadCheck.mensaje) {
        await enviarMensaje(sock, m.key.remoteJid, seguridadCheck.mensaje);
      }
      log(`🚫 Mensaje bloqueado de ${numero}: ${seguridadCheck.razon}`, 'warn');
      return;
    }

    // Verificar si está bloqueado permanentemente
    if (estado.bloqueados[numero]) {
      log(`🚫 Usuario bloqueado intentó enviar mensaje: ${numero}`, 'warn');
      return;
    }

    // Inicializar usuario si es nuevo
    if (!estado.usuarios[numero]) {
      estado.usuarios[numero] = crearUsuario(numero);
      await enviarMensaje(sock, m.key.remoteJid, obtenerMensajeBienvenida());
      return;
    }

    const usuario = estado.usuarios[numero];

    // Actualizar actividad
    resetearContadorDiario(usuario);

    // Si no tiene nombre, guardarlo
    if (!usuario.nombre) {
      usuario.nombre = mensaje.trim();
      const perfil = esAdmin(numero) ? PERFILES.ADMINISTRADOR :
                     esTecnico(numero) ? PERFILES.TECNICO :
                     PERFILES.NORMAL;

      if (perfil !== PERFILES.NORMAL) {
        usuario.perfil = perfil;
        const config = CONFIG_PERFILES[perfil];
        usuario.limiteDiario = config.limiteCanciones;
        usuario.prioridad = config.prioridad;
        usuario.permisos = config.permisos;
      }

      // Si requiere ubicación, solicitarla
      const configPerfil = CONFIG_PERFILES[usuario.perfil];
      if (configPerfil.requiereUbicacion) {
        await enviarMensaje(sock, m.key.remoteJid, obtenerMensajeSolicitudUbicacion(usuario.nombre));
      } else {
        usuario.ubicacionVerificada = true;
        await enviarMensaje(sock, m.key.remoteJid, obtenerMensajeUbicacionVerificada(usuario.nombre));
        await enviarMensaje(sock, m.key.remoteJid, obtenerMenuPrincipal(usuario));
      }
      return;
    }

    // Verificar ubicación si es necesario
    if (!usuario.ubicacionVerificada) {
      if (tipoMensaje === 'ubicacion' && ubicacion) {
        const configPerfil = CONFIG_PERFILES[usuario.perfil];

        // Guardar ubicación siempre (para estadísticas)
        usuario.ultimaUbicacion = {
          lat: ubicacion.degreesLatitude,
          lon: ubicacion.degreesLongitude,
          fecha: new Date().toISOString()
        };

        // Solo validar si el perfil lo requiere (Normal, Premium, Técnico)
        if (configPerfil.validarUbicacion) {
          const esValida = verificarUbicacion({
            latitude: ubicacion.degreesLatitude,
            longitude: ubicacion.degreesLongitude
          });

          if (esValida) {
            usuario.ubicacionVerificada = true;
            await enviarMensaje(sock, m.key.remoteJid, obtenerMensajeUbicacionVerificada(usuario.nombre));
            await enviarMensaje(sock, m.key.remoteJid, obtenerMenuPrincipal(usuario));
          } else {
            await enviarMensaje(sock, m.key.remoteJid, obtenerMensajeUbicacionRechazada(usuario.nombre));
          }
        } else {
          // VIP: solo registrar ubicación sin validar plaza
          usuario.ubicacionVerificada = true;
          await enviarMensaje(
            sock,
            m.key.remoteJid,
            `✅ ¡Ubicación registrada!\n\n${configPerfil.emoji} Bienvenido ${usuario.nombre}, acceso VIP concedido.`
          );
          await enviarMensaje(sock, m.key.remoteJid, obtenerMenuPrincipal(usuario));
        }
      } else {
        await enviarMensaje(sock, m.key.remoteJid, obtenerMensajeSolicitudUbicacion(usuario.nombre));
      }
      return;
    }

    // Filtro de contenido (lenguaje ofensivo, violencia, narco, etc.)
    const filtrado = filtrarContenido(mensaje);
    if (!filtrado.permitido) {
      const mensajeRechazo = obtenerMensajeRechazo(filtrado);

      // Registrar infracción
      if (!estado.infracciones) {
        estado.infracciones = {};
      }
      if (!estado.infracciones[numero]) {
        estado.infracciones[numero] = [];
      }

      estado.infracciones[numero].push({
        fecha: new Date().toISOString(),
        mensaje: mensaje,
        categorias: filtrado.categoriasDetectadas.map(c => c.categoria),
        severidad: filtrado.severidad,
        accion: filtrado.accion
      });

      // Aplicar acción según severidad
      if (filtrado.accion === 'bloqueo_permanente' || estado.infracciones[numero].length >= 3) {
        // Bloqueo permanente
        estado.bloqueados[numero] = {
          fecha: new Date().toISOString(),
          razon: 'contenido_prohibido',
          categorias: filtrado.categoriasDetectadas.map(c => c.nombre),
          infracciones: estado.infracciones[numero].length
        };
        log(`🚨 Usuario bloqueado permanentemente: ${numero} (${filtrado.severidad})`, 'warn');
      } else if (filtrado.accion === 'bloqueo_temporal') {
        // Bloqueo temporal (1 hora) - usando el sistema de seguridad
        sistemaSeguridad.bloqueosTemporales?.set(numero, true);
        log(`⏰ Usuario bloqueado temporalmente: ${numero} (${filtrado.severidad})`, 'warn');
      }

      await enviarMensaje(sock, m.key.remoteJid, mensajeRechazo);
      return;
    }

    // Verificar si tiene notificación pendiente
    if (tieneNotificacionPendiente(numero)) {
      const respuestaNotificacion = await manejarRespuestaNotificacion(usuario, mensaje, estado, sock);
      if (respuestaNotificacion) {
        await enviarMensaje(sock, m.key.remoteJid, respuestaNotificacion);
        return;
      }
    }

    // Comandos globales
    const mensajeLower = mensaje.toLowerCase().trim();

    if (mensajeLower === 'menu' || mensajeLower === 'menú' || mensajeLower === 'inicio') {
      usuario.contexto = null;
      usuario.ultimaSugerencia = null;
      await enviarMensaje(sock, m.key.remoteJid, obtenerMenuPrincipal(usuario));
      return;
    }

    if (mensajeLower === 'ayuda' || mensajeLower === 'help' || mensajeLower === '?') {
      await enviarMensaje(sock, m.key.remoteJid, obtenerMenuAyuda(usuario));
      return;
    }

    if (mensajeLower === 'faq' || mensajeLower === 'preguntas') {
      await enviarMensaje(sock, m.key.remoteJid, obtenerMenuFAQ());
      return;
    }

    if (mensajeLower === 'perfil' || mensajeLower === 'yo') {
      const { obtenerResumenPerfil } = await import('./profiles.js');
      await enviarMensaje(sock, m.key.remoteJid, obtenerResumenPerfil(usuario));
      return;
    }

    if (mensajeLower === 'salir' || mensajeLower === 'exit') {
      usuario.contexto = null;
      usuario.ultimaSugerencia = null;
      await enviarMensaje(
        sock,
        m.key.remoteJid,
        `👋 Hasta pronto ${usuario.nombre}!\n\nEscribe "menu" cuando quieras volver.`
      );
      return;
    }

    // Enrutar según perfil
    let respuesta;

    if (usuario.perfil === PERFILES.ADMINISTRADOR || usuario.perfil === PERFILES.ADMINISTRADOR) {
      // Admins tienen acceso a comandos de admin + funcionalidad normal
      if (mensaje.startsWith('/')) {
        respuesta = await manejarAdministrador(usuario, mensaje, estado);
      } else {
        respuesta = await manejarUsuarioNormal(usuario, mensaje, estado);
      }
    } else if (usuario.perfil === PERFILES.TECNICO) {
      respuesta = await manejarTecnico(usuario, mensaje, estado);
    } else {
      respuesta = await manejarUsuarioNormal(usuario, mensaje, estado);
    }

    if (respuesta) {
      await enviarMensaje(sock, m.key.remoteJid, respuesta);
    }

  } catch (error) {
    log(`❌ Error en procesarMensaje: ${error.message}`, 'error');
    console.error(error);
  }
}

/**
 * Enviar mensaje con manejo de errores
 */
async function enviarMensaje(sock, jid, mensaje) {
  try {
    await sock.sendMessage(jid, { text: mensaje });
    log(`📤 Mensaje enviado a ${jid.split('@')[0]}`, 'debug');
  } catch (error) {
    log(`❌ Error enviando mensaje: ${error.message}`, 'error');
  }
}
