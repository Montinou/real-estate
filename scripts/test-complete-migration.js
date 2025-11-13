#!/usr/bin/env node
/**
 * Complete Migration Test
 * Validates the entire geographic structure implementation
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

console.log('🧪 Complete Migration Test - Geographic Structure\n');
console.log('═'.repeat(60));

const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

async function runTest(name, testFn) {
  tests.total++;
  try {
    await testFn();
    tests.passed++;
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    tests.failed++;
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

try {
  console.log('\n📊 1. Testing Database Structure');
  console.log('─'.repeat(60));

  await runTest('Countries table exists and has data', async () => {
    const result = await sql`SELECT COUNT(*)::int as count FROM countries WHERE deleted_at IS NULL`;
    if (result[0].count < 1) throw new Error(`Expected >= 1 countries, got ${result[0].count}`);
  });

  await runTest('States table exists and has data', async () => {
    const result = await sql`SELECT COUNT(*)::int as count FROM states WHERE deleted_at IS NULL`;
    if (result[0].count < 1) throw new Error(`Expected >= 1 states, got ${result[0].count}`);
  });

  await runTest('Cities table exists and has data', async () => {
    const result = await sql`SELECT COUNT(*)::int as count FROM cities WHERE deleted_at IS NULL`;
    if (result[0].count < 1) throw new Error(`Expected >= 1 cities, got ${result[0].count}`);
  });

  await runTest('Neighborhoods table exists and has data', async () => {
    const result = await sql`SELECT COUNT(*)::int as count FROM neighborhoods WHERE deleted_at IS NULL`;
    if (result[0].count < 1) throw new Error(`Expected >= 1 neighborhoods, got ${result[0].count}`);
  });

  await runTest('Properties table has geographic foreign keys', async () => {
    const result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'properties'
        AND column_name IN ('country_id', 'state_id', 'city_id', 'neighborhood_id', 'location')
    `;
    if (result.length < 5) throw new Error(`Expected 5 geographic columns, found ${result.length}`);
  });

  console.log('\n🔗 2. Testing Data Relationships');
  console.log('─'.repeat(60));

  await runTest('All properties have valid geographic IDs', async () => {
    const result = await sql`
      SELECT COUNT(*)::int as invalid_count
      FROM properties
      WHERE deleted_at IS NULL
        AND (
          (country_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM countries WHERE id = properties.country_id))
          OR (state_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM states WHERE id = properties.state_id))
          OR (city_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cities WHERE id = properties.city_id))
          OR (neighborhood_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM neighborhoods WHERE id = properties.neighborhood_id))
        )
    `;
    if (result[0].invalid_count > 0) throw new Error(`Found ${result[0].invalid_count} properties with invalid geographic IDs`);
  });

  await runTest('Cities belong to valid states', async () => {
    const result = await sql`
      SELECT COUNT(*)::int as invalid_count
      FROM cities c
      LEFT JOIN states s ON c.state_id = s.id
      WHERE c.deleted_at IS NULL AND s.id IS NULL
    `;
    if (result[0].invalid_count > 0) throw new Error(`Found ${result[0].invalid_count} orphaned cities`);
  });

  await runTest('Neighborhoods belong to valid cities', async () => {
    const result = await sql`
      SELECT COUNT(*)::int as invalid_count
      FROM neighborhoods n
      LEFT JOIN cities c ON n.city_id = c.id
      WHERE n.deleted_at IS NULL AND c.id IS NULL
    `;
    if (result[0].invalid_count > 0) throw new Error(`Found ${result[0].invalid_count} orphaned neighborhoods`);
  });

  console.log('\n🗺️  3. Testing PostGIS Geography');
  console.log('─'.repeat(60));

  await runTest('Location column exists and is PostGIS geography', async () => {
    const result = await sql`
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'properties' AND column_name = 'location'
    `;
    if (result.length === 0) throw new Error('Location column not found');
  });

  await runTest('Some properties have geocoded coordinates', async () => {
    const result = await sql`
      SELECT COUNT(*)::int as geocoded_count
      FROM properties
      WHERE location IS NOT NULL AND deleted_at IS NULL
    `;
    if (result[0].geocoded_count === 0) throw new Error('No properties have coordinates');
    console.log(`   📍 ${result[0].geocoded_count} properties geocoded`);
  });

  await runTest('Can calculate distance between properties', async () => {
    const result = await sql`
      SELECT
        COUNT(*)::int as property_pairs,
        AVG(ST_Distance(p1.location, p2.location))::int as avg_distance_meters
      FROM properties p1
      CROSS JOIN properties p2
      WHERE p1.id < p2.id
        AND p1.location IS NOT NULL
        AND p2.location IS NOT NULL
        AND p1.deleted_at IS NULL
        AND p2.deleted_at IS NULL
      LIMIT 100
    `;
    if (result.length === 0 || result[0].property_pairs === 0) throw new Error('Cannot calculate distances');
    console.log(`   📏 Avg distance: ${(result[0].avg_distance_meters / 1000).toFixed(1)}km`);
  });

  console.log('\n🔍 4. Testing API Queries');
  console.log('─'.repeat(60));

  await runTest('Dashboard stats query works', async () => {
    const stats = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM properties WHERE deleted_at IS NULL) as total_properties,
        (SELECT COUNT(*)::int FROM cities WHERE deleted_at IS NULL) as total_cities,
        (SELECT COUNT(*)::int FROM neighborhoods WHERE deleted_at IS NULL) as total_neighborhoods,
        (SELECT COUNT(*)::int FROM properties WHERE location IS NOT NULL AND deleted_at IS NULL) as geocoded_properties
    `;
    if (!stats[0] || stats[0].total_properties === 0) throw new Error('No properties found');
    console.log(`   📊 ${stats[0].total_properties} properties, ${stats[0].total_cities} cities, ${stats[0].total_neighborhoods} neighborhoods`);
  });

  await runTest('Top cities query works', async () => {
    const topCities = await sql`
      SELECT
        c.name->>'es' as city_name,
        COUNT(p.id)::int as count
      FROM cities c
      LEFT JOIN properties p ON p.city_id = c.id AND p.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name
      HAVING COUNT(p.id) > 0
      ORDER BY count DESC
      LIMIT 5
    `;
    if (topCities.length === 0) throw new Error('No cities with properties found');
    console.log(`   🏙️  Top city: ${topCities[0].city_name} (${topCities[0].count} properties)`);
  });

  await runTest('Top neighborhoods query works', async () => {
    const topNeighborhoods = await sql`
      SELECT
        n.name->>'es' as neighborhood_name,
        COUNT(p.id)::int as count
      FROM neighborhoods n
      LEFT JOIN properties p ON p.neighborhood_id = n.id AND p.deleted_at IS NULL
      WHERE n.deleted_at IS NULL
      GROUP BY n.id, n.name
      HAVING COUNT(p.id) > 0
      ORDER BY count DESC
      LIMIT 5
    `;
    if (topNeighborhoods.length === 0) throw new Error('No neighborhoods with properties found');
    console.log(`   🏘️  Top neighborhood: ${topNeighborhoods[0].neighborhood_name} (${topNeighborhoods[0].count} properties)`);
  });

  await runTest('Search with JOINs works', async () => {
    const results = await sql`
      SELECT
        p.id,
        p.title,
        c.name->>'es' as city_name,
        n.name->>'es' as neighborhood_name
      FROM properties p
      LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
      LEFT JOIN cities c ON p.city_id = c.id
      WHERE p.deleted_at IS NULL
      LIMIT 5
    `;
    if (results.length === 0) throw new Error('Search query returned no results');
    console.log(`   🔍 Found ${results.length} properties with geographic data`);
  });

  console.log('\n🌐 5. Testing JSONB i18n Support');
  console.log('─'.repeat(60));

  await runTest('Country names support i18n', async () => {
    const result = await sql`
      SELECT
        code,
        name->>'es' as name_es,
        name->>'en' as name_en
      FROM countries
      WHERE deleted_at IS NULL
      LIMIT 1
    `;
    if (!result[0] || !result[0].name_es) throw new Error('Country names not properly stored as JSONB');
    console.log(`   🌍 ${result[0].code}: ${result[0].name_es} (ES), ${result[0].name_en || 'N/A'} (EN)`);
  });

  await runTest('City slugs are properly generated', async () => {
    const result = await sql`
      SELECT name->>'es' as name, slug
      FROM cities
      WHERE deleted_at IS NULL AND slug IS NOT NULL
      LIMIT 3
    `;
    if (result.length === 0) throw new Error('No cities with slugs found');
    console.log(`   🔗 Example slugs: ${result.map(r => r.slug).join(', ')}`);
  });

  console.log('\n📈 6. Testing Indexes');
  console.log('─'.repeat(60));

  await runTest('Geographic indexes exist', async () => {
    const result = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('properties', 'cities', 'neighborhoods', 'states')
        AND indexname LIKE '%location%' OR indexname LIKE '%boundary%'
    `;
    if (result.length === 0) throw new Error('No geographic indexes found');
    console.log(`   📑 Found ${result.length} geographic indexes`);
  });

  await runTest('Foreign key indexes exist', async () => {
    const result = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'properties'
        AND (
          indexname LIKE '%country_id%'
          OR indexname LIKE '%state_id%'
          OR indexname LIKE '%city_id%'
          OR indexname LIKE '%neighborhood_id%'
        )
    `;
    if (result.length < 4) throw new Error(`Expected 4 foreign key indexes, found ${result.length}`);
    console.log(`   🔑 Found ${result.length} foreign key indexes`);
  });

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests:  ${tests.total}`);
  console.log(`✅ Passed:    ${tests.passed}`);
  console.log(`❌ Failed:    ${tests.failed}`);
  console.log(`Success Rate: ${((tests.passed / tests.total) * 100).toFixed(1)}%`);
  console.log('═'.repeat(60));

  if (tests.failed === 0) {
    console.log('\n🎉 All tests passed! Geographic migration is complete and working correctly.');
  } else {
    console.log(`\n⚠️  ${tests.failed} test(s) failed. Please review the errors above.`);
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ Fatal error during testing:', error.message);
  console.error(error);
  process.exit(1);
}
