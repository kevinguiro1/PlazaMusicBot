// utils/filtroLenguaje.js

const palabrasProhibidas = [
  'puto', 'puta', 'pendejo', 'mierda', 'culo', 'chingar',
  'pinche', 'verga', 'fuck', 'shit', 'bitch', 'cabrón',
  'cabrone', 'maricon', 'maricón', 'joder', 'idiota',
  'imbécil', 'pito', 'pene', 'sexo', 'narco', 'narcotraficante',
  'violencia'
];

export function filtroLenguaje(texto) {
  const textoLower = texto.toLowerCase();
  return palabrasProhibidas.some(palabra => textoLower.includes(palabra));
}
