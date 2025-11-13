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
        (SELECT COUNT(*)::int FROM properties WHERE deleted_at IS NULL) as total_properties,
        (SELECT COUNT(*)::int FROM properties WHERE status = 'active' AND deleted_at IS NULL) as active_properties,
        (SELECT COUNT(*)::int FROM properties WHERE created_at > NOW() - INTERVAL '24 hours' AND deleted_at IS NULL) as new_today,
        (SELECT COUNT(*)::int FROM properties WHERE created_at > NOW() - INTERVAL '7 days' AND deleted_at IS NULL) as new_week,
        (SELECT COALESCE(AVG(price), 0) FROM properties WHERE currency = 'USD' AND price > 0 AND deleted_at IS NULL) as avg_price_usd,
        (SELECT COUNT(*)::int FROM cities WHERE deleted_at IS NULL) as total_cities,
        (SELECT COUNT(*)::int FROM neighborhoods WHERE deleted_at IS NULL) as total_neighborhoods,
        (SELECT COUNT(*)::int FROM properties WHERE location IS NOT NULL AND deleted_at IS NULL) as geocoded_properties
    `;

    // Get properties by type
    const byType = await sql`
      SELECT
        property_type,
        operation_type,
        COUNT(*)::int as count,
        COALESCE(AVG(price), 0) as avg_price
      FROM properties
      WHERE status = 'active' AND deleted_at IS NULL
      GROUP BY property_type, operation_type
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get top cities (using normalized structure)
    const topCities = await sql`
      SELECT
        c.name->>'es' as city_name,
        c.slug as city_slug,
        s.name->>'es' as state_name,
        COUNT(p.id)::int as count,
        COALESCE(AVG(p.price), 0) as avg_price
      FROM cities c
      LEFT JOIN properties p ON p.city_id = c.id AND p.deleted_at IS NULL
      LEFT JOIN states s ON c.state_id = s.id
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name, c.slug, s.name
      HAVING COUNT(p.id) > 0
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get top neighborhoods
    const topNeighborhoods = await sql`
      SELECT
        n.name->>'es' as neighborhood_name,
        n.slug as neighborhood_slug,
        c.name->>'es' as city_name,
        COUNT(p.id)::int as count,
        COALESCE(AVG(p.price), 0) as avg_price
      FROM neighborhoods n
      LEFT JOIN properties p ON p.neighborhood_id = n.id AND p.deleted_at IS NULL
      LEFT JOIN cities c ON n.city_id = c.id
      WHERE n.deleted_at IS NULL
      GROUP BY n.id, n.name, n.slug, c.name
      HAVING COUNT(p.id) > 0
      ORDER BY count DESC
      LIMIT 10
    `;

    // Get latest properties (with geographic JOINs)
    const latest = await sql`
      SELECT
        p.id,
        p.title,
        p.price,
        p.currency,
        p.property_type,
        p.operation_type,
        p.created_at,
        c.name->>'es' as city_name,
        c.slug as city_slug,
        n.name->>'es' as neighborhood_name,
        n.slug as neighborhood_slug,
        s.name->>'es' as state_name,
        co.name->>'es' as country_name,
        p.images->>0 as image_url,
        p.bedrooms,
        p.bathrooms,
        p.total_surface
      FROM properties p
      LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
      LEFT JOIN cities c ON p.city_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN countries co ON p.country_id = co.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT 10
    `;

    res.status(200).json({
      success: true,
      stats: stats[0],
      byType: byType,
      topCities: topCities,
      topNeighborhoods: topNeighborhoods,
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