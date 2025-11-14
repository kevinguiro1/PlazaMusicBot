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
 * Manejar flujo de upgrade de perfil
 */
export async function manejarUpgrade(usuario, mensaje, estado) {
  const texto = mensaje.trim();

  // Mostrar menú de upgrade inicial
  if (!usuario.contexto || usuario.contexto === 'upgrade_inicio') {
    usuario.contexto = 'upgrade_seleccionar_perfil';
    return obtenerMenuSeleccionPerfil(usuario);
  }

  // Selección de perfil
  if (usuario.contexto === 'upgrade_seleccionar_perfil') {
    const opcion = parseInt(texto);

    if (opcion === 0 || texto.toLowerCase() === 'cancelar') {
      usuario.contexto = null;
      return `❌ Upgrade cancelado.\n\n` +
             `Escribe "menu" para volver al menú principal.`;
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
      return `❌ Opción inválida.\n\n` +
             obtenerMenuSeleccionPerfil(usuario);
    }

    // Guardar perfil seleccionado
    usuario.pagoEnProceso = {
      perfil: perfilSeleccionado
    };

    usuario.contexto = 'upgrade_metodo_pago';

    return `⭐ *SELECCIONA MÉTODO DE PAGO*\n\n` +
           `Perfil seleccionado: ${perfilSeleccionado.toUpperCase()}\n\n` +
           `1️⃣ Pago en OXXO\n` +
           `2️⃣ Transferencia SPEI\n\n` +
           `0️⃣ Cancelar\n\n` +
           `💡 Escribe el número`;
  }

  // Selección de método de pago
  if (usuario.contexto === 'upgrade_metodo_pago') {
    const opcion = parseInt(texto);

    if (opcion === 0 || texto.toLowerCase() === 'cancelar') {
      usuario.contexto = null;
      delete usuario.pagoEnProceso;
      return `❌ Upgrade cancelado.\n\n` +
             `Escribe "menu" para volver al menú principal.`;
    }

    const perfil = usuario.pagoEnProceso.perfil;

    try {
      if (opcion === 1) {
        // Generar pago OXXO
        const datosPago = await generarPagoOXXO(usuario, perfil);
        usuario.contexto = 'upgrade_esperando_comprobante';
        usuario.pagoEnProceso.referencia = datosPago.referencia;
        usuario.pagoEnProceso.tipo = 'OXXO';

        return formatearPagoOXXO(datosPago);
      } else if (opcion === 2) {
        // Generar pago SPEI
        const datosPago = await generarPagoSPEI(usuario, perfil);
        usuario.contexto = 'upgrade_esperando_comprobante';
        usuario.pagoEnProceso.referencia = datosPago.referencia;
        usuario.pagoEnProceso.tipo = 'SPEI';

        return formatearPagoSPEI(datosPago);
      } else {
        return `❌ Opción inválida.\n\n` +
               `1️⃣ OXXO\n` +
               `2️⃣ SPEI\n` +
               `0️⃣ Cancelar`;
      }
    } catch (error) {
      log(`❌ Error generando pago: ${error.message}`, 'error');
      usuario.contexto = null;
      delete usuario.pagoEnProceso;
      return `❌ Error generando el pago. Por favor intenta nuevamente más tarde.`;
    }
  }

  // Esperando comprobante (este caso se maneja en messageHandler con imágenes)
  if (usuario.contexto === 'upgrade_esperando_comprobante') {
    if (texto.toLowerCase() === 'cancelar' || texto === '0') {
      usuario.contexto = null;
      delete usuario.pagoEnProceso;
      return `❌ Proceso de pago cancelado.\n\n` +
             `Tu referencia de pago sigue siendo válida por 24 horas.\n` +
             `Puedes enviar el comprobante en cualquier momento.`;
    }

    return `⏳ *ESPERANDO COMPROBANTE*\n\n` +
           `Por favor envía una *foto* de tu comprobante de pago.\n\n` +
           `📋 Referencia: ${usuario.pagoEnProceso.referencia}\n` +
           `💳 Método: ${usuario.pagoEnProceso.tipo}\n\n` +
           `💡 O escribe "cancelar" para salir.`;
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
