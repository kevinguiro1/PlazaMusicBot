# 🌐 Configuración de NGINX - Música Plaza Bot

Guía completa para configurar NGINX como reverse proxy para el panel de administración del bot.

---

## 📋 Tabla de Contenidos

- [¿Qué es NGINX?](#qué-es-nginx)
- [Ventajas de usar NGINX](#ventajas-de-usar-nginx)
- [Instalación Automática](#instalación-automática)
- [Instalación Manual](#instalación-manual)
- [Configuración](#configuración)
- [SSL/HTTPS](#sslhttps)
- [Comandos Útiles](#comandos-útiles)
- [Troubleshooting](#troubleshooting)
- [Optimizaciones](#optimizaciones)

---

## 🤔 ¿Qué es NGINX?

NGINX es un servidor web y reverse proxy de alto rendimiento que:
- Actúa como intermediario entre clientes (navegadores) y tu aplicación Node.js
- Mejora el rendimiento con caché y compresión
- Proporciona seguridad adicional
- Permite usar SSL/HTTPS de manera sencilla
- Maneja múltiples conexiones concurrentes eficientemente

---

## ✨ Ventajas de usar NGINX

### 🚀 **Rendimiento**
- **Compresión Gzip**: Reduce tamaño de respuestas hasta 70%
- **Caché de archivos estáticos**: CSS, JS, imágenes se sirven desde caché
- **Keep-alive connections**: Reduce latencia en múltiples peticiones

### 🔒 **Seguridad**
- **SSL/HTTPS**: Cifrado de todas las comunicaciones
- **Rate limiting**: Protección contra ataques DDoS
- **Security headers**: Protección contra XSS, clickjacking, etc.
- **Oculta servidor interno**: Clientes no acceden directamente a Node.js

### 📊 **Escalabilidad**
- **Load balancing**: Distribuye tráfico entre múltiples instancias
- **Failover automático**: Si Node.js falla, reintentos automáticos
- **Manejo de conexiones**: Miles de conexiones simultáneas

### 🛠️ **Operaciones**
- **Logs centralizados**: Todos los accesos en un solo lugar
- **Monitoreo**: Endpoints de salud y estadísticas
- **Sin downtime**: Recarga de configuración sin interrumpir servicio

---

## 🚀 Instalación Automática

### Opción 1: Script de Instalación (Recomendado)

```bash
# 1. Ejecutar script de instalación
sudo ./scripts/setup-nginx.sh

# 2. Seguir las instrucciones en pantalla
# El script instalará NGINX, copiará configuración, y configurará SSL

# 3. Iniciar el panel Node.js
npm run panel

# 4. Abrir navegador
http://musicaplaza.local
```

**El script hace:**
- ✅ Instala NGINX si no está instalado
- ✅ Copia la configuración del sitio
- ✅ Habilita el sitio
- ✅ Genera certificados SSL (opcional)
- ✅ Configura /etc/hosts
- ✅ Verifica configuración
- ✅ Reinicia NGINX

---

## 🔧 Instalación Manual

### Paso 1: Instalar NGINX

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx -y
```

**CentOS/RHEL:**
```bash
sudo yum install nginx -y
# o
sudo dnf install nginx -y
```

**Verificar instalación:**
```bash
nginx -v
# nginx version: nginx/1.18.0 (Ubuntu)
```

### Paso 2: Copiar Configuración

```bash
# Copiar configuración del sitio
sudo cp nginx/sites-available/musicaplaza /etc/nginx/sites-available/

# Crear enlace simbólico para habilitar
sudo ln -s /etc/nginx/sites-available/musicaplaza /etc/nginx/sites-enabled/

# Eliminar sitio default (opcional)
sudo rm /etc/nginx/sites-enabled/default
```

### Paso 3: Configurar /etc/hosts

```bash
# Agregar entrada para desarrollo local
sudo nano /etc/nginx/sites-enabled/default

# Agregar esta línea:
127.0.0.1    musicaplaza.local
```

### Paso 4: Verificar Configuración

```bash
# Verificar sintaxis
sudo nginx -t

# Debe mostrar:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Paso 5: Iniciar NGINX

```bash
# Iniciar NGINX
sudo systemctl start nginx

# Habilitar en arranque
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx
```

### Paso 6: Iniciar Panel Node.js

```bash
# En el directorio del proyecto
npm run panel
```

### Paso 7: Probar

Abrir navegador en: **http://musicaplaza.local** o **http://localhost**

---

## 🔐 SSL/HTTPS

### Opción 1: Certificados Autofirmados (Desarrollo)

**Generar certificados:**
```bash
# Usar script incluido
./nginx/ssl/generate-self-signed-cert.sh

# O manualmente:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=MX/ST=Sinaloa/L=Mazatlan/O=Musica Plaza/CN=musicaplaza.local"
```

**Configurar NGINX:**
El archivo `nginx/sites-available/musicaplaza` ya incluye la configuración SSL.

**Editar para usar certificados autofirmados:**
```nginx
# En la sección server (puerto 443), descomentar:
ssl_certificate /home/user/PlazaMusicBot/nginx/ssl/cert.pem;
ssl_certificate_key /home/user/PlazaMusicBot/nginx/ssl/key.pem;

# Y comentar:
# ssl_certificate /etc/letsencrypt/live/musicaplaza.local/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/musicaplaza.local/privkey.pem;
```

**Reiniciar NGINX:**
```bash
sudo systemctl restart nginx
```

**Acceder:**
- HTTPS: https://musicaplaza.local
- ⚠️ El navegador mostrará advertencia (normal con certificados autofirmados)

### Opción 2: Let's Encrypt (Producción)

**Instalar Certbot:**
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

**Obtener certificado:**
```bash
# Reemplazar con tu dominio real
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Seguir instrucciones en pantalla
```

**Renovación automática:**
```bash
# Certbot crea un cron job automático
# Verificar:
sudo certbot renew --dry-run

# Forzar renovación (si expira en <30 días):
sudo certbot renew
```

**Configuración NGINX:**
```nginx
# En nginx/sites-available/musicaplaza
# Descomentar bloque de redirección HTTP → HTTPS:
server {
    listen 80;
    server_name tudominio.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 🎛️ Configuración

### Estructura de Archivos

```
PlazaMusicBot/
├── nginx/
│   ├── nginx.conf                    # Configuración principal
│   ├── sites-available/
│   │   └── musicaplaza              # Configuración del sitio
│   ├── sites-enabled/               # Enlaces simbólicos
│   ├── ssl/
│   │   ├── cert.pem                 # Certificado SSL
│   │   ├── key.pem                  # Clave privada SSL
│   │   └── generate-self-signed-cert.sh
│   └── logs/                        # Logs locales (opcional)
└── scripts/
    └── setup-nginx.sh               # Script de instalación
```

### Configuración Principal (nginx.conf)

**Parámetros clave:**

```nginx
# Procesos de trabajo (auto = número de CPUs)
worker_processes auto;

# Conexiones por worker
worker_connections 768;

# Compresión gzip
gzip on;
gzip_comp_level 6;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

### Configuración del Sitio (musicaplaza)

**Bloques principales:**

#### 1. Upstream (Backend)
```nginx
upstream nodejs_backend {
    server 127.0.0.1:3000;    # Servidor Node.js
    keepalive 32;              # Conexiones persistentes
}
```

#### 2. Servidor HTTP (puerto 80)
```nginx
server {
    listen 80;
    server_name musicaplaza.local;

    # Archivos estáticos
    root /home/user/PlazaMusicBot/panel/public;

    # Proxy a API
    location /api/ {
        proxy_pass http://nodejs_backend;
        # ... headers
    }
}
```

#### 3. Servidor HTTPS (puerto 443)
```nginx
server {
    listen 443 ssl http2;
    server_name musicaplaza.local;

    # Certificados SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ... resto de configuración
}
```

### Personalización

**Cambiar puerto de Node.js:**
```nginx
# Si Node.js corre en puerto diferente (ej: 4000)
upstream nodejs_backend {
    server 127.0.0.1:4000;    # <-- Cambiar aquí
}
```

**Cambiar límites de rate limiting:**
```nginx
# nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;  # 20 req/seg

# musicaplaza
location /api/ {
    limit_req zone=api_limit burst=30 nodelay;  # Ráfaga de 30
}
```

**Agregar dominio adicional:**
```nginx
server {
    listen 80;
    server_name musicaplaza.local otro-dominio.com;  # <-- Agregar aquí
    # ...
}
```

---

## 🛠️ Comandos Útiles

### Gestión de NGINX

```bash
# Iniciar
sudo systemctl start nginx

# Detener
sudo systemctl stop nginx

# Reiniciar (interrumpe conexiones)
sudo systemctl restart nginx

# Recargar configuración (sin interrumpir)
sudo systemctl reload nginx

# Ver estado
sudo systemctl status nginx

# Habilitar en arranque
sudo systemctl enable nginx

# Deshabilitar en arranque
sudo systemctl disable nginx
```

### Verificación de Configuración

```bash
# Verificar sintaxis
sudo nginx -t

# Verificar y mostrar configuración procesada
sudo nginx -T

# Ver versión y módulos compilados
nginx -V
```

### Logs

```bash
# Ver logs de acceso
sudo tail -f /var/log/nginx/musicaplaza_access.log

# Ver logs de error
sudo tail -f /var/log/nginx/musicaplaza_error.log

# Ver logs generales de NGINX
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Filtrar por IP
sudo grep "192.168.1.100" /var/log/nginx/musicaplaza_access.log

# Ver últimas 100 líneas
sudo tail -n 100 /var/log/nginx/musicaplaza_error.log
```

### Testing

```bash
# Probar endpoint de salud
curl http://localhost/health

# Probar con headers
curl -I http://musicaplaza.local

# Probar API
curl http://musicaplaza.local/api/config

# Probar HTTPS (ignorar certificado autofirmado)
curl -k https://musicaplaza.local/health

# Ver tiempo de respuesta
curl -o /dev/null -s -w 'Total: %{time_total}s\n' http://musicaplaza.local
```

---

## 🔍 Troubleshooting

### Problema: NGINX no inicia

**Error:** `nginx.service: Failed with result 'exit-code'.`

**Verificar:**
```bash
# Ver logs detallados
sudo journalctl -xeu nginx.service

# Verificar configuración
sudo nginx -t

# Verificar puerto no esté ocupado
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

**Solución:**
```bash
# Si puerto 80/443 está ocupado por Apache u otro servicio
sudo systemctl stop apache2   # o httpd en CentOS

# Si hay error de sintaxis, revisar configuración
sudo nano /etc/nginx/sites-available/musicaplaza
```

---

### Problema: 502 Bad Gateway

**Causa:** Node.js no está corriendo o no responde.

**Verificar:**
```bash
# ¿Node.js está corriendo?
curl http://localhost:3000/health

# Ver procesos Node.js
ps aux | grep node

# Ver logs del panel
cd /home/user/PlazaMusicBot
npm run panel
```

**Solución:**
```bash
# Iniciar panel Node.js
npm run panel

# En producción, usar PM2
pm2 start panel/server.js --name musicaplaza-panel
```

---

### Problema: 404 Not Found

**Causa:** Ruta incorrecta o sitio no habilitado.

**Verificar:**
```bash
# ¿Sitio está habilitado?
ls -la /etc/nginx/sites-enabled/

# Debe aparecer: musicaplaza -> ../sites-available/musicaplaza

# ¿Configuración correcta?
sudo nginx -t
```

**Solución:**
```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/musicaplaza /etc/nginx/sites-enabled/

# Recargar
sudo systemctl reload nginx
```

---

### Problema: Certificado SSL rechazado

**Causa:** Certificado autofirmado o expirado.

**Para desarrollo (certificado autofirmado):**
- Chrome: Escribir `thisisunsafe` en la página de advertencia
- Firefox: Avanzado → Aceptar riesgo

**Para producción:**
```bash
# Renovar con Let's Encrypt
sudo certbot renew

# Verificar fechas
openssl x509 -in /etc/letsencrypt/live/tudominio.com/cert.pem -noout -dates
```

---

### Problema: Rate limit bloqueando peticiones

**Error:** `503 Service Temporarily Unavailable`

**Logs:**
```
limiting requests, excess: 5.123 by zone "api_limit"
```

**Solución:**
```nginx
# Aumentar límites en nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

# Aumentar burst en musicaplaza
location /api/ {
    limit_req zone=api_limit burst=50 nodelay;
}
```

```bash
# Recargar configuración
sudo systemctl reload nginx
```

---

### Problema: Archivos estáticos no se cargan

**Causa:** Permisos o ruta incorrecta.

**Verificar:**
```bash
# Permisos del directorio
ls -la /home/user/PlazaMusicBot/panel/public/

# Usuario de NGINX
ps aux | grep nginx

# Debe ser www-data (Ubuntu) o nginx (CentOS)
```

**Solución:**
```bash
# Ajustar permisos
sudo chown -R www-data:www-data /home/user/PlazaMusicBot/panel/public/
sudo chmod -R 755 /home/user/PlazaMusicBot/panel/public/

# O dar acceso de lectura a todos
chmod -R o+rx /home/user/PlazaMusicBot/panel/
```

---

## ⚡ Optimizaciones

### 1. Caché de Archivos Estáticos

**Configuración actual:**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Beneficio:** Reduce carga del servidor y mejora velocidad de carga.

---

### 2. Compresión Gzip

**Ya configurado en nginx.conf:**
```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;
```

**Verificar:**
```bash
curl -H "Accept-Encoding: gzip" -I http://musicaplaza.local/api/config
# Debe incluir: Content-Encoding: gzip
```

---

### 3. HTTP/2

**Ya habilitado en HTTPS:**
```nginx
listen 443 ssl http2;
```

**Beneficio:** Múltiples peticiones en una sola conexión TCP.

---

### 4. Keep-Alive

**Configurado en upstream:**
```nginx
upstream nodejs_backend {
    server 127.0.0.1:3000;
    keepalive 32;  # Mantener 32 conexiones abiertas
}
```

---

### 5. Logs Selectivos

**Deshabilitar logs de archivos estáticos:**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    access_log off;  # No registrar en logs
}
```

**Beneficio:** Reduce I/O del disco.

---

### 6. Buffer y Timeouts

**Ajustar en musicaplaza:**
```nginx
# Aumentar buffers para respuestas grandes
proxy_buffer_size 16k;
proxy_buffers 4 16k;

# Timeouts más largos si Node.js es lento
proxy_connect_timeout 90s;
proxy_read_timeout 90s;
```

---

## 📊 Monitoreo

### Stub Status (Estadísticas básicas)

**Habilitar en nginx.conf o musicaplaza:**
```nginx
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;  # Solo localhost
    deny all;
}
```

**Ver estadísticas:**
```bash
curl http://localhost/nginx_status

# Output:
# Active connections: 3
# server accepts handled requests
#  128 128 256
# Reading: 0 Writing: 1 Waiting: 2
```

---

## 🔒 Seguridad Adicional

### 1. Ocultar Versión de NGINX

**Ya configurado:**
```nginx
server_tokens off;
```

### 2. Limitar Métodos HTTP

```nginx
# Solo permitir GET, POST, PUT, DELETE
location /api/ {
    if ($request_method !~ ^(GET|POST|PUT|DELETE)$) {
        return 405;
    }
}
```

### 3. Bloquear IPs

```nginx
# En server block
deny 192.168.1.100;
deny 10.0.0.0/8;
allow all;
```

### 4. Protección contra Hotlinking

```nginx
# Evitar que otros sitios usen tus imágenes
location ~* \.(jpg|jpeg|png|gif)$ {
    valid_referers none blocked musicaplaza.local;
    if ($invalid_referer) {
        return 403;
    }
}
```

---

## 📚 Recursos Adicionales

- **Documentación oficial NGINX:** https://nginx.org/en/docs/
- **NGINX Wiki:** https://www.nginx.com/resources/wiki/
- **Let's Encrypt:** https://letsencrypt.org/
- **SSL Labs Test:** https://www.ssllabs.com/ssltest/

---

## 📝 Notas Finales

### Desarrollo vs Producción

**Desarrollo:**
- Certificados autofirmados
- Logs verbosos
- Sin rate limiting estricto
- Dominio local: `musicaplaza.local`

**Producción:**
- Let's Encrypt SSL
- Logs optimizados
- Rate limiting activo
- Dominio real: `tudominio.com`
- Firewall configurado
- Monitoreo activo

### Backup de Configuración

```bash
# Backup antes de cambios
sudo cp /etc/nginx/sites-available/musicaplaza \
       /etc/nginx/sites-available/musicaplaza.backup

# Restaurar si algo falla
sudo cp /etc/nginx/sites-available/musicaplaza.backup \
       /etc/nginx/sites-available/musicaplaza
sudo systemctl reload nginx
```

---

**Última actualización:** 2025-01-13
**Versión:** 1.0.0
