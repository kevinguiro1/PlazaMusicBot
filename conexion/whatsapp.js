// conexion/whatsapp.js - Módulo Mejorado de WhatsApp con Multi-instancia
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { log } from '../utils/logger.js';
import path from 'path';

/**
 * Instancias activas de bots
 */
const instanciasActivas = new Map();

/**
 * Iniciar conexión de WhatsApp con Baileys
 */
export async function iniciarConexionWhatsApp(nombreBot = 'bot-principal', onMessage) {
  const sessionDir = path.join(process.cwd(), 'session', nombreBot);

  log(`🔌 Iniciando conexión de WhatsApp para: ${nombreBot}...`, 'info');

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: true,
    syncFullHistory: false
  });

  // Guardar credenciales cuando cambien
  sock.ev.on('creds.update', saveCreds);

  // Manejar actualizaciones de conexión
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log(`📱 Código QR para ${nombreBot}:`, 'info');
      qrcode.generate(qr, { small: true });
      log(`\n💡 Escanea el código QR con WhatsApp para conectar ${nombreBot}`, 'info');
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      log(
        `🔌 Conexión cerrada para ${nombreBot}. Razón: ${lastDisconnect?.error?.message}`,
        'warn'
      );

      if (shouldReconnect) {
        log(`🔄 Reconectando ${nombreBot}...`, 'info');
        setTimeout(() => {
          iniciarConexionWhatsApp(nombreBot, onMessage);
        }, 5000);
      } else {
        log(`❌ ${nombreBot} desconectado permanentemente`, 'error');
        instanciasActivas.delete(nombreBot);
      }
    } else if (connection === 'open') {
      log(`✅ ${nombreBot} conectado a WhatsApp exitosamente!`, 'success');
      instanciasActivas.set(nombreBot, sock);
    }
  });

  // Manejar mensajes entrantes
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const m of messages) {
      // Ignorar mensajes propios
      if (m.key.fromMe) continue;

      // Ignorar mensajes de grupos (opcional)
      if (m.key.remoteJid.includes('@g.us')) continue;

      // Procesar mensaje
      try {
        await onMessage(sock, m);
      } catch (error) {
        log(`❌ Error procesando mensaje en ${nombreBot}: ${error.message}`, 'error');
      }
    }
  });

  return sock;
}

/**
 * Iniciar múltiples bots
 */
export async function iniciarMultiplesBots(configs, onMessage) {
  const bots = [];

  for (const config of configs) {
    const bot = await iniciarConexionWhatsApp(config.nombre, onMessage);
    bots.push({
      nombre: config.nombre,
      socket: bot
    });

    // Esperar 2 segundos entre bots para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  log(`✅ ${bots.length} bots iniciados exitosamente`, 'success');
  return bots;
}

/**
 * Obtener instancia de bot
 */
export function obtenerInstanciaBot(nombreBot) {
  return instanciasActivas.get(nombreBot);
}

/**
 * Obtener todas las instancias activas
 */
export function obtenerTodasLasInstancias() {
  return Array.from(instanciasActivas.entries()).map(([nombre, socket]) => ({
    nombre,
    conectado: socket.user ? true : false,
    numero: socket.user?.id?.split(':')[0]
  }));
}

/**
 * Desconectar bot
 */
export async function desconectarBot(nombreBot) {
  const socket = instanciasActivas.get(nombreBot);

  if (socket) {
    await socket.logout();
    instanciasActivas.delete(nombreBot);
    log(`🔌 Bot ${nombreBot} desconectado`, 'info');
    return true;
  }

  return false;
}

/**
 * Enviar mensaje a un número
 */
export async function enviarMensajeDirecto(nombreBot, numero, mensaje) {
  const socket = obtenerInstanciaBot(nombreBot);

  if (!socket) {
    throw new Error(`Bot ${nombreBot} no encontrado`);
  }

  const jid = numero.includes('@') ? numero : `${numero}@s.whatsapp.net`;

  await socket.sendMessage(jid, { text: mensaje });
  log(`📤 Mensaje enviado desde ${nombreBot} a ${numero}`, 'debug');
}

/**
 * Enviar mensaje broadcast (a múltiples números)
 */
export async function enviarBroadcast(nombreBot, numeros, mensaje) {
  const socket = obtenerInstanciaBot(nombreBot);

  if (!socket) {
    throw new Error(`Bot ${nombreBot} no encontrado`);
  }

  const resultados = {
    exitosos: 0,
    fallidos: 0,
    errores: []
  };

  for (const numero of numeros) {
    try {
      await enviarMensajeDirecto(nombreBot, numero, mensaje);
      resultados.exitosos++;

      // Pequeña pausa para no saturar
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      resultados.fallidos++;
      resultados.errores.push({
        numero,
        error: error.message
      });
    }
  }

  log(
    `📢 Broadcast completado: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`,
    'info'
  );

  return resultados;
}
