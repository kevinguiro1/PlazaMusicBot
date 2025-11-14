#!/bin/bash
# setup-data-structure.sh - Crear estructura de directorios para producción
# Este script crea la estructura completa de datos para PlazaMusicBot

# Determinar directorio base
if [ -n "$DATA_ROOT" ]; then
  BASE_DIR="$DATA_ROOT"
else
  BASE_DIR="/opt/plazamusic/data"
fi

echo "🚀 Creando estructura de datos en: $BASE_DIR"

# Crear directorios principales
mkdir -p "$BASE_DIR"/{users,payments,music,logs,geo,configs,bots,spotify}

# === USERS === (Todo sobre usuarios)
mkdir -p "$BASE_DIR/users"/{perfiles,ubicaciones,historial-canciones,bloqueados,tecnicos,infracciones}

# === PAYMENTS === (Comprobantes y pagos)
mkdir -p "$BASE_DIR/payments"/{premium,vip,historial,comprobantes}
mkdir -p "$BASE_DIR/payments/comprobantes"/{pendientes,aprobados,rechazados}

# === MUSIC === (Control del audio)
mkdir -p "$BASE_DIR/music"/{cola,historial,bloqueos,volumen,playlists}

# === LOGS === (Seguridad y auditoría)
mkdir -p "$BASE_DIR/logs"/{ataques,palabras-prohibidas,reenvios,eventos,errores,sistema}
mkdir -p "$BASE_DIR/logs/eventos"/{usuarios,pagos,musica,admin}

# === GEO === (GPS y distancias)
mkdir -p "$BASE_DIR/geo"/{ubicaciones,geocercas,historico}

# === CONFIGS === (Configuraciones del bot)
mkdir -p "$BASE_DIR/configs"/{mensajes,plantillas,qrs,precios}

# === BOTS === (Multi-bot - placeholder para futuras instancias)
mkdir -p "$BASE_DIR/bots"/{default}

# === SPOTIFY === (Tokens y playlists)
mkdir -p "$BASE_DIR/spotify"/{tokens,playlists,historial}

# === BACKUPS ===
mkdir -p "$BASE_DIR/backups"/{daily,weekly,monthly}

echo "✅ Estructura de directorios creada exitosamente"

# Crear archivos iniciales vacíos
echo "📝 Creando archivos de configuración iniciales..."

# Users
echo "{}" > "$BASE_DIR/users/perfiles.json"
echo "[]" > "$BASE_DIR/users/ubicaciones.json"
echo "[]" > "$BASE_DIR/users/historial-canciones.json"
echo "{}" > "$BASE_DIR/users/bloqueados.json"
echo "[]" > "$BASE_DIR/users/tecnicos.json"
echo "[]" > "$BASE_DIR/users/infracciones.json"

# Payments
echo "[]" > "$BASE_DIR/payments/historial/pagos.json"

# Music
echo "[]" > "$BASE_DIR/music/cola.json"
echo "[]" > "$BASE_DIR/music/historial.json"
echo "{}" > "$BASE_DIR/music/volumen/config.json"

# Geo
echo "[]" > "$BASE_DIR/geo/ubicaciones.json"
echo '{
  "plaza": {
    "nombre": "Plaza Principal",
    "lat": 23.2494,
    "lon": -106.4111,
    "radio_metros": 500
  }
}' > "$BASE_DIR/geo/geocercas.json"

# Configs
echo '{
  "sistema": {
    "version": "1.0.0",
    "nombre": "PlazaMusicBot",
    "modo": "produccion"
  },
  "limites": {
    "normal": 3,
    "premium": 10,
    "vip": 999
  },
  "precios": {
    "premium": 10,
    "vip": 100
  }
}' > "$BASE_DIR/configs/settings.json"

# Spotify
echo '{}' > "$BASE_DIR/spotify/tokens/active.json"
echo '[]' > "$BASE_DIR/spotify/playlists/current.json"

echo "✅ Archivos de configuración iniciales creados"

# Configurar permisos
echo "🔒 Configurando permisos..."
chmod -R 755 "$BASE_DIR"
chmod -R 644 "$BASE_DIR"/**/*.json

echo ""
echo "✨ Estructura completa creada en: $BASE_DIR"
echo ""
echo "📂 Estructura:"
tree -L 2 "$BASE_DIR" 2>/dev/null || ls -R "$BASE_DIR"
echo ""
echo "🎯 Listo para usar en producción con Docker"
