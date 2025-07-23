// administrador/index.js

export async function manejarAdmin({ texto, numero, usuarios, bloqueados, sock }) {
  // Solo admins definidos en .env pueden usar estos comandos

  const comandos = texto.trim().toLowerCase();

  if (comandos.startsWith('/bloquear ')) {
    const numBloq = comandos.split(' ')[1];
    bloqueados[numBloq] = true;
    return `Usuario ${numBloq} bloqueado.`;
  }

  if (comandos.startsWith('/desbloquear ')) {
    const numDesbloq = comandos.split(' ')[1];
    delete bloqueados[numDesbloq];
    return `Usuario ${numDesbloq} desbloqueado.`;
  }

  if (comandos.startsWith('/promover ')) {
    const [_, numProm, rol] = comandos.split(' ');
    if (!usuarios[numProm]) return 'Usuario no encontrado.';
    if (!['free','premium','vip'].includes(rol)) return 'Rol inválido.';
    usuarios[numProm].role = rol;
    return `Usuario ${numProm} promovido a ${rol.toUpperCase()}.`;
  }

  if (comandos === '/ver bloqueados') {
    const lista = Object.keys(bloqueados).join('\n') || 'No hay usuarios bloqueados.';
    return `Usuarios bloqueados:\n${lista}`;
  }

  return null;
}
