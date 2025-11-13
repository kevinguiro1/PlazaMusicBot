// conexion/spotify.js - Módulo Mejorado de Spotify
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { log } from '../utils/logger.js';

const TOKENS_FILE = path.join(process.cwd(), 'datos', 'spotify_tokens.json');

let credenciales = null;
let accessToken = '';
let tokenExpiracion = 0;

/**
 * Cargar credenciales de Spotify
 */
async function cargarCredenciales() {
  if (credenciales) return credenciales;

  try {
    const contenido = await fs.readFile(TOKENS_FILE, 'utf-8');
    credenciales = JSON.parse(contenido);
    return credenciales;
  } catch (error) {
    log(`❌ Error cargando credenciales de Spotify: ${error.message}`, 'error');
    throw new Error('No se pudieron cargar las credenciales de Spotify');
  }
}

/**
 * Obtener access token (con caché y renovación automática)
 */
async function obtenerAccessToken() {
  // Si el token es válido, retornarlo
  if (accessToken && Date.now() < tokenExpiracion) {
    return accessToken;
  }

  const creds = await cargarCredenciales();

  try {
    const { data } = await axios.post(
      'https://accounts.spotify.com/api/token',
      null,
      {
        params: {
          grant_type: 'refresh_token',
          refresh_token: creds.refreshToken
        },
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = data.access_token;
    tokenExpiracion = Date.now() + (data.expires_in * 1000) - 60000; // Restar 1 minuto por seguridad

    log('✅ Token de Spotify renovado', 'debug');
    return accessToken;
  } catch (error) {
    log(`❌ Error obteniendo token de Spotify: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Buscar canción en Spotify
 */
export async function buscarCancionEnSpotify(query, limite = 10) {
  try {
    const token = await obtenerAccessToken();
    const { data } = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: query,
        type: 'track',
        limit: limite,
        market: 'MX'
      }
    });

    log(`🔍 Búsqueda en Spotify: "${query}" - ${data.tracks.items.length} resultados`, 'debug');
    return data.tracks.items;
  } catch (error) {
    log(`❌ Error buscando en Spotify: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Buscar artista en Spotify
 */
export async function buscarArtistaEnSpotify(query) {
  try {
    const token = await obtenerAccessToken();
    const { data } = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: query,
        type: 'artist',
        limit: 1,
        market: 'MX'
      }
    });

    if (data.artists.items.length > 0) {
      log(`🎤 Artista encontrado: ${data.artists.items[0].name}`, 'debug');
      return data.artists.items[0];
    }

    return null;
  } catch (error) {
    log(`❌ Error buscando artista: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Obtener top tracks de un artista
 */
export async function topTracksDeArtista(artistId) {
  try {
    const token = await obtenerAccessToken();
    const { data } = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { market: 'MX' }
      }
    );

    log(`🎵 Top tracks obtenidos: ${data.tracks.length}`, 'debug');
    return data.tracks;
  } catch (error) {
    log(`❌ Error obteniendo top tracks: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Agregar canción a playlist
 */
export async function agregarCancionAPlaylist(trackUri, posicion = null) {
  try {
    const token = await obtenerAccessToken();
    const creds = await cargarCredenciales();

    const body = { uris: [trackUri] };
    if (posicion !== null) {
      body.position = posicion;
    }

    await axios.post(
      `https://api.spotify.com/v1/playlists/${creds.playlistId}/tracks`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    log(`✅ Canción agregada a playlist: ${trackUri}`, 'info');
    return true;
  } catch (error) {
    log(`❌ Error agregando canción a playlist: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Obtener canciones de la playlist
 */
export async function obtenerPlaylist() {
  try {
    const token = await obtenerAccessToken();
    const creds = await cargarCredenciales();

    const { data } = await axios.get(
      `https://api.spotify.com/v1/playlists/${creds.playlistId}/tracks`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      }
    );

    log(`📜 Playlist obtenida: ${data.items.length} canciones`, 'debug');
    return data.items;
  } catch (error) {
    log(`❌ Error obteniendo playlist: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Eliminar canción de la playlist
 */
export async function eliminarCancionDePlaylist(trackUri) {
  try {
    const token = await obtenerAccessToken();
    const creds = await cargarCredenciales();

    await axios.delete(
      `https://api.spotify.com/v1/playlists/${creds.playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          tracks: [{ uri: trackUri }]
        }
      }
    );

    log(`🗑️ Canción eliminada de playlist: ${trackUri}`, 'info');
    return true;
  } catch (error) {
    log(`❌ Error eliminando canción: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Calcular tiempo estimado para que suene una canción
 */
export async function calcularTiempoParaTrack(trackUri) {
  try {
    const playlist = await obtenerPlaylist();

    // Encontrar la posición de la canción
    const posicion = playlist.findIndex(item => item.track.uri === trackUri);

    if (posicion === -1) {
      return { minutos: 0, segundos: 0 };
    }

    // Sumar duración de todas las canciones anteriores
    let tiempoTotal = 0;
    for (let i = 0; i < posicion; i++) {
      tiempoTotal += playlist[i].track.duration_ms;
    }

    const minutos = Math.floor(tiempoTotal / 60000);
    const segundos = Math.floor((tiempoTotal % 60000) / 1000);

    return { minutos, segundos };
  } catch (error) {
    log(`❌ Error calculando tiempo: ${error.message}`, 'error');
    return { minutos: 0, segundos: 0 };
  }
}

/**
 * Limpiar playlist (eliminar todas las canciones)
 */
export async function limpiarPlaylist() {
  try {
    const playlist = await obtenerPlaylist();

    for (const item of playlist) {
      await eliminarCancionDePlaylist(item.track.uri);
    }

    log(`🧹 Playlist limpiada: ${playlist.length} canciones eliminadas`, 'info');
    return playlist.length;
  } catch (error) {
    log(`❌ Error limpiando playlist: ${error.message}`, 'error');
    return 0;
  }
}

/**
 * Obtener información de una canción
 */
export async function obtenerInfoCancion(trackId) {
  try {
    const token = await obtenerAccessToken();

    const { data } = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return data;
  } catch (error) {
    log(`❌ Error obteniendo info de canción: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Obtener recomendaciones basadas en una canción
 */
export async function obtenerRecomendaciones(trackId, limite = 10) {
  try {
    const token = await obtenerAccessToken();

    const { data } = await axios.get(
      'https://api.spotify.com/v1/recommendations',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          seed_tracks: trackId,
          limit: limite,
          market: 'MX'
        }
      }
    );

    log(`💡 Recomendaciones obtenidas: ${data.tracks.length}`, 'debug');
    return data.tracks;
  } catch (error) {
    log(`❌ Error obteniendo recomendaciones: ${error.message}`, 'error');
    return [];
  }
}
