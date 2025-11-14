// perfiles/payments-handler.js - Manejador de Flujo de Pagos
import {
  generarPagoOXXO,
  generarPagoSPEI,
  registrarComprobante
} from '../core/payments.js';
import {
  obtenerMenuUpgrade,
  obtenerMenuSeleccionPerfil,
  formatearPagoOXXO,
  formatearPagoSPEI,
  obtenerMenuPrincipal
} from '../core/menus.js';
import { PERFILES } from '../core/profiles.js';
import { log } from '../utils/logger.js';

/**
 * Manejar flujo de upgrade de perfil (simplificado)
 */
export async function manejarUpgrade(usuario, mensaje, estado) {
  const texto = mensaje.trim();

  // Mostrar menú de upgrade inicial
  if (!usuario.contexto || usuario.contexto === 'upgrade_inicio') {
    usuario.contexto = 'upgrade_seleccionar_opcion';
    return obtenerMenuUpgrade(usuario);
  }

  // Selección de opción (Premium, VIP o Ver métodos)
  if (usuario.contexto === 'upgrade_seleccionar_opcion') {
    const opcion = parseInt(texto);

    if (opcion === 0 || texto.toLowerCase() === 'cancelar') {
      usuario.contexto = null;
      return `❌ Cancelado.\n\n` +
             `Escribe "menu" para volver al menú principal.`;
    }

    // Opción 3: Ver métodos de pago
    if (opcion === 3) {
      const { obtenerMenuMetodosPago } = await import('../core/menus.js');
      return obtenerMenuMetodosPago();
    }

    let perfilSeleccionado = null;

    if (usuario.perfil === PERFILES.NORMAL) {
      if (opcion === 1) {
        perfilSeleccionado = PERFILES.PREMIUM;
      } else if (opcion === 2) {
        perfilSeleccionado = PERFILES.VIP;
      }
    } else if (usuario.perfil === PERFILES.PREMIUM) {
      if (opcion === 1) {
        perfilSeleccionado = PERFILES.VIP;
      }
    }

    if (!perfilSeleccionado) {
      return `❌ Opción inválida.\n\n` + obtenerMenuUpgrade(usuario);
    }

    // Guardar perfil seleccionado y generar pago OXXO directamente
    const perfilNombre = perfilSeleccionado === PERFILES.PREMIUM ? 'PREMIUM' : 'VIP';

    try {
      // Generar pago OXXO
      const datosPago = await generarPagoOXXO(usuario, perfilSeleccionado);
      usuario.contexto = 'upgrade_esperando_comprobante';
      usuario.pagoEnProceso = {
        perfil: perfilSeleccionado,
        referencia: datosPago.referencia,
        tipo: 'OXXO'
      };

      let mensaje = `💳 *PAGO ${perfilNombre} - OXXO*\n\n`;
      mensaje += `Escanea el siguiente código QR:\n`;
      mensaje += `[QR ${perfilNombre}]\n\n`;
      mensaje += `💰 Monto: $${datosPago.monto} pesos\n\n`;
      mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensaje += `Una vez que pagues, envía foto del ticket.\n\n`;
      mensaje += `¿Ya realizaste el pago?\n\n`;
      mensaje += `1️⃣ Sí, enviar comprobante\n`;
      mensaje += `2️⃣ Ver QR nuevamente\n\n`;
      mensaje += `0️⃣ Cancelar`;

      return mensaje;
    } catch (error) {
      log(`❌ Error generando pago: ${error.message}`, 'error');
      usuario.contexto = null;
      delete usuario.pagoEnProceso;
      return `❌ Error generando el pago. Por favor intenta nuevamente más tarde.`;
    }
  }

  // Esperando comprobante
  if (usuario.contexto === 'upgrade_esperando_comprobante') {
    const opcion = parseInt(texto);

    if (texto.toLowerCase() === 'cancelar' || opcion === 0) {
      usuario.contexto = null;
      delete usuario.pagoEnProceso;
      return `❌ Proceso de pago cancelado.\n\n` +
             `Tu referencia de pago sigue siendo válida por 24 horas.\n` +
             `Puedes enviar el comprobante en cualquier momento.`;
    }

    // Opción 1: Sí, enviar comprobante
    if (opcion === 1) {
      return `📸 *ENVIAR COMPROBANTE*\n\n` +
             `Por favor envía una *foto* de tu ticket de OXXO.\n\n` +
             `📋 Referencia: ${usuario.pagoEnProceso.referencia}\n\n` +
             `💡 Adjunta la imagen y envíala.`;
    }

    // Opción 2: Ver QR nuevamente
    if (opcion === 2) {
      const perfilNombre = usuario.pagoEnProceso.perfil === PERFILES.PREMIUM ? 'PREMIUM' : 'VIP';
      let mensaje = `💳 *PAGO ${perfilNombre} - OXXO*\n\n`;
      mensaje += `Escanea el siguiente código QR:\n`;
      mensaje += `[QR ${perfilNombre}]\n\n`;
      mensaje += `💰 Monto: $${usuario.pagoEnProceso.perfil === PERFILES.PREMIUM ? '10' : '100'} pesos\n\n`;
      mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensaje += `Una vez que pagues, envía foto del ticket.\n\n`;
      mensaje += `¿Ya realizaste el pago?\n\n`;
      mensaje += `1️⃣ Sí, enviar comprobante\n`;
      mensaje += `2️⃣ Ver QR nuevamente\n\n`;
      mensaje += `0️⃣ Cancelar`;

      return mensaje;
    }

    return `❌ Opción inválida.\n\n` +
           `1️⃣ Sí, enviar comprobante\n` +
           `2️⃣ Ver QR nuevamente\n` +
           `0️⃣ Cancelar`;
  }

  return null;
}

/**
 * Procesar comprobante de pago (imagen)
 */
export async function procesarComprobantePago(usuario, imagePath) {
  try {
    if (!usuario.pagoEnProceso || !usuario.pagoEnProceso.referencia) {
      return `❌ No tienes ningún pago en proceso.\n\n` +
             `Escribe "upgrade" para iniciar un pago.`;
    }

    const resultado = registrarComprobante(
      usuario.numero,
      imagePath,
      usuario.pagoEnProceso.referencia
    );

    if (resultado.exito) {
      // Limpiar contexto
      usuario.contexto = null;
      delete usuario.pagoEnProceso;

      return `✅ *COMPROBANTE RECIBIDO*\n\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n\n` +
             `📋 Referencia: ${resultado.referencia}\n\n` +
             `Tu pago está en revisión.\n` +
             `Un administrador verificará tu comprobante.\n\n` +
             `Te notificaremos cuando sea aprobado. ⏰\n\n` +
             `━━━━━━━━━━━━━━━━━━━━━\n` +
             `💡 Escribe "menu" para continuar usando el bot.`;
    } else {
      return `❌ ${resultado.mensaje}\n\n` +
             `Por favor intenta nuevamente o contacta a un administrador.`;
    }
  } catch (error) {
    log(`❌ Error procesando comprobante: ${error.message}`, 'error');
    return `❌ Error procesando el comprobante. Por favor intenta nuevamente.`;
  }
}

/**
 * Verificar si el usuario está en flujo de pago
 */
export function estaEnFlujoPago(usuario) {
  return usuario.contexto && usuario.contexto.startsWith('upgrade_');
}

/**
 * Limpiar flujo de pago
 */
export function limpiarFlujoPago(usuario) {
  usuario.contexto = null;
  delete usuario.pagoEnProceso;
}
