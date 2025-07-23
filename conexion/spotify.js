// conexion/spotify.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const {
  clientId,
  clientSecret,
  redirectUri,
  refreshToken,
  playlistId
} = JSON.parse(fs.readFileSync(path.join('.', 'datos', 'spotify_tokens.json'), 'utf-8'));

let accessToken = '';

async function obtenerAccessToken() {
  const { data } = await axios.post('https://accounts.spotify.com/api/token', null, {
    params: { grant_type: 'refresh_token', refresh_token: refreshToken },
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  accessToken = data.access_token;
  return accessToken;
}

export async function buscarCancionEnSpotify(nombre) {
  const token = await obtenerAccessToken();
  const { data } = await axios.get('https://api.spotify.com/v1/search', {
    headers: { Authorization: `Bearer ${token}` },
    params: { q: nombre, type: 'track', limit: 10, market: 'MX' }
  });
  return data.tracks.items;
}

export async function agregarCancionAPlaylist(trackUri) {
  const token = await obtenerAccessToken();
  const { data } = await axios.post(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    { uris: [trackUri] },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}
