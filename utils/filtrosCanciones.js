// utils/filtrosCanciones.js

// Lista negra de términos sensibles (títulos/artistas)
const listaNegra = [
  'narco', 'violencia', 'muerte', 'asesino', 'asesinar',
  'matar', 'sexo', 'porn', 'verga', 'puta', 'puto',
  'culero', 'mierda', 'chingad', 'bélico', 'ak-47',
  'cuerno de chivo', 'narco', 'sinaloa'
];

// Filtra un array de tracks de Spotify
async function obtenerCancionesFiltradas(canciones) {
  return canciones.filter(track => {
    // 1) Quita las explícitas según Spotify
    if (track.explicit) return false;

    // 2) Quita si título o artista contiene palabra negra
    const texto = (track.name + ' ' + track.artists.map(a => a.name).join(' '))
      .toLowerCase();

    for (const palabra of listaNegra) {
      if (texto.includes(palabra)) return false;
    }

    // 3) Pasa todo lo demás
    return true;
  });
}

// Sugerir similares (añade “remix” para ampliar búsqueda)
async function sugerirCancionesSimilares(nombre) {
  const { buscarCancionEnSpotify } = require('../conexion/spotify');
  const resultados = await buscarCancionEnSpotify(nombre + ' remix');
  return obtenerCancionesFiltradas(resultados);
}

module.exports = {
  obtenerCancionesFiltradas,
  sugerirCancionesSimilares
};
