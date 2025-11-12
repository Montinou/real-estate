/**
 * Demo Scraper API Endpoint
 * Inserts mock property data to demonstrate the system works
 *
 * Usage: GET/POST /api/scrape/demo?count=10
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

/**
 * Generate mock property data
 */
function generateMockProperty(index) {
  const cities = ['Córdoba', 'Buenos Aires', 'Rosario', 'Mendoza', 'La Plata'];
  const neighborhoods = ['Nueva Córdoba', 'Centro', 'Cerro de las Rosas', 'Alta Córdoba', 'Güemes'];
  const types = ['apartment', 'house', 'ph', 'land'];
  const operations = ['sale', 'rent'];

  const city = cities[index % cities.length];
  const neighborhood = neighborhoods[index % neighborhoods.length];
  const propertyType = types[index % types.length];
  const operationType = operations[index % operations.length];

  // Generate realistic Córdoba coordinates
  const baseLat = -31.4201;
  const baseLng = -64.1888;
  const lat = baseLat + (Math.random() - 0.5) * 0.1;
  const lng = baseLng + (Math.random() - 0.5) * 0.1;

  const price = operationType === 'sale'
    ? Math.round((50000 + Math.random() * 150000) / 1000) * 1000
    : Math.round((20000 + Math.random() * 80000) / 1000) * 1000;

  const bedrooms = Math.floor(Math.random() * 4) + 1;
  const bathrooms = Math.floor(Math.random() * 3) + 1;
  const area = Math.round((40 + Math.random() * 120) * 10) / 10;

  return {
    external_id: `DEMO-${Date.now()}-${index}`,
    source: 'demo',
    title: `${propertyType === 'apartment' ? 'Departamento' : 'Casa'} ${bedrooms} dormitorios en ${neighborhood}`,
    description: `Excelente ${propertyType === 'apartment' ? 'departamento' : 'propiedad'} de ${bedrooms} dormitorios y ${bathrooms} baños en ${neighborhood}, ${city}. Ideal para familias o inversión.`,
    url: `https://example.com/property/DEMO-${index}`,
    price,
    currency: 'ARS',
    operation_type: operationType,
    property_type: propertyType,
    bedrooms,
    bathrooms,
    area_sqm: area,
    covered_area_sqm: area * 0.85,
    latitude: lat,
    longitude: lng,
    address: `Av. Example ${1000 + index}`,
    neighborhood,
    city,
    state: city === 'Córdoba' ? 'Córdoba' : 'Buenos Aires',
    country: 'AR',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858',
    ],
    features: [
      { name: 'Balcón', value: 'Sí' },
      { name: 'Cochera', value: Math.random() > 0.5 ? 'Sí' : 'No' },
      { name: 'Piscina', value: Math.random() > 0.7 ? 'Sí' : 'No' },
    ],
    metadata: {
      demo: true,
      generated_at: new Date().toISOString(),
    },
  };
}

/**
 * Insert property into database
 */
async function insertProperty(property) {
  try {
    // Build location geography point
    const locationWKT = property.latitude && property.longitude
      ? `POINT(${property.longitude} ${property.latitude})`
      : null;

    await sql`
      INSERT INTO properties (
        external_id,
        source,
        title,
        description,
        url,
        price,
        currency,
        operation_type,
        property_type,
        bedrooms,
        bathrooms,
        area_sqm,
        covered_area_sqm,
        location,
        address,
        neighborhood,
        city,
        state,
        country,
        images,
        features,
        metadata,
        status,
        scraped_at,
        last_seen_at
      ) VALUES (
        ${property.external_id},
        ${property.source},
        ${property.title},
        ${property.description},
        ${property.url},
        ${property.price},
        ${property.currency},
        ${property.operation_type},
        ${property.property_type},
        ${property.bedrooms},
        ${property.bathrooms},
        ${property.area_sqm},
        ${property.covered_area_sqm},
        ${locationWKT ? sql`ST_GeogFromText(${locationWKT})` : null},
        ${property.address},
        ${property.neighborhood},
        ${property.city},
        ${property.state},
        ${property.country},
        ${JSON.stringify(property.images)},
        ${JSON.stringify(property.features)},
        ${JSON.stringify(property.metadata)},
        'active',
        NOW(),
        NOW()
      )
      ON CONFLICT (external_id) DO UPDATE SET
        price = EXCLUDED.price,
        last_seen_at = NOW()
    `;

    return { success: true, external_id: property.external_id };
  } catch (error) {
    console.error(`Error inserting property ${property.external_id}:`, error);
    return { success: false, external_id: property.external_id, error: error.message };
  }
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    const { count = 10 } = req.query;
    const numProperties = Math.min(parseInt(count), 50); // Max 50

    console.log(`📝 Generating ${numProperties} demo properties...`);

    const results = [];
    for (let i = 0; i < numProperties; i++) {
      const property = generateMockProperty(i);
      const result = await insertProperty(property);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    const stats = {
      success: true,
      total: numProperties,
      inserted: successful,
      failed,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      note: 'Demo data generated for testing',
    };

    console.log(`✅ Demo complete: ${successful} properties inserted, ${failed} failed in ${stats.duration}ms`);

    return res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Demo error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    });
  }
}
