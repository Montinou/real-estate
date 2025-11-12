#!/bin/bash

# Script para configurar variables de entorno en Vercel

echo "╔════════════════════════════════════════════════════════╗"
echo "║   CONFIGURACIÓN DE VARIABLES DE ENTORNO EN VERCEL     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Variables de entorno a configurar
echo "📝 Configurando variables de entorno..."

# App URL
echo "https://proptech-ai.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production

# Placeholder para MercadoLibre (actualizar con tus valores reales)
echo "APP-YOUR-CLIENT-ID" | vercel env add ML_CLIENT_ID production
echo "your-client-secret" | vercel env add ML_CLIENT_SECRET production

# JWT Secret (generado aleatoriamente)
echo "$(openssl rand -base64 32)" | vercel env add JWT_SECRET production

# Database URL placeholder (para después)
echo "postgresql://user:pass@host:5432/proptech" | vercel env add DATABASE_URL production

echo ""
echo "✅ Variables de entorno configuradas"
echo ""
echo "⚠️  IMPORTANTE: Ahora debes:"
echo "1. Actualizar ML_CLIENT_ID y ML_CLIENT_SECRET con tus valores reales"
echo "2. Ir a: https://vercel.com/agustin-montoyas-projects-554f9f37/proptech-ai/settings/environment-variables"
echo "3. Editar las variables con los valores correctos"
echo ""
echo "📌 Tu Redirect URI para MercadoLibre es:"
echo "   https://proptech-ai.vercel.app/api/auth/mercadolibre/callback"