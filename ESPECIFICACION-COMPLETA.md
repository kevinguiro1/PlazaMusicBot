# 📋 ESPECIFICACIÓN COMPLETA - MÚSICA PLAZA BOT

**Versión:** 3.0.0
**Fecha:** 2025-01-13
**Estado:** ESPECIFICACIÓN DEFINITIVA PARA IMPLEMENTACIÓN COMPLETA

---

## 🎯 OBJETIVO

Sistema completo de música interactiva para plazas públicas con:
- WhatsApp como interfaz principal
- Spotify para reproducción
- Sistema de perfiles y pagos
- Panel web de administración completo
- Multi-bot support

---

## 📊 PERFILES DE USUARIO

### 1. USUARIO NORMAL (Gratis)
```yaml
Características:
  - Costo: Gratis
  - Canciones: 3 por día
  - Ubicación: DEBE estar en la plaza
  - Cooldown: 60 minutos
  - Prioridad: Baja (1)

Funcionalidades:
  - Buscar canción (top 10 resultados)
  - Buscar por artista (top 10 resultados)
  - Ver próximas 5 canciones
  - Recibir notificación 2 canciones antes
  - Cancelar su canción (si aún no suena)
  - Solicitar letra de canción (karaoke)
  - Hacerse Premium/VIP (con pago)

Restricciones:
  - NO puede ver cola completa
  - NO puede ver estadísticas
  - NO puede poner música fuera de plaza
```

### 2. USUARIO PREMIUM ($10 MXN)
```yaml
Características:
  - Costo: $10 MXN vía OXXO/SPEI
  - Canciones: 3 por día (configurable por admin)
  - Ubicación: DEBE estar en la plaza
  - Cooldown: 30 minutos
  - Prioridad: Media (2)

Funcionalidades:
  - TODO lo de Usuario Normal +
  - Ver cola completa de reproducción
  - Múltiples dedicatorias pagadas (Fase 2)

Pago:
  - Genera QR de OXXO/SPEI
  - Usuario envía captura
  - Admin aprueba/rechaza
  - Upgrade automático
```

### 3. USUARIO VIP ($100 MXN)
```yaml
Características:
  - Costo: $100 MXN vía OXXO/SPEI
  - Canciones: 1 por hora
  - Ubicación: Pide pero NO valida (puede estar fuera)
  - Cooldown: 60 minutos entre canciones
  - Prioridad: ALTA (3) - va al inicio de cola

Funcionalidades:
  - TODO lo de Premium +
  - Ver estadísticas personales
  - Ver mi perfil
  - Canción va INMEDIATAMENTE después de la actual
  - NO puede cancelar (su canción siempre suena)
  - Dedicatorias pagadas ilimitadas (Fase 2)

Especial:
  - Ubicación se registra solo para estadísticas
  - Puede poner música desde su casa
  - Prioridad máxima en cola
```

### 4. TÉCNICO
```yaml
Características:
  - Asignado por administrador
  - Canciones: Ilimitadas
  - Ubicación: DEBE estar en la plaza
  - Cooldown: 0
  - Prioridad: MÁXIMA (4)

Funcionalidades:
  - TODO lo de VIP +
  - CONTROLES DE AUDIO:
    * Subir volumen
    * Bajar volumen
    * Pausar reproducción
    * Reanudar reproducción
    * Saltar canción actual
    * Siguiente canción
    * Canción anterior
  - Ver cola completa sin límite
  - Eliminar cualquier canción de cola
  - Insertar canción en posición específica
  - Ver artistas/grupos bloqueados
  - Análisis de música tocada
  - Estadísticas en vivo (géneros, artistas, etc.)
  - Ver top canciones del día

Restricciones:
  - NO puede bloquear artistas (solo admin)
  - NO puede cambiar configuración (solo admin)
```

### 5. ADMINISTRADOR
```yaml
Características:
  - Número fijo: 8661165920
  - Canciones: Ilimitadas
  - Ubicación: NO requiere (siempre acepta)
  - Acceso: Total

Funcionalidades:
  - TODO lo de Técnico +

SELECTOR DE PERFIL TEMPORAL:
  - Puede probar como Normal
  - Puede probar como Premium
  - Puede probar como VIP
  - Puede probar como Técnico
  - Puede regresar a Admin en cualquier momento

GESTIÓN DE USUARIOS:
  - Ver todos los usuarios registrados
  - Bloquear/desbloquear usuarios
  - Promover usuarios (cambiar perfil)
  - Degradar usuarios
  - Ver solicitudes de pago pendientes
  - Aprobar/rechazar pagos Premium/VIP
  - Asignar técnicos (agregar número)

GESTIÓN DE MÚSICA:
  - Bloquear artistas/grupos
  - Bloquear canciones específicas
  - Crear listas de reproducción
  - Asignar lista del día
  - Configurar música continua (fondo)
  - Configurar horario auto-stop
  - Ver análisis completo de música
  - Activar/desactivar filtro de contenido

GESTIÓN DE PAGOS:
  - Configurar datos OXXO/SPEI
  - Subir imagen QR de pago
  - Recibir notificaciones de pago
  - Aprobar/rechazar pagos
  - Ver historial de pagos
  - Activar/desactivar perfiles Premium/VIP

GESTIÓN DE MENSAJES:
  - Editar "Buenos días/tardes/noches"
  - Personalizar todos los mensajes del bot
  - Enviar mensaje masivo a todos
  - Enviar anuncio
  - Enviar imagen/promoción/banner

GESTIÓN DE PALABRAS:
  - Agregar palabras prohibidas
  - Eliminar palabras prohibidas
  - Ver categorías de filtros
  - Activar/desactivar filtros

SISTEMA DE BLOQUEOS:
  - Ver lista negra completa
  - Ver razones de bloqueo
  - Dar segundas oportunidades
  - Desbloquear usuarios

CONFIGURACIÓN MULTI-BOT:
  - Ver todos los bots activos
  - Crear nuevo bot
  - Configurar cada bot:
    * Número WhatsApp
    * Sesión Spotify
    * Radio GPS (o sin radio)
    * Límites por perfil
    * Activar/desactivar perfiles
    * Datos de pago

ESTADÍSTICAS GLOBALES:
  - Ver todas las métricas
  - Exportar datos
  - Ver logs del sistema
```

---

## 🔄 FLUJOS COMPLETOS DE INTERACCIÓN

### FLUJO 1: REGISTRO INICIAL

```
Usuario envía: "Hola" (cualquier mensaje)
  ↓
Bot detecta: Usuario nuevo
  ↓
Bot responde:
  [Saludo según hora]
  "¿Cómo te llamas?"
  ↓
Usuario: "Juan"
  ↓
Bot guarda nombre
Bot verifica si es Admin (8661165920) o Técnico
  ↓
SI ES ADMIN:
  Bot: "Bienvenido Administrador Juan"
  Bot: "¿Qué perfil quieres probar?"
    1. Usuario Normal
    2. Usuario Premium
    3. Usuario VIP
    4. Técnico
    5. Panel Admin
  → NO pide ubicación
  → Salta a menú del perfil elegido

SI ES TÉCNICO:
  Bot: "Bienvenido Técnico Juan"
  Bot: "Envía tu ubicación en tiempo real"
  → Si ubicación válida: Menú Técnico
  → Si ubicación inválida: Rechaza

SI ES USUARIO NORMAL:
  Bot: "Envía tu ubicación en tiempo real"
  → Si ubicación válida: Menú Normal
  → Si ubicación inválida:
     Bot: "No estás en la plaza"
     Bot: "¿Quieres ser VIP? ($100 MXN, 1 canción, desde cualquier lugar)"
       - Sí → Proceso de pago VIP
       - No → Despedida
```

### FLUJO 2: BÚSQUEDA Y SELECCIÓN DE MÚSICA

```
Usuario selecciona: "1. Pedir canción"
  ↓
Bot: "¿Cómo quieres buscar?"
  1. Por nombre de canción
  2. Por artista
  0. Volver
  ↓
OPCIÓN 1 - POR CANCIÓN:
  Bot: "Escribe el nombre de la canción"
  Usuario: "despacito"
  ↓
  Bot busca en Spotify
  Bot filtra contenido prohibido
  Bot filtra artistas bloqueados
  ↓
  Bot: "🎵 TOP 10 RESULTADOS"
    1. Despacito - Luis Fonsi, Daddy Yankee (3:47)
    2. Despacito Remix - Luis Fonsi, JB (3:49)
    3. Despacito Salsa - Luis Fonsi (3:50)
    ...
    10. [última opción]

    Escribe 1-10 para seleccionar
    "nueva" para nueva búsqueda
    "artista" para buscar por artista
    0 para volver al menú
  ↓
  Usuario: "1"
  ↓
  Bot verifica:
    - ¿Tiene límite disponible?
    - ¿Ya agregó esta canción hoy?
    - ¿Está en cooldown?
  ↓
  SI TODO OK:
    Bot agrega a Spotify
    Bot calcula posición según prioridad:
      - VIP: posición 1 (siguiente)
      - Técnico: donde él diga
      - Premium: final de cola
      - Normal: final de cola
    ↓
    Bot calcula tiempo de espera
    Bot: "✅ Canción agregada!"
         "🎵 Despacito"
         "🎤 Luis Fonsi, Daddy Yankee"
         "⏱️ Sonará en: 15m 30s"
         "📊 Canciones hoy: 1/3"
         ""
         "💡 Opciones:"
         "- 'letra' para ver la letra"
         "- 'proximas' para ver siguiente música"
         "- 'menu' para volver"

OPCIÓN 2 - POR ARTISTA:
  Bot: "Escribe el nombre del artista"
  Usuario: "Queen"
  ↓
  Bot busca artista en Spotify
  Bot obtiene top tracks del artista
  Bot filtra contenido
  ↓
  Bot: "🎤 QUEEN - TOP 10"
    1. Bohemian Rhapsody (5:55)
    2. Don't Stop Me Now (3:29)
    ...
    10. [última]

    Escribe 1-10 para seleccionar
  ↓
  [mismo proceso de selección]
```

### FLUJO 3: NOTIFICACIÓN 2 CANCIONES ANTES

```
Sistema monitorea cola cada 30 segundos
  ↓
Detecta: Quedan 2 canciones antes de la del usuario
  ↓
Bot envía a usuario:
  "🔔 ¡TU CANCIÓN ESTÁ PRÓXIMA!"
  ""
  "🎵 Despacito - Luis Fonsi"
  "⏱️ Sonará en aproximadamente: 6m 30s"
  ""
  "¿Vas a poder escucharla?"
  "1. Sí, estaré ahí ✅"
  "2. No, cancélala ❌"
  ""
  "Tienes 3 minutos para responder"
  ↓
USUARIO RESPONDE "1" (o no responde):
  → Canción se mantiene en cola
  → Bot: "👍 Perfecto! Disfruta tu música"
  ↓
USUARIO RESPONDE "2":
  → Si es VIP:
      Bot: "💎 Como VIP tu canción no se puede cancelar"
  → Si es Normal/Premium/Técnico:
      Bot elimina canción de Spotify
      Bot restaura contador del usuario (+1 disponible)
      Bot: "✅ Canción cancelada"
           "📊 Canciones disponibles: 2/3"
  ↓
NO RESPONDE EN 3 MINUTOS:
  → Se asume que sí la escuchará
  → Canción se mantiene
```

### FLUJO 4: VER PRÓXIMAS CANCIONES

```
Usuario escribe: "proximas" o selecciona opción
  ↓
Bot consulta cola de Spotify
Bot obtiene próximas 5 canciones
Bot calcula tiempos acumulados
  ↓
Bot: "📜 PRÓXIMAS 5 CANCIONES"
     ""
     "Esta es la lista siguiente para tu deleite:"
     ""
     "▶️ SONANDO AHORA:"
     "Shape of You - Ed Sheeran (1:23 restante)"
     ""
     "🎵 PRÓXIMAS:"
     "1. Despacito - Luis Fonsi (en 1m)"
     "2. Blinding Lights - The Weeknd (en 5m)"
     "3. Levitating - Dua Lipa (en 8m)"
     "4. Bad Habits - Ed Sheeran (en 12m)"
     "5. Stay - The Kid LAROI (en 15m)"
     ""
     "⏱️ Tiempo total de espera: ~15 minutos"
     ""
     "💡 ¿Quieres pedir una canción?"
```

### FLUJO 5: LETRAS DE CANCIÓN (KARAOKE)

```
Después de agregar canción, usuario escribe: "letra"
  ↓
Bot consulta API de letras (Genius/Musixmatch)
Bot obtiene letra completa
  ↓
Bot: "🎤 LETRA - DESPACITO"
     "Luis Fonsi, Daddy Yankee"
     ""
     "━━━━━━━━━━━━━━━━━"
     ""
     [Letra completa aquí]
     ""
     "━━━━━━━━━━━━━━━━━"
     ""
     "💡 Guarda esta letra para cantarla"
     "cuando suene en la plaza!"
```

### FLUJO 6: SISTEMA DE PAGOS

```
Usuario Normal escribe: "2. Hacerte Premium/VIP"
  ↓
Bot: "💰 PLANES DISPONIBLES"
     ""
     "⭐ PREMIUM - $10 MXN"
     "   • 3 canciones por día"
     "   • Ver cola completa"
     "   • Cooldown 30 minutos"
     "   • Debe estar en plaza"
     ""
     "💎 VIP - $100 MXN"
     "   • 1 canción por hora"
     "   • Prioridad ALTA (suena de inmediato)"
     "   • Puedes estar en cualquier lugar"
     "   • Ver estadísticas"
     ""
     "¿Cuál quieres?"
     "1. Premium ($10)"
     "2. VIP ($100)"
     "0. Cancelar"
  ↓
Usuario: "1" (Premium)
  ↓
Bot genera referencia de pago
Bot: "💳 DATOS PARA PAGAR"
     ""
     "Opción 1 - OXXO Pay:"
     [Imagen QR de OXXO]
     ""
     "Opción 2 - TRANSFERENCIA SPEI:"
     "CLABE: 012345678901234567"
     "Banco: BBVA"
     "Beneficiario: Música Plaza"
     "Referencia: MP-8661-001"
     "Monto: $10.00 MXN"
     ""
     "📸 IMPORTANTE:"
     "Envía captura de tu comprobante de pago"
     "para activar tu cuenta Premium"
     ""
     "Tu solicitud: #MP-8661-001"
  ↓
Usuario envía IMAGEN del comprobante
  ↓
Bot detecta imagen
Bot rechaza la imagen (por seguridad normal)
PERO guarda referencia de pago pendiente
  ↓
Bot notifica al ADMIN:
  "💰 NUEVA SOLICITUD DE PAGO"
  ""
  "Usuario: Juan (5218661165920)"
  "Plan: Premium ($10 MXN)"
  "Referencia: MP-8661-001"
  "[Imagen del comprobante]"
  ""
  "¿Aprobar?"
  "1. ✅ Aprobar y activar"
  "2. ❌ Rechazar"
  ↓
ADMIN responde: "1"
  ↓
Sistema actualiza perfil de usuario a Premium
Sistema registra pago
  ↓
Bot envía a usuario:
  "✅ ¡PAGO APROBADO!"
  ""
  "⭐ Tu cuenta Premium está activa"
  "🎵 Límite: 3 canciones/día"
  "⏰ Cooldown: 30 minutos"
  ""
  "¡Disfruta tu música!"
  ""
  "Escribe 'menu' para empezar"
  ↓
ADMIN responde: "2" (Rechazar)
  ↓
Bot envía a usuario:
  "❌ Pago no verificado"
  ""
  "Tu solicitud ha sido rechazada."
  "Verifica tu comprobante y vuelve a intentar"
  "o contacta al administrador"
```

### FLUJO 7: CONTROLES DE AUDIO (TÉCNICO)

```
Técnico en Panel Técnico selecciona:
  "8. Control de Audio"
  ↓
Bot: "🎧 CONTROL DE AUDIO"
     ""
     "Volumen actual: 75%"
     "Estado: Reproduciendo"
     ""
     "1. ➕ Subir volumen (+10%)"
     "2. ➖ Bajar volumen (-10%)"
     "3. ⏸️ Pausar"
     "4. ▶️ Reanudar"
     "5. ⏭️ Siguiente canción"
     "6. ⏮️ Canción anterior"
     "0. Volver"
  ↓
Técnico: "1" (Subir volumen)
  ↓
Sistema llama Spotify API:
  PUT /v1/me/player/volume?volume_percent=85
  ↓
Bot: "✅ Volumen ajustado a 85%"
  ↓
Técnico: "3" (Pausar)
  ↓
Sistema llama Spotify API:
  PUT /v1/me/player/pause
  ↓
Bot: "⏸️ Reproducción pausada"
     "Presiona 4 para reanudar"
```

### FLUJO 8: BLOQUEO DE ARTISTAS (ADMIN)

```
Admin: "Gestión de Música" → "Bloquear artista"
  ↓
Bot: "🚫 BLOQUEAR ARTISTA/GRUPO"
     ""
     "¿Cómo quieres buscar?"
     "1. Por nombre de artista"
     "2. Por nombre de canción"
     "3. Ver lista de bloqueados"
     "0. Volver"
  ↓
Admin: "1"
  ↓
Bot: "Escribe el nombre del artista a bloquear"
Admin: "Grupo Marrano"
  ↓
Bot busca en Spotify
Bot: "¿Bloquear este artista?"
     ""
     "🎤 Grupo Marrano"
     "ID: spotify:artist:xxxxx"
     ""
     "Canciones populares:"
     "- Canción 1"
     "- Canción 2"
     ""
     "✅ Confirmar bloqueo"
     "❌ Cancelar"
  ↓
Admin: "✅"
  ↓
Sistema agrega a lista de artistas bloqueados
Bot: "✅ Artista bloqueado"
     ""
     "Ningún usuario podrá seleccionar"
     "canciones de este artista"
```

### FLUJO 9: LISTAS DE REPRODUCCIÓN

```
Admin: "Gestión de Música" → "Listas de reproducción"
  ↓
Bot: "📜 LISTAS DE REPRODUCCIÓN"
     ""
     "Listas disponibles:"
     "1. Rock Clásico (50 canciones)"
     "2. Pop Latino (80 canciones)"
     "3. Romántica (45 canciones)"
     ""
     "Lista activa HOY: Rock Clásico"
     ""
     "Opciones:"
     "A. Crear nueva lista"
     "B. Cambiar lista del día"
     "C. Ver canciones de lista"
     "D. Configurar música continua"
     "0. Volver"
  ↓
Admin: "B" (Cambiar lista del día)
  ↓
Bot: "Selecciona lista para hoy:"
     "1. Rock Clásico"
     "2. Pop Latino"
     "3. Romántica"
Admin: "2"
  ↓
Sistema cambia lista activa
Bot: "✅ Lista cambiada"
     ""
     "Lista activa: Pop Latino"
     "Esta música sonará cuando no haya"
     "canciones pedidas por usuarios"
  ↓
Admin: "D" (Configurar música continua)
  ↓
Bot: "⚙️ MÚSICA CONTINUA"
     ""
     "Cuando NO hay canciones de usuarios:"
     ""
     "Actual: ✅ Activado"
     "Lista: Pop Latino"
     "Mezcla automática: ✅ Sí"
     ""
     "Prioridad:"
     "1. Canciones de usuarios"
     "2. Música de lista continua"
     ""
     "¿Cambiar configuración?"
     "1. Desactivar música continua"
     "2. Cambiar lista"
     "3. Activar/desactivar mezcla"
     "0. Volver"
```

### FLUJO 10: HORARIO AUTO-STOP

```
Admin: "Configuración" → "Horarios"
  ↓
Bot: "⏰ CONFIGURACIÓN DE HORARIOS"
     ""
     "Auto-stop actual:"
     "Hora: 02:00 AM"
     "Estado: ✅ Activado"
     ""
     "Comportamiento:"
     "- Si NO hay canciones en cola → STOP"
     "- Si hay canciones en cola → Sigue"
     "- Después de última canción → STOP"
     ""
     "¿Qué quieres hacer?"
     "1. Cambiar hora de stop"
     "2. Activar/desactivar"
     "3. Configurar por día de semana"
     "0. Volver"
  ↓
Admin: "1"
  ↓
Bot: "¿A qué hora quieres el auto-stop?"
     "Formato: HH:MM (24 hrs)"
Admin: "03:30"
  ↓
Sistema actualiza configuración
Bot: "✅ Horario actualizado"
     ""
     "Auto-stop: 03:30 AM"
     "Días: Todos"
```

---

## 🎤 DEDICATORIAS Y SALUDOS (FASE 2 - DESACTIVADO INICIALMENTE)

### ESPECIFICACIÓN COMPLETA

```yaml
Funcionalidad:
  - Usuario puede pedir dedicatoria/saludo
  - Bot mejora el texto automáticamente
  - Genera audio con TTS
  - Pausa música de Spotify
  - Reproduce dedicatoria por las bocinas
  - Reanuda música de Spotify

Límites:
  Normal:   1 gratis, resto pagadas ($5 c/u)
  Premium:  3 por pago Premium
  VIP:      Ilimitadas (incluidas en plan)

Voces disponibles:
  - Personajes: Wukong, Bart Simpson, Homer Simpson, etc.
  - Artistas: Selección de voces de cantantes
  - Standard: Voces naturales (ES-MX)

Proceso:
  1. Usuario: "quiero mandar un saludo"
  2. Bot: "¿A quién va dedicado?"
  3. Usuario: "A Pedro Alexander"
  4. Bot: "¿Qué quieres decir?"
  5. Usuario: "Feliz cumpleaños, que lo pases bien con tu familia"
  6. Bot: "¿Qué voz quieres?"
     - Lista de voces disponibles
  7. Usuario: "Bart Simpson"
  8. Bot mejora texto:
     "Feliz cumpleaños Pedro Alexander. Que pases un día increíble
      rodeado de tu familia. ¡Disfruta tu día!"
  9. Bot genera audio
  10. Bot: "✅ Dedicatoria lista"
      "Se reproducirá cuando sea tu turno"
  11. Cuando llega el turno:
      - Spotify.pause()
      - Reproduce audio dedicatoria
      - Spotify.resume()

Estado actual:
  - Código preparado
  - Menús creados PERO desactivados
  - Solo visible para Admin (testing)
  - No aparece a usuarios
```

---

## 🎛️ PANEL WEB - ESPECIFICACIÓN COMPLETA

### SISTEMA DE LOGIN

```yaml
Roles:
  - Super Admin: Ve y controla TODO
  - Admin Bot: Ve y controla solo bots asignados
  - Viewer: Solo lectura

Usuarios:
  Estructura:
    - username: string (único)
    - password: hash bcrypt
    - rol: super_admin | admin_bot | viewer
    - bots_asignados: [bot_id1, bot_id2, ...]
    - fecha_creacion: timestamp
    - ultimo_acceso: timestamp

Funcionalidades:
  - Login con usuario/contraseña
  - Sesión con JWT
  - Logout
  - Cambiar contraseña
  - Super Admin puede crear usuarios
  - Super Admin asigna bots a usuarios
```

### DASHBOARD PRINCIPAL

```yaml
Vistas según rol:

SUPER ADMIN:
  - Lista de todos los bots
  - Estadísticas globales
  - Crear nuevo bot
  - Asignar usuarios a bots

ADMIN BOT:
  - Solo sus bots asignados
  - Configuración de sus bots
  - Estadísticas de sus bots

VIEWER:
  - Solo estadísticas (lectura)
  - No puede modificar nada
```

### CONFIGURACIÓN POR BOT

```yaml
Cada bot tiene:

General:
  - Nombre del bot
  - Número de WhatsApp
  - Estado: Activo/Inactivo
  - Sesión WhatsApp (QR, estado)

Spotify:
  - Client ID
  - Client Secret
  - Refresh Token
  - Playlist ID
  - Estado de conexión

GPS:
  - Activar/desactivar validación
  - Latitud
  - Longitud
  - Radio (km)
  - Mapa interactivo Google Maps

Perfiles:
  - Activar/desactivar Normal
  - Activar/desactivar Premium
  - Activar/desactivar VIP
  - Límites personalizados por perfil
  - Costos de Premium/VIP

Pagos:
  - Datos OXXO/SPEI
  - Imagen QR para mostrar
  - Activar/desactivar pagos

Mensajes:
  - Editor de todos los mensajes del bot
  - Personalizar saludos
  - Personalizar respuestas
  - Preview en tiempo real

Palabras prohibidas:
  - Gestión de categorías
  - Agregar/eliminar palabras
  - Activar/desactivar filtros

Horarios:
  - Configurar auto-stop
  - Horarios por día

Listas:
  - Ver listas de Spotify
  - Asignar lista del día
  - Crear nuevas listas
  - Música continua on/off

Artistas bloqueados:
  - Lista de bloqueados
  - Buscar y bloquear
  - Desbloquear
```

### GESTIÓN DE USUARIOS

```yaml
Vista de usuarios:
  - Tabla con todos los usuarios del bot
  - Filtros: perfil, fecha registro, estado
  - Búsqueda por nombre/número

Acciones:
  - Ver perfil completo
  - Cambiar perfil
  - Bloquear/desbloquear
  - Ver historial de canciones
  - Ver pagos realizados
  - Enviar mensaje directo
```

### GESTIÓN DE PAGOS

```yaml
Solicitudes pendientes:
  - Lista de pagos por aprobar
  - Usuario, plan, referencia
  - Imagen del comprobante
  - Fecha/hora de solicitud
  - Botones: Aprobar / Rechazar

Historial:
  - Todos los pagos (aprobados/rechazados)
  - Filtros por fecha, usuario, plan
  - Exportar a Excel/PDF

Configuración:
  - Editar datos bancarios
  - Subir nuevo QR
  - Previsualizar QR actual
```

### ESTADÍSTICAS Y ANÁLISIS

```yaml
En tiempo real:
  - Usuarios activos hoy
  - Canciones reproducidas
  - Canciones en cola
  - Estado de Spotify
  - Uso por perfil

Gráficas:
  - Canciones por hora
  - Géneros más solicitados
  - Artistas más pedidos
  - Uso por perfil (pie chart)
  - Usuarios nuevos (línea de tiempo)

Reportes:
  - Generar reporte diario
  - Generar reporte semanal
  - Generar reporte mensual
  - Exportar Excel/PDF
```

### MENSAJERÍA

```yaml
Mensaje masivo:
  - Seleccionar destinatarios:
    * Todos
    * Por perfil (Normal, Premium, VIP)
    * Usuarios específicos
  - Tipo de mensaje:
    * Texto
    * Imagen + texto
    * Promoción/Banner
  - Preview antes de enviar
  - Confirmación
  - Ver estado de envíos

Anuncios:
  - Programar anuncio
  - Fecha/hora de envío
  - Destinatarios
  - Guardar plantillas
```

---

## 📦 ESTRUCTURA DE CARPETAS DEFINITIVA

```
PlazaMusicBot/
├── data/                          # Carpeta principal de datos
│   ├── usuarios/                  # Datos de usuarios
│   │   ├── normal/
│   │   ├── premium/
│   │   ├── vip/
│   │   ├── tecnico/
│   │   └── admin/
│   ├── perfiles/                  # Configuración de perfiles
│   ├── estadisticas/              # Estadísticas y análisis
│   ├── qrs-pago/                  # Imágenes QR de pago
│   ├── menus/                     # Textos de menús editables
│   ├── mensajes/                  # Mensajes del bot editables
│   ├── listas-spotify/            # Listas de reproducción
│   ├── palabras-prohibidas/       # Filtros de contenido
│   ├── artistas-bloqueados/       # Artistas/grupos bloqueados
│   ├── pagos/                     # Historial de pagos
│   ├── infracciones/              # Registro de infracciones
│   ├── backups/                   # Backups automáticos
│   └── logs/                      # Logs del sistema
│       ├── whatsapp/
│       ├── spotify/
│       └── sistema/
│
├── core/                          # Núcleo del sistema
│   ├── profiles.js
│   ├── menus.js
│   ├── messageHandler.js
│   ├── security.js
│   ├── dataManager.js
│   ├── monitoring.js
│   ├── payments.js              # NUEVO
│   ├── notifications.js         # NUEVO
│   ├── musicQueue.js            # NUEVO
│   └── scheduler.js             # NUEVO
│
├── perfiles/                      # Lógica por perfil
│   ├── usuario.js
│   ├── tecnico.js
│   └── admin.js
│
├── conexion/                      # Integraciones externas
│   ├── whatsapp.js
│   ├── spotify.js
│   ├── payments/                # NUEVO
│   │   ├── oxxo.js
│   │   └── spei.js
│   └── tts/                     # NUEVO (Fase 2)
│       ├── elevenlabs.js
│       └── google-tts.js
│
├── utils/                         # Utilidades
│   ├── logger.js
│   ├── saludos.js
│   ├── filtroContenido.js
│   ├── ubicacion.js
│   ├── lyrics.js                # NUEVO
│   └── queue.js                 # NUEVO
│
├── panel/                         # Panel web
│   ├── server.js
│   ├── auth/                    # NUEVO
│   │   ├── login.js
│   │   ├── jwt.js
│   │   └── roles.js
│   ├── routes/                  # NUEVO
│   │   ├── bots.js
│   │   ├── users.js
│   │   ├── payments.js
│   │   ├── stats.js
│   │   └── messages.js
│   └── public/
│       ├── index.html
│       ├── login.html           # NUEVO
│       ├── dashboard.html       # NUEVO
│       └── css/
│
├── scripts/                       # Scripts auxiliares
│   ├── setup-nginx.sh
│   ├── backup.sh                # NUEVO
│   └── migrate.sh               # NUEVO
│
├── nginx/                         # Configuración NGINX
│   ├── nginx.conf
│   └── sites-available/
│
├── docker/                        # NUEVO - Docker
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── docs/                          # Documentación
│   ├── FLUJOS-COMPLETOS.md
│   ├── SEGURIDAD.md
│   ├── NGINX.md
│   ├── PANEL.md
│   ├── PRECIOS.md
│   └── API.md                   # NUEVO
│
├── tests/                         # NUEVO - Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── package.json
├── bot.js
└── README.md
```

---

## 🔌 APIs Y LIBRERÍAS

### SPOTIFY API - FUNCIONES COMPLETAS

```javascript
// REPRODUCCIÓN
spotify.play()                    // Iniciar reproducción
spotify.pause()                   // Pausar
spotify.resume()                  // Reanudar
spotify.next()                    // Siguiente canción
spotify.previous()                // Canción anterior
spotify.seek(position_ms)         // Saltar a posición

// VOLUMEN
spotify.setVolume(percent)        // Ajustar volumen 0-100

// COLA
spotify.addToQueue(uri)           // Agregar canción
spotify.getQueue()                // Ver cola
spotify.removeFromQueue(uri)      // Eliminar de cola

// BÚSQUEDA
spotify.search(query, type)       // Buscar canciones/artistas
spotify.getArtist(id)            // Info de artista
spotify.getArtistTopTracks(id)   // Top tracks de artista

// PLAYLIST
spotify.getPlaylist(id)          // Ver playlist
spotify.addToPlaylist(uri)       // Agregar a playlist
spotify.removeFromPlaylist(uri)  // Quitar de playlist
spotify.reorderPlaylist()        // Reordenar

// ESTADO
spotify.getCurrentTrack()        // Canción actual
spotify.getPlayer()              // Estado completo del player

// RECOMENDACIONES (Spotify AI)
spotify.getRecommendations(params) // Recomendaciones IA
```

### WHATSAPP (Baileys) - FUNCIONES

```javascript
// CONEXIÓN
baileys.makeWASocket()           // Crear conexión
baileys.useMultiFileAuthState()  // Manejo de sesión

// MENSAJES
sock.sendMessage(jid, content)   // Enviar mensaje
sock.readMessages(keys)          // Marcar como leído
sock.sendPresenceUpdate()        // Estado (escribiendo, etc)

// MULTIMEDIA
sock.downloadMediaMessage()      // Descargar imagen/audio
sock.sendImage()                 // Enviar imagen
sock.sendAudio()                 // Enviar audio

// GRUPOS (si se necesita)
sock.groupMetadata()             // Info de grupo
sock.groupParticipants()         // Participantes
```

### LETRAS - Genius/Musixmatch API

```javascript
// GENIUS API
genius.searchSong(query)         // Buscar canción
genius.getLyrics(songId)         // Obtener letra

// MUSIXMATCH (alternativa)
musixmatch.search(query)
musixmatch.getLyrics(trackId)
```

### TTS - ElevenLabs/Google (Fase 2)

```javascript
// ELEVENLABS
elevenlabs.textToSpeech({
  text: string,
  voice_id: string,             // Personaje/Artista
  model_id: string
})

// GOOGLE TTS
googleTTS.synthesize({
  text: string,
  voice: string,
  languageCode: 'es-MX'
})
```

### PAGOS - OXXO/SPEI

```javascript
// Generar referencia OXXO
oxxo.generateReference({
  amount: number,
  description: string,
  customer: object
})

// Generar QR OXXO
oxxo.generateQR(reference)

// Verificar pago
oxxo.checkPayment(reference)

// SPEI - Generar CLABE
spei.generateCLABE({
  amount: number,
  reference: string
})
```

---

## ⚙️ VARIABLES DE ENTORNO COMPLETAS

```env
# WHATSAPP
SESSION_DIR=./session

# SPOTIFY
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
SPOTIFY_PLAYLIST_ID=
SPOTIFY_DEVICE_ID=

# UBICACIÓN GPS
PLAZA_LAT=23.2494
PLAZA_LON=-106.4111
PLAZA_RADIUS_KM=0.5
GPS_VALIDATION_ENABLED=true

# PERFILES - LÍMITES
LIMITE_CANCIONES_NORMAL=3
LIMITE_CANCIONES_PREMIUM=3
LIMITE_CANCIONES_VIP=1

# PERFILES - ACTIVACIÓN
PERFIL_NORMAL_ENABLED=true
PERFIL_PREMIUM_ENABLED=true
PERFIL_VIP_ENABLED=true

# PERFILES - PRECIOS
PRECIO_PREMIUM=10
PRECIO_VIP=100

# ADMINISTRADORES
ADMIN_NUMBERS=8661165920
TECNICO_NUMBERS=

# SEGURIDAD
MAX_REQUESTS_PER_MINUTE=20
FLOOD_THRESHOLD=5
FLOOD_WINDOW_MS=10000

# PANEL WEB
PANEL_PORT=3000
JWT_SECRET=
SESSION_TIMEOUT=3600

# PAGOS
OXXO_API_KEY=
OXXO_SECRET=
SPEI_CLABE=
SPEI_BANCO=BBVA
SPEI_BENEFICIARIO=Música Plaza

# LETRAS
GENIUS_API_KEY=
MUSIXMATCH_API_KEY=

# TTS (Fase 2)
ELEVENLABS_API_KEY=
GOOGLE_TTS_API_KEY=

# HORARIOS
AUTO_STOP_ENABLED=true
AUTO_STOP_TIME=02:00

# MÚSICA CONTINUA
CONTINUOUS_MUSIC_ENABLED=true
DEFAULT_PLAYLIST_ID=

# NOTIFICACIONES
NOTIFY_2_SONGS_BEFORE=true
NOTIFICATION_TIMEOUT_MINUTES=3

# LOGS
LOG_LEVEL=info
LOG_TO_FILE=true
```

---

## 🐳 DOCKER CONFIGURATION

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código
COPY . .

# Crear directorios
RUN mkdir -p \
    data/usuarios \
    data/backups \
    data/logs \
    session

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health')"

# Start
CMD ["node", "bot.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Bot principal
  musicaplaza-bot:
    build: .
    container_name: musicaplaza-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./data:/app/data
      - ./session:/app/session
    ports:
      - "3000:3000"
    networks:
      - musicaplaza-net
    depends_on:
      - nginx

  # NGINX
  nginx:
    image: nginx:alpine
    container_name: musicaplaza-nginx
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/sites-available:/etc/nginx/sites-available
      - ./nginx/ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
    networks:
      - musicaplaza-net

  # MongoDB (opcional - para escalar)
  # mongodb:
  #   image: mongo:6
  #   container_name: musicaplaza-db
  #   restart: unless-stopped
  #   volumes:
  #     - mongodb-data:/data/db
  #   networks:
  #     - musicaplaza-net

networks:
  musicaplaza-net:
    driver: bridge

volumes:
  mongodb-data:
```

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### FASE 1 - CRÍTICO (Esta semana)
```
1. ✅ Flujo búsqueda mejorado (top 10)
2. ✅ Ver próximas 5 canciones
3. ✅ Notificaciones 2 canciones antes
4. ✅ Sistema de pagos OXXO/SPEI
5. ✅ Controles de audio (técnico)
```

### FASE 2 - IMPORTANTE (Próximas 2 semanas)
```
6. ✅ Login multi-tenant
7. ✅ Selector perfil temporal (admin)
8. ✅ Bloqueo artistas/grupos
9. ✅ Listas de reproducción
10. ✅ Música continua
11. ✅ Horarios auto-stop
12. ✅ Letras de canciones
13. ✅ Editor de mensajes
```

### FASE 3 - OPTIMIZACIÓN (Mes 1)
```
14. ✅ Estructura carpetas
15. ✅ Docker completo
16. ✅ Backup automático
17. ✅ Tests unitarios
18. ✅ Documentación API
```

### FASE 4 - FUTURO (A demanda)
```
19. ⏸️ Dedicatorias TTS
20. ⏸️ Voces personajes
21. ⏸️ IA Spotify avanzada
22. ⏸️ App móvil admin
```

---

## 📝 MENSAJES EXACTOS DEL BOT

### Saludos personalizados
```
06:00-12:00: "🌅 Buenos días"
12:00-20:00: "☀️ Buenas tardes"
20:00-06:00: "🌙 Buenas noches"
```

### Bienvenida
```
"[Saludo]! 🎵

¡BIENVENIDO A MÚSICA PLAZA!

Soy tu asistente musical para la plaza.
Puedo ayudarte a:

🎵 Pedir tus canciones favoritas
🎤 Descubrir música de artistas
📊 Ver estadísticas de reproducción
💎 Y mucho más...

Para comenzar, por favor dime:
¿Cómo te llamas?"
```

### Mensajes editables desde panel
```
- Todos los mensajes del bot
- Saludos
- Menús
- Confirmaciones
- Errores
- Notificaciones
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

Para que TODO esté completo, debe cumplir:

```
✅ Todos los perfiles funcionan correctamente
✅ GPS valida según especificación
✅ Búsqueda muestra top 10
✅ Notificaciones 2 canciones antes funcionan
✅ Sistema de pagos completo y funcional
✅ Panel web con login funciona
✅ Técnico puede controlar audio
✅ Admin puede bloquear artistas
✅ Listas de reproducción funcionan
✅ Música continua automática
✅ Auto-stop por horario
✅ Letras de canciones
✅ Editor de mensajes
✅ Multi-bot support
✅ Docker funcional
✅ Documentación completa
✅ Sin errores en producción
✅ Tests básicos pasan
```

---

**FIN DE ESPECIFICACIÓN**

Esta especificación es DEFINITIVA y COMPLETA.
Todo lo necesario está aquí para implementación total.
