// utils/ubicacion.js
export default function verificarUbicacion(lat, long) {
  // Coordenadas del centro de plaza (ejemplo)
  const latPlaza = 25.4200;
  const longPlaza = -101.0000;
  const radioMetros = 200;

  function toRad(x) {
    return x * Math.PI / 180;
  }

  const R = 6378137; // radio Tierra en metros
  const dLat = toRad(lat - latPlaza);
  const dLong = toRad(long - longPlaza);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(latPlaza)) * Math.cos(toRad(lat)) *
            Math.sin(dLong/2) * Math.sin(dLong/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;

  return d <= radioMetros;
}
