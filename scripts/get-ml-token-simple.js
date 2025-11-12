#!/usr/bin/env node

/**
 * Simple MercadoLibre OAuth Token Generator
 * No browser automation - just manual steps
 */

const CLIENT_ID = process.env.ML_APP_ID || '1859583576625723';
const CLIENT_SECRET = process.env.ML_APP_SECRET_KEY || '5hc7HhvtENT6Kd2hSgR3mhTW0Iql9WwS';
const REDIRECT_URI = 'http://localhost:3000/callback';

console.log('\n🔐 MercadoLibre OAuth Token Generator\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check if we got a code as argument
const code = process.argv[2];

if (!code) {
  // Step 1: Show authorization URL
  console.log('📋 STEP 1: Get Authorization Code\n');
  console.log('Open this URL in your browser:\n');

  const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  console.log(authUrl);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📌 What to do:\n');
  console.log('1. Copy the URL above');
  console.log('2. Paste it in your browser');
  console.log('3. Log in to MercadoLibre (if needed)');
  console.log('4. Click "Autorizar" (Authorize)');
  console.log('5. You\'ll be redirected to: http://localhost:3000/callback?code=TG-...');
  console.log('6. Copy ONLY the code part (after code=)');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 STEP 2: Run this script again with the code:\n');
  console.log('node scripts/get-ml-token-simple.js YOUR_CODE_HERE\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);
}

// Step 2: Exchange code for tokens
console.log('🔄 Exchanging authorization code for tokens...\n');

(async () => {
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
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to get tokens:');
      console.error(error);
      console.log('\n⚠️  Common issues:');
      console.log('- Code expired (they expire in 10 minutes)');
      console.log('- Code already used (can only use once)');
      console.log('- Wrong redirect_uri\n');
      console.log('💡 Solution: Run the script again without arguments to get a new code\n');
      process.exit(1);
    }

    const tokens = await response.json();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! Your MercadoLibre OAuth Tokens:\n');
    console.log('Copy these lines to your .env file:\n');
    console.log(`ML_ACCESS_TOKEN="${tokens.access_token}"`);
    console.log(`ML_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 Token Info:');
    console.log(`  User ID: ${tokens.user_id}`);
    console.log(`  Expires in: ${tokens.expires_in / 3600} hours`);
    console.log(`  Scope: ${tokens.scope || 'offline_access'}`);
    console.log('\n💡 Next Steps:');
    console.log('1. Add the tokens to your .env file');
    console.log('2. Restart your dev server (if running)');
    console.log('3. Test the scraper:');
    console.log('   curl "http://localhost:3000/api/scrape/mercadolibre?limit=5"\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
