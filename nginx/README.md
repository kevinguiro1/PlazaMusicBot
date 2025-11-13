# 🌐 NGINX Configuration

Configuración de NGINX como reverse proxy para el panel de administración.

## 📁 Estructura

```
nginx/
├── nginx.conf                    # Configuración principal de NGINX
├── sites-available/
│   └── musicaplaza              # Configuración del sitio
├── sites-enabled/               # Enlaces simbólicos (automático)
├── ssl/
│   ├── .gitignore               # Ignora certificados privados
│   └── generate-self-signed-cert.sh  # Script para generar SSL
└── logs/                        # Logs locales (opcional)
```

## 🚀 Instalación Rápida

```bash
# Desde el directorio raíz del proyecto
sudo ./scripts/setup-nginx.sh
```

## 📖 Documentación Completa

Ver: [../NGINX.md](../NGINX.md)

## 🔑 Certificados SSL

Los certificados SSL **NO** se commitean al repositorio por seguridad.

### Generar certificados de desarrollo:

```bash
./ssl/generate-self-signed-cert.sh
```

### Producción (Let's Encrypt):

```bash
sudo certbot --nginx -d tudominio.com
```

## ⚙️ Configuración

### Copiar a sistema:

```bash
# Copiar configuración del sitio
sudo cp sites-available/musicaplaza /etc/nginx/sites-available/

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/musicaplaza /etc/nginx/sites-enabled/

# Verificar
sudo nginx -t

# Recargar
sudo systemctl reload nginx
```

## 🔧 Personalización

Edita `sites-available/musicaplaza` para:
- Cambiar puerto de Node.js (default: 3000)
- Ajustar rate limiting
- Modificar security headers
- Configurar SSL
- Agregar dominios

## 📝 Notas

- El sitio usa dominio local `musicaplaza.local` para desarrollo
- Para producción, cambiar `server_name` al dominio real
- Logs en `/var/log/nginx/musicaplaza_*.log`
