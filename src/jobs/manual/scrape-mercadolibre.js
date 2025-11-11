#!/usr/bin/env node

/**
 * Manual MercadoLibre Scraping Job
 * Fetches properties from MercadoLibre API and stores in database
 */

const { Client } = require('pg');
const MercadoLibreClient = require('../../scrapers/mercadolibre/client');
require('dotenv').config();

// Database connection
const db = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/real_estate_cordoba'
});

// Statistics
const stats = {
  startTime: Date.now(),
  processed: 0,
  inserted: 0,
  updated: 0,
  errors: 0,
  duplicates: 0
};

/**
 * Get source ID for MercadoLibre
 */
async function getSourceId() {
  const result = await db.query(
    'SELECT id FROM sources WHERE name = $1',
    ['mercadolibre']
  );

  if (result.rows.length === 0) {
    throw new Error('MercadoLibre source not found in database');
  }

  return result.rows[0].id;
}

/**
 * Insert or update raw listing
 */
async function saveRawListing(sourceId, property, parsed) {
  try {
    const checksum = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(property))
      .digest('hex');

    const result = await db.query(`
      INSERT INTO raw_listings (
        source_id,
        external_id,
        url,
        raw_data,
        title,
        price_raw,
        location_raw,
        checksum,
        scraped_at,
        processing_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'pending')
      ON CONFLICT (source_id, external_id) DO UPDATE SET
        raw_data = $4,
        title = $5,
        price_raw = $6,
        location_raw = $7,
        checksum = $8,
        last_seen_at = NOW(),
        times_seen = raw_listings.times_seen + 1,
        processing_status = CASE
          WHEN raw_listings.checksum != $8 THEN 'pending'
          ELSE raw_listings.processing_status
        END
      RETURNING id, (xmax = 0) as inserted
    `, [
      sourceId,
      property.id,
      property.permalink,
      property,
      parsed.title,
      `${property.currency_id} ${property.price}`,
      parsed.address,
      checksum
    ]);

    if (result.rows[0].inserted) {
      stats.inserted++;
    } else {
      stats.updated++;
    }

    return result.rows[0].id;

  } catch (error) {
    console.error(`❌ Error saving property ${property.id}:`, error.message);
    stats.errors++;
    return null;
  }
}

/**
 * Process and normalize property data
 */
async function processProperty(rawListingId, parsed) {
  try {
    // Check for existing property
    const existing = await db.query(`
      SELECT p.id FROM properties p
      JOIN property_sources ps ON p.id = ps.property_id
      WHERE ps.external_id = $1 AND ps.source_id = (
        SELECT source_id FROM raw_listings WHERE id = $2
      )
    `, [parsed.external_id, rawListingId]);

    let propertyId;

    if (existing.rows.length > 0) {
      // Update existing property
      propertyId = existing.rows[0].id;

      await db.query(`
        UPDATE properties SET
          title = $1,
          price = $2,
          currency = $3::currency_type,
          price_usd = CASE
            WHEN $3 = 'USD' THEN $2
            WHEN $3 = 'ARS' THEN $2 / 1000  -- Approximate conversion
            ELSE $2
          END,
          province = $4,
          city = $5,
          neighborhood = $6,
          address = $7,
          location = CASE
            WHEN $8::FLOAT IS NOT NULL AND $9::FLOAT IS NOT NULL
            THEN ST_SetSRID(ST_MakePoint($9::FLOAT, $8::FLOAT), 4326)
            ELSE location
          END,
          property_type = $10::property_type,
          operation_type = $11::operation_type,
          total_surface = $12,
          covered_surface = $13,
          rooms = $14,
          bedrooms = $15,
          bathrooms = $16,
          garage_spaces = $17,
          description = $18,
          last_seen_at = NOW(),
          last_updated_at = NOW(),
          times_seen = times_seen + 1
        WHERE id = $19
      `, [
        parsed.title,
        parsed.price,
        parsed.currency || 'ARS',
        parsed.province,
        parsed.city,
        parsed.neighborhood,
        parsed.address,
        parsed.lat,
        parsed.lng,
        parsed.property_type,
        parsed.operation_type,
        parsed.total_surface,
        parsed.covered_surface,
        parsed.rooms,
        parsed.bedrooms,
        parsed.bathrooms,
        parsed.garage_spaces,
        parsed.description,
        propertyId
      ]);

      stats.duplicates++;

    } else {
      // Insert new property
      const result = await db.query(`
        INSERT INTO properties (
          internal_code,
          title,
          price,
          currency,
          price_usd,
          province,
          city,
          neighborhood,
          address,
          location,
          property_type,
          operation_type,
          total_surface,
          covered_surface,
          rooms,
          bedrooms,
          bathrooms,
          garage_spaces,
          description,
          status,
          first_seen_at,
          last_seen_at
        ) VALUES (
          $1, $2, $3, $4::currency_type,
          CASE
            WHEN $4 = 'USD' THEN $3
            WHEN $4 = 'ARS' THEN $3 / 1000
            ELSE $3
          END,
          $5, $6, $7, $8,
          CASE
            WHEN $9::FLOAT IS NOT NULL AND $10::FLOAT IS NOT NULL
            THEN ST_SetSRID(ST_MakePoint($10::FLOAT, $9::FLOAT), 4326)
            ELSE NULL
          END,
          $11::property_type, $12::operation_type,
          $13, $14, $15, $16, $17, $18, $19,
          'active'::property_status,
          NOW(), NOW()
        ) RETURNING id
      `, [
        `ML-${parsed.external_id}`,
        parsed.title,
        parsed.price,
        parsed.currency || 'ARS',
        parsed.province,
        parsed.city,
        parsed.neighborhood,
        parsed.address,
        parsed.lat,
        parsed.lng,
        parsed.property_type,
        parsed.operation_type,
        parsed.total_surface,
        parsed.covered_surface,
        parsed.rooms,
        parsed.bedrooms,
        parsed.bathrooms,
        parsed.garage_spaces,
        parsed.description
      ]);

      propertyId = result.rows[0].id;
    }

    // Link property to source
    await db.query(`
      INSERT INTO property_sources (
        property_id,
        source_id,
        external_id,
        external_url,
        source_data
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (property_id, source_id) DO UPDATE SET
        external_url = $4,
        last_seen_at = NOW(),
        times_seen = property_sources.times_seen + 1
    `, [
      propertyId,
      await getSourceId(),
      parsed.external_id,
      parsed.url,
      { seller: parsed.seller }
    ]);

    // Save images
    if (parsed.images && parsed.images.length > 0) {
      for (let i = 0; i < parsed.images.length; i++) {
        const image = parsed.images[i];

        await db.query(`
          INSERT INTO property_images (
            property_id,
            original_url,
            display_order,
            width,
            height,
            source_url
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT ON CONSTRAINT property_images_property_id_original_url_key
          DO NOTHING
        `, [
          propertyId,
          image.url,
          i,
          image.width,
          image.height,
          parsed.url
        ]);
      }
    }

    // Update raw listing with property ID
    await db.query(`
      UPDATE raw_listings SET
        property_id = $1,
        processing_status = 'processed'::listing_status,
        processed_at = NOW()
      WHERE id = $2
    `, [propertyId, rawListingId]);

    return propertyId;

  } catch (error) {
    console.error('❌ Error processing property:', error.message);

    // Mark as error
    await db.query(`
      UPDATE raw_listings SET
        processing_status = 'error'::listing_status,
        error_message = $1,
        processing_attempts = processing_attempts + 1
      WHERE id = $2
    `, [error.message, rawListingId]);

    stats.errors++;
    return null;
  }
}

/**
 * Main scraping function
 */
async function scrape(options = {}) {
  console.log('═══════════════════════════════════════');
  console.log('   MercadoLibre Property Scraper');
  console.log('═══════════════════════════════════════\n');

  try {
    // Connect to database
    await db.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Get source ID
    const sourceId = await getSourceId();
    console.log(`📊 Source ID: ${sourceId}\n`);

    // Initialize MercadoLibre client
    const client = new MercadoLibreClient();
    console.log('🚀 Starting property fetch...\n');

    // Fetch properties
    const searchOptions = {
      ...options,
      // Default to Córdoba if no location specified
      state: options.state || 'TUxBUENPUmRvYmE'
    };

    for await (const property of client.fetchAllProperties(searchOptions)) {
      stats.processed++;

      // Parse property
      const parsed = client.parseProperty(property);

      // Save raw listing
      const rawListingId = await saveRawListing(sourceId, property, parsed);

      if (rawListingId) {
        // Process and normalize
        await processProperty(rawListingId, parsed);
      }

      // Progress update
      if (stats.processed % 10 === 0) {
        const elapsed = (Date.now() - stats.startTime) / 1000;
        const rate = stats.processed / elapsed;

        console.log(`📈 Progress: ${stats.processed} properties (${rate.toFixed(1)}/s)`);
        console.log(`   Inserted: ${stats.inserted}, Updated: ${stats.updated}, Errors: ${stats.errors}`);
      }

      // Optional limit for testing
      if (options.limit && stats.processed >= options.limit) {
        console.log(`\n📊 Reached limit of ${options.limit} properties`);
        break;
      }
    }

    // Update source last scrape time
    await db.query(`
      UPDATE sources SET
        last_scrape_at = NOW(),
        last_success_at = NOW(),
        total_scraped = total_scraped + $1
      WHERE id = $2
    `, [stats.processed, sourceId]);

    // Final statistics
    const duration = (Date.now() - stats.startTime) / 1000;
    console.log('\n═══════════════════════════════════════');
    console.log('   Scraping Complete!');
    console.log('═══════════════════════════════════════\n');
    console.log('📊 Final Statistics:');
    console.log(`   Total Processed: ${stats.processed}`);
    console.log(`   New Properties: ${stats.inserted}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Duplicates: ${stats.duplicates}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Duration: ${duration.toFixed(1)} seconds`);
    console.log(`   Rate: ${(stats.processed / duration).toFixed(1)} properties/second`);

    // API stats
    console.log('\n📡 API Statistics:');
    console.log(client.getStats());

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--city':
        options.city = args[++i];
        break;
      case '--operation':
        options.operation = args[++i]; // sale, rent
        break;
      case '--property-type':
        options.propertyType = args[++i]; // apartment, house, etc
        break;
      case '--min-price':
        options.minPrice = parseInt(args[++i]);
        break;
      case '--max-price':
        options.maxPrice = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
Usage: node scrape-mercadolibre.js [options]

Options:
  --limit <n>           Limit number of properties to fetch
  --city <name>         Filter by city
  --operation <type>    Filter by operation (sale, rent)
  --property-type <type> Filter by property type (apartment, house, ph, land)
  --min-price <n>       Minimum price filter
  --max-price <n>       Maximum price filter
  --help               Show this help message

Examples:
  node scrape-mercadolibre.js --limit 100
  node scrape-mercadolibre.js --operation sale --property-type apartment
  node scrape-mercadolibre.js --min-price 50000 --max-price 150000
        `);
        process.exit(0);
    }
  }

  // Run scraper
  scrape(options);
}

module.exports = { scrape };