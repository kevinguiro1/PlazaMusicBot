# 📦 PLAZAMUSICBOT - GUÍA DE DESPLIEGUE EN PRODUCCIÓN

## ✅ SISTEMA COMPLETO DE REGISTRO DE DATOS

### **TODO LO QUE SE REGISTRA:**

| Categoría | Qué se registra | Dónde | Persistencia |
|-----------|-----------------|-------|--------------|
| **👤 Usuarios** | Nombre, teléfono, perfil, ubicación actual | `/data/users/perfiles/usuarios.json` | ✅ Permanente |
| **📍 Ubicaciones** | Historial completo de GPS | `/data/geo/ubicaciones/{numero}.json` | ✅ Últimas 100 por usuario |
| **🎵 Canciones** | Historial por usuario | `/data/users/historial-canciones/{numero}.json` | ✅ Últimas 500 por usuario |
| **🎵 Anti-repetición** | Historial global 1 hora | `/data/music/historial/global.json` | ✅ Permanente |
| **💰 Pagos** | Solicitudes Premium/VIP | `/data/payments/historial/solicitudes.json` | ✅ Permanente |
| **🖼️ Comprobantes** | Imágenes de pagos | `/data/payments/comprobantes/{estado}/` | ✅ Permanente |
| **🚫 Bloqueados** | Lista de bloqueados | `/data/users/bloqueados/bloqueados.json` | ✅ Permanente |
| **⚠️ Infracciones** | Palabras prohibidas, ataques | `/data/users/infracciones/{numero}.json` | ✅ Últimas 100 por usuario |
| **📊 Estadísticas** | Totales, por día, artistas | `/data/configs/estadisticas.json` | ✅ Permanente |
| **📝 Logs Sistema** | Eventos del sistema | `/data/logs/sistema/{fecha}.log` | ✅ 30 días |
| **🚨 Logs Ataques** | Intentos maliciosos | `/data/logs/ataques/{fecha}.log` | ✅ 30 días |
| **💬 Logs Eventos** | Usuarios, pagos, música | `/data/logs/eventos/{tipo}/{fecha}.log` | ✅ 30 días |
| **🎤 Tokens Spotify** | Credenciales activas | `/data/spotify/tokens/active.json` | ✅ Permanente |
| **🗺️ Geocercas** | Configuración de plazas | `/data/geo/geocercas/geocercas.json` | ✅ Permanente |

---

## 📁 ESTRUCTURA DE DIRECTORIOS COMPLETA

```
/opt/plazamusic/data/
│
├── users/                      ← TODO sobre usuarios
│   ├── perfiles/
│   │   └── usuarios.json       ✅ Nombre, teléfono, perfil, stats
│   ├── ubicaciones/
│   │   └── {numero}.json       ✅ Historial GPS (últimas 100)
│   ├── historial-canciones/
│   │   └── {numero}.json       ✅ Canciones pedidas (últimas 500)
│   ├── bloqueados/
│   │   └── bloqueados.json     ✅ Usuarios bloqueados
│   └── infracciones/
│       └── {numero}.json       ✅ Infracciones de seguridad
│
├── payments/                   ← Comprobantes y pagos
│   ├── historial/
│   │   └── solicitudes.json    ✅ Todas las solicitudes
│   └── comprobantes/
│       ├── pendientes/         ✅ Tickets sin revisar
│       ├── aprobados/          ✅ Tickets aprobados
│       └── rechazados/         ✅ Tickets rechazados
│
├── music/                      ← Control del audio
│   ├── historial/
│   │   └── global.json         ✅ Historial anti-repetición (1h)
│   └── cola/
│       └── actual.json         ⚡ Cola en tiempo real
│
├── logs/                       ← Seguridad y auditoría
│   ├── sistema/
│   │   └── sistema-{fecha}.log ✅ Logs generales (30 días)
│   ├── ataques/
│   │   └── ataques-{fecha}.log ✅ Intentos maliciosos (30 días)
│   ├── palabras-prohibidas/
│   │   └── palabras-{fecha}.log ✅ Detecciones (30 días)
│   └── eventos/
│       ├── usuarios/           ✅ Registro, login, cambios
│       ├── pagos/              ✅ Aprobaciones, rechazos
│       └── musica/             ✅ Canciones agregadas
│
├── geo/                        ← GPS y geocercas
│   ├── ubicaciones/
│   │   └── {numero}.json       ✅ Historial de ubicaciones
│   └── geocercas/
│       └── geocercas.json      ✅ Config de plazas (lat/lon/radio)
│
├── configs/                    ← Configuración
│   ├── settings.json           ✅ Config general del sistema
│   ├── estadisticas.json       ✅ Stats globales
│   └── precios.json            ✅ Precios Premium/VIP
│
├── bots/                       ← Multi-bot (futuro)
│   └── default/                📂 Instancia por defecto
│
├── spotify/                    ← Spotify API
│   ├── tokens/
│   │   └── active.json         ✅ Access/Refresh tokens
│   └── playlists/
│       └── current.json        ✅ Playlist actual
│
└── backups/                    ← Respaldos automáticos
    ├── daily/                  ✅ Backups diarios (7 días)
    ├── weekly/                 ✅ Backups semanales (4 semanas)
    └── monthly/                ✅ Backups mensuales (12 meses)
```

---

## 🚀 DESPLIEGUE CON DOCKER

### **1. Preparar el servidor**

```bash
# Crear directorios en el host
sudo mkdir -p /opt/plazamusic/{data,sessions}

# Ejecutar script de estructura
chmod +x scripts/setup-data-structure.sh
sudo DATA_ROOT=/opt/plazamusic/data ./scripts/setup-data-structure.sh
```

### **2. Configurar tokens de Spotify**

```bash
# Crear archivo de tokens
sudo nano /opt/plazamusic/data/spotify/tokens/active.json
```

```json
{
  "clientId": "TU_CLIENT_ID",
  "clientSecret": "TU_CLIENT_SECRET",
  "refreshToken": "TU_REFRESH_TOKEN",
  "playlistId": "ID_DE_LA_PLAYLIST"
}
```

### **3. Configurar administradores**

Editar `docker-compose.yml`:

```yaml
environment:
  ADMIN_NUMBERS: "5218661165920,5218441234567"
  TECNICO_NUMBERS: "5218661165921"
```

### **4. Desplegar**

```bash
# Construir y levantar
docker-compose up -d

# Ver logs
docker-compose logs -f plazamusic-bot

# Verificar salud
docker-compose ps
```

### **5. Escanear QR de WhatsApp**

```bash
# Ver QR en los logs
docker-compose logs plazamusic-bot | grep -A 20 "QR"

# O acceder al contenedor
docker exec -it plazamusic_bot_production /bin/sh
cat /app/sessions/PlazaMusicBot/qr.txt
```

---

## 📊 MONITOREO EN PRODUCCIÓN

### **Ver logs en tiempo real**

```bash
# Logs generales
tail -f /opt/plazamusic/data/logs/sistema/sistema-$(date +%Y-%m-%d).log

# Logs de ataques
tail -f /opt/plazamusic/data/logs/ataques/ataques-$(date +%Y-%m-%d).log

# Logs de eventos de usuarios
tail -f /opt/plazamusic/data/logs/eventos/usuarios/usuarios-$(date +%Y-%m-%d).log
```

### **Verificar estadísticas**

```bash
# Stats globales
cat /opt/plazamusic/data/configs/estadisticas.json | jq

# Usuarios registrados
cat /opt/plazamusic/data/users/perfiles/usuarios.json | jq '. | length'

# Pagos pendientes
cat /opt/plazamusic/data/payments/historial/solicitudes.json | jq '[.[] | select(.estado == "pendiente")] | length'
```

### **Revisar ubicaciones**

```bash
# Ver última ubicación de un usuario
cat /opt/plazamusic/data/geo/ubicaciones/5218441234567.json | jq '.[-1]'

# Contar ubicaciones válidas
cat /opt/plazamusic/data/geo/ubicaciones/5218441234567.json | jq '[.[] | select(.zona_valida == true)] | length'
```

---

## 🔒 SEGURIDAD Y BACKUPS

### **Backup manual**

```bash
# Backup completo
tar -czf /opt/plazamusic/backups/manual/backup-$(date +%Y%m%d-%H%M).tar.gz \
  /opt/plazamusic/data/

# Restaurar backup
tar -xzf /opt/plazamusic/backups/manual/backup-20250214-1200.tar.gz -C /
```

### **Backup automático (cron)**

```bash
# Editar crontab
sudo crontab -e

# Agregar:
# Backup diario a las 2 AM
0 2 * * * tar -czf /opt/plazamusic/backups/daily/backup-$(date +\%Y\%m\%d).tar.gz /opt/plazamusic/data/

# Limpiar backups > 7 días
0 3 * * * find /opt/plazamusic/backups/daily/ -name "*.tar.gz" -mtime +7 -delete
```

### **Permisos correctos**

```bash
# Asegurar permisos
sudo chown -R 1000:1000 /opt/plazamusic/data
sudo chmod -R 755 /opt/plazamusic/data
sudo chmod -R 644 /opt/plazamusic/data/**/*.json
```

---

## 🧰 COMANDOS ÚTILES

### **Reiniciar el bot**

```bash
docker-compose restart plazamusic-bot
```

### **Ver uso de recursos**

```bash
docker stats plazamusic_bot_production
```

### **Acceder al contenedor**

```bash
docker exec -it plazamusic_bot_production /bin/sh
```

### **Ver usuarios en vivo**

```bash
watch -n 5 'cat /opt/plazamusic/data/users/perfiles/usuarios.json | jq ". | length"'
```

### **Limpiar logs antiguos**

```bash
# Eliminar logs > 30 días
find /opt/plazamusic/data/logs -name "*.log" -mtime +30 -delete
```

---

## 📱 PANEL WEB (Opcional)

Si despliegas el panel web:

```bash
# Acceder al panel
http://tu-servidor:8080

# El panel lee de /data/ en modo solo lectura
```

---

## ⚡ SOLUCIÓN DE PROBLEMAS

### **Bot no responde**

```bash
# Ver logs
docker-compose logs --tail=100 plazamusic-bot

# Verificar conexión WhatsApp
docker exec plazamusic_bot_production ls -la /app/sessions/PlazaMusicBot/

# Reiniciar sesión WhatsApp
docker-compose down
sudo rm -rf /opt/plazamusic/sessions/*
docker-compose up -d
```

### **Datos no se guardan**

```bash
# Verificar volumen
docker volume inspect plazamusic_data

# Verificar permisos
ls -la /opt/plazamusic/data/

# Ver errores de escritura
docker-compose logs | grep "Error guardando"
```

### **Memoria llena**

```bash
# Ver uso de disco
du -sh /opt/plazamusic/data/*

# Limpiar logs antiguos
find /opt/plazamusic/data/logs -name "*.log" -mtime +30 -delete

# Limpiar backups antiguos
find /opt/plazamusic/data/backups -type f -mtime +90 -delete
```

---

## ✅ CHECKLIST DE PRODUCCIÓN

- [ ] Directorios creados en `/opt/plazamusic/`
- [ ] Tokens de Spotify configurados
- [ ] Administradores definidos en `docker-compose.yml`
- [ ] Docker Compose levantado
- [ ] QR de WhatsApp escaneado
- [ ] Primera canción probada
- [ ] Logs verificados
- [ ] Backup manual creado
- [ ] Cron de backups configurado
- [ ] Panel web accesible (opcional)
- [ ] Monitoreo configurado

---

## 📞 SOPORTE

- **Logs**: `/opt/plazamusic/data/logs/`
- **Config**: `/opt/plazamusic/data/configs/settings.json`
- **Documentación**: Este archivo `PRODUCCION.md`

---

**🎯 TODO QUEDA GUARDADO EN `/opt/plazamusic/data/` - NUNCA SE PIERDE**
