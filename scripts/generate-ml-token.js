#!/usr/bin/env node

/**
 * Simple MercadoLibre OAuth Token Generator
 *
 * This script helps you get your ML_ACCESS_TOKEN and ML_REFRESH_TOKEN
 * in 3 simple steps.
 */

const http = require('http');
const open = require('open');

const CLIENT_ID = process.env.ML_APP_ID || '1859583576625723';
const CLIENT_SECRET = process.env.ML_APP_SECRET_KEY || '5hc7HhvtENT6Kd2hSgR3mhTW0Iql9WwS';
const REDIRECT_URI = 'http://localhost:6019/callback';

console.log('\n🔐 MercadoLibre OAuth Token Generator\n');
console.log('This will get your access and refresh tokens in 3 steps:\n');

let authCode = null;

// Create a simple HTTP server to catch the OAuth callback
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/callback')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    authCode = url.searchParams.get('code');

    if (authCode) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: sans-serif; padding: 50px; text-align: center;">
            <h1>✅ Authorization Successful!</h1>
            <p>You can close this window and return to your terminal.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);

      console.log('\n✅ Authorization code received!');
      console.log('📝 Exchanging code for tokens...\n');

      // Exchange code for tokens
      try {
        const response = await fetch('https://api.mercadolibre.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: authCode,
            redirect_uri: REDIRECT_URI,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('❌ Failed to get tokens:', error);
          process.exit(1);
        }

        const tokens = await response.json();

        console.log('🎉 SUCCESS! Your tokens:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Add these to your .env file:\n');
        console.log(`ML_ACCESS_TOKEN="${tokens.access_token}"`);
        console.log(`ML_REFRESH_TOKEN="${tokens.refresh_token}"`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`⏰ Access token expires in: ${tokens.expires_in / 3600} hours`);
        console.log(`🔄 Refresh token expires in: Never (use it to get new access tokens)\n`);

        // Close server
        server.close();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error:', error.message);
        server.close();
        process.exit(1);
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('No authorization code received');
      console.error('❌ No authorization code received');
      server.close();
      process.exit(1);
    }
  }
});

server.listen(6019, () => {
  console.log('Step 1/3: Starting local callback server on http://localhost:6019');
  console.log('Step 2/3: Opening MercadoLibre authorization page in your browser...\n');

  const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  console.log('If the browser doesn\'t open automatically, visit this URL:');
  console.log(authUrl + '\n');

  // Open browser
  open(authUrl).catch(() => {
    console.log('Could not open browser automatically. Please visit the URL above.');
  });

  console.log('Step 3/3: Authorize the app in your browser...\n');
  console.log('⏳ Waiting for authorization...\n');
});

// Handle timeout
setTimeout(() => {
  if (!authCode) {
    console.error('\n❌ Timeout: No authorization received after 5 minutes');
    console.log('Please try running the script again.\n');
    server.close();
    process.exit(1);
  }
}, 5 * 60 * 1000); // 5 minutes timeout
