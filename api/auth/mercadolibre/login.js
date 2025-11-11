/**
 * Vercel API Route: Initiate MercadoLibre OAuth
 * /api/auth/mercadolibre/login
 */

export default async function handler(req, res) {
  const clientId = process.env.ML_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadolibre/callback`;

  if (!clientId) {
    return res.status(500).json({ error: 'MercadoLibre client ID not configured' });
  }

  // Build OAuth URL
  const authUrl = new URL('https://auth.mercadolibre.com.ar/authorization');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);

  // Redirect to MercadoLibre OAuth
  res.redirect(authUrl.toString());
}