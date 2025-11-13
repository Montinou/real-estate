#!/usr/bin/env node
/**
 * Test Properties Search API
 * Tests the updated geographic structure
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

console.log('🔍 Testing Properties Search API with Geographic Structure\n');

async function testSearch(filters, description) {
  console.log(`\n📋 Test: ${description}`);
  console.log(`   Filters:`, filters);

  try {
    // Build query
    let whereClauses = ['p.status = $1', 'p.deleted_at IS NULL'];
    let values = ['active'];
    let paramCount = 2;

    if (filters.city) {
      whereClauses.push(`(c.name->>'es' ILIKE $${paramCount} OR c.slug ILIKE $${paramCount})`);
      values.push(`%${filters.city}%`);
      paramCount++;
    }

    if (filters.property_type) {
      whereClauses.push(`p.property_type = $${paramCount}`);
      values.push(filters.property_type);
      paramCount++;
    }

    if (filters.operation_type) {
      whereClauses.push(`p.operation_type = $${paramCount}`);
      values.push(filters.operation_type);
      paramCount++;
    }

    const whereClause = whereClauses.join(' AND ');

    const query = `
      SELECT
        p.id,
        p.title,
        p.price,
        p.currency,
        p.property_type,
        c.name->>'es' as city_name,
        n.name->>'es' as neighborhood_name,
        s.name->>'es' as state_name,
        co.name->>'es' as country_name
      FROM properties p
      LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
      LEFT JOIN cities c ON p.city_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN countries co ON p.country_id = co.id
      WHERE ${whereClause}
      LIMIT 5
    `;

    // Execute using .query() method for parameterized queries
    const rows = await sql.query(query, values);

    console.log(`   ✅ Found ${rows.length} properties:`);
    rows.forEach((prop, i) => {
      const location = [prop.neighborhood_name, prop.city_name, prop.state_name]
        .filter(Boolean)
        .join(', ');
      console.log(`      ${i + 1}. ${prop.title.substring(0, 40)} - ${location}`);
    });

    return rows.length;

  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return -1;
  }
}

try {
  console.log('✅ Starting tests\n');

  // Test 1: Search all active properties
  await testSearch({}, 'All active properties');

  // Test 2: Search by city (text search)
  await testSearch({ city: 'Caballito' }, 'Text search for city "Caballito"');

  // Test 3: Search by property type
  await testSearch({ property_type: 'apartment' }, 'Filter by property_type = apartment');

  // Test 4: Search by operation type
  await testSearch({ operation_type: 'sale' }, 'Filter by operation_type = sale');

  // Test 5: Combined filters
  await testSearch(
    { property_type: 'apartment', operation_type: 'sale' },
    'Apartments for sale'
  );

  console.log('\n✅ All search API tests completed!');

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error);
}
