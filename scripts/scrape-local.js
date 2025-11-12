#!/usr/bin/env node
/**
 * Local Scraper Script
 * Run this from your local machine to avoid datacenter IP blocks
 * Downloads images and uploads to R2 + ImageKit
 *
 * Usage:
 *   node scripts/scrape-local.js properati --limit 50
 *   node scripts/scrape-local.js properati --type departamentos_alquiler_caba --limit 30
 *   node scripts/scrape-local.js properati --limit 50 --skip-images  (skip image download)
 */

import * as cheerio from 'cheerio';
import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize R2 client (S3-compatible)
const r2Client = process.env.R2_ACCESS_KEY_ID ? new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
}) : null;

const sql = neon(process.env.DATABASE_URL);

// Properati URLs
const PROPERATI_URLS = {
  departamentos_venta_caba: 'https://www.properati.com.ar/s/capital-federal/departamento/venta',
  casas_venta_caba: 'https://www.properati.com.ar/s/capital-federal/casa/venta',
  departamentos_alquiler_caba: 'https://www.properati.com.ar/s/capital-federal/departamento/alquiler',
  casas_alquiler_caba: 'https://www.properati.com.ar/s/capital-federal/casa/alquiler',
};

// Helper functions (same as API)
function extractNumber(text) {
  if (!text) return null;
  const match = text.match(/[\d,.]+/);
  if (!match) return null;
  return parseFloat(match[0].replace(/[,.]/g, ''));
}

function extractPrice(priceText) {
  if (!priceText) return { price: null, currency: 'ARS' };
  const clean = priceText.trim();
  if (clean.includes('USD') || clean.includes('US$') || clean.includes('U$S')) {
    return { price: extractNumber(clean), currency: 'USD' };
  }
  return { price: extractNumber(clean), currency: 'ARS' };
}

function getOperationType(url) {
  if (url.includes('/alquiler')) return 'rent';
  if (url.includes('/venta')) return 'sale';
  return 'sale';
}

function getPropertyType(url) {
  if (url.includes('/departamento')) return 'apartment';
  if (url.includes('/casa')) return 'house';
  if (url.includes('/terreno')) return 'land';
  if (url.includes('/local')) return 'commercial';
  return 'other';
}

// Download image and upload to R2
async function downloadAndUploadImage(imageUrl, propertyId) {
  if (!r2Client || !process.env.R2_BUCKET_NAME) {
    return imageUrl; // Return original if R2 not configured
  }

  try {
    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download: ${response.status}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Generate filename
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
    const ext = contentType.split('/')[1] || 'jpg';
    const filename = `properties/${propertyId}/${hash}.${ext}`;

    // Upload to R2
    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    }));

    // Return R2 public URL or ImageKit URL
    if (process.env.R2_PUBLIC_URL) {
      return `${process.env.R2_PUBLIC_URL}/${filename}`;
    }

    // If ImageKit is configured, use it
    if (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
      return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${filename}`;
    }

    return imageUrl; // Fallback to original

  } catch (error) {
    console.error(`    ⚠️  Image upload failed: ${error.message}`);
    return imageUrl; // Return original on error
  }
}

// Main scraper
async function scrapeProperati(options = {}) {
  const { type = 'departamentos_venta_caba', limit = 20 } = options;

  console.log('🏠 PropTech AI - Local Scraper');
  console.log('━'.repeat(50));
  console.log(`📍 Source: Properati Argentina`);
  console.log(`🏷️  Type: ${type}`);
  console.log(`📊 Limit: ${limit}`);
  console.log('━'.repeat(50));

  const stats = {
    fetched: 0,
    inserted: 0,
    updated: 0,
    errors: 0,
    startTime: Date.now(),
  };

  try {
    const targetUrl = PROPERATI_URLS[type] || PROPERATI_URLS.departamentos_venta_caba;

    console.log(`\n🌐 Fetching: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const snippets = $('.snippet').toArray();
    stats.fetched = Math.min(snippets.length, limit);

    console.log(`✅ Found ${snippets.length} listings, processing ${stats.fetched}\n`);

    for (let i = 0; i < stats.fetched; i++) {
      try {
        const snippet = $(snippets[i]);

        // Extract data
        const title = snippet.find('.information2__top .title').text().trim();
        const priceText = snippet.find('.information2__top .price').text().trim();
        const location = snippet.find('.information2__top .location').text().trim();
        const description = snippet.find('.information2 .description').text().trim();

        // Extract URL
        const href = snippet.attr('onclick');
        let propertyUrl = null;
        if (href) {
          const match = href.match(/window\.location\.href='([^']+)'/);
          if (match) {
            propertyUrl = match[1].startsWith('http') ? match[1] : `https://www.properati.com.ar${match[1]}`;
          }
        }

        if (!propertyUrl) {
          stats.errors++;
          continue;
        }

        const { price, currency } = extractPrice(priceText);
        const bedrooms = extractNumber(snippet.find('.properties__bedrooms').text());
        const bathrooms = extractNumber(snippet.find('.properties__bathrooms').text());
        const area = extractNumber(snippet.find('.properties__area').text());

        const operationType = getOperationType(targetUrl);
        const propertyType = getPropertyType(targetUrl);
        const externalId = `properati_${propertyUrl.split('/').pop()}`;

        // Process images
        let images = [];
        const imageUrl = snippet.find('.snippet__image img').attr('src');

        if (imageUrl && !options.skipImages) {
          console.log(`    📷 Uploading image...`);
          const uploadedUrl = await downloadAndUploadImage(imageUrl, externalId);
          images = [uploadedUrl];
        } else if (imageUrl) {
          images = [imageUrl];
        }

        const locationParts = location.split(',').map(p => p.trim());
        const city = locationParts[0] || 'Capital Federal';
        const neighborhood = locationParts[1] || null;

        // Insert into database
        const query = `
          INSERT INTO properties (
            external_id, source, title, description, url,
            price, currency, operation_type, property_type,
            bedrooms, bathrooms, area_sqm,
            address, neighborhood, city, state, country,
            images, features, metadata, status,
            scraped_at, last_seen_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12,
            $13, $14, $15, $16, $17,
            $18::jsonb, $19::jsonb, $20::jsonb, $21,
            NOW(), NOW(), NOW()
          )
          ON CONFLICT (external_id)
          DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            currency = EXCLUDED.currency,
            bedrooms = EXCLUDED.bedrooms,
            bathrooms = EXCLUDED.bathrooms,
            area_sqm = EXCLUDED.area_sqm,
            address = EXCLUDED.address,
            neighborhood = EXCLUDED.neighborhood,
            city = EXCLUDED.city,
            images = EXCLUDED.images,
            last_seen_at = NOW(),
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted
        `;

        const params = [
          externalId,
          'properati',
          title || 'Sin título',
          description || '',
          propertyUrl,
          price,
          currency,
          operationType,
          propertyType,
          bedrooms,
          bathrooms,
          area,
          location,
          neighborhood,
          city,
          'Buenos Aires',
          'AR',
          JSON.stringify(images),
          JSON.stringify([]),
          JSON.stringify({ scraped_from: targetUrl, scraper: 'local' }),
          'active',
        ];

        const result = await sql(query, params);

        if (result[0]?.inserted) {
          stats.inserted++;
          console.log(`  ✅ [${i + 1}/${stats.fetched}] Inserted: ${title.substring(0, 60)}`);
        } else {
          stats.updated++;
          console.log(`  🔄 [${i + 1}/${stats.fetched}] Updated: ${title.substring(0, 60)}`);
        }

        // Rate limiting
        if (i < stats.fetched - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

      } catch (itemError) {
        stats.errors++;
        console.error(`  ❌ [${i + 1}/${stats.fetched}] Error:`, itemError.message);
      }
    }

    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);

    console.log('\n' + '━'.repeat(50));
    console.log('📊 RESULTS');
    console.log('━'.repeat(50));
    console.log(`✅ Inserted: ${stats.inserted}`);
    console.log(`🔄 Updated:  ${stats.updated}`);
    console.log(`❌ Errors:   ${stats.errors}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('━'.repeat(50));

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const source = args[0] || 'properati';
const options = {};

for (let i = 1; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--skip-images') {
    options.skipImages = true;
    continue;
  }

  if (arg.startsWith('--')) {
    const key = arg.replace('--', '');
    const value = args[i + 1];

    if (key === 'limit') {
      options.limit = parseInt(value);
      i++; // Skip next arg
    } else if (key === 'type') {
      options.type = value;
      i++; // Skip next arg
    }
  }
}

// Run scraper
if (source === 'properati') {
  scrapeProperati(options);
} else {
  console.error('❌ Unknown source:', source);
  console.log('\nUsage:');
  console.log('  node scripts/scrape-local.js properati --limit 50');
  console.log('  node scripts/scrape-local.js properati --type departamentos_alquiler_caba --limit 30');
  console.log('\nAvailable types:');
  console.log('  - departamentos_venta_caba');
  console.log('  - casas_venta_caba');
  console.log('  - departamentos_alquiler_caba');
  console.log('  - casas_alquiler_caba');
  process.exit(1);
}
