#!/bin/bash
# Script de instalación y configuración de NGINX para Música Plaza Bot

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/home/user/PlazaMusicBot"
NGINX_CONFIG_SRC="$PROJECT_DIR/nginx/sites-available/musicaplaza"
NGINX_CONFIG_DEST="/etc/nginx/sites-available/musicaplaza"
NGINX_ENABLED="/etc/nginx/sites-enabled/musicaplaza"
SSL_DIR="$PROJECT_DIR/nginx/ssl"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🎵 Configuración de NGINX - Música Plaza${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Este script debe ejecutarse como root${NC}"
    echo -e "${YELLOW}   Usa: sudo ./scripts/setup-nginx.sh${NC}"
    exit 1
fi

# Detectar sistema operativo
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}❌ No se pudo detectar el sistema operativo${NC}"
    exit 1
fi

echo -e "${GREEN}📋 Sistema detectado: $PRETTY_NAME${NC}"
echo ""

# Función para instalar NGINX
install_nginx() {
    echo -e "${YELLOW}📦 Instalando NGINX...${NC}"

    case $OS in
        ubuntu|debian)
            apt-get update
            apt-get install -y nginx
            ;;
        centos|rhel|fedora)
            yum install -y nginx || dnf install -y nginx
            ;;
        *)
            echo -e "${RED}❌ Sistema operativo no soportado: $OS${NC}"
            exit 1
            ;;
    esac

    echo -e "${GREEN}✅ NGINX instalado${NC}"
}

# Verificar si NGINX está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  NGINX no está instalado${NC}"
    read -p "¿Deseas instalar NGINX? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        install_nginx
    else
        echo -e "${RED}❌ NGINX es requerido. Instalación cancelada.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ NGINX ya está instalado${NC}"
fi

echo ""

# Verificar si el sitio ya está configurado
if [ -L "$NGINX_ENABLED" ]; then
    echo -e "${YELLOW}⚠️  El sitio musicaplaza ya está habilitado${NC}"
    read -p "¿Deseas reconfigurar? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        echo -e "${BLUE}ℹ️  Configuración cancelada${NC}"
        exit 0
    fi
fi

# Crear backup de configuración existente si existe
if [ -f "$NGINX_CONFIG_DEST" ]; then
    echo -e "${YELLOW}📦 Creando backup de configuración existente...${NC}"
    cp "$NGINX_CONFIG_DEST" "$NGINX_CONFIG_DEST.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copiar configuración
echo -e "${YELLOW}📝 Copiando configuración de NGINX...${NC}"
cp "$NGINX_CONFIG_SRC" "$NGINX_CONFIG_DEST"
echo -e "${GREEN}✅ Configuración copiada${NC}"

# Habilitar sitio
echo -e "${YELLOW}🔗 Habilitando sitio...${NC}"
ln -sf "$NGINX_CONFIG_DEST" "$NGINX_ENABLED"
echo -e "${GREEN}✅ Sitio habilitado${NC}"

# Deshabilitar sitio default si existe
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    echo -e "${YELLOW}🔧 Deshabilitando sitio default...${NC}"
    rm -f "/etc/nginx/sites-enabled/default"
    echo -e "${GREEN}✅ Sitio default deshabilitado${NC}"
fi

# Verificar configuración de NGINX
echo ""
echo -e "${YELLOW}🔍 Verificando configuración de NGINX...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Configuración válida${NC}"
else
    echo -e "${RED}❌ Error en la configuración de NGINX${NC}"
    echo -e "${YELLOW}   Revisa los logs: /var/log/nginx/error.log${NC}"
    exit 1
fi

# Preguntar si generar certificados SSL
echo ""
read -p "¿Deseas generar certificados SSL autofirmados para desarrollo? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${YELLOW}🔐 Generando certificados SSL...${NC}"
    bash "$SSL_DIR/generate-self-signed-cert.sh"
fi

# Agregar entrada a /etc/hosts si no existe
echo ""
echo -e "${YELLOW}🌐 Configurando /etc/hosts...${NC}"
if ! grep -q "musicaplaza.local" /etc/hosts; then
    echo "127.0.0.1    musicaplaza.local" >> /etc/hosts
    echo -e "${GREEN}✅ Entrada agregada a /etc/hosts${NC}"
else
    echo -e "${BLUE}ℹ️  Entrada ya existe en /etc/hosts${NC}"
fi

# Reiniciar NGINX
echo ""
echo -e "${YELLOW}🔄 Reiniciando NGINX...${NC}"
systemctl restart nginx
systemctl enable nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ NGINX reiniciado exitosamente${NC}"
else
    echo -e "${RED}❌ Error al reiniciar NGINX${NC}"
    systemctl status nginx
    exit 1
fi

# Verificar que Node.js esté corriendo
echo ""
echo -e "${YELLOW}🔍 Verificando servidor Node.js...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Servidor Node.js respondiendo en puerto 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor Node.js no está corriendo en puerto 3000${NC}"
    echo -e "${BLUE}ℹ️  Inicia el servidor con: npm run panel${NC}"
fi

# Resumen final
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuración completada exitosamente${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📍 Accesos:${NC}"
echo -e "   HTTP:  ${BLUE}http://musicaplaza.local${NC}"
echo -e "   HTTP:  ${BLUE}http://localhost${NC}"
echo -e "   HTTPS: ${BLUE}https://musicaplaza.local${NC} ${YELLOW}(si generaste SSL)${NC}"
echo ""
echo -e "${GREEN}📝 Comandos útiles:${NC}"
echo -e "   Reiniciar NGINX:  ${BLUE}sudo systemctl restart nginx${NC}"
echo -e "   Ver logs NGINX:   ${BLUE}sudo tail -f /var/log/nginx/musicaplaza_error.log${NC}"
echo -e "   Ver logs panel:   ${BLUE}sudo tail -f /var/log/nginx/musicaplaza_access.log${NC}"
echo -e "   Verificar config: ${BLUE}sudo nginx -t${NC}"
echo ""
echo -e "${GREEN}🚀 Siguiente paso:${NC}"
echo -e "   1. Iniciar el panel: ${BLUE}npm run panel${NC}"
echo -e "   2. Abrir navegador en: ${BLUE}http://musicaplaza.local${NC}"
echo ""
