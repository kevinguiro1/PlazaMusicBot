// core/payments.js - Sistema de Pagos OXXO/SPEI
import axios from 'axios';
import crypto from 'crypto';
import { log } from '../utils/logger.js';
import { promoverUsuario, PERFILES } from './profiles.js';

// Configuración de pagos (en producción esto vendría de variables de entorno)
const CONEKTA_API_KEY = process.env.CONEKTA_API_KEY || '';
const CONEKTA_API_VERSION = '2.0.0';

// Almacén de pagos pendientes
const pagosPendientes = new Map(); // referencia -> { usuario, monto, tipo, timestamp }

/**
 * Generar referencia de pago OXXO
 * @param {Object} usuario - Usuario que solicita el pago
 * @param {string} perfil - Perfil a adquirir (premium, vip)
 * @returns {Object} - Datos de la referencia de pago
 */
export async function generarPagoOXXO(usuario, perfil) {
  try {
    const monto = obtenerMontoPerfil(perfil);

    // Generar referencia única
    const referencia = generarReferencia();

    // En producción, aquí se haría la llamada a Conekta API
    // Por ahora, simulamos la generación
    const datosPago = {
      tipo: 'OXXO',
      referencia: referencia,
      monto: monto,
      perfil: perfil,
      usuario: {
        numero: usuario.numero,
        nombre: usuario.nombre
      },
      instrucciones: [
        '1. Acude a cualquier tienda OXXO',
        '2. Indica que deseas hacer un pago de servicio',
        `3. Proporciona la referencia: ${referencia}`,
        `4. Realiza el pago de $${monto} MXN`,
        '5. Guarda tu comprobante',
        '6. Envía foto del comprobante al bot'
      ],
      codigoBarras: generarCodigoBarras(referencia),
      expiracion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      createdAt: new Date().toISOString()
    };

    // Guardar pago pendiente
    pagosPendientes.set(referencia, {
      usuario: usuario.numero,
      monto: monto,
      perfil: perfil,
      tipo: 'OXXO',
      timestamp: Date.now(),
      estado: 'pendiente'
    });

    log(`💰 Pago OXXO generado: ${referencia} para ${usuario.nombre} (${perfil})`, 'info');

    return datosPago;
  } catch (error) {
    log(`❌ Error generando pago OXXO: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Generar referencia de pago SPEI
 * @param {Object} usuario - Usuario que solicita el pago
 * @param {string} perfil - Perfil a adquirir (premium, vip)
 * @returns {Object} - Datos de la transferencia SPEI
 */
export async function generarPagoSPEI(usuario, perfil) {
  try {
    const monto = obtenerMontoPerfil(perfil);

    // Generar CLABE interbancaria única (18 dígitos)
    const clabe = generarCLABE();
    const referencia = generarReferencia();

    // En producción, aquí se haría la llamada a Conekta API
    const datosPago = {
      tipo: 'SPEI',
      referencia: referencia,
      clabe: clabe,
      banco: 'STP',
      beneficiario: 'MÚSICA PLAZA S.A. DE C.V.',
      monto: monto,
      perfil: perfil,
      usuario: {
        numero: usuario.numero,
        nombre: usuario.nombre
      },
      instrucciones: [
        '1. Ingresa a tu banca en línea o app',
        '2. Selecciona transferencia SPEI',
        `3. CLABE: ${clabe}`,
        `4. Beneficiario: MÚSICA PLAZA S.A. DE C.V.`,
        `5. Monto: $${monto} MXN`,
        `6. Concepto: ${referencia}`,
        '7. Guarda tu comprobante',
        '8. Envía foto del comprobante al bot'
      ],
      expiracion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    // Guardar pago pendiente
    pagosPendientes.set(referencia, {
      usuario: usuario.numero,
      monto: monto,
      perfil: perfil,
      tipo: 'SPEI',
      clabe: clabe,
      timestamp: Date.now(),
      estado: 'pendiente'
    });

    log(`💰 Pago SPEI generado: ${referencia} para ${usuario.nombre} (${perfil})`, 'info');

    return datosPago;
  } catch (error) {
    log(`❌ Error generando pago SPEI: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Registrar comprobante de pago
 * @param {string} numero - Número del usuario
 * @param {string} imagePath - Ruta de la imagen del comprobante
 * @param {string} referencia - Referencia del pago (opcional)
 * @returns {Object} - Información del registro
 */
export function registrarComprobante(numero, imagePath, referencia = null) {
  try {
    // Buscar el pago más reciente del usuario si no se proporciona referencia
    let pagoPendiente = null;

    if (referencia) {
      pagoPendiente = pagosPendientes.get(referencia);
    } else {
      // Buscar último pago del usuario
      for (const [ref, pago] of pagosPendientes.entries()) {
        if (pago.usuario === numero && pago.estado === 'pendiente') {
          pagoPendiente = pago;
          pagoPendiente.referencia = ref;
          break;
        }
      }
    }

    if (!pagoPendiente) {
      return {
        exito: false,
        mensaje: 'No se encontró un pago pendiente para este usuario.'
      };
    }

    // Actualizar estado
    pagoPendiente.estado = 'comprobante_enviado';
    pagoPendiente.comprobante = imagePath;
    pagoPendiente.fechaComprobante = new Date().toISOString();

    log(`📄 Comprobante registrado para ${numero}: ${pagoPendiente.referencia}`, 'info');

    return {
      exito: true,
      mensaje: `✅ Comprobante recibido.\n\n` +
               `Tu pago está en revisión.\n` +
               `Te notificaremos cuando sea aprobado.`,
      referencia: pagoPendiente.referencia,
      pago: pagoPendiente
    };
  } catch (error) {
    log(`❌ Error registrando comprobante: ${error.message}`, 'error');
    return {
      exito: false,
      mensaje: 'Error procesando el comprobante.'
    };
  }
}

/**
 * Aprobar pago y actualizar perfil del usuario
 * @param {string} referencia - Referencia del pago
 * @param {Object} usuario - Usuario a actualizar
 * @returns {Object} - Resultado de la aprobación
 */
export function aprobarPago(referencia, usuario) {
  try {
    const pago = pagosPendientes.get(referencia);

    if (!pago) {
      return {
        exito: false,
        mensaje: 'Pago no encontrado.'
      };
    }

    if (pago.estado === 'aprobado') {
      return {
        exito: false,
        mensaje: 'Este pago ya fue aprobado anteriormente.'
      };
    }

    // Actualizar perfil del usuario
    const perfilAnterior = usuario.perfil;
    promoverUsuario(usuario, pago.perfil);

    // Marcar pago como aprobado
    pago.estado = 'aprobado';
    pago.fechaAprobacion = new Date().toISOString();

    log(`✅ Pago aprobado: ${referencia} - ${usuario.nombre} (${perfilAnterior} → ${pago.perfil})`, 'success');

    return {
      exito: true,
      mensaje: `✅ Pago aprobado.\n\n` +
               `Usuario actualizado:\n` +
               `${perfilAnterior} → ${pago.perfil}`,
      usuario: usuario,
      pago: pago
    };
  } catch (error) {
    log(`❌ Error aprobando pago: ${error.message}`, 'error');
    return {
      exito: false,
      mensaje: 'Error aprobando el pago.'
    };
  }
}

/**
 * Rechazar pago
 * @param {string} referencia - Referencia del pago
 * @param {string} razon - Razón del rechazo
 * @returns {Object} - Resultado del rechazo
 */
export function rechazarPago(referencia, razon = 'No especificada') {
  try {
    const pago = pagosPendientes.get(referencia);

    if (!pago) {
      return {
        exito: false,
        mensaje: 'Pago no encontrado.'
      };
    }

    // Marcar pago como rechazado
    pago.estado = 'rechazado';
    pago.razonRechazo = razon;
    pago.fechaRechazo = new Date().toISOString();

    log(`❌ Pago rechazado: ${referencia} - Razón: ${razon}`, 'warn');

    return {
      exito: true,
      mensaje: `❌ Pago rechazado.\n\nRazón: ${razon}`,
      pago: pago
    };
  } catch (error) {
    log(`❌ Error rechazando pago: ${error.message}`, 'error');
    return {
      exito: false,
      mensaje: 'Error rechazando el pago.'
    };
  }
}

/**
 * Obtener pagos pendientes de aprobación
 * @returns {Array} - Lista de pagos pendientes
 */
export function obtenerPagosPendientes() {
  const pendientes = [];

  for (const [referencia, pago] of pagosPendientes.entries()) {
    if (pago.estado === 'comprobante_enviado') {
      pendientes.push({
        referencia,
        ...pago
      });
    }
  }

  return pendientes.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Obtener todos los pagos
 * @returns {Array} - Lista de todos los pagos
 */
export function obtenerTodosPagos() {
  const pagos = [];

  for (const [referencia, pago] of pagosPendientes.entries()) {
    pagos.push({
      referencia,
      ...pago
    });
  }

  return pagos.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Obtener pagos de un usuario
 * @param {string} numero - Número del usuario
 * @returns {Array} - Lista de pagos del usuario
 */
export function obtenerPagosUsuario(numero) {
  const pagos = [];

  for (const [referencia, pago] of pagosPendientes.entries()) {
    if (pago.usuario === numero) {
      pagos.push({
        referencia,
        ...pago
      });
    }
  }

  return pagos.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Obtener monto según el perfil
 * @param {string} perfil - Perfil a adquirir
 * @returns {number} - Monto en pesos mexicanos
 */
function obtenerMontoPerfil(perfil) {
  const montos = {
    [PERFILES.PREMIUM]: 10,
    [PERFILES.VIP]: 100
  };

  return montos[perfil] || 0;
}

/**
 * Generar referencia única
 * @returns {string} - Referencia alfanumérica
 */
function generarReferencia() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `MP${timestamp}${random}`.toUpperCase();
}

/**
 * Generar código de barras (simulado)
 * @param {string} referencia - Referencia del pago
 * @returns {string} - Código de barras
 */
function generarCodigoBarras(referencia) {
  // En producción, esto generaría un código real
  const hash = crypto.createHash('sha256').update(referencia).digest('hex');
  return hash.substring(0, 13); // 13 dígitos para EAN-13
}

/**
 * Generar CLABE interbancaria (simulada)
 * @returns {string} - CLABE de 18 dígitos
 */
function generarCLABE() {
  // En producción, esto vendría de la API del banco
  const banco = '646'; // STP
  const plaza = '180'; // Ciudad de México
  const cuenta = crypto.randomBytes(6).readUIntBE(0, 6).toString().padStart(11, '0');
  const clabe = banco + plaza + cuenta;

  // Agregar dígito verificador (simplificado)
  const digitoVerificador = calcularDigitoVerificador(clabe);

  return clabe + digitoVerificador;
}

/**
 * Calcular dígito verificador de CLABE (simplificado)
 * @param {string} clabe17 - CLABE sin dígito verificador
 * @returns {string} - Dígito verificador
 */
function calcularDigitoVerificador(clabe17) {
  // Algoritmo simplificado (en producción usar el algoritmo oficial)
  const suma = clabe17.split('').reduce((acc, digit, index) => {
    const peso = (index % 3) + 1;
    return acc + (parseInt(digit) * peso);
  }, 0);

  return ((10 - (suma % 10)) % 10).toString();
}

/**
 * Limpiar pagos expirados (más de 48 horas)
 */
export function limpiarPagosExpirados() {
  const ahora = Date.now();
  const EXPIRACION = 48 * 60 * 60 * 1000; // 48 horas

  let eliminados = 0;

  for (const [referencia, pago] of pagosPendientes.entries()) {
    if (pago.estado === 'pendiente' && ahora - pago.timestamp > EXPIRACION) {
      pagosPendientes.delete(referencia);
      eliminados++;
    }
  }

  if (eliminados > 0) {
    log(`🧹 Pagos expirados eliminados: ${eliminados}`, 'info');
  }

  return eliminados;
}

// Limpiar pagos expirados cada 6 horas
setInterval(limpiarPagosExpirados, 6 * 60 * 60 * 1000);

/**
 * Exportar datos de pagos para persistencia
 * @returns {Array} - Datos de pagos
 */
export function exportarDatosPagos() {
  return Array.from(pagosPendientes.entries()).map(([referencia, pago]) => ({
    referencia,
    ...pago
  }));
}

/**
 * Importar datos de pagos desde persistencia
 * @param {Array} datos - Datos de pagos
 */
export function importarDatosPagos(datos) {
  if (!Array.isArray(datos)) return;

  datos.forEach(item => {
    const { referencia, ...pago } = item;
    if (referencia && pago) {
      pagosPendientes.set(referencia, pago);
    }
  });

  log(`📥 Pagos importados: ${datos.length}`, 'info');
}
