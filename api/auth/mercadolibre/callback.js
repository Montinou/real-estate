/**
 * Vercel API Route: MercadoLibre OAuth Callback
 * /api/auth/mercadolibre/callback
 */

import axios from 'axios';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/?auth_error=${error}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      code: code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadolibre/callback`
    });

    const { access_token, refresh_token, user_id } = tokenResponse.data;

    // Store tokens (in production, use a database)
    // For now, we'll send them to the frontend
    const successUrl = `/?auth=success&access_token=${access_token.substring(0, 20)}...&user_id=${user_id}`;

    // HTML response with auto-close
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autenticación Exitosa - PropTech AI</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          h1 { margin-bottom: 1rem; }
          .success { color: #4ade80; }
          .token-info {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 5px;
            margin: 1rem 0;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">✅ Autenticación Exitosa</h1>
          <p>Has sido autenticado correctamente con MercadoLibre</p>
          <div class="token-info">
            <p>User ID: ${user_id}</p>
            <p>Token: ${access_token.substring(0, 20)}...</p>
          </div>
          <p>Esta ventana se cerrará en 3 segundos...</p>
          <p>Tokens guardados en las variables de entorno de Vercel</p>
        </div>
        <script>
          // Store tokens in localStorage for the app to use
          localStorage.setItem('ml_access_token', '${access_token}');
          localStorage.setItem('ml_refresh_token', '${refresh_token}');
          localStorage.setItem('ml_user_id', '${user_id}');

          setTimeout(() => {
            window.close();
            // If can't close, redirect to home
            window.location.href = '/';
          }, 3000);
        </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    console.error('Full error:', error);

    // Return detailed HTML error page for debugging
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - MercadoLibre OAuth</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #1e1e1e;
            color: #d4d4d4;
          }
          .container {
            background: #252526;
            padding: 30px;
            border-radius: 8px;
          }
          h1 { color: #f85149; }
          .error {
            background: #1e1e1e;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #f85149;
            font-family: monospace;
            margin: 20px 0;
          }
          pre {
            background: #0d1117;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            color: #79c0ff;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Error al Intercambiar Código</h1>
          <div class="error">
            <strong>Error:</strong> ${error.message}
          </div>
          ${error.response?.data ? `
            <h3>Detalles de la respuesta de MercadoLibre:</h3>
            <pre>${JSON.stringify(error.response.data, null, 2)}</pre>
          ` : ''}
          <h3>Información de debugging:</h3>
          <pre>
ML_CLIENT_ID: ${process.env.ML_CLIENT_ID ? '✅ Configurado' : '❌ Faltante'}
ML_CLIENT_SECRET: ${process.env.ML_CLIENT_SECRET ? '✅ Configurado' : '❌ Faltante'}
NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || '❌ Faltante'}
Redirect URI: ${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadolibre/callback
Código recibido: ${code ? 'Sí' : 'No'}
          </pre>
          <p>Posibles causas:</p>
          <ul>
            <li>El código de autorización expiró (expiran en 10 minutos)</li>
            <li>El código ya fue usado (solo se puede usar una vez)</li>
            <li>El redirect_uri no coincide con el configurado en la app de MercadoLibre</li>
            <li>Credenciales incorrectas (client_id o client_secret)</li>
          </ul>
          <a href="/api/auth/mercadolibre/login" style="color: #58a6ff;">Intentar nuevamente</a> |
          <a href="/" style="color: #58a6ff;">Volver al inicio</a>
        </div>
      </body>
      </html>
    `);
  }
}