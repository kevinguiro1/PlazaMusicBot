// core/security.js - Sistema de Seguridad Anti-Flood y Rate Limiting
import NodeCache from 'node-cache';
import { log } from '../utils/logger.js';

/**
 * Inicializar sistema de seguridad
 */
export function iniciarSistemaSeguridad() {
  // Cache para rate limiting (TTL = 60 segundos)
  const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 10 });

  // Cache para detección de flood (TTL = 10 segundos)
  const floodCache = new NodeCache({ stdTTL: 10, checkperiod: 5 });

  // Cache para mensajes duplicados
  const mensajesDuplicadosCache = new NodeCache({ stdTTL: 30, checkperiod: 10 });

  // Lista de IPs/números bloqueados temporalmente
  const bloqueosTemporales = new NodeCache({ stdTTL: 3600, checkperiod: 60 });

  const RATE_LIMIT = parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 20;
  const FLOOD_THRESHOLD = parseInt(process.env.FLOOD_THRESHOLD) || 5;
  const FLOOD_WINDOW = parseInt(process.env.FLOOD_WINDOW_MS) || 10000;

  return {
    /**
     * Verificar rate limit de un usuario
     */
    verificarRateLimit(numero) {
      const key = `rate_${numero}`;
      const contador = rateLimitCache.get(key) || 0;

      if (contador >= RATE_LIMIT) {
        log(`🚫 Rate limit excedido para ${numero}`, 'warn');
        return false;
      }

      rateLimitCache.set(key, contador + 1);
      return true;
    },

    /**
     * Detectar flood (múltiples mensajes en poco tiempo)
     */
    detectarFlood(numero) {
      const key = `flood_${numero}`;
      const mensajes = floodCache.get(key) || [];
      const ahora = Date.now();

      // Filtrar mensajes dentro de la ventana de tiempo
      const mensajesRecientes = mensajes.filter(
        timestamp => ahora - timestamp < FLOOD_WINDOW
      );

      mensajesRecientes.push(ahora);

      if (mensajesRecientes.length > FLOOD_THRESHOLD) {
        log(`🚨 Flood detectado para ${numero}`, 'warn');

        // Bloquear temporalmente (1 hora)
        bloqueosTemporales.set(numero, true);

        return true;
      }

      floodCache.set(key, mensajesRecientes);
      return false;
    },

    /**
     * Detectar mensajes duplicados
     */
    esMensajeDuplicado(numero, mensaje) {
      const key = `msg_${numero}`;
      const ultimoMensaje = mensajesDuplicadosCache.get(key);

      if (ultimoMensaje === mensaje) {
        log(`⚠️ Mensaje duplicado detectado de ${numero}`, 'warn');
        return true;
      }

      mensajesDuplicadosCache.set(key, mensaje);
      return false;
    },

    /**
     * Verificar si un número está bloqueado temporalmente
     */
    estaBloqueadoTemporalmente(numero) {
      return bloqueosTemporales.get(numero) === true;
    },

    /**
     * Desbloquear número temporalmente bloqueado
     */
    desbloquearTemporal(numero) {
      bloqueosTemporales.del(numero);
      log(`✅ Desbloqueo temporal aplicado a ${numero}`, 'info');
    },

    /**
     * Validar tipo de mensaje (solo texto y ubicación permitidos)
     */
    validarTipoMensaje(mensajeObj) {
      // Tipos de mensaje permitidos
      const tiposPermitidos = ['conversation', 'extendedTextMessage', 'locationMessage'];

      // Rechazar fotos
      if (mensajeObj.imageMessage) {
        log('🚫 Imagen rechazada', 'warn');
        return {
          valido: false,
          razon: 'tipo_no_permitido',
          mensaje: '📵 No se permiten imágenes. Solo texto y ubicación.'
        };
      }

      // Rechazar videos
      if (mensajeObj.videoMessage) {
        log('🚫 Video rechazado', 'warn');
        return {
          valido: false,
          razon: 'tipo_no_permitido',
          mensaje: '📵 No se permiten videos. Solo texto y ubicación.'
        };
      }

      // Rechazar audios
      if (mensajeObj.audioMessage || mensajeObj.ptt) {
        log('🚫 Audio rechazado', 'warn');
        return {
          valido: false,
          razon: 'tipo_no_permitido',
          mensaje: '📵 No se permiten audios. Solo texto y ubicación.'
        };
      }

      // Rechazar documentos
      if (mensajeObj.documentMessage) {
        log('🚫 Documento rechazado', 'warn');
        return {
          valido: false,
          razon: 'tipo_no_permitido',
          mensaje: '📵 No se permiten documentos. Solo texto y ubicación.'
        };
      }

      // Rechazar stickers
      if (mensajeObj.stickerMessage) {
        log('🚫 Sticker rechazado', 'warn');
        return {
          valido: false,
          razon: 'tipo_no_permitido',
          mensaje: '📵 No se permiten stickers. Solo texto y ubicación.'
        };
      }

      // Rechazar mensajes reenviados
      if (mensajeObj.extendedTextMessage?.contextInfo?.isForwarded) {
        log('🚫 Mensaje reenviado rechazado', 'warn');
        return {
          valido: false,
          razon: 'reenvio_no_permitido',
          mensaje: '📵 No se permiten mensajes reenviados.'
        };
      }

      // Rechazar contactos
      if (mensajeObj.contactMessage || mensajeObj.contactsArrayMessage) {
        log('🚫 Contacto rechazado', 'warn');
        return {
          valido: false,
          razon: 'tipo_no_permitido',
          mensaje: '📵 No se permiten contactos. Solo texto y ubicación.'
        };
      }

      return {
        valido: true,
        razon: null,
        mensaje: null
      };
    },

    /**
     * Validar mensaje (sanitización básica)
     */
    validarMensaje(mensaje) {
      if (!mensaje || typeof mensaje !== 'string') {
        return false;
      }

      // Limitar longitud del mensaje
      if (mensaje.length > 500) {
        log('⚠️ Mensaje muy largo rechazado', 'warn');
        return false;
      }

      // Detectar spam de caracteres repetidos
      const caracteresRepetidos = /(.)\1{10,}/;
      if (caracteresRepetidos.test(mensaje)) {
        log('⚠️ Spam de caracteres detectado', 'warn');
        return false;
      }

      return true;
    },

    /**
     * Verificar seguridad completa
     */
    verificarSeguridad(numero, mensaje) {
      // 1. Verificar bloqueo temporal
      if (this.estaBloqueadoTemporalmente(numero)) {
        return {
          permitido: false,
          razon: 'bloqueado_temporal',
          mensaje: '🚫 Estás bloqueado temporalmente por actividad sospechosa. Intenta en 1 hora.'
        };
      }

      // 2. Verificar validez del mensaje
      if (!this.validarMensaje(mensaje)) {
        return {
          permitido: false,
          razon: 'mensaje_invalido',
          mensaje: '⚠️ Mensaje inválido o muy largo.'
        };
      }

      // 3. Verificar mensajes duplicados
      if (this.esMensajeDuplicado(numero, mensaje)) {
        return {
          permitido: false,
          razon: 'mensaje_duplicado',
          mensaje: null // No responder a duplicados
        };
      }

      // 4. Detectar flood
      if (this.detectarFlood(numero)) {
        return {
          permitido: false,
          razon: 'flood',
          mensaje: '🚨 Demasiados mensajes en poco tiempo. Has sido bloqueado temporalmente por 1 hora.'
        };
      }

      // 5. Verificar rate limit
      if (!this.verificarRateLimit(numero)) {
        return {
          permitido: false,
          razon: 'rate_limit',
          mensaje: '⏰ Demasiadas solicitudes. Espera un momento antes de enviar más mensajes.'
        };
      }

      return {
        permitido: true,
        razon: null,
        mensaje: null
      };
    },

    /**
     * Obtener estadísticas de seguridad
     */
    obtenerEstadisticas() {
      return {
        rateLimitActivos: rateLimitCache.keys().length,
        floodDetecciones: floodCache.keys().length,
        bloqueosTemporales: bloqueosTemporales.keys().length,
        mensajesCacheados: mensajesDuplicadosCache.keys().length
      };
    },

    /**
     * Limpiar cachés
     */
    limpiarCaches() {
      rateLimitCache.flushAll();
      floodCache.flushAll();
      mensajesDuplicadosCache.flushAll();
      log('🧹 Cachés de seguridad limpiados', 'info');
    }
  };
}

/**
 * Validar comando de administrador
 */
export function validarComandoAdmin(comando) {
  const comandosValidos = [
    '/bloquear',
    '/desbloquear',
    '/promover',
    '/degradar',
    '/stats',
    '/usuarios',
    '/limpiar',
    '/broadcast',
    '/help',
    '/cola',
    '/eliminar'
  ];

  const comandoBase = comando.trim().split(' ')[0].toLowerCase();
  return comandosValidos.includes(comandoBase);
}
