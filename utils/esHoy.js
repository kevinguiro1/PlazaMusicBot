function esHoy(timestamp) {
  const fecha = new Date(timestamp);
  const ahora = new Date();

  return fecha.getDate() === ahora.getDate() &&
         fecha.getMonth() === ahora.getMonth() &&
         fecha.getFullYear() === ahora.getFullYear();
}

module.exports = { esHoy };
