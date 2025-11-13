#!/usr/bin/env node
/**
 * Migrate Existing Properties to Geographic Structure
 * - Reads existing properties with text-based location
 * - Finds or creates geographic entities (country, state, city, neighborhood)
 * - Updates properties with foreign keys
 * - Attempts geocoding to get lat/lng coordinates
 *
 * Usage:
 *   node scripts/migrate-geographic-data.js
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

// Geocoding service (Nominatim - free, open source)
async function geocode(address) {
  // Rate limit: 1 request per second
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(address)}&` +
      `format=json&limit=1&countrycodes=ar`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PropTech-AI/1.0 (real-estate platform)',
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error(`  ⚠️  Geocoding failed for "${address}": ${error.message}`);
    return null;
  }
}

// Normalize neighborhood name for matching
function normalizeNeighborhoodName(name) {
  if (!name) return null;

  // Remove common prefixes/suffixes
  let normalized = name.toLowerCase().trim();
  normalized = normalized.replace(/^barrio\s+/i, '');
  normalized = normalized.replace(/\s+(barrio|comuna)$/i, '');

  // Handle common variations
  const variations = {
    'palermo chico': 'palermo-chico',
    'palermo viejo': 'palermo-viejo',
    'palermo hollywood': 'palermo-hollywood',
    'palermo soho': 'palermo-soho',
    'villa urquiza': 'villa-urquiza',
    'villa del parque': 'villa-del-parque',
    'san telmo': 'san-telmo',
  };

  return variations[normalized] || normalized.replace(/\s+/g, '-');
}

// Find or create geographic entities
async function findOrCreateCountry(countryText) {
  // Default to Argentina
  const result = await sql`
    SELECT id FROM countries
    WHERE code = 'AR'
    LIMIT 1
  `;
  return result[0]?.id;
}

async function findOrCreateState(stateText, countryId) {
  if (!stateText) {
    // Default to Capital Federal
    const result = await sql`
      SELECT id FROM states
      WHERE country_id = ${countryId}
      AND code = 'CF'
      LIMIT 1
    `;
    return result[0]?.id;
  }

  // Try exact match first
  const normalized = stateText.toLowerCase().trim();
  const result = await sql`
    SELECT id FROM states
    WHERE country_id = ${countryId}
    AND (
      LOWER(name->>'es') = ${normalized}
      OR LOWER(slug) = ${normalized.replace(/\s+/g, '-')}
    )
    LIMIT 1
  `;

  return result[0]?.id;
}

async function findOrCreateCity(cityText, stateId) {
  if (!cityText) {
    // Default to CABA
    const result = await sql`
      SELECT id FROM cities
      WHERE state_id = ${stateId}
      AND slug = 'caba'
      LIMIT 1
    `;
    return result[0]?.id;
  }

  const normalized = cityText.toLowerCase().trim();
  const slug = normalized.replace(/\s+/g, '-');

  // Try to find existing
  const existing = await sql`
    SELECT id FROM cities
    WHERE state_id = ${stateId}
    AND (
      LOWER(name->>'es') = ${normalized}
      OR slug = ${slug}
    )
    LIMIT 1
  `;

  if (existing[0]) return existing[0].id;

  // Create new city
  console.log(`    📍 Creating new city: ${cityText}`);
  const result = await sql`
    INSERT INTO cities (state_id, name, slug)
    VALUES (
      ${stateId},
      ${JSON.stringify({ es: cityText, en: cityText })}::jsonb,
      ${slug}
    )
    RETURNING id
  `;

  return result[0].id;
}

async function findOrCreateNeighborhood(neighborhoodText, cityId) {
  if (!neighborhoodText) return null;

  const normalized = normalizeNeighborhoodName(neighborhoodText);
  if (!normalized) return null;

  // Try to find existing
  const existing = await sql`
    SELECT id FROM neighborhoods
    WHERE city_id = ${cityId}
    AND slug = ${normalized}
    LIMIT 1
  `;

  if (existing[0]) return existing[0].id;

  // Create new neighborhood
  console.log(`    🏘️  Creating new neighborhood: ${neighborhoodText}`);
  const result = await sql`
    INSERT INTO neighborhoods (city_id, name, slug, category)
    VALUES (
      ${cityId},
      ${JSON.stringify({ es: neighborhoodText, en: neighborhoodText })}::jsonb,
      ${normalized},
      'residential'
    )
    RETURNING id
  `;

  return result[0].id;
}

// Main migration function
async function migrateProperties() {
  console.log('🗺️  PropTech AI - Geographic Data Migration');
  console.log('━'.repeat(50));

  const stats = {
    total: 0,
    migrated: 0,
    geocoded: 0,
    errors: 0,
    startTime: Date.now()
  };

  try {
    // Get all properties that haven't been migrated yet
    const properties = await sql`
      SELECT id, title, city, state, country, neighborhood, address
      FROM properties
      WHERE country_id IS NULL
      ORDER BY id
    `;

    stats.total = properties.length;
    console.log(`\n📊 Found ${stats.total} properties to migrate\n`);

    for (const property of properties) {
      try {
        console.log(`🔄 [${stats.migrated + 1}/${stats.total}] Migrating: ${property.title.substring(0, 50)}`);

        // Find or create geographic entities
        const countryId = await findOrCreateCountry(property.country);
        const stateId = await findOrCreateState(property.state, countryId);
        const cityId = await findOrCreateCity(property.city, stateId);
        const neighborhoodId = await findOrCreateNeighborhood(property.neighborhood, cityId);

        console.log(`    ✅ Geographic IDs: country=${countryId}, state=${stateId}, city=${cityId}, neighborhood=${neighborhoodId}`);

        // Try to geocode
        let location = null;
        if (property.address) {
          const fullAddress = `${property.address}, ${property.city || ''}, ${property.state || 'Buenos Aires'}, Argentina`;
          console.log(`    🌐 Geocoding: ${fullAddress.substring(0, 60)}...`);

          const coords = await geocode(fullAddress);
          if (coords) {
            location = `POINT(${coords.lng} ${coords.lat})`;
            console.log(`    📍 Coordinates: ${coords.lat}, ${coords.lng}`);
            stats.geocoded++;
          }
        }

        // Update property
        if (location) {
          await sql`
            UPDATE properties
            SET
              country_id = ${countryId},
              state_id = ${stateId},
              city_id = ${cityId},
              neighborhood_id = ${neighborhoodId},
              location = ST_GeographyFromText(${location})
            WHERE id = ${property.id}
          `;
        } else {
          await sql`
            UPDATE properties
            SET
              country_id = ${countryId},
              state_id = ${stateId},
              city_id = ${cityId},
              neighborhood_id = ${neighborhoodId}
            WHERE id = ${property.id}
          `;
        }

        stats.migrated++;
        console.log(`    ✅ Updated property ${property.id}\n`);

      } catch (error) {
        stats.errors++;
        console.error(`    ❌ Error migrating property ${property.id}:`, error.message, '\n');
      }
    }

    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);

    console.log('━'.repeat(50));
    console.log('📊 MIGRATION RESULTS');
    console.log('━'.repeat(50));
    console.log(`✅ Migrated:  ${stats.migrated}/${stats.total}`);
    console.log(`📍 Geocoded:  ${stats.geocoded}/${stats.total}`);
    console.log(`❌ Errors:    ${stats.errors}`);
    console.log(`⏱️  Duration:  ${duration}s`);
    console.log('━'.repeat(50));

    if (stats.errors > 0) {
      console.log('\n⚠️  Some properties had errors. Review logs above.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateProperties();
