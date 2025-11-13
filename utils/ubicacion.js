// utils/ubicacion.js - Verificación de Ubicación
import { log } from './logger.js';

// Coordenadas de la plaza (desde .env)
const PLAZA_LAT = parseFloat(process.env.PLAZA_LAT) || 23.2494;
const PLAZA_LON = parseFloat(process.env.PLAZA_LON) || -106.4111;
const PLAZA_RADIUS_KM = parseFloat(process.env.PLAZA_RADIUS_KM) || 0.5;

/**
 * Verificar si una ubicación está dentro del rango de la plaza
 */
export function verificarUbicacion(ubicacion) {
  if (!ubicacion || !ubicacion.latitude || !ubicacion.longitude) {
    log('⚠️ Ubicación inválida recibida', 'warn');
    return false;
  }

  const distancia = calcularDistancia(
    PLAZA_LAT,
    PLAZA_LON,
    ubicacion.latitude,
    ubicacion.longitude
  );

  const esValida = distancia <= PLAZA_RADIUS_KM;

  log(
    `📍 Verificación de ubicación: ${distancia.toFixed(3)}km - ${esValida ? 'ACEPTADA' : 'RECHAZADA'}`,
    esValida ? 'debug' : 'warn'
  );

  return esValida;
}

/**
 * Calcular distancia entre dos coordenadas (fórmula de Haversine)
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = gradosARadianes(lat2 - lat1);
  const dLon = gradosARadianes(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(gradosARadianes(lat1)) *
      Math.cos(gradosARadianes(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;

  return distancia;
}

/**
 * Convertir grados a radianes
 */
function gradosARadianes(grados) {
  return grados * (Math.PI / 180);
}

/**
 * Obtener información de la plaza configurada
 */
export function obtenerInfoPlaza() {
  return {
    latitud: PLAZA_LAT,
    longitud: PLAZA_LON,
    radioKm: PLAZA_RADIUS_KM
  };
}
