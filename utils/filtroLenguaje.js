// utils/filtroLenguaje.js - Filtro de Lenguaje Ofensivo
const palabrasProhibidas = [
  'puto', 'puta', 'pendejo', 'mierda', 'culo', 'chingar',
  'pinche', 'verga', 'fuck', 'shit', 'bitch', 'cabrón',
  'cabrone', 'maricon', 'maricón', 'joder', 'idiota',
  'imbécil', 'pito', 'pene', 'sexo', 'narco', 'narcotraficante',
  'violencia', 'matar', 'morir', 'muerte', 'droga', 'cocaina',
  'cristal', 'heroina', 'cartel', 'sicario'
];

/**
 * Verificar si un texto contiene lenguaje ofensivo
 */
export function filtroLenguaje(texto) {
  if (!texto || typeof texto !== 'string') {
    return false;
  }

  const textoLower = texto.toLowerCase();

  return palabrasProhibidas.some(palabra => textoLower.includes(palabra));
}

/**
 * Filtrar palabras ofensivas de un texto
 */
export function censurarTexto(texto) {
  if (!texto || typeof texto !== 'string') {
    return texto;
  }

  let textoCensurado = texto;

  for (const palabra of palabrasProhibidas) {
    const regex = new RegExp(palabra, 'gi');
    textoCensurado = textoCensurado.replace(regex, '*'.repeat(palabra.length));
  }

  return textoCensurado;
}
