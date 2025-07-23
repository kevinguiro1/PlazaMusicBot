// utils/campaign.js
const fs   = require('fs');
const path = require('path');
const { client } = require('../conexion/whatsapp');

const USUARIOS = path.join(__dirname, '../datos/usuarios.json');

function loadUsers() {
  return JSON.parse(fs.readFileSync(USUARIOS));
}

/**
 * Envía un mensaje o imagen a todos los usuarios.
 * @param {string} content — Texto o URL de imagen.
 */
async function enviarCampaña(content) {
  const users = loadUsers();
  for (const numero of Object.keys(users)) {
    const jid = `${numero}@c.us`;
    try {
      if (/^https?:\/\//.test(content)) {
        await client.sendMessage(jid, { image: { url: content }, caption: '🎁 ¡Promoción especial!' });
      } else {
        await client.sendMessage(jid, `🎁 *Promoción*:\n${content}`);
      }
      // Pequeña pausa para no saturar
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`Error enviando campaña a ${numero}:`, e);
    }
  }
}

module.exports = { enviarCampaña };
