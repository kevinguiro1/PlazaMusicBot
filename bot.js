// bot.js - Sistema de Bot de Música Plaza v2.0
import dotenv from 'dotenv';
dotenv.config();

import { iniciarConexionWhatsApp } from './conexion/whatsapp.js';
import { procesarMensaje } from './core/messageHandler.js';
import { cargarDatos, guardarDatos } from './core/dataManager.js';
import { iniciarSistemaSeguridad } from './core/security.js';
import { iniciarMonitoreo } from './core/monitoring.js';
import { log } from './utils/logger.js';

// Estado global de la aplicación
let estado = {
  usuarios: {},
  bloqueados: {},
  solicitudes: {},
  estadisticas: {},
  bots: {}
};

/**
 * Inicializar la aplicación
 */
async function main() {
  try {
    log('🚀 Iniciando PlazaMusicBot v2.0...', 'info');

    // Cargar datos persistentes
    estado = await cargarDatos();

    // Iniciar sistema de seguridad
    const sistemaSeguridad = iniciarSistemaSeguridad();

    // Iniciar monitoreo y estadísticas
    iniciarMonitoreo(estado);

    // Conectar bot principal
    const sock = await iniciarConexionWhatsApp(
      'bot-principal',
      async (sock, m) => {
        try {
          await procesarMensaje(sock, m, estado, sistemaSeguridad);
          // Guardar datos después de cada mensaje procesado
          await guardarDatos(estado);
        } catch (error) {
          log(`❌ Error procesando mensaje: ${error.message}`, 'error');
          console.error(error);
        }
      }
    );

    estado.bots['bot-principal'] = sock;

    log('✅ PlazaMusicBot iniciado exitosamente!', 'success');
    log(`📊 Usuarios registrados: ${Object.keys(estado.usuarios).length}`, 'info');
    log(`🚫 Usuarios bloqueados: ${Object.keys(estado.bloqueados).length}`, 'info');

    // Guardar datos periódicamente (cada 5 minutos)
    setInterval(async () => {
      await guardarDatos(estado);
      log('💾 Datos guardados automáticamente', 'info');
    }, 5 * 60 * 1000);

  } catch (error) {
    log(`💥 Error fatal al iniciar: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  log('\n⏸️  Deteniendo PlazaMusicBot...', 'info');
  await guardarDatos(estado);
  log('✅ Datos guardados. Adiós!', 'success');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await guardarDatos(estado);
  process.exit(0);
});

// Iniciar aplicación
main();
