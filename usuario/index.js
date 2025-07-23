// usuario/index.js
import { filtroLenguaje } from '../utils/filtroLenguaje.js';

export async function manejarUsuario({
  mensaje,
  numero,
  usuarios,
  bloqueados,
  agregarCancionAPlaylist,
  buscarCancionEnSpotify,
  obtenerCancionesFiltradas,
  sugerirCancionesSimilares,
  LIMITE_CANCIONES
}) {
  if (!usuarios[numero]) {
    usuarios[numero] = {
      nombre: 'Usuario',
      premium: false,
      vip: false,
      cancionesPedidas: 0,
      agregadasHoy: [],
      ultimaSugerencia: null,
    };
  }

  const usuario = usuarios[numero];
  const texto = mensaje.trim();

  // Filtro lenguaje ofensivo
  if (filtroLenguaje(texto)) {
    bloqueados[numero] = true;
    return `?? ${usuario.nombre}, has sido bloqueado por usar lenguaje inapropiado.`;
  }

  // Límite de canciones para usuarios normales
  if (!usuario.premium && usuario.cancionesPedidas >= LIMITE_CANCIONES) {
    return `?? ${usuario.nombre}, ya pediste tu límite de canciones gratis hoy. ¡Vuelve mañana para más!`;
  }

  // Si usuario está respondiendo a menú de sugerencias
  if (usuario.ultimaSugerencia) {
    const match = texto.match(/^(\d{1,2})$/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx === 10) {
        // Repetir menú
        let msg = `?? ${usuario.nombre}, aquí está de nuevo el menú:\n\n`;
        usuario.ultimaSugerencia.titles.forEach((t, i) => {
          msg += `${i + 1}. ${t}\n`;
        });
        msg += `\n11. Ver menú anterior`;
        return msg;
      }
      if (idx >= 0 && idx < usuario.ultimaSugerencia.uris.length) {
        const uri = usuario.ultimaSugerencia.uris[idx];
        const name = usuario.ultimaSugerencia.titles[idx];
        if (usuario.agregadasHoy.includes(uri)) {
          return `?? ${usuario.nombre}, “${name}” ya fue agregada hoy. Pide otra o vuelve mañana para esta canción.`;
        }
        await agregarCancionAPlaylist(uri);
        usuario.cancionesPedidas++;
        usuario.agregadasHoy.push(uri);
        usuario.ultimaSugerencia = null;
        return `? ${usuario.nombre}, agregada: *${name}* ??`;
      }
      return `? Opción no válida. Responde con un número del 1 al 11.`;
    }
  }

  // Buscar canción en Spotify
  const resultados = await buscarCancionEnSpotify(texto);
  const filtradas = await obtenerCancionesFiltradas(resultados);

  if (filtradas.length === 0) {
    const raw = await sugerirCancionesSimilares(texto);
    const sugeridas = await obtenerCancionesFiltradas(raw);
    if (sugeridas.length === 0) {
      return `? Lo siento ${usuario.nombre}, no encontré nada apropiado.`;
    }
    const opciones = sugeridas.slice(0, 10);
    const titles = opciones.map(c => `${c.name} – ${c.artists[0].name}`);
    const uris = opciones.map(c => c.uri);
    usuario.ultimaSugerencia = { titles, uris };
    let msg = `?? ${usuario.nombre}, no encontré esa canción exacta, pero prueba alguna de estas:\n\n`;
    titles.forEach((t, i) => (msg += `${i + 1}. ${t}\n`));
    msg += `11. Ver menú anterior\n\nResponde con el número (1–11) para seleccionar.`;
    return msg;
  }

  const opciones = filtradas.slice(0, 10);
  const titles = opciones.map(c => `${c.name} – ${c.artists[0].name}`);
  const uris = opciones.map(c => c.uri);
  usuario.ultimaSugerencia = { titles, uris };
  let respuesta = `?? ${usuario.nombre}, encontré estas opciones:\n\n`;
  titles.forEach((t, i) => (respuesta += `${i + 1}. ${t}\n`));
  respuesta += `11. Ver menú anterior\n\nResponde con el número (1–11) para agregarla a la playlist.`;
  return respuesta;
}
