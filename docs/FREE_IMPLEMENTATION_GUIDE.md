# 🏠 Free Real Estate Scraper - Complete Implementation Guide

This guide provides a **100% free** implementation of a real estate scraping system for Argentina (Córdoba), using only open-source tools and free APIs. Total cost: **$0/month** during development.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Detailed Setup](#detailed-setup)
4. [Data Sources](#data-sources)
5. [API Documentation](#api-documentation)
6. [Troubleshooting](#troubleshooting)
7. [Migration to Production](#migration-to-production)
8. [Legal Considerations](#legal-considerations)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ (or use Docker)
- Git
- 4GB+ RAM
- 20GB+ free disk space

### 30-Minute Setup

```bash
# 1. Clone and setup
git clone <your-repo>
cd real-estate
npm install

# 2. Start PostgreSQL with Docker
docker-compose up -d postgres

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Run database migrations
npm run db:migrate

# 5. Setup MercadoLibre OAuth
node src/auth/mercadolibre-auth.js
# Browser will open - login with MercadoLibre account

# 6. Start scraping!
npm run scrape:mercadolibre -- --limit 100
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│         FREE DATA SOURCES           │
│                                     │
│  MercadoLibre API    Properati      │
│   (OAuth 2.0)        (BigQuery)     │
│    400,000+          10,572         │
│   properties        properties      │
└──────────┬──────────────┬──────────┘
           │              │
           ▼              ▼
┌──────────────────────────────────────┐
│         LOCAL PROCESSING             │
│                                      │
│  PostgreSQL 15   →   pg-boss Queue  │
│  (with PostGIS)      (no Redis!)    │
│                                      │
│  Deduplication  →  Geocoding (free) │
│  Price History  →  Image Processing │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│         LOCAL STORAGE                │
│                                      │
│  File System  /  MinIO (optional)    │
│  Images: WebP, Multiple Sizes        │
│  BlurHash for Progressive Loading    │
└──────────────────────────────────────┘
```

## 🔧 Detailed Setup

### 1. Database Setup (PostgreSQL)

#### Option A: Docker (Easiest)

```bash
# Start PostgreSQL with PostGIS extensions
docker-compose up -d postgres

# Verify it's running
docker ps | grep postgres

# Connect to verify
psql postgresql://postgres:postgres@localhost:5432/real_estate_cordoba
```

#### Option B: Native PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-15-postgis-3

# macOS
brew install postgresql@15 postgis

# Create database
createdb real_estate_cordoba

# Enable extensions
psql real_estate_cordoba -c "CREATE EXTENSION postgis;"
psql real_estate_cordoba -c "CREATE EXTENSION pg_trgm;"
```

### 2. Run Migrations

```bash
# Automatic migration
npm run db:migrate

# Or manual
psql real_estate_cordoba < database/migrations/001_initial_schema.sql
psql real_estate_cordoba < database/migrations/002_functions.sql
```

### 3. MercadoLibre Setup (FREE API)

#### Get Credentials

1. Go to https://developers.mercadolibre.com.ar
2. Create account (free)
3. Create new application
4. Get `CLIENT_ID` and `CLIENT_SECRET`

#### Configure OAuth

```bash
# Add to .env
ML_CLIENT_ID=your_client_id
ML_CLIENT_SECRET=your_client_secret

# Run OAuth flow
node src/auth/mercadolibre-auth.js
```

The browser will open automatically. After login, tokens are saved to `.env`.

### 4. Properati Setup (FREE BigQuery)

#### Option A: Direct BigQuery Access

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project (free tier includes 1TB queries/month)
3. Enable BigQuery API
4. Create service account key
5. Download JSON key file

```bash
# Add to .env
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=/path/to/service-account-key.json
```

#### Option B: Public Dataset (No Auth)

```sql
-- Query directly in BigQuery console
SELECT *
FROM `properati-data-public.properties_ar.properties_ar`
WHERE place_with_parent_names LIKE '%Córdoba%'
LIMIT 100
```

### 5. Start Scraping

#### MercadoLibre (Primary Source)

```bash
# Basic scraping
npm run scrape:mercadolibre

# With filters
node src/jobs/manual/scrape-mercadolibre.js \
  --limit 1000 \
  --operation sale \
  --property-type apartment \
  --min-price 50000 \
  --max-price 150000
```

#### Properati Sync

```bash
# Sync from BigQuery
npm run scrape:properati
```

## 📊 Data Sources

### MercadoLibre API (100% Legal & Free)

**Coverage:** 400,000+ properties in Argentina

**Rate Limits:** Not officially documented, we use conservative 1 req/sec

**Data Quality:** ⭐⭐⭐⭐⭐ Excellent

**Example Response:**
```javascript
{
  id: "MLA123456789",
  title: "Departamento 2 ambientes Nueva Córdoba",
  price: 95000,
  currency_id: "USD",
  location: {
    latitude: -31.4201,
    longitude: -64.1888,
    neighborhood: { name: "Nueva Córdoba" }
  },
  attributes: [
    { id: "ROOMS", value_name: "2" },
    { id: "COVERED_AREA", value_struct: { number: 45, unit: "m²" } }
  ],
  pictures: [...],
  permalink: "https://inmueble.mercadolibre.com.ar/..."
}
```

### Properati BigQuery (Public Dataset)

**Coverage:** 10,572 properties in Córdoba

**Cost:** FREE (1TB queries/month in Google Cloud free tier)

**Data Quality:** ⭐⭐⭐⭐ Very Good

**SQL Query Example:**
```sql
SELECT
    id,
    title,
    price_aprox_usd,
    rooms,
    surface_total_in_m2,
    lat, lon,
    properati_url
FROM `properati-data-public.properties_ar.properties_ar`
WHERE place_with_parent_names LIKE '%Córdoba%'
  AND operation_type = 'sale'
  AND property_type = 'apartment'
  AND price_aprox_usd BETWEEN 50000 AND 150000
ORDER BY created_on DESC
LIMIT 100
```

### Web Scraping (Optional & Risky)

⚠️ **Only if absolutely necessary!**

**Rate Limiting Configuration:**
```javascript
// src/config/scraping.js
const scrapingConfig = {
  zonaprop: {
    enabled: false, // Disabled by default
    maxRequestsPerMinute: 20,
    maxRequestsPerHour: 1000,
    userAgent: 'RealEstateResearch/1.0 (educational)',
    respectRobotsTxt: true,
    delayBetweenRequests: 3000 // 3 seconds
  }
}
```

## 🔍 Database Schema

### Core Tables

```sql
-- Properties (Master table)
CREATE TABLE properties (
    id UUID PRIMARY KEY,
    internal_code VARCHAR(50) UNIQUE,

    -- Classification
    property_type ENUM ('apartment','house','ph','land','commercial'),
    operation_type ENUM ('sale','rent','temp_rent'),
    status ENUM ('active','inactive','sold','rented'),

    -- Location
    country, province, city, neighborhood,
    address, street_name, street_number,
    location GEOMETRY(Point, 4326), -- PostGIS

    -- Pricing
    price DECIMAL(15,2),
    currency ENUM ('ARS','USD','EUR'),
    price_usd DECIMAL(15,2),

    -- Characteristics
    total_surface, covered_surface,
    rooms, bedrooms, bathrooms,

    -- Tracking
    first_seen_at, last_seen_at,
    times_seen, days_on_market
);

-- Raw listings (Original data)
CREATE TABLE raw_listings (
    id UUID PRIMARY KEY,
    source_id UUID REFERENCES sources(id),
    external_id VARCHAR(255),
    raw_data JSONB, -- Complete original data
    processing_status ENUM ('pending','processing','processed','error')
);

-- Price history tracking
CREATE TABLE price_history (
    property_id UUID REFERENCES properties(id),
    price, currency, recorded_at,
    price_change_percentage
);
```

### Key Functions

```sql
-- Find nearby properties
SELECT * FROM find_properties_nearby(-31.4201, -64.1888, 1000);

-- Detect duplicates
SELECT * FROM detect_duplicate_properties('property-uuid');

-- Get area statistics
SELECT * FROM get_area_statistics('Córdoba', 'Nueva Córdoba');

-- Clean old data
SELECT * FROM cleanup_old_data(90);
```

## 🖼️ Image Processing

### Local Storage Structure

```
data/images/
├── {property_id}/
│   ├── original/     # Original images
│   │   ├── 001.jpg
│   │   └── 002.jpg
│   ├── thumbnail/    # 150px wide
│   │   ├── 001.webp
│   │   └── 002.webp
│   ├── card/         # 400px wide
│   ├── gallery/      # 800px wide
│   └── full/         # 1200px wide
```

### Processing Pipeline

```javascript
// Automatic WebP conversion with Sharp
const sharp = require('sharp');

async function processImage(buffer, propertyId) {
  const sizes = [
    { name: 'thumbnail', width: 150, quality: 80 },
    { name: 'card', width: 400, quality: 85 },
    { name: 'gallery', width: 800, quality: 90 },
    { name: 'full', width: 1200, quality: 90 }
  ];

  for (const size of sizes) {
    await sharp(buffer)
      .resize(size.width)
      .webp({ quality: size.quality })
      .toFile(`data/images/${propertyId}/${size.name}/image.webp`);
  }
}
```

## 🔄 Queue System (pg-boss)

### Why pg-boss?

- **No Redis needed** - Uses PostgreSQL
- **Free** - No additional infrastructure
- **Reliable** - ACID compliant job queue
- **Simple** - Easy migration to BullMQ later

### Setup

```javascript
const PgBoss = require('pg-boss');

const boss = new PgBoss(process.env.DATABASE_URL);
await boss.start();

// Create job
await boss.send('process-property', { propertyId: '123' });

// Process jobs
await boss.work('process-property', async job => {
  console.log(`Processing ${job.data.propertyId}`);
  // Process property...
});
```

## 📅 Scheduling

### Using node-cron

```javascript
const cron = require('node-cron');

// Every 6 hours
cron.schedule('0 */6 * * *', () => {
  scrapeMercadoLibre();
});

// Daily at 3 AM
cron.schedule('0 3 * * *', () => {
  detectInactiveProperties();
});

// Weekly deduplication
cron.schedule('0 0 * * 0', () => {
  runDeduplication();
});
```

### Using PM2

```bash
# Start all processes
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs

# Auto-restart on boot
pm2 startup
pm2 save
```

## 🌍 Free Geocoding

### Nominatim (OpenStreetMap)

```javascript
async function geocodeAddress(address) {
  // Rate limit: 1 request per second
  await sleep(1000);

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(address)}&format=json&limit=1`
  );

  const results = await response.json();
  if (results.length > 0) {
    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon)
    };
  }
}
```

## 📡 API Endpoints

### Start API Server

```bash
npm start
# API runs on http://localhost:3000
```

### Endpoints

#### Search Properties
```http
GET /api/properties/search?city=Córdoba&type=apartment&minPrice=50000

Response:
{
  "results": [...],
  "total": 1234,
  "page": 1,
  "pageSize": 50
}
```

#### Get Property Details
```http
GET /api/properties/123e4567-e89b-12d3-a456-426614174000

Response:
{
  "id": "123e4567...",
  "title": "Departamento 2 ambientes",
  "price": 95000,
  "currency": "USD",
  ...
}
```

#### Geospatial Search
```http
GET /api/properties/nearby?lat=-31.4201&lng=-64.1888&radius=1000

Response:
{
  "results": [
    {
      "id": "...",
      "distance": 250,
      "title": "..."
    }
  ]
}
```

## 🚀 Migration to Production

### When to Migrate

- Storage exceeds 100GB
- Need 99.9% uptime
- Multiple users
- Want CDN for images
- Need automated backups

### Migration Steps

#### 1. Database Migration

```bash
# Export local database
pg_dump real_estate_cordoba > backup.sql

# Import to Supabase/RDS
psql $PRODUCTION_DATABASE_URL < backup.sql
```

#### 2. Image Migration

```bash
# Sync to S3
aws s3 sync data/images/ s3://your-bucket/images/

# Or use rclone for any cloud
rclone sync data/images/ remote:bucket/images/
```

#### 3. Update Configuration

```bash
# .env.production
DATABASE_URL=postgresql://...supabase.co.../real_estate
STORAGE_TYPE=s3
S3_BUCKET=your-bucket
```

#### 4. Deploy Code

```bash
# Vercel
vercel --prod

# Railway
railway up

# Heroku
git push heroku main
```

### Cost Comparison

| Stage | Stack | Monthly Cost |
|-------|-------|--------------|
| **Development** | Local PostgreSQL + File System | **$0** |
| **Staging** | Supabase Free + Local Storage | **$0** |
| **Production** | Supabase Pro + S3 + Vercel | **~$75** |
| **Scale** | RDS + CloudFront + EC2 | **~$300** |

## 🔧 Troubleshooting

### Common Issues

#### PostgreSQL Connection Failed

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -h localhost -p 5432
```

#### MercadoLibre Token Expired

```javascript
// Tokens auto-refresh, but if needed:
node src/auth/mercadolibre-auth.js
```

#### Out of Disk Space

```bash
# Clean old raw listings
psql real_estate_cordoba -c "SELECT cleanup_old_data(30);"

# Compress images
find data/images -name "*.jpg" -exec jpegoptim {} \;
```

#### Duplicate Properties

```sql
-- Run deduplication
SELECT create_duplicate_clusters();

-- View duplicates
SELECT * FROM property_duplicates
WHERE cluster_id IN (
  SELECT cluster_id FROM property_duplicates
  GROUP BY cluster_id HAVING COUNT(*) > 1
);
```

## ⚖️ Legal Considerations

### ✅ Fully Legal Sources

1. **MercadoLibre API**
   - Official OAuth 2.0
   - Commercial use allowed
   - Must display "Powered by MercadoLibre"

2. **Properati BigQuery**
   - Public dataset
   - Research/educational use
   - Attribution required

### ⚠️ Gray Area (Scraping)

**If you must scrape:**

1. **Respect robots.txt**
```javascript
const robotsChecker = require('robots-txt-checker');
await robotsChecker.check(url);
```

2. **Use proper User-Agent**
```javascript
headers: {
  'User-Agent': 'RealEstateResearch/1.0 (educational; contact@email.com)'
}
```

3. **Rate limit aggressively**
```javascript
// Maximum 1 request per 3 seconds
await sleep(3000);
```

4. **Handle blocks gracefully**
```javascript
if (response.status === 403) {
  console.log('Blocked, stopping scraping');
  return;
}
```

## 📈 Performance Tips

### Database Optimization

```sql
-- Update statistics
ANALYZE properties;

-- Rebuild indexes
REINDEX TABLE properties;

-- Vacuum to reclaim space
VACUUM FULL properties;
```

### Query Optimization

```sql
-- Use indexes efficiently
EXPLAIN ANALYZE
SELECT * FROM properties
WHERE city = 'Córdoba'
  AND property_type = 'apartment'
  AND price_usd BETWEEN 50000 AND 150000;
```

### Image Optimization

```bash
# Convert all images to WebP
for img in data/images/original/*.jpg; do
  cwebp -q 85 "$img" -o "${img%.jpg}.webp"
done
```

## 🎯 Next Steps

### Phase 1 (Week 1-2)
- [x] Database setup
- [x] MercadoLibre integration
- [ ] Properati sync
- [ ] Basic deduplication

### Phase 2 (Week 3-4)
- [ ] Image processing pipeline
- [ ] API development
- [ ] Frontend dashboard
- [ ] Search functionality

### Phase 3 (Month 2)
- [ ] ML price predictions
- [ ] WhatsApp notifications
- [ ] Mobile app
- [ ] Advanced analytics

## 📚 Resources

- [MercadoLibre API Docs](https://developers.mercadolibre.com.ar)
- [Properati Dataset](https://www.properati.com.ar/data)
- [PostGIS Documentation](https://postgis.net/docs/)
- [pg-boss Documentation](https://github.com/timgit/pg-boss)
- [PM2 Documentation](https://pm2.keymetrics.io/)

## 💡 Tips & Best Practices

1. **Start with MercadoLibre only** - It's legal and has great data
2. **Use aggressive caching** - Reduce API calls
3. **Process incrementally** - Don't try to scrape everything at once
4. **Monitor rate limits** - Stay well below limits
5. **Backup regularly** - Use `pg_dump` daily
6. **Use transactions** - Ensure data consistency
7. **Log everything** - Use Winston for structured logging

## 🆘 Support

- GitHub Issues: [your-repo/issues]
- Email: contact@your-email.com
- Documentation: This file!

---

**Remember:** This is a learning project. Always respect websites' terms of service and use data ethically. When in doubt, stick to official APIs!