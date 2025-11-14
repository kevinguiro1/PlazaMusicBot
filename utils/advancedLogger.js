// utils/advancedLogger.js - Sistema Avanzado de Logging con Persistencia
import fs from 'fs/promises';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Determinar directorio de logs
const DATA_ROOT = process.env.DATA_ROOT || '/opt/plazamusic/data';
const LOGS_DIR = path.join(DATA_ROOT, 'logs');

// Niveles de log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];

/**
 * Logger Avanzado con escritura a archivos
 */
class AdvancedLogger {
  constructor() {
    this.initPromise = this.init();
  }

  async init() {
    try {
      // Asegurar que existen los directorios
      await fs.mkdir(path.join(LOGS_DIR, 'sistema'), { recursive: true });
      await fs.mkdir(path.join(LOGS_DIR, 'errores'), { recursive: true });
      await fs.mkdir(path.join(LOGS_DIR, 'eventos'), { recursive: true });
      await fs.mkdir(path.join(LOGS_DIR, 'ataques'), { recursive: true });
      await fs.mkdir(path.join(LOGS_DIR, 'palabras-prohibidas'), { recursive: true });
    } catch (error) {
      console.error('❌ Error inicializando logger:', error);
    }
  }

  /**
   * Obtener nombre de archivo con rotación diaria
   */
  getLogFileName(categoria) {
    const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${categoria}-${fecha}.log`;
  }

  /**
   * Escribir log a archivo
   */
  async writeToFile(categoria, mensaje) {
    await this.initPromise;

    try {
      const fileName = this.getLogFileName(categoria);
      const filePath = path.join(LOGS_DIR, categoria, fileName);
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${mensaje}\n`;

      await fs.appendFile(filePath, logEntry, 'utf-8');
    } catch (error) {
      console.error('❌ Error escribiendo log:', error);
    }
  }

  /**
   * Log genérico con consola y archivo
   */
  async log(mensaje, nivel = 'info', categoria = 'sistema') {
    const nivelUpper = nivel.toUpperCase();
    const nivelNumerico = LOG_LEVELS[nivelUpper] || LOG_LEVELS.INFO;

    // Filtrar por nivel
    if (nivelNumerico > CURRENT_LOG_LEVEL) {
      return;
    }

    const timestamp = new Date().toISOString();
    let color = colors.white;
    let prefijo = 'INFO';

    switch (nivel) {
      case 'error':
        color = colors.red;
        prefijo = 'ERROR';
        categoria = 'errores';
        break;
      case 'warn':
        color = colors.yellow;
        prefijo = 'WARN';
        break;
      case 'success':
        color = colors.green;
        prefijo = 'SUCCESS';
        break;
      case 'debug':
        color = colors.cyan;
        prefijo = 'DEBUG';
        break;
      case 'trace':
        color = colors.magenta;
        prefijo = 'TRACE';
        break;
      case 'info':
      default:
        color = colors.blue;
        prefijo = 'INFO';
        break;
    }

    // Log a consola
    console.log(
      `${colors.bright}[${timestamp}]${colors.reset} ` +
      `${color}[${prefijo}]${colors.reset} ${mensaje}`
    );

    // Log a archivo (async, no bloquea)
    this.writeToFile(categoria, `[${prefijo}] ${mensaje}`).catch(err => {
      console.error('Error escribiendo log a archivo:', err);
    });
  }

  /**
   * Log de eventos de usuario
   */
  async logEvento(tipo, usuario, datos) {
    const evento = {
      timestamp: new Date().toISOString(),
      tipo: tipo,
      usuario: {
        numero: usuario.numero,
        nombre: usuario.nombre,
        perfil: usuario.perfil
      },
      datos: datos
    };

    const categoria = `eventos/${tipo}`;
    const mensaje = JSON.stringify(evento);

    await this.writeToFile(categoria, mensaje);

    // También log a consola en modo debug
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      await this.log(`Evento ${tipo}: ${usuario.nombre}`, 'debug', 'sistema');
    }
  }

  /**
   * Log de infracciones de seguridad
   */
  async logInfraccion(numero, tipo, detalles) {
    const infraccion = {
      timestamp: new Date().toISOString(),
      numero: numero,
      tipo: tipo,
      detalles: detalles,
      severidad: detalles.severidad || 'media'
    };

    const categoria = tipo === 'palabra_prohibida' ? 'palabras-prohibidas' : 'ataques';
    const mensaje = JSON.stringify(infraccion);

    await this.writeToFile(categoria, mensaje);
    await this.log(`🚨 Infracción ${tipo}: ${numero}`, 'warn', 'sistema');
  }

  /**
   * Log de ataque/intento malicioso
   */
  async logAtaque(numero, tipoAtaque, detalles) {
    const ataque = {
      timestamp: new Date().toISOString(),
      numero: numero,
      tipo: tipoAtaque,
      detalles: detalles,
      ip: detalles.ip || 'unknown',
      bloqueado: detalles.bloqueado || false
    };

    const mensaje = JSON.stringify(ataque);
    await this.writeToFile('ataques', mensaje);
    await this.log(`🚨 ATAQUE DETECTADO: ${tipoAtaque} desde ${numero}`, 'error', 'sistema');
  }

  /**
   * Log de pago
   */
  async logPago(usuario, tipo, monto, estado) {
    const pago = {
      timestamp: new Date().toISOString(),
      usuario: {
        numero: usuario.numero,
        nombre: usuario.nombre
      },
      tipo: tipo,
      monto: monto,
      estado: estado
    };

    const mensaje = JSON.stringify(pago);
    await this.writeToFile('eventos/pagos', mensaje);
    await this.log(`💰 Pago ${tipo}: ${usuario.nombre} - $${monto} MXN - ${estado}`, 'info', 'sistema');
  }

  /**
   * Log de canción agregada
   */
  async logCancion(usuario, cancion, prioridad = 'normal') {
    const evento = {
      timestamp: new Date().toISOString(),
      usuario: {
        numero: usuario.numero,
        nombre: usuario.nombre,
        perfil: usuario.perfil
      },
      cancion: {
        uri: cancion.uri,
        nombre: cancion.name,
        artistas: cancion.artists.map(a => a.name).join(', ')
      },
      prioridad: prioridad
    };

    const mensaje = JSON.stringify(evento);
    await this.writeToFile('eventos/musica', mensaje);
  }

  /**
   * Log de ubicación
   */
  async logUbicacion(usuario, ubicacion, distancia, esValida) {
    const evento = {
      timestamp: new Date().toISOString(),
      usuario: {
        numero: usuario.numero,
        nombre: usuario.nombre
      },
      ubicacion: {
        lat: ubicacion.latitude || ubicacion.lat,
        lon: ubicacion.longitude || ubicacion.lon
      },
      distancia: distancia,
      valida: esValida
    };

    const mensaje = JSON.stringify(evento);
    await this.writeToFile('eventos/ubicaciones', mensaje);
  }

  /**
   * Limpiar logs antiguos (más de 30 días)
   */
  async limpiarLogsAntiguos(diasRetencion = 30) {
    await this.initPromise;

    try {
      const categorias = ['sistema', 'errores', 'eventos', 'ataques', 'palabras-prohibidas'];
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);

      let archivosEliminados = 0;

      for (const categoria of categorias) {
        const dirPath = path.join(LOGS_DIR, categoria);

        try {
          const archivos = await fs.readdir(dirPath);

          for (const archivo of archivos) {
            if (!archivo.endsWith('.log')) continue;

            const filePath = path.join(dirPath, archivo);
            const stats = await fs.stat(filePath);

            if (stats.mtime < fechaLimite) {
              await fs.unlink(filePath);
              archivosEliminados++;
            }
          }
        } catch (error) {
          // Directorio no existe o error leyendo
          continue;
        }
      }

      await this.log(`🧹 Logs antiguos limpiados: ${archivosEliminados} archivos eliminados`, 'info', 'sistema');
      return archivosEliminados;
    } catch (error) {
      await this.log(`❌ Error limpiando logs antiguos: ${error.message}`, 'error', 'sistema');
      return 0;
    }
  }

  /**
   * Obtener estadísticas de logs
   */
  async getEstadisticas() {
    await this.initPromise;

    try {
      const stats = {
        totalArchivos: 0,
        tamanhoTotal: 0,
        ultimoLog: null
      };

      const categorias = ['sistema', 'errores', 'eventos', 'ataques', 'palabras-prohibidas'];

      for (const categoria of categorias) {
        const dirPath = path.join(LOGS_DIR, categoria);

        try {
          const archivos = await fs.readdir(dirPath);
          stats.totalArchivos += archivos.length;

          for (const archivo of archivos) {
            const filePath = path.join(dirPath, archivo);
            const stat = await fs.stat(filePath);
            stats.tamanhoTotal += stat.size;

            if (!stats.ultimoLog || stat.mtime > new Date(stats.ultimoLog)) {
              stats.ultimoLog = stat.mtime.toISOString();
            }
          }
        } catch (error) {
          continue;
        }
      }

      stats.tamanhoTotalMB = (stats.tamanhoTotal / 1024 / 1024).toFixed(2);

      return stats;
    } catch (error) {
      return null;
    }
  }
}

// Instancia singleton
const logger = new AdvancedLogger();

// Exportar funciones de conveniencia
export const log = (mensaje, nivel, categoria) => logger.log(mensaje, nivel, categoria);
export const logEvento = (tipo, usuario, datos) => logger.logEvento(tipo, usuario, datos);
export const logInfraccion = (numero, tipo, detalles) => logger.logInfraccion(numero, tipo, detalles);
export const logAtaque = (numero, tipo, detalles) => logger.logAtaque(numero, tipo, detalles);
export const logPago = (usuario, tipo, monto, estado) => logger.logPago(usuario, tipo, monto, estado);
export const logCancion = (usuario, cancion, prioridad) => logger.logCancion(usuario, cancion, prioridad);
export const logUbicacion = (usuario, ubicacion, distancia, esValida) => logger.logUbicacion(usuario, ubicacion, distancia, esValida);
export const limpiarLogsAntiguos = (dias) => logger.limpiarLogsAntiguos(dias);
export const getEstadisticasLogs = () => logger.getEstadisticas();

export default logger;
