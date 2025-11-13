# 🌐 Panel de Administración Web - PlazaMusicBot

Panel web interactivo para administrar el bot de música desde el navegador.

## 🚀 Características

### ⚙️ Configuración
- **Límites de Canciones**: Modificar límites por perfil (Normal, Premium, VIP)
- **Ubicación GPS**: Seleccionar ubicación de la plaza con Google Maps
  - Arrastrar marcador para mover ubicación
  - Click en el mapa para colocar marcador
  - Ajustar radio de área válida
- **Seguridad**: Configurar rate limiting y flood detection

### 👥 Gestión de Usuarios
- Ver lista completa de usuarios registrados
- Cambiar perfil de usuarios en tiempo real
- Ver estadísticas por usuario

### 📊 Estadísticas
- Total de usuarios
- Total de canciones pedidas
- Usuarios activos hoy
- Usuarios bloqueados

## 📍 Google Maps Integration

El panel incluye un mapa interactivo de Google Maps que permite:

1. **Ver ubicación actual** de la plaza
2. **Hacer click** en el mapa para cambiar ubicación
3. **Arrastrar marcador** para ajustar posición
4. **Visualizar área válida** con círculo de radio
5. **Ajustar radio** en tiempo real

## 🎯 Uso

### 1. Iniciar el Panel

```bash
npm run panel
```

El panel estará disponible en: **http://localhost:3000**

### 2. Acceder desde el Navegador

Abre tu navegador y ve a `http://localhost:3000`

### 3. Modificar Configuración

#### Límites de Canciones:
1. Ir a la pestaña "Configuración"
2. Ajustar valores de canciones por perfil
3. Click en "Guardar Límites"
4. Reiniciar el bot para aplicar cambios

#### Ubicación GPS:
1. Ir a la sección "Ubicación de la Plaza"
2. Hacer click en el mapa o arrastrar el marcador
3. Ajustar el radio si es necesario
4. Click en "Guardar Ubicación"

#### Cambiar Perfil de Usuario:
1. Ir a la pestaña "Usuarios"
2. Buscar el usuario en la lista
3. Seleccionar nuevo perfil en el dropdown
4. Se guarda automáticamente

## 🛠️ API Endpoints

El panel expone los siguientes endpoints:

### GET /api/config
Obtener configuración actual del sistema

### POST /api/config
Actualizar configuración
```json
{
  "limites": {
    "normal": 3,
    "premium": 3,
    "vip": 1
  },
  "ubicacion": {
    "lat": 23.2494,
    "lon": -106.4111,
    "radioKm": 0.5
  },
  "seguridad": {
    "rateLimit": 20,
    "floodThreshold": 5
  }
}
```

### GET /api/usuarios
Obtener lista de usuarios

### POST /api/usuarios/:numero/perfil
Cambiar perfil de usuario
```json
{
  "perfil": "premium"
}
```

### GET /api/estadisticas
Obtener estadísticas del sistema

## 🎨 Capturas

### Configuración de Límites
![Límites](limits-screenshot.png)

### Selección de Ubicación con Google Maps
![Mapa](map-screenshot.png)

### Gestión de Usuarios
![Usuarios](users-screenshot.png)

## ⚡ Características Avanzadas

### Actualización en Tiempo Real
- Los cambios se guardan inmediatamente
- Feedback visual de éxito/error
- Validación de datos

### Interfaz Responsiva
- Funciona en desktop, tablet y móvil
- Diseño adaptativo
- Experiencia táctil optimizada

### Seguridad
- Solo accesible desde localhost por defecto
- Validación de datos en servidor
- Protección contra inyección

## 🔧 Configuración Avanzada

### Cambiar Puerto

Editar `.env`:
```env
PANEL_PORT=8080
```

### Habilitar Acceso Remoto

**⚠️ Precaución**: Solo habilitar en redes seguras

En `panel/server.js`:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Panel en http://0.0.0.0:${PORT}`);
});
```

### Google Maps API Key

El panel usa una API key pública de Google Maps. Para producción, obtén tu propia key:

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto y habilitar Maps JavaScript API
3. Generar API key
4. Reemplazar en `index.html`:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY"></script>
```

## 📱 Uso desde Móvil

1. Obtener IP local del servidor:
```bash
ifconfig | grep inet
```

2. Acceder desde móvil:
```
http://192.168.x.x:3000
```

3. Usar GPS del móvil para marcar ubicación exacta

## 🚨 Troubleshooting

### Panel no inicia
```bash
# Verificar que el puerto no esté en uso
lsof -i :3000

# Cambiar puerto en .env
PANEL_PORT=3001
```

### Mapa no carga
- Verificar conexión a internet
- Revisar API key de Google Maps
- Verificar consola del navegador (F12)

### Cambios no se aplican
- Reiniciar el bot después de cambios
- Verificar permisos de archivos
- Revisar logs del servidor

## 💡 Tips

- **Backup antes de cambios**: El sistema modifica archivos directamente
- **Reiniciar bot**: Necesario para aplicar cambios de configuración
- **Ubicación precisa**: Usar modo satélite en Google Maps
- **Radio apropiado**: 0.5km recomendado para plazas

## 🔐 Seguridad

- No exponer el panel a Internet sin autenticación
- Usar solo en red local confiable
- Hacer backups regulares de configuración
- Limitar acceso por firewall si es necesario

---

**Panel desarrollado para PlazaMusicBot v2.0**
