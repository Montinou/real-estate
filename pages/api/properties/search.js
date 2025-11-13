/**
 * Vercel API Route: Search Properties
 * /api/properties/search
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

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

  const {
    city,
    neighborhood,
    city_id,
    state_id,
    neighborhood_id,
    country_id,
    property_type,
    operation_type,
    min_price,
    max_price,
    rooms,
    limit = 50,
    offset = 0
  } = req.query;

  try {
    // Build WHERE conditions
    const conditions = [];
    const params = [];

    conditions.push(`p.status = 'active'`);
    conditions.push(`p.deleted_at IS NULL`);

    if (country_id) {
      conditions.push(`p.country_id = ${parseInt(country_id)}`);
    }

    if (state_id) {
      conditions.push(`p.state_id = ${parseInt(state_id)}`);
    }

    if (city_id) {
      conditions.push(`p.city_id = ${parseInt(city_id)}`);
    }

    if (neighborhood_id) {
      conditions.push(`p.neighborhood_id = ${parseInt(neighborhood_id)}`);
    }

    if (city && !city_id) {
      conditions.push(`(c.name->>'es' ILIKE '%${city}%' OR c.slug ILIKE '%${city}%')`);
    }

    if (neighborhood && !neighborhood_id) {
      conditions.push(`(n.name->>'es' ILIKE '%${neighborhood}%' OR n.slug ILIKE '%${neighborhood}%')`);
    }

    if (property_type) {
      conditions.push(`p.property_type = '${property_type}'`);
    }

    if (operation_type) {
      conditions.push(`p.operation_type = '${operation_type}'`);
    }

    if (min_price) {
      conditions.push(`p.price_usd >= ${parseFloat(min_price)}`);
    }

    if (max_price) {
      conditions.push(`p.price_usd <= ${parseFloat(max_price)}`);
    }

    if (rooms) {
      conditions.push(`p.rooms >= ${parseInt(rooms)}`);
    }

    const whereClause = conditions.join(' AND ');

    // Execute query using Neon
    const result = await sql`
      SELECT
        p.id,
        p.title,
        p.price,
        p.currency,
        p.price_usd,
        p.property_type,
        p.operation_type,
        p.address,
        ST_X(p.location::geometry) as lng,
        ST_Y(p.location::geometry) as lat,
        p.area_sqm,
        p.rooms,
        p.bedrooms,
        p.bathrooms,
        p.created_at,
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
      WHERE ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*)::int as total
      FROM properties p
      LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
      LEFT JOIN cities c ON p.city_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN countries co ON p.country_id = co.id
      WHERE ${sql.unsafe(whereClause)}
    `;

    // Send response
    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < countResult[0].total
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search properties',
      details: error.message
    });
  }
}
