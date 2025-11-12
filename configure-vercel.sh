#!/bin/bash

echo "Configurando variables de entorno en Vercel..."

# Configura estas variables con tus valores reales
ML_CLIENT_ID="1859583576625723"
ML_CLIENT_SECRET="TU_SECRET_KEY_AQUI"  # <- CAMBIA ESTO
JWT_SECRET=$(openssl rand -base64 32)

# Agregar variables a Vercel
echo "$ML_CLIENT_ID" | vercel env add ML_CLIENT_ID production --force
echo "$ML_CLIENT_SECRET" | vercel env add ML_CLIENT_SECRET production --force
echo "$JWT_SECRET" | vercel env add JWT_SECRET production --force
echo "https://proptech-ai.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production --force
echo "postgresql://user:pass@host:5432/proptech" | vercel env add DATABASE_URL production --force

echo "✅ Variables configuradas. Recuerda:"
echo "1. Actualizar ML_CLIENT_SECRET con tu valor real"
echo "2. Configurar DATABASE_URL cuando tengas Supabase"
