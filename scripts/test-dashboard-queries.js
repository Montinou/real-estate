#!/usr/bin/env node
/**
 * Test Dashboard API Queries
 * Verifies the new geographic structure queries work correctly
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

console.log('🧪 Testing Dashboard API Queries with Geographic Structure\n');

try {
  console.log('📊 Testing general statistics...');
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
  console.log('✅ General Stats:', stats[0]);
  console.log('');

  console.log('🏘️  Testing top cities query...');
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
  console.log('✅ Top Cities:');
  topCities.forEach((city, i) => {
    console.log(`   ${i + 1}. ${city.city_name} (${city.state_name}): ${city.count} properties, avg $${Math.round(city.avg_price)}`);
  });
  console.log('');

  console.log('🏠 Testing top neighborhoods query...');
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
  console.log('✅ Top Neighborhoods:');
  topNeighborhoods.forEach((neighborhood, i) => {
    console.log(`   ${i + 1}. ${neighborhood.neighborhood_name} (${neighborhood.city_name}): ${neighborhood.count} properties, avg $${Math.round(neighborhood.avg_price)}`);
  });
  console.log('');

  console.log('📄 Testing latest properties with JOINs...');
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
      co.name->>'es' as country_name
    FROM properties p
    LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN states s ON p.state_id = s.id
    LEFT JOIN countries co ON p.country_id = co.id
    WHERE p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT 5
  `;
  console.log('✅ Latest Properties:');
  latest.forEach((prop, i) => {
    const location = [prop.neighborhood_name, prop.city_name, prop.state_name, prop.country_name]
      .filter(Boolean)
      .join(', ');
    console.log(`   ${i + 1}. ${prop.title.substring(0, 50)} - ${location}`);
  });
  console.log('');

  console.log('✅ All dashboard queries working correctly!');

} catch (error) {
  console.error('❌ Error testing queries:', error.message);
  console.error(error);
  process.exit(1);
}
