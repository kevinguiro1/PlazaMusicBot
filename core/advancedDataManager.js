// core/advancedDataManager.js - Sistema Avanzado de Persistencia de Datos
import fs from 'fs/promises';
import path from 'path';
import { log } from '../utils/advancedLogger.js';

// Determinar directorio raíz de datos
const DATA_ROOT = process.env.DATA_ROOT || '/opt/plazamusic/data';

// Estructura de directorios
const DIRS = {
  users: path.join(DATA_ROOT, 'users'),
  payments: path.join(DATA_ROOT, 'payments'),
  music: path.join(DATA_ROOT, 'music'),
  logs: path.join(DATA_ROOT, 'logs'),
  geo: path.join(DATA_ROOT, 'geo'),
  configs: path.join(DATA_ROOT, 'configs'),
  bots: path.join(DATA_ROOT, 'bots'),
  spotify: path.join(DATA_ROOT, 'spotify'),
  backups: path.join(DATA_ROOT, 'backups')
};

/**
 * Asegurar que existe la estructura de directorios
 */
async function asegurarEstructura() {
  try {
    // Crear directorios principales
    for (const dir of Object.values(DIRS)) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Subdirectorios específicos
    await fs.mkdir(path.join(DIRS.users, 'perfiles'), { recursive: true });
    await fs.mkdir(path.join(DIRS.users, 'ubicaciones'), { recursive: true });
    await fs.mkdir(path.join(DIRS.users, 'historial-canciones'), { recursive: true });
    await fs.mkdir(path.join(DIRS.users, 'bloqueados'), { recursive: true });
    await fs.mkdir(path.join(DIRS.users, 'infracciones'), { recursive: true });

    await fs.mkdir(path.join(DIRS.payments, 'premium'), { recursive: true });
    await fs.mkdir(path.join(DIRS.payments, 'vip'), { recursive: true });
    await fs.mkdir(path.join(DIRS.payments, 'historial'), { recursive: true });
    await fs.mkdir(path.join(DIRS.payments, 'comprobantes', 'pendientes'), { recursive: true });
    await fs.mkdir(path.join(DIRS.payments, 'comprobantes', 'aprobados'), { recursive: true });
    await fs.mkdir(path.join(DIRS.payments, 'comprobantes', 'rechazados'), { recursive: true });

    await fs.mkdir(path.join(DIRS.music, 'cola'), { recursive: true });
    await fs.mkdir(path.join(DIRS.music, 'historial'), { recursive: true });
    await fs.mkdir(path.join(DIRS.music, 'bloqueos'), { recursive: true });

    await fs.mkdir(path.join(DIRS.geo, 'ubicaciones'), { recursive: true });
    await fs.mkdir(path.join(DIRS.geo, 'geocercas'), { recursive: true });
    await fs.mkdir(path.join(DIRS.geo, 'historico'), { recursive: true });

    await fs.mkdir(path.join(DIRS.spotify, 'tokens'), { recursive: true });
    await fs.mkdir(path.join(DIRS.spotify, 'playlists'), { recursive: true });

    log('✅ Estructura de directorios verificada', 'debug');
  } catch (error) {
    log(`❌ Error creando estructura: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Cargar archivo JSON de forma segura
 */
async function cargarJSON(filePath, defaultValue = null) {
  try {
    const contenido = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(contenido);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Archivo no existe
      if (defaultValue !== null) {
        await guardarJSON(filePath, defaultValue);
        return defaultValue;
      }
      return null;
    }
    log(`❌ Error cargando ${filePath}: ${error.message}`, 'error');
    return defaultValue;
  }
}

/**
 * Guardar archivo JSON de forma segura
 */
async function guardarJSON(filePath, datos) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(
      filePath,
      JSON.stringify(datos, null, 2),
      'utf-8'
    );
    return true;
  } catch (error) {
    log(`❌ Error guardando ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * USUARIOS
 * ═══════════════════════════════════════════════════════════════
 */

export async function cargarUsuarios() {
  const filePath = path.join(DIRS.users, 'perfiles', 'usuarios.json');
  return await cargarJSON(filePath, {});
}

export async function guardarUsuarios(usuarios) {
  const filePath = path.join(DIRS.users, 'perfiles', 'usuarios.json');
  return await guardarJSON(filePath, usuarios);
}

export async function cargarBloqueados() {
  const filePath = path.join(DIRS.users, 'bloqueados', 'bloqueados.json');
  return await cargarJSON(filePath, {});
}

export async function guardarBloqueados(bloqueados) {
  const filePath = path.join(DIRS.users, 'bloqueados', 'bloqueados.json');
  return await guardarJSON(filePath, bloqueados);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * UBICACIONES
 * ═══════════════════════════════════════════════════════════════
 */

export async function registrarUbicacion(numero, ubicacion, distancia, esValida) {
  const registro = {
    timestamp: new Date().toISOString(),
    numero: numero,
    lat: ubicacion.latitude || ubicacion.lat,
    lon: ubicacion.longitude || ubicacion.lon,
    distancia: distancia,
    zona_valida: esValida
  };

  // Cargar historial existente
  const filePath = path.join(DIRS.geo, 'ubicaciones', `${numero}.json`);
  const historial = await cargarJSON(filePath, []);

  // Agregar nueva ubicación
  historial.push(registro);

  // Mantener solo últimas 100 ubicaciones
  if (historial.length > 100) {
    historial.shift();
  }

  // Guardar
  return await guardarJSON(filePath, historial);
}

export async function obtenerHistorialUbicaciones(numero, limite = 50) {
  const filePath = path.join(DIRS.geo, 'ubicaciones', `${numero}.json`);
  const historial = await cargarJSON(filePath, []);
  return historial.slice(-limite);
}

export async function cargarGeocercas() {
  const filePath = path.join(DIRS.geo, 'geocercas', 'geocercas.json');
  return await cargarJSON(filePath, {
    plaza: {
      nombre: 'Plaza Principal',
      lat: 23.2494,
      lon: -106.4111,
      radio_metros: 500
    }
  });
}

export async function guardarGeocercas(geocercas) {
  const filePath = path.join(DIRS.geo, 'geocercas', 'geocercas.json');
  return await guardarJSON(filePath, geocercas);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HISTORIAL DE CANCIONES (Por Usuario)
 * ═══════════════════════════════════════════════════════════════
 */

export async function registrarCancionUsuario(numero, cancion, perfil) {
  const registro = {
    timestamp: new Date().toISOString(),
    uri: cancion.uri,
    nombre: cancion.name,
    artistas: cancion.artists.map(a => a.name).join(', '),
    perfil: perfil
  };

  const filePath = path.join(DIRS.users, 'historial-canciones', `${numero}.json`);
  const historial = await cargarJSON(filePath, []);

  historial.push(registro);

  // Mantener solo últimas 500 canciones por usuario
  if (historial.length > 500) {
    historial.shift();
  }

  return await guardarJSON(filePath, historial);
}

export async function obtenerHistorialCanciones(numero, limite = 100) {
  const filePath = path.join(DIRS.users, 'historial-canciones', `${numero}.json`);
  const historial = await cargarJSON(filePath, []);
  return historial.slice(-limite);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HISTORIAL GLOBAL DE CANCIONES (Anti-repetición 1 hora)
 * ═══════════════════════════════════════════════════════════════
 */

export async function cargarHistorialGlobal() {
  const filePath = path.join(DIRS.music, 'historial', 'global.json');
  return await cargarJSON(filePath, []);
}

export async function guardarHistorialGlobal(historial) {
  const filePath = path.join(DIRS.music, 'historial', 'global.json');
  return await guardarJSON(filePath, historial);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * PAGOS
 * ═══════════════════════════════════════════════════════════════
 */

export async function cargarSolicitudes() {
  const filePath = path.join(DIRS.payments, 'historial', 'solicitudes.json');
  return await cargarJSON(filePath, {});
}

export async function guardarSolicitudes(solicitudes) {
  const filePath = path.join(DIRS.payments, 'historial', 'solicitudes.json');
  return await guardarJSON(filePath, solicitudes);
}

export async function guardarComprobante(numero, tipo, buffer, extension = 'jpg') {
  const timestamp = Date.now();
  const nombreArchivo = `${numero}_${timestamp}.${extension}`;
  const filePath = path.join(DIRS.payments, 'comprobantes', 'pendientes', nombreArchivo);

  try {
    await fs.writeFile(filePath, buffer);
    log(`💾 Comprobante guardado: ${nombreArchivo}`, 'info');
    return {
      success: true,
      path: filePath,
      filename: nombreArchivo
    };
  } catch (error) {
    log(`❌ Error guardando comprobante: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

export async function moverComprobante(filename, estado) {
  const origen = path.join(DIRS.payments, 'comprobantes', 'pendientes', filename);
  const destino = path.join(DIRS.payments, 'comprobantes', estado, filename);

  try {
    await fs.rename(origen, destino);
    return true;
  } catch (error) {
    log(`❌ Error moviendo comprobante: ${error.message}`, 'error');
    return false;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * INFRACCIONES DE SEGURIDAD
 * ═══════════════════════════════════════════════════════════════
 */

export async function registrarInfraccion(numero, tipo, detalles) {
  const infraccion = {
    timestamp: new Date().toISOString(),
    numero: numero,
    tipo: tipo,
    detalles: detalles
  };

  const filePath = path.join(DIRS.users, 'infracciones', `${numero}.json`);
  const infracciones = await cargarJSON(filePath, []);

  infracciones.push(infraccion);

  // Mantener solo últimas 100 infracciones
  if (infracciones.length > 100) {
    infracciones.shift();
  }

  return await guardarJSON(filePath, infracciones);
}

export async function obtenerInfracciones(numero) {
  const filePath = path.join(DIRS.users, 'infracciones', `${numero}.json`);
  return await cargarJSON(filePath, []);
}

export async function contarInfraccionesRecientes(numero, horasAtras = 24) {
  const infracciones = await obtenerInfracciones(numero);
  const fechaLimite = new Date();
  fechaLimite.setHours(fechaLimite.getHours() - horasAtras);

  return infracciones.filter(inf => new Date(inf.timestamp) > fechaLimite).length;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * ESTADÍSTICAS
 * ═══════════════════════════════════════════════════════════════
 */

export async function cargarEstadisticas() {
  const filePath = path.join(DIRS.configs, 'estadisticas.json');
  return await cargarJSON(filePath, {
    totalUsuarios: 0,
    totalCanciones: 0,
    cancionesPorDia: {},
    artistasMasPedidos: {},
    cancionesMasPedidas: {},
    pagosPremium: 0,
    pagosVIP: 0,
    ingresosTotales: 0
  });
}

export async function guardarEstadisticas(estadisticas) {
  const filePath = path.join(DIRS.configs, 'estadisticas.json');
  return await guardarJSON(filePath, estadisticas);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * SPOTIFY
 * ═══════════════════════════════════════════════════════════════
 */

export async function cargarTokensSpotify() {
  const filePath = path.join(DIRS.spotify, 'tokens', 'active.json');
  return await cargarJSON(filePath, null);
}

export async function guardarTokensSpotify(tokens) {
  const filePath = path.join(DIRS.spotify, 'tokens', 'active.json');
  return await guardarJSON(filePath, tokens);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * CONFIGURACIÓN
 * ═══════════════════════════════════════════════════════════════
 */

export async function cargarConfiguracion() {
  const filePath = path.join(DIRS.configs, 'settings.json');
  return await cargarJSON(filePath, {
    sistema: {
      version: '1.0.0',
      nombre: 'PlazaMusicBot',
      modo: 'produccion'
    },
    limites: {
      normal: 3,
      premium: 10,
      vip: 999
    },
    precios: {
      premium: 10,
      vip: 100
    }
  });
}

export async function guardarConfiguracion(config) {
  const filePath = path.join(DIRS.configs, 'settings.json');
  return await guardarJSON(filePath, config);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * BACKUP
 * ═══════════════════════════════════════════════════════════════
 */

export async function hacerBackupCompleto() {
  try {
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toISOString().split('T')[1].split(':')[0];
    const backupDir = path.join(DIRS.backups, 'daily', `${fecha}_${hora}h`);

    await fs.mkdir(backupDir, { recursive: true });

    // Copiar todos los archivos importantes
    const archivosClave = [
      { src: path.join(DIRS.users, 'perfiles', 'usuarios.json'), dst: 'usuarios.json' },
      { src: path.join(DIRS.users, 'bloqueados', 'bloqueados.json'), dst: 'bloqueados.json' },
      { src: path.join(DIRS.payments, 'historial', 'solicitudes.json'), dst: 'solicitudes.json' },
      { src: path.join(DIRS.music, 'historial', 'global.json'), dst: 'historial.json' },
      { src: path.join(DIRS.configs, 'estadisticas.json'), dst: 'estadisticas.json' },
      { src: path.join(DIRS.configs, 'settings.json'), dst: 'settings.json' },
      { src: path.join(DIRS.geo, 'geocercas', 'geocercas.json'), dst: 'geocercas.json' }
    ];

    let archivosCopiados = 0;

    for (const { src, dst } of archivosClave) {
      try {
        const destPath = path.join(backupDir, dst);
        await fs.copyFile(src, destPath);
        archivosCopiados++;
      } catch (error) {
        // Archivo puede no existir aún
        continue;
      }
    }

    log(`✅ Backup completo creado: ${archivosCopiados} archivos en ${backupDir}`, 'info');

    return {
      success: true,
      path: backupDir,
      archivos: archivosCopiados
    };
  } catch (error) {
    log(`❌ Error creando backup: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * CARGAR TODO (Inicialización)
 * ═══════════════════════════════════════════════════════════════
 */

export async function cargarDatos() {
  try {
    // Asegurar estructura
    await asegurarEstructura();

    // Cargar todos los datos
    const usuarios = await cargarUsuarios();
    const bloqueados = await cargarBloqueados();
    const solicitudes = await cargarSolicitudes();
    const estadisticas = await cargarEstadisticas();
    const configuracion = await cargarConfiguracion();
    const geocercas = await cargarGeocercas();

    // Importar historial al sistema de anti-repetición
    const historialGlobal = await cargarHistorialGlobal();
    if (historialGlobal && historialGlobal.length > 0) {
      const { importarHistorial } = await import('./history.js');
      importarHistorial(historialGlobal);
    }

    log('✅ Todos los datos cargados exitosamente', 'info');

    return {
      usuarios,
      bloqueados,
      solicitudes,
      estadisticas,
      configuracion,
      geocercas,
      bots: {}
    };
  } catch (error) {
    log(`❌ Error cargando datos: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * GUARDAR TODO
 * ═══════════════════════════════════════════════════════════════
 */

export async function guardarDatos(estado) {
  try {
    await Promise.all([
      guardarUsuarios(estado.usuarios),
      guardarBloqueados(estado.bloqueados),
      guardarSolicitudes(estado.solicitudes),
      guardarEstadisticas(estado.estadisticas)
    ]);

    // Exportar y guardar historial global
    const { exportarHistorial } = await import('./history.js');
    const historial = exportarHistorial();
    await guardarHistorialGlobal(historial);

    // Guardar configuración si existe
    if (estado.configuracion) {
      await guardarConfiguracion(estado.configuracion);
    }

    log('💾 Todos los datos guardados exitosamente', 'debug');
    return true;
  } catch (error) {
    log(`❌ Error guardando datos: ${error.message}`, 'error');
    return false;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXPORTACIONES
 * ═══════════════════════════════════════════════════════════════
 */

export {
  asegurarEstructura,
  cargarJSON,
  guardarJSON,
  DIRS,
  DATA_ROOT
};
