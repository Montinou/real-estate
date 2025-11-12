/**
 * MercadoLibre OAuth - Step 1: Authorization
 * Redirects user to MercadoLibre authorization page
 */

export default function handler(req, res) {
  const CLIENT_ID = process.env.ML_APP_ID;
  const REDIRECT_URI = `${req.headers.origin || 'https://prop-tech-ai.vercel.app'}/api/auth/mercadolibre/callback`;

  const authUrl = new URL('https://auth.mercadolibre.com.ar/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);

  // Redirect to MercadoLibre
  res.redirect(authUrl.toString());
}
