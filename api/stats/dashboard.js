/**
 * Vercel API Route: Dashboard Statistics
 * /api/stats/dashboard
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get general statistics
    const stats = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM properties) as total_properties,
        (SELECT COUNT(*)::int FROM properties WHERE status = 'active') as active_properties,
        (SELECT COUNT(*)::int FROM properties WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
        (SELECT COUNT(*)::int FROM properties WHERE created_at > NOW() - INTERVAL '7 days') as new_week,
        (SELECT COALESCE(AVG(price), 0) FROM properties WHERE currency = 'USD' AND price > 0) as avg_price_usd,
        (SELECT COUNT(DISTINCT city)::int FROM properties) as total_cities
    `;

    // Get properties by type
    const byType = await sql`
      SELECT
        property_type,
        operation_type,
        COUNT(*)::int as count,
        COALESCE(AVG(price), 0) as avg_price
      FROM properties
      WHERE status = 'active'
      GROUP BY property_type, operation_type
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get top cities
    const topCities = await sql`
      SELECT
        city,
        COUNT(*)::int as count
      FROM properties
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get latest properties
    const latest = await sql`
      SELECT
        id,
        title,
        price,
        currency,
        city,
        neighborhood,
        property_type,
        created_at
      FROM properties
      ORDER BY created_at DESC
      LIMIT 10
    `;

    res.status(200).json({
      success: true,
      stats: stats[0],
      byType: byType,
      topCities: topCities,
      latestProperties: latest,
      sources: [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics',
      details: error.message
    });
  }
}