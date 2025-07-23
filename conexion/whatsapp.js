// conexion/whatsapp.js
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

async function iniciarConexionWhatsApp(onMessage) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: 'MusicaPlaza' }),
        puppeteer: { headless: true }
    });

    client.on('qr', qr => qrcode.generate(qr, { small: true }));
    client.on('ready', () => console.log('✅ Conectado a WhatsApp'));

    client.on('message', async msg => {
        const numero = msg.from.replace(/@c\.us$/, '');
        let tipo = 'texto';
        let contenido = msg.body;
        let ubicacion = null;

        if (msg.location) {
            tipo = 'ubicacion';
            ubicacion = msg.location;
        }

        const respuesta = await onMessage(contenido, numero, tipo, ubicacion);
        if (respuesta) {
            client.sendMessage(msg.from, respuesta);
        }
    });

    await client.initialize();
    return client;
}

module.exports = { iniciarConexionWhatsApp };
