/**
 * Local Properati Scraper - Extract all images from property listings and upload to R2
 * Run with: node scripts/scrape-properati-local.js
 */

import { neon } from '@neondatabase/serverless';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { uploadPropertyImages } from '../lib/r2-upload.js';

const sql = neon(process.env.DATABASE_URL);

// Helper function to fetch all images from a property detail page
async function fetchDetailPageImages(propertyUrl) {
  try {
    const fullUrl = propertyUrl.startsWith('http')
      ? propertyUrl
      : `https://www.properati.com.ar${propertyUrl}`;

    console.log(`  Fetching detail page: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Referer': 'https://www.properati.com.ar/',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      console.error(`  ❌ Detail page returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const images = [];

    // Extract images from gallery
    $('img[alt^="place photo"]').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('img.properati.com')) {
        images.push(src);
      }
    });

    // Also try other common selectors
    if (images.length === 0) {
      $('.gallery-image img, .property-gallery img, [class*="gallery"] img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('img.properati.com')) {
          images.push(src);
        }
      });
    }

    console.log(`  ✅ Found ${images.length} images`);
    return [...new Set(images)]; // Remove duplicates

  } catch (error) {
    console.error(`  ❌ Error fetching detail page:`, error.message);
    return [];
  }
}

// Main scraper function
async function scrapePropertyImages(limit = null) {
  console.log('\n🚀 Starting local Properati image scraper...\n');

  try {
    // Fetch properties that need image updates (those with url field)
    const query = limit
      ? sql`SELECT id, url, title FROM properties WHERE url IS NOT NULL AND url LIKE '%properati.com%' ORDER BY id LIMIT ${limit}`
      : sql`SELECT id, url, title FROM properties WHERE url IS NOT NULL AND url LIKE '%properati.com%' ORDER BY id`;

    const properties = await query;
    console.log(`📊 Found ${properties.length} properties to process\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      console.log(`[${i + 1}/${properties.length}] Processing property ID ${property.id}: ${property.title}`);

      // Fetch all images from detail page
      const properatiImages = await fetchDetailPageImages(property.url);

      if (properatiImages.length > 0) {
        console.log(`  📤 Uploading ${properatiImages.length} images to R2...`);

        // Upload images to R2
        const r2Images = await uploadPropertyImages(properatiImages, property.id);

        if (r2Images.length > 0) {
          // Update property with R2 URLs
          await sql`
            UPDATE properties
            SET
              images = ${JSON.stringify(r2Images)},
              updated_at = NOW()
            WHERE id = ${property.id}
          `;
          console.log(`  ✅ Uploaded and saved ${r2Images.length} images to R2\n`);
          successCount++;
        } else {
          console.log(`  ❌ Failed to upload images to R2\n`);
          errorCount++;
        }
      } else {
        console.log(`  ⚠️  No images found, skipping update\n`);
        errorCount++;
      }

      // Rate limiting - wait 500ms between requests to be respectful
      if (i < properties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n✅ Scraping completed!');
    console.log(`   Success: ${successCount} properties updated`);
    console.log(`   Errors:  ${errorCount} properties skipped`);

  } catch (error) {
    console.error('\n❌ Scraper error:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

// Run scraper
scrapePropertyImages(limit)
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
