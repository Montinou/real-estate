#!/usr/bin/env node

/**
 * MercadoLibre OAuth 2.0 Authentication Flow (HTTPS Version)
 * Versión alternativa que funciona con requisitos HTTPS de MercadoLibre
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const CLIENT_ID = process.env.ML_CLIENT_ID;
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const PORT = 3000;

// URLs alternativos para desarrollo
const REDIRECT_OPTIONS = [
  `https://localhost:${PORT}/auth/mercadolibre/callback`,
  'https://auth.mercadolibre.com.ar/authorization',
  'https://www.mercadolibre.com.ar/authorization'
];

console.log('═══════════════════════════════════════');
console.log('   MercadoLibre OAuth - Solución HTTPS');
console.log('═══════════════════════════════════════');
console.log('');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: ML_CLIENT_ID y ML_CLIENT_SECRET deben estar en .env');
  process.exit(1);
}

console.log('📝 Opciones de Redirect URI para MercadoLibre:');
console.log('');
console.log('OPCIÓN 1 (Recomendada): Usar ngrok');
console.log('  1. Instala ngrok: brew install ngrok');
console.log('  2. Ejecuta: ngrok http 3000');
console.log('  3. Usa la URL HTTPS que te da ngrok');
console.log('');
console.log('OPCIÓN 2: URLs alternativos que puedes probar:');
REDIRECT_OPTIONS.forEach(url => {
  console.log(`  - ${url}`);
});
console.log('');

// Configuración alternativa sin servidor local
console.log('📋 INSTRUCCIONES MANUALES:');
console.log('');
console.log('1. Ve a esta URL en tu navegador:');
console.log('');
console.log(`https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${CLIENT_ID}`);
console.log('');
console.log('2. Autoriza la aplicación');
console.log('');
console.log('3. Después del redirect, copia el código de la URL');
console.log('   Ejemplo: ?code=TG-123456789-abcdef');
console.log('');
console.log('4. Pega el código aquí:');

// Leer código desde consola
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Código de autorización: ', async (code) => {
  if (!code) {
    console.log('❌ No se proporcionó código');
    rl.close();
    process.exit(1);
  }

  console.log('');
  console.log('🔄 Intercambiando código por token...');

  try {
    // Intercambiar código por token
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code.trim(),
      redirect_uri: 'https://www.mercadolibre.com.ar/authorization'
    });

    console.log('');
    console.log('✅ ¡Tokens obtenidos exitosamente!');
    console.log('═══════════════════════════════════════');
    console.log('Access Token:', response.data.access_token.substring(0, 20) + '...');
    console.log('Refresh Token:', response.data.refresh_token.substring(0, 20) + '...');
    console.log('User ID:', response.data.user_id);
    console.log('Expires in:', response.data.expires_in, 'seconds');
    console.log('═══════════════════════════════════════');

    // Guardar en .env
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const updates = {
      ML_ACCESS_TOKEN: response.data.access_token,
      ML_REFRESH_TOKEN: response.data.refresh_token,
      ML_USER_ID: response.data.user_id
    };

    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'gm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('');
    console.log('💾 Tokens guardados en .env');
    console.log('');
    console.log('✅ ¡Configuración completa!');
    console.log('');
    console.log('Ahora puedes ejecutar:');
    console.log('  node src/jobs/manual/scrape-mercadolibre.js --limit 10');

  } catch (error) {
    console.error('');
    console.error('❌ Error obteniendo token:', error.response?.data || error.message);
    console.error('');
    console.error('Posibles causas:');
    console.error('1. El código expiró (válido solo 10 minutos)');
    console.error('2. El redirect_uri no coincide con el configurado');
    console.error('3. Cliente ID o Secret incorrectos');
  }

  rl.close();
});