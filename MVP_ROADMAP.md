# 🚀 Private MVP Roadmap - No Auth Required

**Goal:** Build a working real estate scraper and search platform ASAP
**Timeline:** 1-2 weeks
**Auth:** None (private MVP only)

---

## ✅ Infrastructure Complete (100%)

- Neon PostgreSQL + PostGIS 3.5
- Database schema with properties tables
- Cloudflare R2 + ImageKit (linked)
- Upstash Redis (caching)
- Upstash QStash (scheduled jobs)
- Google Gemini (AI descriptions)
- Groq (chatbot - optional)
- Sentry (error tracking)

**Cost: $0/month**

---

## 🎯 MVP Core Features (No Auth)

### Phase 1: Data Collection (Week 1)

#### 1.1 MercadoLibre Scraper
**Priority:** HIGH
**Time:** 2-3 hours

Create: `app/api/scrape/mercadolibre/route.ts`

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    // Fetch listings from MercadoLibre API
    const response = await fetch(
      `https://api.mercadolibre.com/sites/MLA/search?category=MLA1459&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.ML_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    let inserted = 0;
    let updated = 0;

    for (const item of data.results) {
      // Get detailed property info
      const detailResponse = await fetch(
        `https://api.mercadolibre.com/items/${item.id}`
      );
      const detail = await detailResponse.json();

      // Extract location (if available)
      const location = detail.location || item.location;
      const locationSQL = location?.latitude && location?.longitude
        ? sql`ST_GeogFromText('POINT(${location.longitude} ${location.latitude})')`
        : null;

      // Insert or update property
      const result = await sql`
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
          location,
          city,
          images,
          metadata,
          status,
          scraped_at,
          last_seen_at
        ) VALUES (
          ${item.id},
          'mercadolibre',
          ${item.title},
          ${detail.description?.plain_text || item.title},
          ${item.permalink},
          ${item.price},
          ${item.currency_id},
          ${item.buying_mode === 'buy_it_now' ? 'sale' : 'rent'},
          'apartment',
          ${locationSQL},
          ${location?.city?.name || 'Unknown'},
          ${JSON.stringify(item.pictures?.map((p: any) => p.url) || [])},
          ${JSON.stringify(detail)},
          'active',
          NOW(),
          NOW()
        )
        ON CONFLICT (external_id) DO UPDATE SET
          price = EXCLUDED.price,
          title = EXCLUDED.title,
          last_seen_at = NOW(),
          status = 'active'
      `;

      if (result.count > 0) inserted++;
      else updated++;

      // Be respectful - delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return Response.json({
      success: true,
      inserted,
      updated,
      total: data.results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Scraping error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Allow manual triggering without auth for MVP
export async function GET(request: Request) {
  return POST(request);
}
```

**Test it:**
```bash
# Manual trigger
curl http://localhost:3000/api/scrape/mercadolibre

# Or visit in browser
open http://localhost:3000/api/scrape/mercadolibre
```

**Schedule with QStash** (after testing):
1. Go to: https://console.upstash.com/qstash
2. Create new schedule:
   - URL: `https://your-app.vercel.app/api/scrape/mercadolibre`
   - Schedule: `0 */6 * * *` (every 6 hours)
   - Method: POST

---

#### 1.2 Image Download & Upload
**Priority:** MEDIUM
**Time:** 1-2 hours

Create: `lib/image-processor.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function downloadAndUploadImage(
  imageUrl: string,
  propertyId: string
): Promise<string> {
  try {
    // Download image
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Generate unique filename
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `properties/${propertyId}/${Date.now()}.${ext}`;

    // Upload to R2
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: `image/${ext}`,
    }));

    // Return ImageKit URL
    return `${process.env.IMAGEKIT_ENDPOINT_URL}${fileName}`;

  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
}

// ImageKit transformation URLs
export function getImageVariants(baseUrl: string) {
  return {
    original: baseUrl,
    thumbnail: `${baseUrl}?tr=w-200,h-200,c-at_max,q-80,f-webp`,
    card: `${baseUrl}?tr=w-400,h-300,c-at_max,q-85,f-webp`,
    gallery: `${baseUrl}?tr=w-800,h-600,c-at_max,q-90,f-webp`,
    full: `${baseUrl}?tr=w-1920,q-90,f-webp`,
  };
}
```

---

### Phase 2: Search & Display (Week 1-2)

#### 2.1 Property Search API
**Priority:** HIGH
**Time:** 1-2 hours

Create: `app/api/properties/search/route.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';

const sql = neon(process.env.DATABASE_URL!);
const redis = Redis.fromEnv();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const city = searchParams.get('city') || '';
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseInt(searchParams.get('radius') || '10000'); // 10km default
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const propertyType = searchParams.get('type');
  const minBedrooms = searchParams.get('bedrooms');
  const query = searchParams.get('q'); // Text search
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Create cache key
  const cacheKey = `search:${city}:${lat}:${lng}:${radius}:${minPrice}:${maxPrice}:${propertyType}:${minBedrooms}:${query}:${limit}:${offset}`;

  // Check cache (5 min TTL)
  const cached = await redis.get(cacheKey);
  if (cached) {
    return Response.json({
      properties: cached,
      cached: true,
      count: (cached as any[]).length
    });
  }

  // Build query
  let properties;

  if (lat && lng) {
    // Geospatial search
    properties = await sql`
      SELECT
        id, external_id, source, title, description, url,
        price, currency, operation_type, property_type,
        bedrooms, bathrooms, area_sqm, covered_area_sqm,
        address, city, state, country, images, features,
        ST_Distance(
          location,
          ST_GeogFromText(${`POINT(${lng} ${lat})`})
        ) / 1000 as distance_km,
        created_at, updated_at
      FROM properties
      WHERE status = 'active'
        AND location IS NOT NULL
        AND ST_DWithin(
          location,
          ST_GeogFromText(${`POINT(${lng} ${lat})`}),
          ${radius}
        )
        ${city ? sql`AND city ILIKE ${`%${city}%`}` : sql``}
        ${minPrice ? sql`AND price >= ${minPrice}` : sql``}
        ${maxPrice ? sql`AND price <= ${maxPrice}` : sql``}
        ${propertyType ? sql`AND property_type = ${propertyType}` : sql``}
        ${minBedrooms ? sql`AND bedrooms >= ${minBedrooms}` : sql``}
        ${query ? sql`AND (
          to_tsvector('spanish', title || ' ' || COALESCE(description, ''))
          @@ plainto_tsquery('spanish', ${query})
        )` : sql``}
      ORDER BY distance_km ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  } else {
    // Regular search (no geospatial)
    properties = await sql`
      SELECT
        id, external_id, source, title, description, url,
        price, currency, operation_type, property_type,
        bedrooms, bathrooms, area_sqm, covered_area_sqm,
        address, city, state, country, images, features,
        created_at, updated_at
      FROM properties
      WHERE status = 'active'
        ${city ? sql`AND city ILIKE ${`%${city}%`}` : sql``}
        ${minPrice ? sql`AND price >= ${minPrice}` : sql``}
        ${maxPrice ? sql`AND price <= ${maxPrice}` : sql``}
        ${propertyType ? sql`AND property_type = ${propertyType}` : sql``}
        ${minBedrooms ? sql`AND bedrooms >= ${minBedrooms}` : sql``}
        ${query ? sql`AND (
          to_tsvector('spanish', title || ' ' || COALESCE(description, ''))
          @@ plainto_tsquery('spanish', ${query})
        )` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, properties);

  return Response.json({
    properties,
    cached: false,
    count: properties.length
  });
}
```

**Test queries:**
```bash
# All properties in Córdoba
GET /api/properties/search?city=Córdoba

# Properties within 5km of city center
GET /api/properties/search?lat=-31.4201&lng=-64.1810&radius=5000

# Apartments under $100K
GET /api/properties/search?type=apartment&maxPrice=100000

# Text search
GET /api/properties/search?q=piscina+garage&city=Córdoba

# Combined filters
GET /api/properties/search?city=Córdoba&type=apartment&maxPrice=150000&bedrooms=2
```

---

#### 2.2 Property Detail API
**Priority:** HIGH
**Time:** 30 minutes

Create: `app/api/properties/[id]/route.ts`

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const property = await sql`
    SELECT * FROM properties
    WHERE id = ${params.id}
    AND status = 'active'
  `;

  if (property.length === 0) {
    return Response.json({ error: 'Property not found' }, { status: 404 });
  }

  return Response.json({ property: property[0] });
}
```

---

#### 2.3 Simple Property Listing Page
**Priority:** HIGH
**Time:** 2-3 hours

Create: `app/properties/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Property {
  id: number;
  title: string;
  price: number;
  currency: string;
  city: string;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    maxPrice: '',
    type: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.type) params.set('type', filters.type);

    const response = await fetch(`/api/properties/search?${params}`);
    const data = await response.json();
    setProperties(data.properties);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchProperties();
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Propiedades</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-4">
        <input
          type="text"
          placeholder="Ciudad"
          value={filters.city}
          onChange={e => setFilters({ ...filters, city: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Precio máximo"
          value={filters.maxPrice}
          onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Todos los tipos</option>
          <option value="apartment">Departamento</option>
          <option value="house">Casa</option>
          <option value="land">Terreno</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded">
          Buscar
        </button>
      </form>

      {/* Loading State */}
      {loading && <p>Cargando propiedades...</p>}

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {properties.map(property => (
          <div key={property.id} className="border rounded-lg overflow-hidden shadow-lg">
            {/* Image */}
            {property.images?.[0] && (
              <div className="relative h-48">
                <Image
                  src={`${property.images[0]}?tr=w-400,h-300,c-at_max,q-85,f-webp`}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Details */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{property.title}</h3>
              <p className="text-2xl text-green-600 font-bold mb-2">
                {property.currency} {property.price.toLocaleString()}
              </p>
              <p className="text-gray-600 mb-2">{property.city}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                {property.bedrooms && <span>{property.bedrooms} dorm</span>}
                {property.bathrooms && <span>{property.bathrooms} baños</span>}
                {property.area_sqm && <span>{property.area_sqm} m²</span>}
              </div>
              <a
                href={`/properties/${property.id}`}
                className="block mt-4 text-blue-500 hover:underline"
              >
                Ver detalles →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && properties.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          No se encontraron propiedades. Intenta ajustar los filtros.
        </p>
      )}
    </div>
  );
}
```

---

### Phase 3: Nice-to-Have Features (Week 2)

#### 3.1 AI Description Generator (Optional)
**Priority:** LOW
**Time:** 1 hour

Create: `app/api/ai/enhance-description/route.ts`

```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(request: Request) {
  const { propertyId } = await request.json();

  // Fetch property
  const sql = neon(process.env.DATABASE_URL!);
  const [property] = await sql`
    SELECT * FROM properties WHERE id = ${propertyId}
  `;

  if (!property) {
    return Response.json({ error: 'Property not found' }, { status: 404 });
  }

  // Generate enhanced description
  const { text } = await generateText({
    model: google('gemini-1.5-flash'),
    prompt: `Mejora esta descripción de propiedad en español:

Original: ${property.description || property.title}

Datos:
- Tipo: ${property.property_type}
- Ciudad: ${property.city}
- Precio: ${property.currency} ${property.price}
${property.bedrooms ? `- Dormitorios: ${property.bedrooms}` : ''}
${property.bathrooms ? `- Baños: ${property.bathrooms}` : ''}
${property.area_sqm ? `- Superficie: ${property.area_sqm} m²` : ''}

Genera una descripción atractiva de máximo 150 palabras.`,
  });

  // Update property
  await sql`
    UPDATE properties
    SET description = ${text}
    WHERE id = ${propertyId}
  `;

  return Response.json({ description: text });
}
```

---

#### 3.2 Property Stats Dashboard
**Priority:** LOW
**Time:** 1 hour

Create: `app/api/stats/route.ts`

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const stats = await sql`
    SELECT
      COUNT(*) as total_properties,
      COUNT(DISTINCT city) as total_cities,
      AVG(price) as avg_price,
      MIN(price) as min_price,
      MAX(price) as max_price,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week
    FROM properties
    WHERE status = 'active'
  `;

  const byCity = await sql`
    SELECT city, COUNT(*) as count
    FROM properties
    WHERE status = 'active'
    GROUP BY city
    ORDER BY count DESC
    LIMIT 10
  `;

  const byType = await sql`
    SELECT property_type, COUNT(*) as count, AVG(price) as avg_price
    FROM properties
    WHERE status = 'active'
    GROUP BY property_type
    ORDER BY count DESC
  `;

  return Response.json({
    overall: stats[0],
    byCity,
    byType,
  });
}
```

---

## 📋 MVP Checklist

### Week 1: Core Features
- [ ] Install SDK packages (`./scripts/install-sdks.sh`)
- [ ] Build MercadoLibre scraper API
- [ ] Test scraper locally
- [ ] Build property search API
- [ ] Add Redis caching to search
- [ ] Build simple property listing page
- [ ] Deploy to Vercel
- [ ] Schedule scraper with QStash

### Week 2: Polish
- [ ] Add property detail page
- [ ] Implement image transformations (ImageKit)
- [ ] Add stats dashboard
- [ ] Improve UI/UX
- [ ] Add loading states and error handling
- [ ] Test geospatial search
- [ ] (Optional) Add AI description enhancement

---

## 🚀 Quick Deploy

```bash
# Install dependencies
npm install

# Install SDKs
./scripts/install-sdks.sh

# Run locally
npm run dev

# Deploy to Vercel
vercel --prod

# Get deployment URL
# Then schedule scraper in Upstash QStash
```

---

## 📊 Success Metrics

### After Week 1:
- [ ] 100+ properties in database
- [ ] Search API returning results < 200ms
- [ ] Basic UI deployed and working
- [ ] Scraper running automatically every 6 hours

### After Week 2:
- [ ] 500+ properties in database
- [ ] Multiple cities covered
- [ ] Geospatial search working
- [ ] Images optimized via ImageKit
- [ ] Stats dashboard showing metrics

---

**Ready to build! Start with the scraper first to populate your database.** 🚀
