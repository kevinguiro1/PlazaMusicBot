#!/bin/bash
# Script para generar certificados SSL autofirmados para desarrollo

set -e

echo "🔐 Generando certificados SSL autofirmados para desarrollo..."
echo ""

# Configuración
DOMAIN="musicaplaza.local"
SSL_DIR="/home/user/PlazaMusicBot/nginx/ssl"
DAYS=365

# Crear directorio si no existe
mkdir -p "$SSL_DIR"

# Generar certificado autofirmado
openssl req -x509 -nodes -days $DAYS -newkey rsa:2048 \
  -keyout "$SSL_DIR/key.pem" \
  -out "$SSL_DIR/cert.pem" \
  -subj "/C=MX/ST=Sinaloa/L=Mazatlan/O=Musica Plaza/OU=IT/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1"

# Permisos restrictivos para la clave privada
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo ""
echo "✅ Certificados generados exitosamente:"
echo "   📄 Certificado: $SSL_DIR/cert.pem"
echo "   🔑 Clave: $SSL_DIR/key.pem"
echo ""
echo "⚠️  NOTA: Estos certificados son SOLO para desarrollo."
echo "    Para producción, usa Let's Encrypt con certbot."
echo ""
echo "📝 Para confiar en el certificado en tu navegador:"
echo "   Chrome/Edge: Configuración → Privacidad → Certificados → Importar"
echo "   Firefox: Configuración → Certificados → Ver certificados → Importar"
echo ""
