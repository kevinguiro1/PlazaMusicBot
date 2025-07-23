// bot.js
<<<<<<< HEAD
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
        await sock.sendMessage(m.key.remoteJid, '������ Has sido bloqueado y no puedes pedir canciones.');
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

      // Procesar mensaje con la función manejarUsuario
      const respuesta = await manejarUsuario({
        mensaje: texto,
        numero,
        usuarios,
        bloqueados,
        agregarCancionAPlaylist: spotify.agregarCancionAPlaylist,
        buscarCancionEnSpotify: spotify.buscarCancionEnSpotify,
        obtenerCancionesFiltradas: (canciones) => {
          // Aquí puedes implementar un filtro de canciones si quieres
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
=======
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { iniciarConexionWhatsApp } = require('./conexion/whatsapp');
const {
  buscarCancionEnSpotify,
  agregarCancionAPlaylist,
  buscarArtistaEnSpotify,
  topTracksDeArtista,
  calcularTiempoParaTrack
} = require('./conexion/spotify');
const { obtenerCancionesFiltradas, sugerirCancionesSimilares } = require('./utils/filtrosCanciones');
const { verificarUbicacion } = require('./utils/ubicacion');
const { manejarUsuario } = require('./usuario/index');
const { manejarAdmin } = require('./administrador/index');
const filtrarMensaje = require('./utils/filtroLenguaje');

const usuariosPath   = path.join(__dirname, 'datos/usuarios.json');
const bloqueadosPath = path.join(__dirname, 'datos/bloqueados.json');

let usuarios   = JSON.parse(fs.readFileSync(usuariosPath));
let bloqueados = JSON.parse(fs.readFileSync(bloqueadosPath));

// Ajusta esto al identificador que ves en el log (sin '+' ni sufijos)
const ADMIN_NUMERO     = '5218661165921';
const LIMITE_CANCIONES = 3;

// Saludo según la hora
function saludoPorHora() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

iniciarConexionWhatsApp(async (mensaje, numero, tipo, ubicacion) => {
  // 1) Recarga datos
  usuarios   = JSON.parse(fs.readFileSync(usuariosPath));
  bloqueados = JSON.parse(fs.readFileSync(bloqueadosPath));

  // 2) DEBUG: imprime el número entrante
  console.log('DEBUG → número entrante:', numero);

  const text = mensaje.trim();

  // 3) Filtrado de groserías
  if (filtrarMensaje(text)) {
    bloqueados[numero] = true;
    fs.writeFileSync(bloqueadosPath, JSON.stringify(bloqueados, null, 2));
    return;
  }

  // 4) Admin: sólo si es comando (empieza con '/')
  if (
    (numero === ADMIN_NUMERO || numero.endsWith(ADMIN_NUMERO)) &&
    text.startsWith('/')
  ) {
    return await manejarAdmin(text, numero);
  }

  // 5) Bloqueados
  if (bloqueados[numero]) {
    return;
  }

  // 6) Prepara nuevo usuario
  if (!usuarios[numero]) {
    usuarios[numero] = {
      nombre: null,
      cancionesPedidas: 0,
      premium: false,
      confirmado: false,
      context: null,
      ultimaSugerencia: null,
      agregadasHoy: [],
      finishedToday: false,
      lastDate: null
    };
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
    return `¡${saludoPorHora()}, bienvenido a MúsicaPlaza! ¿Cómo te llamas?`;
  }

  // 7) Reset diario
  const usr = usuarios[numero];
  const hoy = new Date().toISOString().slice(0,10);
  if (usr.lastDate !== hoy) {
    usr.lastDate = hoy;
    usr.agregadasHoy = [];
    usr.finishedToday = false;
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
  }

  // 8) Si ya terminó hoy
  if (usr.finishedToday) {
    return `⚠️ ${usr.nombre}, ya terminaste por hoy. Vuelve mañana.`;
  }

  // 9) Registrar nombre
  if (!usr.nombre) {
    usr.nombre = text;
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
    return `¡${saludoPorHora()}, ${usr.nombre}! Ahora mándame tu ubicación en tiempo real para validar que estás en la plaza.`;
  }

  // 10) Validar ubicación
  if (!usr.confirmado) {
    if (tipo === 'ubicacion') {
      if (verificarUbicacion(ubicacion)) {
        usr.confirmado = true;
        usr.context   = 'mainMenu';
        fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
        return `✅ Ubicación verificada, ${usr.nombre}.\nElige una opción:\n1. Artista\n2. Canción\n3. Salir`;
      } else {
        return `❌ Lo siento, ${usr.nombre}, estás fuera del área permitida.`;
      }
    }
    return `${usr.nombre}, por favor envía tu ubicación en tiempo real para validar que estás en la plaza.`;
  }

  // 11) Menú principal
  if (usr.context === 'mainMenu') {
    if (/^[1-3]$/.test(text)) {
      const choice = parseInt(text,10);
      if (choice === 1) {
        usr.context = 'artistSuggest';
        fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
        return `Genial, ${usr.nombre}. ¿Qué artista te interesa?`;
      }
      if (choice === 2) {
        usr.context = 'trackSearch';
        fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
        return `Perfecto, ${usr.nombre}. ¿Qué canción te interesa?`;
      }
      // choice === 3 → salir
      usr.finishedToday = true;
      fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
      return `¡Entendido, ${usr.nombre}! Sesión cerrada por hoy. Hasta mañana.`;
    }
    return `No entendí, ${usr.nombre}. Responde con 1, 2 o 3.`;
  }

  // 12) Flujo artista
  if (usr.context === 'artistSuggest') {
    const art = await buscarArtistaEnSpotify(text);
    if (!art) {
      delete usr.context;
      fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
      return `❌ No encontré al artista "${text}". Vuelve al menú con 11 o prueba otro.`;
    }
    const top = await topTracksDeArtista(art.id);
    const filtradas = await obtenerCancionesFiltradas(top);
    const opciones = filtradas.slice(0, 10);
    const titles = opciones.map(c => `${c.name} – ${c.artists[0].name}`);
    const uris   = opciones.map(c => c.uri);
    usr.ultimaSugerencia = { titles, uris };
    delete usr.context;
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

    let msg = `🎤 ${usr.nombre}, estas son las top canciones de ${art.name}:\n\n`;
    titles.forEach((t,i) => msg += `${i+1}. ${t}\n`);
    msg += `11. Volver al menú principal`;
    msg += `\n\nResponde con el número (1–11).`;
    return msg;
  }

  // 13) Flujo pistas / selección numérica
  if (usr.context === 'trackSearch' || usr.ultimaSugerencia) {
    if (usr.ultimaSugerencia && /^[1-9]$|^10$|^11$/.test(text)) {
      const idx = parseInt(text,10) - 1;
      if (idx === 10) {
        usr.context = 'mainMenu';
        delete usr.ultimaSugerencia;
        fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
        return `🔄 ${usr.nombre}, elige:\n1. Artista\n2. Canción\n3. Salir`;
      }
      if (idx >= 0 && idx < usr.ultimaSugerencia.uris.length) {
        const uri = usr.ultimaSugerencia.uris[idx];
        const name = usr.ultimaSugerencia.titles[idx];
        if (usr.agregadasHoy.includes(uri)) {
          return `⚠️ ${usr.nombre}, “${name}” ya fue agregada hoy.`;
        }
        await agregarCancionAPlaylist(uri);
        usr.cancionesPedidas++;
        usr.agregadasHoy.push(uri);
        // estimación
        const { minutos, segundos } = await calcularTiempoParaTrack(uri);
        usr.finishedToday = true;
        delete usr.ultimaSugerencia;
        delete usr.context;
        fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
        return `✅ ${usr.nombre}, agregada: *${name}* 🎵\n⏱ Tu canción sonará en aprox. ${minutos}m ${segundos}s.\nSesión cerrada por hoy.`;
      }
      return `❌ Opción no válida. Responde con un número del 1 al 11.`;
    }
    if (usr.context === 'trackSearch') {
      const resp = await manejarUsuario({
        mensaje: text,
        numero,
        usuarios,
        bloqueados,
        agregarCancionAPlaylist,
        buscarCancionEnSpotify,
        obtenerCancionesFiltradas,
        sugerirCancionesSimilares,
        LIMITE_CANCIONES
      });
      delete usr.context;
      fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
      return resp;
    }
  }

  // 14) Fallback libre
  const respuesta = await manejarUsuario({
    mensaje: text,
    numero,
    usuarios,
    bloqueados,
    agregarCancionAPlaylist,
    buscarCancionEnSpotify,
    obtenerCancionesFiltradas,
    sugerirCancionesSimilares,
    LIMITE_CANCIONES
  });
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
  return respuesta;
});
>>>>>>> 84a385d6b0d79fb67219396c133b027284bf6756
