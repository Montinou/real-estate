/**
 * MercadoLibre OAuth - Step 1: Login
 * Redirects user to MercadoLibre authorization page
 */

export default function handler(req, res) {
  const CLIENT_ID = process.env.ML_APP_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || req.headers.origin || 'https://prop-tech-ai.vercel.app'}/api/auth/mercadolibre/callback`;

  if (!CLIENT_ID) {
    return res.status(500).json({
      error: 'MercadoLibre client ID not configured',
      hint: 'Add ML_APP_ID to environment variables'
    });
  }

  // Build OAuth URL
  const authUrl = new URL('https://auth.mercadolibre.com.ar/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);

  console.log('[ML OAuth] Redirecting to:', authUrl.toString());

  // Redirect to MercadoLibre
  res.redirect(authUrl.toString());
}
