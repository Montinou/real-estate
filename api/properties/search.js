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

    // Build query dynamically
    let query = `
      SELECT
        id,
        title,
        price,
        currency,
        price_usd,
        property_type,
        operation_type,
        city,
        neighborhood,
        address,
        ST_X(location::geometry) as lng,
        ST_Y(location::geometry) as lat,
        total_surface,
        rooms,
        bedrooms,
        bathrooms,
        created_at,
        (SELECT url FROM property_images WHERE property_id = p.id ORDER BY display_order LIMIT 1) as image_url
      FROM properties p
      WHERE status = 'active'
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Add filters
    if (city) {
      conditions.push(`city ILIKE $${paramCount}`);
      values.push(`%${city}%`);
      paramCount++;
    }

    if (neighborhood) {
      conditions.push(`neighborhood ILIKE $${paramCount}`);
      values.push(`%${neighborhood}%`);
      paramCount++;
    }

    if (property_type) {
      conditions.push(`property_type = $${paramCount}`);
      values.push(property_type);
      paramCount++;
    }

    if (operation_type) {
      conditions.push(`operation_type = $${paramCount}`);
      values.push(operation_type);
      paramCount++;
    }

    if (min_price) {
      conditions.push(`price_usd >= $${paramCount}`);
      values.push(parseFloat(min_price));
      paramCount++;
    }

    if (max_price) {
      conditions.push(`price_usd <= $${paramCount}`);
      values.push(parseFloat(max_price));
      paramCount++;
    }

    if (rooms) {
      conditions.push(`rooms >= $${paramCount}`);
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

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM properties p WHERE status = 'active'`;
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