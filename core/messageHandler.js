// core/messageHandler.js - Procesador Principal de Mensajes
import {
  crearUsuario,
  esAdmin,
  esTecnico,
  PERFILES,
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
import { filtroLenguaje } from '../utils/filtroLenguaje.js';
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

    // Verificar seguridad
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
                     esTecnico(numero) ? PERFILES.ADMINISTRADOR :
                     PERFILES.NORMAL;

      if (perfil !== PERFILES.NORMAL) {
        usuario.perfil = perfil;
        const config = require('./profiles.js').CONFIG_PERFILES[perfil];
        usuario.limiteDiario = config.limiteCanciones;
        usuario.prioridad = config.prioridad;
        usuario.permisos = config.permisos;
      }

      // Si requiere ubicación, solicitarla
      const configPerfil = require('./profiles.js').CONFIG_PERFILES[usuario.perfil];
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
        const esValida = verificarUbicacion({
          latitude: ubicacion.degreesLatitude,
          longitude: ubicacion.degreesLongitude
        });

        if (esValida) {
          usuario.ubicacionVerificada = true;
          usuario.ultimaUbicacion = {
            lat: ubicacion.degreesLatitude,
            lon: ubicacion.degreesLongitude,
            fecha: new Date().toISOString()
          };
          await enviarMensaje(sock, m.key.remoteJid, obtenerMensajeUbicacionVerificada(usuario.nombre));
          await enviarMensaje(sock, m.key.remoteJid, obtenerMenuPrincipal(usuario));
        } else {
          await enviarMensaje(sock, m.key.remoteJid, obtenerMensajeUbicacionRechazada(usuario.nombre));
        }
      } else {
        await enviarMensaje(sock, m.key.remoteJid, obtenerMensajeSolicitudUbicacion(usuario.nombre));
      }
      return;
    }

    // Filtro de lenguaje ofensivo
    if (filtroLenguaje(mensaje)) {
      estado.bloqueados[numero] = {
        fecha: new Date().toISOString(),
        razon: 'lenguaje_ofensivo',
        mensaje: mensaje
      };
      await enviarMensaje(
        sock,
        m.key.remoteJid,
        `🚫 Has sido bloqueado por usar lenguaje inapropiado.\n\nContacta a un administrador si crees que es un error.`
      );
      log(`🚫 Usuario bloqueado por lenguaje ofensivo: ${numero}`, 'warn');
      return;
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
