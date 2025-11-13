# 🛡️ Sistema de Seguridad - Música Plaza Bot

## Resumen

Sistema de seguridad multicapa diseñado para proteger el bot contra abusos, contenido inapropiado y ataques maliciosos.

---

## 📋 Características de Seguridad

### 1. **Validación de Tipo de Mensaje**

Solo se permiten mensajes de **texto** y **ubicación GPS**. Todos los demás tipos son rechazados automáticamente:

**Tipos Rechazados:**
- ❌ Imágenes/Fotos
- ❌ Videos
- ❌ Audios/Notas de voz
- ❌ Documentos
- ❌ Stickers
- ❌ Contactos
- ❌ **Mensajes reenviados**

**Mensaje al usuario:** `📵 No se permiten imágenes. Solo texto y ubicación.`

### 2. **Filtro de Contenido Avanzado**

Sistema inteligente de filtrado de palabras y frases prohibidas organizado por categorías.

#### Categorías de Contenido Prohibido

| Categoría | Severidad | Acción | Descripción |
|-----------|-----------|--------|-------------|
| **Lenguaje Ofensivo** | 🟡 Media | Advertencia | Palabras obscenas y vulgares |
| **Violencia** | 🟠 Alta | Bloqueo Temporal | Referencias a violencia, armas, amenazas |
| **Narcotráfico** | 🔴 Crítica | Bloqueo Permanente | Términos relacionados con drogas y carteles |
| **Contenido Sexual** | 🟠 Alta | Bloqueo Temporal | Referencias sexuales explícitas |
| **Discriminación** | 🔴 Crítica | Bloqueo Permanente | Lenguaje racista, sexista, homofóbico |
| **Terror** | 🔴 Crítica | Bloqueo Permanente | Referencias terroristas o extremistas |
| **Spam Comercial** | 🟡 Baja | Advertencia | Publicidad no autorizada |

#### Acciones Progresivas

```
Primera infracción (severidad baja/media)
  ↓
⚠️ ADVERTENCIA
  ↓
Segunda infracción (severidad alta)
  ↓
⏰ BLOQUEO TEMPORAL (1 hora)
  ↓
Tercera infracción o severidad crítica
  ↓
🚨 BLOQUEO PERMANENTE
```

### 3. **Sistema de Listas Negras**

#### Lista Negra Temporal
- **Duración:** 60 minutos
- **Motivos:**
  - Violencia
  - Contenido sexual
  - 2 advertencias previas
- **Resultado:** Usuario bloqueado por 1 hora

#### Lista Negra Permanente
- **Duración:** Permanente (requiere desbloqueo manual)
- **Motivos:**
  - Narcotráfico
  - Discriminación
  - Terrorismo
  - 3 o más infracciones
- **Resultado:** Usuario bloqueado permanentemente

### 4. **Protecciones Anti-Abuso**

#### Rate Limiting
```javascript
Límite: 20 mensajes por minuto
Ventana: 60 segundos
Acción: Rechazo temporal de mensajes
```

#### Flood Detection
```javascript
Límite: 5 mensajes en 10 segundos
Ventana: 10 segundos
Acción: Bloqueo temporal de 1 hora
```

#### Spam Detection
```javascript
- Mensajes duplicados (30 seg)
- Caracteres repetidos (>10 veces)
- Mensajes muy largos (>500 caracteres)
Acción: Mensaje rechazado
```

### 5. **Registro de Infracciones**

Cada infracción se registra con:
```json
{
  "fecha": "2025-01-13T12:30:00.000Z",
  "mensaje": "texto del mensaje",
  "categorias": ["violencia", "lenguaje_ofensivo"],
  "severidad": "alta",
  "accion": "bloqueo_temporal"
}
```

---

## 🎯 Flujo de Validación

```
Usuario envía mensaje
    ↓
┌─────────────────────────────────┐
│ 1. Validar Tipo de Mensaje      │
│    ✓ Solo texto y ubicación     │
│    ✗ Fotos, videos, reenvíos    │
└─────────────────────────────────┘
    ↓ PERMITIDO
┌─────────────────────────────────┐
│ 2. Verificar Rate Limit         │
│    ✓ < 20 mensajes/minuto       │
│    ✗ Demasiados mensajes        │
└─────────────────────────────────┘
    ↓ PERMITIDO
┌─────────────────────────────────┐
│ 3. Detectar Flood               │
│    ✓ < 5 mensajes/10 seg        │
│    ✗ Flood detectado            │
└─────────────────────────────────┘
    ↓ PERMITIDO
┌─────────────────────────────────┐
│ 4. Validar Mensaje              │
│    ✓ Longitud correcta          │
│    ✓ No spam de caracteres      │
│    ✗ Mensaje inválido           │
└─────────────────────────────────┘
    ↓ PERMITIDO
┌─────────────────────────────────┐
│ 5. Filtrar Contenido            │
│    ✓ Sin palabras prohibidas    │
│    ✗ Contenido inapropiado      │
└─────────────────────────────────┘
    ↓ PERMITIDO
┌─────────────────────────────────┐
│ 6. Procesar Mensaje             │
│    ✓ Mensaje aceptado           │
└─────────────────────────────────┘
```

---

## 🎛️ Panel de Administración

### Gestión de Palabras Prohibidas

**Acceso:** `http://localhost:3000` → Pestaña "Seguridad"

#### Endpoints API

**Obtener palabras prohibidas:**
```http
GET /api/palabras-prohibidas
```

**Agregar palabra:**
```http
POST /api/palabras-prohibidas/:categoria
Content-Type: application/json

{
  "palabra": "nueva_palabra"
}
```

**Eliminar palabra:**
```http
DELETE /api/palabras-prohibidas/:categoria/:palabra
```

**Recargar configuración:**
```http
POST /api/palabras-prohibidas/recargar
```

### Gestión de Infracciones

**Ver infracciones:**
```http
GET /api/infracciones
```

**Desbloquear usuario:**
```http
POST /api/infracciones/:numero/desbloquear
```

---

## 📁 Archivos de Configuración

### `data/palabras-prohibidas.json`

Archivo JSON editable que contiene todas las palabras prohibidas organizadas por categoría.

```json
{
  "categorias": {
    "lenguaje_ofensivo": {
      "nombre": "Lenguaje Ofensivo",
      "severidad": "medio",
      "accion": "advertencia",
      "palabras": ["palabra1", "palabra2", ...]
    },
    "narcotrafico": {
      "nombre": "Referencias al Narcotráfico",
      "severidad": "critico",
      "accion": "bloqueo_permanente",
      "palabras": [...]
    }
  }
}
```

### `datos/estado.json`

Almacena el estado del sistema incluyendo:
- Usuarios bloqueados
- Infracciones registradas
- Estadísticas de seguridad

---

## 🚀 Implementación Técnica

### Módulos de Seguridad

#### `core/security.js`
- Rate limiting
- Flood detection
- Validación de tipo de mensaje
- Detección de spam
- Gestión de bloqueos temporales

#### `utils/filtroContenido.js`
- Filtrado inteligente de contenido
- Normalización de texto (quita acentos)
- Detección de palabras en contexto
- Sistema de severidad y acciones
- Gestión dinámica de palabras prohibidas

#### `core/messageHandler.js`
- Orquestación de validaciones
- Registro de infracciones
- Aplicación de sanciones
- Manejo de respuestas

---

## 📊 Estadísticas de Seguridad

El sistema mantiene estadísticas en tiempo real:

```javascript
{
  totalCategorias: 7,
  totalPalabras: 150+,
  porCategoria: {
    lenguaje_ofensivo: { cantidad: 20, severidad: "medio" },
    violencia: { cantidad: 26, severidad: "alto" },
    narcotrafico: { cantidad: 35, severidad: "critico" },
    // ...
  }
}
```

---

## 🔧 Mantenimiento

### Agregar Nueva Categoría

1. Editar `data/palabras-prohibidas.json`
2. Agregar nueva categoría con:
   - `nombre`: Nombre descriptivo
   - `severidad`: bajo, medio, alto, critico
   - `accion`: advertencia, bloqueo_temporal, bloqueo_permanente
   - `palabras`: Array de palabras

3. Reiniciar bot o llamar endpoint de recarga

### Agregar Palabras Individuales

**Opción 1: Panel Web**
1. Ir a Seguridad → Palabras Prohibidas
2. Seleccionar categoría
3. Agregar palabra
4. Guardar

**Opción 2: API**
```bash
curl -X POST http://localhost:3000/api/palabras-prohibidas/narcotrafico \
  -H "Content-Type: application/json" \
  -d '{"palabra": "nueva_palabra"}'
```

### Revisar Infracciones

**Panel Web:**
1. Ir a Seguridad → Infracciones
2. Ver lista de usuarios con infracciones
3. Revisar detalles de cada infracción
4. Desbloquear usuarios si es necesario

**API:**
```bash
curl http://localhost:3000/api/infracciones
```

---

## ⚙️ Configuración

### Variables de Entorno

```env
# Seguridad - Rate Limiting
MAX_REQUESTS_PER_MINUTE=20

# Seguridad - Flood Detection
FLOOD_THRESHOLD=5
FLOOD_WINDOW_MS=10000

# Administradores (números que ignoran restricciones)
ADMIN_NUMBERS=5212345678,5219876543
TECNICO_NUMBERS=5211111111,5212222222
```

---

## 🛠️ Troubleshooting

### Usuario bloqueado por error

**Solución:**
```bash
# Opción 1: Panel Web
http://localhost:3000 → Seguridad → Desbloquear usuario

# Opción 2: API
curl -X POST http://localhost:3000/api/infracciones/5212345678/desbloquear
```

### Palabra legítima siendo bloqueada

**Solución:**
1. Ir a `data/palabras-prohibidas.json`
2. Agregar palabra a sección `excepciones`
3. O eliminar de la categoría correspondiente

### Sistema muy estricto

**Ajustar severidades:**
1. Editar `data/palabras-prohibidas.json`
2. Cambiar `severidad` de categorías problemáticas
3. Opciones: `bajo`, `medio`, `alto`, `critico`
4. Recargar configuración

---

## 📝 Notas Importantes

1. **Administradores y Técnicos** no están sujetos a filtros de contenido
2. **Ubicaciones GPS** nunca son filtradas por contenido
3. **Mensajes del sistema** (menu, ayuda, etc.) no pasan por filtros
4. **Palabras en títulos de canciones** pueden tener excepciones
5. **Normalización de texto** quita acentos para mejor detección
6. **Búsqueda de palabras** se hace con límites de palabra completa (`\b`)

---

## 🔒 Mejores Prácticas

1. **Revisar infracciones regularmente** para detectar falsos positivos
2. **Mantener lista de palabras actualizada** según comportamiento
3. **Ajustar severidades** basado en contexto local
4. **Backup de `palabras-prohibidas.json`** antes de cambios mayores
5. **Monitorear logs** para detectar nuevos patrones de abuso
6. **Comunicar reglas claramente** a los usuarios
7. **Ser consistente** en la aplicación de sanciones

---

## 📚 Referencias

- Filtrado de Contenido: `utils/filtroContenido.js`
- Sistema de Seguridad: `core/security.js`
- Manejo de Mensajes: `core/messageHandler.js`
- API del Panel: `panel/server.js`
- Base de Datos: `data/palabras-prohibidas.json`

---

**Última actualización:** 2025-01-13
**Versión:** 2.0.0
