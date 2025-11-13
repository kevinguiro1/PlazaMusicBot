# 🎵 PlazaMusicBot v2.0

Bot de música inteligente para WhatsApp con integración de Spotify, sistema de perfiles multinivel, seguridad avanzada y soporte para múltiples instancias.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Perfiles de Usuario](#-perfiles-de-usuario)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Comandos](#-comandos)
- [Arquitectura](#-arquitectura)
- [Seguridad](#-seguridad)
- [FAQ](#-faq)

## ✨ Características

### 🎯 Funcionalidades Principales

- **Sistema de Perfiles Multinivel**: FREE, PREMIUM, VIP, DJ, ADMIN, SUPER_ADMIN
- **Búsqueda Inteligente de Música**: Búsqueda por canción o artista con filtros de contenido
- **Integración Completa con Spotify**: Gestión de playlist, cola de reproducción, estadísticas
- **Sistema de Seguridad Avanzado**:
  - Rate limiting configurable
  - Detección de flood
  - Anti-spam
  - Filtro de lenguaje ofensivo
  - Bloqueos temporales y permanentes
- **Verificación de Ubicación GPS**: Solo usuarios en la plaza pueden usar el bot
- **Soporte Multi-Instancia**: Múltiples bots funcionando simultáneamente
- **Menús Interactivos**: Interfaz intuitiva para cada tipo de usuario
- **Sistema de FAQ Automático**: Preguntas frecuentes integradas
- **Estadísticas en Tiempo Real**: Monitoreo de uso y actividad
- **Persistencia de Datos**: Guardado automático y backups
- **Notificaciones y Alertas**: Sistema de broadcast para administradores

### 🎨 Menús Personalizados

Cada perfil tiene un menú adaptado a sus permisos:

- **FREE**: Búsqueda básica, límite de 3 canciones/día
- **PREMIUM**: Búsqueda avanzada, ver cola, 10 canciones/día
- **VIP**: Sin límites, estadísticas, prioridad en cola
- **DJ**: Control total de playlist, gestión de cola
- **ADMIN**: Gestión de usuarios, estadísticas, broadcasts
- **SUPER_ADMIN**: Control total del sistema

## 👥 Perfiles de Usuario

### 🎵 FREE
- Límite: 3 canciones por día
- Cooldown: 60 minutos
- Requiere verificación de ubicación
- Acceso a búsqueda básica

### ⭐ PREMIUM
- Límite: 10 canciones por día
- Cooldown: 30 minutos
- Ver cola de reproducción
- Búsqueda por artista
- Requiere verificación de ubicación

### 💎 VIP
- Canciones ilimitadas
- Sin cooldown
- Prioridad en cola de reproducción
- Estadísticas personales
- No requiere ubicación

### 🎧 DJ
- Control total de música
- Gestión de cola de reproducción
- Eliminar y reordenar canciones
- Estadísticas en vivo
- Agregar canciones prioritarias
- Limpiar playlist

### 👤 ADMIN
- Todas las funciones de DJ
- Gestión de usuarios:
  - Bloquear/desbloquear
  - Promover/degradar perfiles
  - Ver lista de usuarios
- Enviar mensajes masivos
- Ver estadísticas generales
- Limpiar datos antiguos

### 👑 SUPER_ADMIN
- Control total del sistema
- Gestión de administradores
- Gestión de múltiples bots
- Acceso a todas las funcionalidades

## 🚀 Instalación

### Requisitos Previos

- Node.js v18 o superior
- Cuenta de Spotify Developer
- WhatsApp Business o personal

### Pasos de Instalación

1. **Clonar el repositorio**:
```bash
git clone <repository-url>
cd PlazaMusicBot
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. **Configurar Spotify**:
   - Crear aplicación en [Spotify Dashboard](https://developer.spotify.com/dashboard)
   - Obtener Client ID y Client Secret
   - Configurar Redirect URI: `http://127.0.0.1:8888/callback`
   - Obtener Refresh Token (ver sección de configuración)

5. **Iniciar el bot**:
```bash
npm start
```

6. **Escanear código QR**:
   - Abrir WhatsApp
   - Ir a Dispositivos Vinculados
   - Escanear el código QR mostrado en terminal

## ⚙️ Configuración

### Archivo .env

```env
# Spotify Configuration
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8888/callback
SPOTIFY_REFRESH_TOKEN=your_refresh_token
SPOTIFY_PLAYLIST_ID=your_playlist_id

# Administradores (separados por comas)
ADMIN_NUMBERS=5218661165921,5218882223344
SUPER_ADMIN_NUMBERS=5218661165921

# Límites de Canciones
LIMITE_CANCIONES_FREE=3
LIMITE_CANCIONES_PREMIUM=10
LIMITE_CANCIONES_VIP=999

# Seguridad
RATE_LIMIT_MESSAGES=10
RATE_LIMIT_WINDOW_MS=60000
MAX_REQUESTS_PER_MINUTE=20
FLOOD_THRESHOLD=5
FLOOD_WINDOW_MS=10000

# Ubicación de la Plaza
PLAZA_LAT=23.2494
PLAZA_LON=-106.4111
PLAZA_RADIUS_KM=0.5
```

### Obtener Refresh Token de Spotify

1. Crear un archivo temporal `getToken.js`:
```javascript
import axios from 'axios';

const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';
const code = 'AUTHORIZATION_CODE'; // Del callback

const getToken = async () => {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    `grant_type=authorization_code&code=${code}&redirect_uri=http://127.0.0.1:8888/callback`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      }
    }
  );
  console.log('Refresh Token:', response.data.refresh_token);
};

getToken();
```

2. Visitar URL de autorización:
```
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://127.0.0.1:8888/callback&scope=playlist-modify-public%20playlist-modify-private
```

3. Copiar el código del callback y ejecutar el script

### Configuración de spotify_tokens.json

```json
{
  "clientId": "YOUR_CLIENT_ID",
  "clientSecret": "YOUR_CLIENT_SECRET",
  "redirectUri": "http://127.0.0.1:8888/callback",
  "refreshToken": "YOUR_REFRESH_TOKEN",
  "playlistId": "YOUR_PLAYLIST_ID"
}
```

## 📱 Uso

### Para Usuarios

1. **Primer uso**:
   - Enviar cualquier mensaje al bot
   - Proporcionar tu nombre
   - Enviar ubicación en tiempo real
   - Empezar a usar el bot

2. **Pedir una canción**:
   - Escribe "menu" para ver opciones
   - Selecciona "1" para buscar canción
   - Escribe el nombre de la canción
   - Selecciona de la lista

3. **Buscar por artista**:
   - Selecciona "2" en el menú
   - Escribe el nombre del artista
   - Elige de las canciones populares

### Para DJs

- Acceder al panel DJ con opción "6"
- Ver y gestionar cola completa
- Saltar canciones
- Eliminar canciones de la cola
- Agregar canciones prioritarias
- Limpiar playlist

### Para Administradores

#### Comandos Directos

```
/bloquear [número] - Bloquear usuario
/desbloquear [número] - Desbloquear usuario
/promover [número] [perfil] - Promover usuario
/degradar [número] - Degradar a FREE
/usuarios - Ver lista de usuarios
/bloqueados - Ver usuarios bloqueados
/stats - Ver estadísticas
/limpiar [días] - Limpiar datos antiguos
/broadcast - Enviar mensaje masivo
/help - Ver ayuda
```

#### Menú Admin

- Acceder con opción "9" o comando `/menu`
- Gestión completa de usuarios
- Estadísticas del sistema
- Envío de mensajes masivos

## 🏗️ Arquitectura

### Estructura del Proyecto

```
PlazaMusicBot/
├── bot.js                      # Punto de entrada principal
├── core/                       # Módulos core del sistema
│   ├── profiles.js             # Sistema de perfiles
│   ├── menus.js                # Menús interactivos
│   ├── security.js             # Seguridad y rate limiting
│   ├── messageHandler.js       # Procesador de mensajes
│   ├── dataManager.js          # Gestión de datos
│   └── monitoring.js           # Monitoreo y estadísticas
├── conexion/                   # Módulos de conexión
│   ├── whatsapp.js             # WhatsApp (Baileys)
│   └── spotify.js              # Spotify API
├── perfiles/                   # Manejadores de perfiles
│   ├── usuario.js              # Free, Premium, VIP
│   ├── dj.js                   # DJ
│   └── admin.js                # Admin, Super Admin
├── utils/                      # Utilidades
│   ├── logger.js               # Sistema de logging
│   ├── filtrosCanciones.js     # Filtro de contenido
│   ├── filtroLenguaje.js       # Filtro de lenguaje
│   └── ubicacion.js            # Verificación GPS
├── datos/                      # Almacenamiento de datos
│   ├── usuarios.json
│   ├── bloqueados.json
│   ├── solicitudes.json
│   ├── estadisticas.json
│   └── spotify_tokens.json
└── session/                    # Sesiones de WhatsApp
    └── bot-principal/
```

### Flujo de Mensajes

```
1. Usuario envía mensaje
2. WhatsApp Baileys recibe mensaje
3. Sistema de seguridad valida:
   - Rate limiting
   - Flood detection
   - Mensaje duplicado
   - Bloqueos
4. messageHandler procesa:
   - Identifica usuario
   - Valida perfil
   - Verifica ubicación (si necesario)
   - Filtra lenguaje
5. Enruta a manejador según perfil:
   - Usuario normal
   - DJ
   - Admin
6. Procesa acción solicitada
7. Interactúa con Spotify (si necesario)
8. Genera respuesta
9. Envía mensaje de vuelta
10. Guarda datos
```

## 🔒 Seguridad

### Medidas Implementadas

1. **Rate Limiting**:
   - Máximo 20 mensajes por minuto
   - Ventana deslizante de 60 segundos

2. **Flood Detection**:
   - Máximo 5 mensajes en 10 segundos
   - Bloqueo temporal de 1 hora

3. **Anti-Spam**:
   - Detección de mensajes duplicados
   - Filtro de caracteres repetidos

4. **Filtro de Contenido**:
   - Lista negra de palabras ofensivas
   - Filtro de canciones explícitas
   - Bloqueo automático por lenguaje inapropiado

5. **Verificación de Ubicación**:
   - GPS required para usuarios FREE y PREMIUM
   - Radio configurable alrededor de la plaza
   - Fórmula de Haversine para precisión

6. **Bloqueos**:
   - Bloqueos temporales automáticos
   - Bloqueos permanentes por admin
   - Sistema de razones de bloqueo

### Buenas Prácticas

- Nunca compartir tokens de Spotify
- Mantener actualizadas las dependencias
- Hacer backups regulares
- Monitorear logs de seguridad
- Revisar usuarios bloqueados periódicamente

## ❓ FAQ

### ¿Cómo obtengo acceso Premium o VIP?

Contacta a un administrador del bot. Solo ellos pueden promover usuarios.

### ¿Por qué no encuentro una canción?

Las canciones pueden estar filtradas por:
- Contenido explícito
- Palabras prohibidas en título o artista
- No disponible en Spotify México

### ¿Cuánto tarda en sonar mi canción?

Depende de la cola actual. Los usuarios VIP tienen prioridad y sus canciones se agregan al inicio de la cola.

### ¿Puedo usar el bot desde fuera de la plaza?

Solo usuarios VIP o superiores pueden usar el bot sin verificación de ubicación. FREE y PREMIUM requieren estar en la plaza.

### ¿Qué hago si me bloquearon?

Contacta a un administrador explicando tu situación. Los bloqueos por lenguaje ofensivo son automáticos.

### ¿Puedo pedir la misma canción dos veces?

No puedes pedir la misma canción dos veces el mismo día.

### ¿Cómo me convierto en DJ o Admin?

Solo los Super Administradores pueden promover a estos perfiles. Contacta al administrador principal.

## 🛠️ Desarrollo

### Agregar Nuevo Perfil

1. Agregar en `core/profiles.js`:
```javascript
export const PERFILES = {
  // ... existing
  NUEVO_PERFIL: 'nuevo_perfil'
};

export const CONFIG_PERFILES = {
  [PERFILES.NUEVO_PERFIL]: {
    nombre: 'Nombre del Perfil',
    emoji: '🔥',
    limiteCanciones: 15,
    prioridad: 2,
    // ... más configuración
  }
};
```

2. Crear manejador en `perfiles/nuevo_perfil.js`
3. Integrar en `core/messageHandler.js`

### Agregar Nuevo Comando Admin

En `perfiles/admin.js`:
```javascript
case 'nuevo':
  return await ejecutarNuevoComando(args, estado);
```

## 📊 Monitoreo

### Ver Estadísticas

- Como Admin: `/stats`
- El sistema muestra automáticamente estadísticas cada 6 horas
- Las estadísticas se actualizan cada hora

### Logs

Los logs se muestran en consola con colores:
- 🔵 INFO: Información general
- 🟡 WARN: Advertencias
- 🔴 ERROR: Errores
- 🟢 SUCCESS: Operaciones exitosas
- 🔷 DEBUG: Debug (solo en desarrollo)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-feature`)
3. Commit cambios (`git commit -m 'Agregar nueva feature'`)
4. Push a branch (`git push origin feature/nueva-feature`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto es privado y está protegido por derechos de autor.

## 👨‍💻 Autor

Desarrollado para Plaza Music

## 🆘 Soporte

Para soporte, contacta al administrador del sistema o crea un issue en GitHub.

---

**Versión**: 2.0.0
**Última actualización**: Noviembre 2025
**Estado**: Producción

🎵 ¡Disfruta la música en la plaza! 🎵
