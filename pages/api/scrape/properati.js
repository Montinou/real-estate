/**
 * Properati Argentina Web Scraper
 * Scrapes real estate listings from Properati.com.ar
 */

import * as cheerio from 'cheerio';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Properati search URLs for Argentina
const PROPERATI_URLS = {
  departamentos_venta_caba: 'https://www.properati.com.ar/s/capital-federal/departamento/venta',
  casas_venta_caba: 'https://www.properati.com.ar/s/capital-federal/casa/venta',
  departamentos_alquiler_caba: 'https://www.properati.com.ar/s/capital-federal/departamento/alquiler',
  casas_alquiler_caba: 'https://www.properati.com.ar/s/capital-federal/casa/alquiler',
};

// Helper: Extract number from text
function extractNumber(text) {
  if (!text) return null;
  const match = text.match(/[\d,.]+/);
  if (!match) return null;
  return parseFloat(match[0].replace(/[,.]/g, ''));
}

// Helper: Extract price and currency
function extractPrice(priceText) {
  if (!priceText) return { price: null, currency: 'ARS' };

  // Remove whitespace
  const clean = priceText.trim();

  // Check for USD
  if (clean.includes('USD') || clean.includes('US$') || clean.includes('U$S')) {
    return {
      price: extractNumber(clean),
      currency: 'USD'
    };
  }

  // Default to ARS
  return {
    price: extractNumber(clean),
    currency: 'ARS'
  };
}

// Helper: Determine operation type from URL
function getOperationType(url) {
  if (url.includes('/alquiler')) return 'rent';
  if (url.includes('/venta')) return 'sale';
  return 'sale';
}

// Helper: Determine property type from URL
function getPropertyType(url) {
  if (url.includes('/departamento')) return 'apartment';
  if (url.includes('/casa')) return 'house';
  if (url.includes('/terreno')) return 'land';
  if (url.includes('/local')) return 'commercial';
  return 'other';
}

// Helper: Fetch all images from property detail page
async function fetchDetailPageImages(propertyUrl) {
  try {
    const fullUrl = propertyUrl.startsWith('http')
      ? propertyUrl
      : `https://www.properati.com.ar${propertyUrl}`;

    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.properati.com.ar/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch detail page: ${fullUrl}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract all images from the gallery
    const images = [];

    // Try multiple selectors to find images
    // Method 1: Images with "place photo" alt text
    $('img[alt^="place photo"]').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('img.properati.com')) {
        images.push(src);
      }
    });

    // Method 2: If no images found, try carousel images
    if (images.length === 0) {
      $('.carousel img, .gallery img, [class*="photo"] img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('img.properati.com') && !images.includes(src)) {
          images.push(src);
        }
      });
    }

    return images.length > 0 ? images : [];

  } catch (error) {
    console.error(`Error fetching detail page images for ${propertyUrl}:`, error.message);
    return [];
  }
}

// Main scraper function
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Properati Scraper] Starting scrape...');

    const stats = {
      fetched: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      startTime: Date.now(),
    };

    // Query parameters
    const urlKey = req.query.type || 'departamentos_venta_caba';
    const targetUrl = PROPERATI_URLS[urlKey] || PROPERATI_URLS.departamentos_venta_caba;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    console.log('[Properati Scraper] Fetching:', targetUrl);

    // Fetch HTML with proper headers
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      throw new Error(`Properati returned ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find all property snippets
    const snippets = $('.snippet').toArray();
    stats.fetched = Math.min(snippets.length, limit);

    console.log(`[Properati Scraper] Found ${snippets.length} listings, processing ${stats.fetched}`);

    // Process each listing
    for (let i = 0; i < stats.fetched; i++) {
      try {
        const snippet = $(snippets[i]);

        // Extract basic info
        const title = snippet.find('.information2__top .title').text().trim();
        const priceText = snippet.find('.information2__top .price').text().trim();
        const location = snippet.find('.information2__top .location').text().trim();
        const description = snippet.find('.information2 .description').text().trim();

        // Extract link from <a> tag
        const propertyUrl = snippet.find('a').first().attr('href');

        // Skip if no URL (can't identify property uniquely)
        if (!propertyUrl) {
          console.warn('[Properati Scraper] Skipping listing without URL');
          stats.errors++;
          continue;
        }

        // Extract price
        const { price, currency } = extractPrice(priceText);

        // Extract property features
        const bedrooms = extractNumber(snippet.find('.properties__bedrooms').text());
        const bathrooms = extractNumber(snippet.find('.properties__bathrooms').text());
        const area = extractNumber(snippet.find('.properties__area').text());

        // Extract images from detail page
        console.log(`[Properati Scraper] Fetching images for: ${propertyUrl}`);
        const detailImages = await fetchDetailPageImages(propertyUrl);

        // Fallback to listing image if detail fetch fails
        const listingImage = snippet.find('.snippet__image img').attr('src');
        const images = detailImages.length > 0 ? detailImages : (listingImage ? [listingImage] : []);

        console.log(`[Properati Scraper] Found ${images.length} images for property`);

        // Determine operation and property type from URL
        const operationType = getOperationType(targetUrl);
        const propertyType = getPropertyType(targetUrl);

        // Generate external ID from URL
        const externalId = `properati_${propertyUrl.split('/').pop()}`;

        // Extract city from location (usually first part before comma)
        const locationParts = location.split(',').map(p => p.trim());
        const city = locationParts[0] || 'Capital Federal';
        const neighborhood = locationParts[1] || null;

        // Prepare property data
        const propertyData = {
          external_id: externalId,
          source: 'properati',
          title: title || 'Sin título',
          description: description || '',
          url: propertyUrl,
          price: price,
          currency: currency,
          operation_type: operationType,
          property_type: propertyType,
          bedrooms: bedrooms,
          bathrooms: bathrooms,
          area_sqm: area,
          covered_area_sqm: null,
          address: location,
          neighborhood: neighborhood,
          city: city,
          state: 'Buenos Aires',
          country: 'AR',
          images: JSON.stringify(images),
          features: JSON.stringify([]),
          metadata: JSON.stringify({
            scraped_from: targetUrl,
            scraper: 'properati-web',
          }),
          status: 'active',
        };

        // Insert or update property (UPSERT)
        const query = `
          INSERT INTO properties (
            external_id, source, title, description, url,
            price, currency, operation_type, property_type,
            bedrooms, bathrooms, area_sqm, covered_area_sqm,
            address, neighborhood, city, state, country,
            images, features, metadata, status,
            scraped_at, last_seen_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17, $18,
            $19::jsonb, $20::jsonb, $21::jsonb, $22,
            NOW(), NOW(), NOW()
          )
          ON CONFLICT (external_id)
          DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            url = EXCLUDED.url,
            price = EXCLUDED.price,
            currency = EXCLUDED.currency,
            operation_type = EXCLUDED.operation_type,
            property_type = EXCLUDED.property_type,
            bedrooms = EXCLUDED.bedrooms,
            bathrooms = EXCLUDED.bathrooms,
            area_sqm = EXCLUDED.area_sqm,
            address = EXCLUDED.address,
            neighborhood = EXCLUDED.neighborhood,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            images = EXCLUDED.images,
            features = EXCLUDED.features,
            metadata = EXCLUDED.metadata,
            status = EXCLUDED.status,
            last_seen_at = NOW(),
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted
        `;

        const params = [
          propertyData.external_id,
          propertyData.source,
          propertyData.title,
          propertyData.description,
          propertyData.url,
          propertyData.price,
          propertyData.currency,
          propertyData.operation_type,
          propertyData.property_type,
          propertyData.bedrooms,
          propertyData.bathrooms,
          propertyData.area_sqm,
          propertyData.covered_area_sqm,
          propertyData.address,
          propertyData.neighborhood,
          propertyData.city,
          propertyData.state,
          propertyData.country,
          propertyData.images,
          propertyData.features,
          propertyData.metadata,
          propertyData.status,
        ];

        const result = await sql(query, params);

        if (result[0]?.inserted) {
          stats.inserted++;
          console.log(`[Properati Scraper] ✅ Inserted: ${title?.substring(0, 50)}`);
        } else {
          stats.updated++;
          console.log(`[Properati Scraper] 🔄 Updated: ${title?.substring(0, 50)}`);
        }

        // Rate limiting: wait 500ms between properties (we're now fetching detail pages)
        if (i < stats.fetched - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (itemError) {
        console.error(`[Properati Scraper] Error processing item ${i}:`, itemError.message);
        stats.errors++;
      }
    }

    const duration = Date.now() - stats.startTime;

    console.log('[Properati Scraper] Completed:', stats);

    return res.status(200).json({
      success: true,
      source: 'properati',
      stats: {
        ...stats,
        duration: `${(duration / 1000).toFixed(2)}s`,
      },
      message: `Scraped ${stats.fetched} listings from Properati: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.errors} errors`,
    });

  } catch (error) {
    console.error('[Properati Scraper] Fatal error:', error);
    return res.status(500).json({
      error: 'Scraping failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
