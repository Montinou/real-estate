#!/usr/bin/env node

/**
 * MercadoLibre OAuth 2.0 Authentication Flow
 * Run this script to get access and refresh tokens
 */

const express = require('express');
const axios = require('axios');
const open = require('open');
require('dotenv').config();

const CLIENT_ID = process.env.ML_CLIENT_ID;
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const REDIRECT_URI = process.env.ML_REDIRECT_URI || 'http://localhost:3000/auth/mercadolibre/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: ML_CLIENT_ID and ML_CLIENT_SECRET must be set in .env file');
  console.log('\nSteps to get credentials:');
  console.log('1. Go to https://developers.mercadolibre.com.ar');
  console.log('2. Create or login to your account');
  console.log('3. Create a new application');
  console.log('4. Get your CLIENT_ID and CLIENT_SECRET');
  console.log('5. Add them to your .env file');
  process.exit(1);
}

const app = express();
let server;

/**
 * Generate OAuth authorization URL
 */
function getAuthUrl() {
  const baseUrl = 'https://auth.mercadolibre.com.ar/authorization';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI
  });

  return `${baseUrl}?${params}`;
}

/**
 * Exchange authorization code for access token
 */
async function getAccessToken(code) {
  try {
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error refreshing access token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test API access with token
 */
async function testApiAccess(accessToken) {
  try {
    // Get user information
    const userResponse = await axios.get('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('\n✅ API Access successful!');
    console.log('User info:', {
      id: userResponse.data.id,
      nickname: userResponse.data.nickname,
      email: userResponse.data.email,
      site_id: userResponse.data.site_id
    });

    // Test property search
    const searchResponse = await axios.get('https://api.mercadolibre.com/sites/MLA/search', {
      params: {
        category: 'MLA1459', // Real Estate
        limit: 1
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log(`\n📊 Found ${searchResponse.data.paging.total} properties in Argentina`);

    return true;
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    return false;
  }
}

// Setup routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MercadoLibre OAuth</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #FFE600;
          color: #333;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
        }
        .button:hover {
          background-color: #FFD100;
        }
        pre {
          background: #f4f4f4;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <h1>🔐 MercadoLibre OAuth Authentication</h1>
      <p>Click the button below to authenticate with MercadoLibre:</p>
      <a href="${getAuthUrl()}" class="button">Login with MercadoLibre</a>
      <hr>
      <h3>Configuration:</h3>
      <pre>CLIENT_ID: ${CLIENT_ID}
REDIRECT_URI: ${REDIRECT_URI}</pre>
    </body>
    </html>
  `);
});

app.get('/auth/mercadolibre/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    res.send(`
      <h1>❌ Authentication Failed</h1>
      <p>Error: ${error}</p>
      <a href="/">Try Again</a>
    `);
    return;
  }

  if (!code) {
    res.send(`
      <h1>❌ No Authorization Code</h1>
      <p>No authorization code received</p>
      <a href="/">Try Again</a>
    `);
    return;
  }

  try {
    console.log('\n🔄 Exchanging authorization code for access token...');
    const tokenData = await getAccessToken(code);

    console.log('\n✅ Tokens received successfully!');
    console.log('═══════════════════════════════════════');
    console.log('Access Token:', tokenData.access_token);
    console.log('Refresh Token:', tokenData.refresh_token);
    console.log('Expires in:', tokenData.expires_in, 'seconds');
    console.log('User ID:', tokenData.user_id);
    console.log('═══════════════════════════════════════');

    // Test API access
    await testApiAccess(tokenData.access_token);

    // Save tokens to .env file
    const fs = require('fs');
    const envPath = require('path').join(process.cwd(), '.env');

    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add tokens
    const updates = {
      ML_ACCESS_TOKEN: tokenData.access_token,
      ML_REFRESH_TOKEN: tokenData.refresh_token,
      ML_USER_ID: tokenData.user_id
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
    console.log('\n💾 Tokens saved to .env file');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Success!</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
          }
          .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 4px;
            color: #155724;
          }
          pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            word-wrap: break-word;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ Authentication Successful!</h1>
          <p>Tokens have been saved to your .env file</p>
        </div>

        <h3>Token Information:</h3>
        <pre>Access Token: ${tokenData.access_token.substring(0, 20)}...
Refresh Token: ${tokenData.refresh_token.substring(0, 20)}...
User ID: ${tokenData.user_id}
Expires in: ${tokenData.expires_in} seconds</pre>

        <h3>Next Steps:</h3>
        <ol>
          <li>Tokens have been saved to your .env file</li>
          <li>You can now close this window</li>
          <li>Run <code>npm run scrape:mercadolibre</code> to start scraping</li>
        </ol>

        <a href="#" onclick="window.close()" class="button">Close Window</a>

        <script>
          setTimeout(() => {
            window.close();
          }, 10000);
        </script>
      </body>
      </html>
    `);

    // Close server after successful auth
    setTimeout(() => {
      console.log('\n👋 Closing authentication server...');
      server.close();
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('❌ Authentication failed:', error.message);

    res.send(`
      <h1>❌ Authentication Failed</h1>
      <pre>${error.message}</pre>
      <a href="/">Try Again</a>
    `);
  }
});

// Start server
const PORT = 3000;
server = app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('   MercadoLibre OAuth Authentication');
  console.log('═══════════════════════════════════════\n');
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('\n📝 Steps:');
  console.log('1. Opening browser to authentication page...');
  console.log('2. Login with your MercadoLibre account');
  console.log('3. Authorize the application');
  console.log('4. Tokens will be saved automatically\n');

  // Open browser automatically
  open(`http://localhost:${PORT}`);
});

// Handle errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('Please close other applications using this port or change the port in the script');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});