/**
 * MercadoLibre OAuth - Step 2: Callback
 * Receives authorization code and exchanges it for tokens
 */

export default async function handler(req, res) {
  const { code, error } = req.query;

  // Handle authorization errors
  if (error) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - MercadoLibre OAuth</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #d32f2f; }
            .error {
              background: #ffebee;
              padding: 15px;
              border-radius: 4px;
              border-left: 4px solid #d32f2f;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error de Autorización</h1>
            <div class="error">
              <strong>Error:</strong> ${error}
            </div>
            <p>La autorización fue cancelada o falló.</p>
            <a href="/">Volver al inicio</a>
          </div>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - MercadoLibre OAuth</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Código de Autorización Faltante</h1>
            <p>No se recibió el código de autorización.</p>
            <a href="/api/auth/mercadolibre/authorize">Intentar nuevamente</a>
          </div>
        </body>
      </html>
    `);
  }

  // Exchange code for tokens
  try {
    const CLIENT_ID = process.env.ML_APP_ID;
    const CLIENT_SECRET = process.env.ML_APP_SECRET_KEY;
    const REDIRECT_URI = `${req.headers.origin || 'https://prop-tech-ai.vercel.app'}/api/auth/mercadolibre/callback`;

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token exchange error:', errorData);
      throw new Error(`Failed to exchange code for tokens: ${response.status}`);
    }

    const tokens = await response.json();

    // Return success page with tokens
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>✅ Tokens Generados - MercadoLibre OAuth</title>
          <style>
            body {
              font-family: 'Monaco', 'Courier New', monospace;
              max-width: 900px;
              margin: 30px auto;
              padding: 20px;
              background: #1e1e1e;
              color: #d4d4d4;
            }
            .container {
              background: #252526;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            }
            h1 {
              color: #4ec9b0;
              margin: 0 0 20px 0;
              font-size: 28px;
            }
            .success-banner {
              background: #0e4429;
              border: 1px solid #26a641;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 30px;
              color: #3fb950;
            }
            .token-section {
              background: #1e1e1e;
              border: 1px solid #3e3e42;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .token-label {
              color: #9cdcfe;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .token-value {
              background: #0d1117;
              padding: 12px;
              border-radius: 4px;
              font-size: 13px;
              color: #c9d1d9;
              word-break: break-all;
              border: 1px solid #30363d;
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            }
            .copy-button {
              background: #238636;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              margin-top: 8px;
              font-weight: 600;
            }
            .copy-button:hover {
              background: #2ea043;
            }
            .copy-button:active {
              background: #238636;
            }
            .instructions {
              background: #0d1117;
              border-left: 3px solid #58a6ff;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .instructions h3 {
              color: #58a6ff;
              margin: 0 0 10px 0;
              font-size: 16px;
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
              color: #c9d1d9;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .info-item {
              background: #0d1117;
              padding: 12px;
              border-radius: 4px;
              border: 1px solid #30363d;
            }
            .info-label {
              color: #8b949e;
              font-size: 11px;
              margin-bottom: 4px;
            }
            .info-value {
              color: #58a6ff;
              font-size: 14px;
              font-weight: bold;
            }
            code {
              background: #0d1117;
              padding: 2px 6px;
              border-radius: 3px;
              color: #79c0ff;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 ¡Tokens Generados Exitosamente!</h1>

            <div class="success-banner">
              ✅ La autorización con MercadoLibre fue exitosa. Tokens listos para usar.
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">User ID</div>
                <div class="info-value">${tokens.user_id}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Token Expira En</div>
                <div class="info-value">${Math.round(tokens.expires_in / 3600)} horas</div>
              </div>
            </div>

            <div class="token-section">
              <div class="token-label">🔑 Access Token</div>
              <div class="token-value" id="access-token">${tokens.access_token}</div>
              <button class="copy-button" onclick="copyToken('access-token', this)">
                📋 Copiar Access Token
              </button>
            </div>

            <div class="token-section">
              <div class="token-label">🔄 Refresh Token</div>
              <div class="token-value" id="refresh-token">${tokens.refresh_token}</div>
              <button class="copy-button" onclick="copyToken('refresh-token', this)">
                📋 Copiar Refresh Token
              </button>
            </div>

            <div class="instructions">
              <h3>📝 Próximos Pasos</h3>
              <ol>
                <li>Copia ambos tokens usando los botones de arriba</li>
                <li>Agrega estas líneas a tu archivo <code>.env</code>:
                  <div style="margin: 10px 0; padding: 10px; background: #0d1117; border-radius: 4px;">
                    <code style="display: block; color: #79c0ff;">ML_ACCESS_TOKEN="${tokens.access_token}"</code>
                    <code style="display: block; color: #79c0ff; margin-top: 4px;">ML_REFRESH_TOKEN="${tokens.refresh_token}"</code>
                  </div>
                </li>
                <li>Reinicia tu servidor de desarrollo (si está corriendo)</li>
                <li>¡Prueba el scraper!</li>
              </ol>
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #0d1117; border-radius: 6px; border: 1px solid #30363d;">
              <strong style="color: #f85149;">⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px; color: #c9d1d9;">
                <li>El <strong>Access Token</strong> expira en ${Math.round(tokens.expires_in / 3600)} horas</li>
                <li>El <strong>Refresh Token</strong> no expira (úsalo para obtener nuevos access tokens)</li>
                <li>Guarda estos tokens de forma segura en tu <code>.env</code></li>
                <li>No compartas estos tokens públicamente</li>
              </ul>
            </div>
          </div>

          <script>
            function copyToken(elementId, button) {
              const tokenElement = document.getElementById(elementId);
              const text = tokenElement.textContent;

              navigator.clipboard.writeText(text).then(() => {
                const originalText = button.textContent;
                button.textContent = '✓ Copiado!';
                button.style.background = '#2ea043';

                setTimeout(() => {
                  button.textContent = originalText;
                  button.style.background = '#238636';
                }, 2000);
              });
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - MercadoLibre OAuth</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #d32f2f; }
            .error {
              background: #ffebee;
              padding: 15px;
              border-radius: 4px;
              border-left: 4px solid #d32f2f;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error al Intercambiar Código</h1>
            <div class="error">${error.message}</div>
            <p>Posibles causas:</p>
            <ul>
              <li>El código de autorización expiró (expiran en 10 minutos)</li>
              <li>El código ya fue usado (solo se puede usar una vez)</li>
              <li>Error en las credenciales de la aplicación</li>
            </ul>
            <a href="/api/auth/mercadolibre/authorize">Intentar nuevamente</a>
          </div>
        </body>
      </html>
    `);
  }
}
