// bot.js
import dotenv from 'dotenv';
dotenv.config();

import { iniciarConexionWhatsApp } from './conexion/whatsapp.js';
import { manejarUsuario } from './usuario/index.js';
import * as spotify from './conexion/spotify.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join('.', 'datos');
const USERS_FILE = path.join(DATA_DIR, 'usuarios.json');
const BLOCKED_FILE = path.join(DATA_DIR, 'bloqueados.json');

let usuarios = {};
let bloqueados = {};

function cargarDatos() {
  if (fs.existsSync(USERS_FILE)) {
    usuarios = JSON.parse(fs.readFileSync(USERS_FILE));
  }
  if (fs.existsSync(BLOCKED_FILE)) {
    bloqueados = JSON.parse(fs.readFileSync(BLOCKED_FILE));
  }
}

function guardarDatos() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(usuarios, null, 2));
  fs.writeFileSync(BLOCKED_FILE, JSON.stringify(bloqueados, null, 2));
}

async function main() {
  cargarDatos();

  const LIMITE_CANCIONES = process.env.LIMITE_CANCIONES ? parseInt(process.env.LIMITE_CANCIONES) : 3;

  const sock = await iniciarConexionWhatsApp(async (sock, m) => {
    try {
      const numero = m.key.remoteJid.split('@')[0];

      if (bloqueados[numero]) {
        await sock.sendMessage(m.key.remoteJid, 'í ½íº« Has sido bloqueado y no puedes pedir canciones.');
        return;
      }

      if (!usuarios[numero]) {
        usuarios[numero] = {
          nombre: numero,
          premium: false,
          vip: false,
          cancionesPedidas: 0,
          agregadasHoy: [],
          ultimaSugerencia: null,
        };
        await sock.sendMessage(m.key.remoteJid, `Hola! Por favor dime tu nombre.`);
        guardarDatos();
        return;
      }

      const texto = m.message.conversation || m.message.extendedTextMessage?.text || '';

      // Procesar mensaje con la funciÃ³n manejarUsuario
      const respuesta = await manejarUsuario({
        mensaje: texto,
        numero,
        usuarios,
        bloqueados,
        agregarCancionAPlaylist: spotify.agregarCancionAPlaylist,
        buscarCancionEnSpotify: spotify.buscarCancionEnSpotify,
        obtenerCancionesFiltradas: (canciones) => {
          // AquÃ­ puedes implementar un filtro de canciones si quieres
          return canciones.filter(c => !c.explicit);
        },
        sugerirCancionesSimilares: spotify.buscarCancionEnSpotify,
        LIMITE_CANCIONES,
      });

      if (respuesta) {
        await sock.sendMessage(m.key.remoteJid, respuesta);
        guardarDatos();
      }
    } catch (error) {
      console.error('Error en mensaje:', error);
    }
  });
}

main();
