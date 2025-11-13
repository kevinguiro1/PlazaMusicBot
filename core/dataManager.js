// core/dataManager.js - Gestor de Datos Persistentes
import fs from 'fs/promises';
import path from 'path';
import { log } from '../utils/logger.js';

const DATA_DIR = path.join(process.cwd(), 'datos');

/**
 * Cargar todos los datos del sistema
 */
export async function cargarDatos() {
  try {
    // Asegurar que existe el directorio de datos
    await fs.mkdir(DATA_DIR, { recursive: true });

    const usuarios = await cargarJSON('usuarios.json', {});
    const bloqueados = await cargarJSON('bloqueados.json', {});
    const solicitudes = await cargarJSON('solicitudes.json', {});
    const estadisticas = await cargarJSON('estadisticas.json', {
      totalUsuarios: 0,
      totalCanciones: 0,
      cancionesPorDia: {},
      artistasMasPedidos: {},
      cancionesMasPedidas: {}
    });

    log('✅ Datos cargados exitosamente', 'info');

    return {
      usuarios,
      bloqueados,
      solicitudes,
      estadisticas,
      bots: {}
    };
  } catch (error) {
    log(`❌ Error cargando datos: ${error.message}`, 'error');
    return {
      usuarios: {},
      bloqueados: {},
      solicitudes: {},
      estadisticas: {
        totalUsuarios: 0,
        totalCanciones: 0,
        cancionesPorDia: {},
        artistasMasPedidos: {},
        cancionesMasPedidas: {}
      },
      bots: {}
    };
  }
}

/**
 * Guardar todos los datos del sistema
 */
export async function guardarDatos(estado) {
  try {
    await guardarJSON('usuarios.json', estado.usuarios);
    await guardarJSON('bloqueados.json', estado.bloqueados);
    await guardarJSON('solicitudes.json', estado.solicitudes);
    await guardarJSON('estadisticas.json', estado.estadisticas);

    log('💾 Datos guardados exitosamente', 'debug');
  } catch (error) {
    log(`❌ Error guardando datos: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Cargar archivo JSON
 */
async function cargarJSON(archivo, valorPorDefecto = {}) {
  const rutaArchivo = path.join(DATA_DIR, archivo);

  try {
    const contenido = await fs.readFile(rutaArchivo, 'utf-8');
    return JSON.parse(contenido);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Archivo no existe, crear con valor por defecto
      await guardarJSON(archivo, valorPorDefecto);
      return valorPorDefecto;
    }
    throw error;
  }
}

/**
 * Guardar archivo JSON
 */
async function guardarJSON(archivo, datos) {
  const rutaArchivo = path.join(DATA_DIR, archivo);

  try {
    await fs.writeFile(
      rutaArchivo,
      JSON.stringify(datos, null, 2),
      'utf-8'
    );
  } catch (error) {
    log(`❌ Error guardando ${archivo}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Hacer backup de datos
 */
export async function hacerBackup() {
  try {
    const fecha = new Date().toISOString().split('T')[0];
    const backupDir = path.join(DATA_DIR, 'backups', fecha);

    await fs.mkdir(backupDir, { recursive: true });

    const archivos = ['usuarios.json', 'bloqueados.json', 'solicitudes.json', 'estadisticas.json'];

    for (const archivo of archivos) {
      const origen = path.join(DATA_DIR, archivo);
      const destino = path.join(backupDir, archivo);

      try {
        await fs.copyFile(origen, destino);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    log(`✅ Backup creado en ${backupDir}`, 'info');
    return backupDir;
  } catch (error) {
    log(`❌ Error creando backup: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Limpiar datos antiguos
 */
export async function limpiarDatosAntiguos(diasAntiguedad = 90) {
  try {
    const estado = await cargarDatos();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    let usuariosEliminados = 0;

    // Eliminar usuarios inactivos
    for (const [numero, usuario] of Object.entries(estado.usuarios)) {
      const ultimaActividad = new Date(usuario.ultimaActividad);

      if (ultimaActividad < fechaLimite) {
        delete estado.usuarios[numero];
        usuariosEliminados++;
      }
    }

    await guardarDatos(estado);

    log(`🧹 Limpieza completada: ${usuariosEliminados} usuarios eliminados`, 'info');

    return {
      usuariosEliminados
    };
  } catch (error) {
    log(`❌ Error en limpieza de datos: ${error.message}`, 'error');
    throw error;
  }
}
