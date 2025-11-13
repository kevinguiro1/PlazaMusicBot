// panel/server.js - Servidor del Panel de Administración
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PANEL_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas de datos
const DATA_DIR = path.join(__dirname, '..', 'datos');
const ENV_FILE = path.join(__dirname, '..', '.env');

/**
 * Página principal del panel
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * API: Obtener configuración actual
 */
app.get('/api/config', async (req, res) => {
  try {
    const config = {
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        playlistId: process.env.SPOTIFY_PLAYLIST_ID
      },
      limites: {
        normal: parseInt(process.env.LIMITE_CANCIONES_NORMAL) || 3,
        premium: parseInt(process.env.LIMITE_CANCIONES_PREMIUM) || 3,
        vip: parseInt(process.env.LIMITE_CANCIONES_VIP) || 1
      },
      ubicacion: {
        lat: parseFloat(process.env.PLAZA_LAT) || 23.2494,
        lon: parseFloat(process.env.PLAZA_LON) || -106.4111,
        radioKm: parseFloat(process.env.PLAZA_RADIUS_KM) || 0.5
      },
      seguridad: {
        rateLimit: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 20,
        floodThreshold: parseInt(process.env.FLOOD_THRESHOLD) || 5
      },
      administradores: {
        admin: (process.env.ADMIN_NUMBERS || '').split(',').filter(n => n.trim()),
        tecnico: (process.env.TECNICO_NUMBERS || '').split(',').filter(n => n.trim())
      }
    };

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Actualizar configuración
 */
app.post('/api/config', async (req, res) => {
  try {
    const { limites, ubicacion, seguridad, administradores } = req.body;

    // Leer .env actual
    let envContent = await fs.readFile(ENV_FILE, 'utf-8');

    // Actualizar valores
    if (limites) {
      envContent = updateEnvValue(envContent, 'LIMITE_CANCIONES_NORMAL', limites.normal);
      envContent = updateEnvValue(envContent, 'LIMITE_CANCIONES_PREMIUM', limites.premium);
      envContent = updateEnvValue(envContent, 'LIMITE_CANCIONES_VIP', limites.vip);
    }

    if (ubicacion) {
      envContent = updateEnvValue(envContent, 'PLAZA_LAT', ubicacion.lat);
      envContent = updateEnvValue(envContent, 'PLAZA_LON', ubicacion.lon);
      envContent = updateEnvValue(envContent, 'PLAZA_RADIUS_KM', ubicacion.radioKm);
    }

    if (seguridad) {
      envContent = updateEnvValue(envContent, 'MAX_REQUESTS_PER_MINUTE', seguridad.rateLimit);
      envContent = updateEnvValue(envContent, 'FLOOD_THRESHOLD', seguridad.floodThreshold);
    }

    if (administradores) {
      if (administradores.admin) {
        envContent = updateEnvValue(envContent, 'ADMIN_NUMBERS', administradores.admin.join(','));
      }
      if (administradores.tecnico) {
        envContent = updateEnvValue(envContent, 'TECNICO_NUMBERS', administradores.tecnico.join(','));
      }
    }

    // Guardar .env
    await fs.writeFile(ENV_FILE, envContent);

    res.json({ success: true, message: 'Configuración actualizada. Reinicia el bot para aplicar cambios.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Obtener usuarios
 */
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuariosFile = path.join(DATA_DIR, 'usuarios.json');
    const content = await fs.readFile(usuariosFile, 'utf-8');
    const usuarios = JSON.parse(content);

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Actualizar perfil de usuario
 */
app.post('/api/usuarios/:numero/perfil', async (req, res) => {
  try {
    const { numero } = req.params;
    const { perfil } = req.body;

    const usuariosFile = path.join(DATA_DIR, 'usuarios.json');
    const content = await fs.readFile(usuariosFile, 'utf-8');
    const usuarios = JSON.parse(content);

    if (!usuarios[numero]) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    usuarios[numero].perfil = perfil;

    // Actualizar permisos según perfil
    const { CONFIG_PERFILES } = await import('../core/profiles.js');
    const config = CONFIG_PERFILES[perfil];

    if (config) {
      usuarios[numero].limiteDiario = config.limiteCanciones;
      usuarios[numero].prioridad = config.prioridad;
      usuarios[numero].permisos = config.permisos;
    }

    await fs.writeFile(usuariosFile, JSON.stringify(usuarios, null, 2));

    res.json({ success: true, usuario: usuarios[numero] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: Obtener estadísticas
 */
app.get('/api/estadisticas', async (req, res) => {
  try {
    const statsFile = path.join(DATA_DIR, 'estadisticas.json');
    const content = await fs.readFile(statsFile, 'utf-8');
    const stats = JSON.parse(content);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Actualizar valor en .env
 */
function updateEnvValue(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🌐 Panel de Administración iniciado en http://localhost:${PORT}`);
  console.log(`📊 Accede desde tu navegador para configurar el bot\n`);
});
