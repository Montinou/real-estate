/**
 * Vercel API Route: Get Single Property
 * /api/properties/[id]
 */

import { Client } from 'pg';

// Create PostgreSQL client
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Property ID is required'
    });
  }

  const client = getClient();

  try {
    await client.connect();

    // Fetch property with geographic JOINs
    const query = `
      SELECT
        p.id,
        p.title,
        p.description,
        p.price,
        p.currency,
        p.price_usd,
        p.property_type,
        p.operation_type,
        p.address,
        ST_X(p.location::geometry) as lng,
        ST_Y(p.location::geometry) as lat,
        p.area_sqm,
        p.covered_area_sqm,
        p.rooms,
        p.bedrooms,
        p.bathrooms,
        p.garages,
        p.antiquity,
        p.orientation,
        p.disposition,
        p.images,
        p.source_url,
        p.created_at,
        p.updated_at,
        c.name->>'es' as city_name,
        c.slug as city_slug,
        n.name->>'es' as neighborhood_name,
        n.slug as neighborhood_slug,
        s.name->>'es' as state_name,
        s.slug as state_slug,
        co.name->>'es' as country_name,
        co.code as country_code,
        p.images->>0 as image_url
      FROM properties p
      LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
      LEFT JOIN cities c ON p.city_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN countries co ON p.country_id = co.id
      WHERE p.id = $1 AND p.status = 'active' AND p.deleted_at IS NULL
    `;

    const result = await client.query(query, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Send response
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Property fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property',
      details: error.message
    });
  } finally {
    await client.end();
  }
}
