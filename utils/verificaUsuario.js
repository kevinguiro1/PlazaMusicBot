// Función ejemplo para verificar si usuario existe
function verificaUsuario(usuarios, numero) {
  return usuarios.hasOwnProperty(numero);
}

module.exports = { verificaUsuario };
