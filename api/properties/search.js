/**
 * Vercel API Route: Search Properties
 * /api/properties/search
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

  const client = getClient();

  try {
    await client.connect();

    // Build query dynamically with geographic JOINs
    let query = `
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
        p.total_surface,
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
        (SELECT url FROM property_images WHERE property_id = p.id ORDER BY display_order LIMIT 1) as image_url
      FROM properties p
      LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
      LEFT JOIN cities c ON p.city_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN countries co ON p.country_id = co.id
      WHERE p.status = 'active' AND p.deleted_at IS NULL
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Add geographic filters (new normalized structure)
    if (country_id) {
      conditions.push(`p.country_id = $${paramCount}`);
      values.push(parseInt(country_id));
      paramCount++;
    }

    if (state_id) {
      conditions.push(`p.state_id = $${paramCount}`);
      values.push(parseInt(state_id));
      paramCount++;
    }

    if (city_id) {
      conditions.push(`p.city_id = $${paramCount}`);
      values.push(parseInt(city_id));
      paramCount++;
    }

    if (neighborhood_id) {
      conditions.push(`p.neighborhood_id = $${paramCount}`);
      values.push(parseInt(neighborhood_id));
      paramCount++;
    }

    // Legacy text-based filters (for backward compatibility)
    if (city && !city_id) {
      conditions.push(`(c.name->>'es' ILIKE $${paramCount} OR c.slug ILIKE $${paramCount})`);
      values.push(`%${city}%`);
      paramCount++;
    }

    if (neighborhood && !neighborhood_id) {
      conditions.push(`(n.name->>'es' ILIKE $${paramCount} OR n.slug ILIKE $${paramCount})`);
      values.push(`%${neighborhood}%`);
      paramCount++;
    }

    if (property_type) {
      conditions.push(`p.property_type = $${paramCount}`);
      values.push(property_type);
      paramCount++;
    }

    if (operation_type) {
      conditions.push(`p.operation_type = $${paramCount}`);
      values.push(operation_type);
      paramCount++;
    }

    if (min_price) {
      conditions.push(`p.price_usd >= $${paramCount}`);
      values.push(parseFloat(min_price));
      paramCount++;
    }

    if (max_price) {
      conditions.push(`p.price_usd <= $${paramCount}`);
      values.push(parseFloat(max_price));
      paramCount++;
    }

    if (rooms) {
      conditions.push(`p.rooms >= $${paramCount}`);
      values.push(parseInt(rooms));
      paramCount++;
    }

    // Add conditions to query
    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), parseInt(offset));

    // Execute query
    const result = await client.query(query, values);

    // Get total count (with same JOINs for filter accuracy)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM properties p
      LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
      LEFT JOIN cities c ON p.city_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN countries co ON p.country_id = co.id
      WHERE p.status = 'active' AND p.deleted_at IS NULL
    `;
    if (conditions.length > 0) {
      countQuery += ` AND ${conditions.join(' AND ')}`;
    }
    const countResult = await client.query(countQuery, values.slice(0, -2));

    // Send response
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + limit < countResult.rows[0].total
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search properties',
      details: error.message
    });
  } finally {
    await client.end();
  }
}