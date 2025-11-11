/**
 * Vercel API Route: Dashboard Statistics
 * /api/stats/dashboard
 */

import { Client } from 'pg';

const getClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
};

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

  const client = getClient();

  try {
    await client.connect();

    // Get general statistics
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM properties) as total_properties,
        (SELECT COUNT(*) FROM raw_listings) as total_listings,
        (SELECT COUNT(*) FROM properties WHERE status = 'active') as active_properties,
        (SELECT COUNT(*) FROM properties WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
        (SELECT COUNT(*) FROM properties WHERE created_at > NOW() - INTERVAL '7 days') as new_week,
        (SELECT AVG(price_usd) FROM properties WHERE price_usd > 0) as avg_price_usd,
        (SELECT COUNT(DISTINCT city) FROM properties) as total_cities,
        (SELECT COUNT(*) FROM property_images) as total_images
    `);

    // Get properties by type
    const byType = await client.query(`
      SELECT
        property_type,
        operation_type,
        COUNT(*) as count,
        AVG(price_usd) as avg_price
      FROM properties
      WHERE status = 'active'
      GROUP BY property_type, operation_type
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get top cities
    const topCities = await client.query(`
      SELECT
        city,
        COUNT(*) as count
      FROM properties
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get latest properties
    const latest = await client.query(`
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
    `);

    // Get scraping sources status
    const sources = await client.query(`
      SELECT
        s.display_name,
        s.is_active,
        s.last_scrape_at,
        COUNT(r.id) as total_scraped,
        SUM(CASE WHEN r.processing_status = 'processed' THEN 1 ELSE 0 END) as processed,
        SUM(CASE WHEN r.processing_status = 'error' THEN 1 ELSE 0 END) as errors
      FROM sources s
      LEFT JOIN raw_listings r ON s.id = r.source_id
      GROUP BY s.id, s.display_name, s.is_active, s.last_scrape_at
    `);

    res.status(200).json({
      success: true,
      stats: stats.rows[0],
      byType: byType.rows,
      topCities: topCities.rows,
      latestProperties: latest.rows,
      sources: sources.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics',
      details: error.message
    });
  } finally {
    await client.end();
  }
}