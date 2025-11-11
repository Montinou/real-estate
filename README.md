# Real Estate Scraper Argentina 🏠

A **100% free** real estate scraping and aggregation system for Argentina, focused on Córdoba province. Built with open-source tools and designed to run locally with zero monthly costs.

## 🎯 Features

- **Free Data Sources**: MercadoLibre API (OAuth 2.0) + Properati BigQuery
- **Local PostgreSQL**: Full database with PostGIS for geospatial queries
- **Image Processing**: Automatic WebP conversion, multiple sizes, BlurHash generation
- **Deduplication**: Smart duplicate detection using coordinates and fuzzy matching
- **Price History**: Track property price changes over time
- **Queue System**: pg-boss (PostgreSQL-based) or BullMQ with Redis
- **REST API**: Search properties with filters and geospatial queries
- **Future-Ready**: Easy migration path to cloud services

## 📊 Data Sources

| Source | Type | Properties | Cost |
|--------|------|------------|------|
| MercadoLibre | Official API | 400,000+ | FREE |
| Properati | BigQuery Dataset | 10,572 (Córdoba) | FREE |
| ZonaProp | Ethical Scraping | 54,648 (Córdoba) | FREE* |

*Requires careful rate limiting and ethical practices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or use Docker)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/real-estate-scraper.git
cd real-estate-scraper
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL with PostGIS
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 5

# Run migrations
npm run db:migrate
```

#### Option B: Local PostgreSQL

```bash
# Create database
createdb real_estate_cordoba

# Run migrations
psql real_estate_cordoba < database/migrations/001_initial_schema.sql
psql real_estate_cordoba < database/migrations/002_add_indexes.sql
psql real_estate_cordoba < database/migrations/003_add_functions.sql
```

### 4. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required configurations:**
- MercadoLibre API credentials (get from https://developers.mercadolibre.com.ar)
- Google Cloud project for Properati (optional)

### 5. MercadoLibre OAuth Setup

1. Register your app at https://developers.mercadolibre.com.ar
2. Get your `CLIENT_ID` and `CLIENT_SECRET`
3. Add redirect URI: `http://localhost:3000/auth/mercadolibre/callback`
4. Run OAuth flow:

```bash
node src/auth/mercadolibre-auth.js
```

### 6. Start Services

```bash
# Start all services with PM2
npm run pm2:start

# Or start individually:

# API Server
npm start

# Queue Workers
npm run worker

# Scheduler
npm run scheduler
```

### 7. Initial Data Load

```bash
# Scrape MercadoLibre
npm run scrape:mercadolibre

# Sync Properati
npm run scrape:properati
```

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│      Data Sources               │
│  - MercadoLibre API            │
│  - Properati BigQuery          │
│  - ZonaProp (optional)         │
└────────────┬───────────────────┘
             │
┌────────────▼───────────────────┐
│      Queue System              │
│  - pg-boss (PostgreSQL)        │
│  - Jobs: scrape, process,      │
│    images, deduplicate         │
└────────────┬───────────────────┘
             │
┌────────────▼───────────────────┐
│    Processing Pipeline         │
│  - Parse → Validate            │
│  - Normalize → Enrich          │
│  - Deduplicate → Store         │
└────────────┬───────────────────┘
             │
┌────────────▼───────────────────┐
│      PostgreSQL 15             │
│  - PostGIS (geospatial)        │
│  - pg_trgm (fuzzy matching)    │
│  - TimescaleDB (optional)      │
└────────────┬───────────────────┘
             │
┌────────────▼───────────────────┐
│      Storage & API             │
│  - Local filesystem / MinIO    │
│  - Express REST API            │
│  - Image processing (Sharp)    │
└────────────────────────────────┘
```

## 📁 Project Structure

```
real-estate/
├── database/           # SQL migrations and functions
├── src/
│   ├── scrapers/      # MercadoLibre, Properati, ZonaProp
│   ├── pipeline/      # Data processing pipeline
│   ├── workers/       # Queue workers
│   ├── api/           # REST API
│   └── utils/         # Utilities (geocoding, images)
├── data/              # Local data storage
│   └── images/        # Property images
└── docs/              # Documentation
```

## 🔧 Configuration

### Database Schema

The system uses a normalized PostgreSQL schema with:

- `sources`: Data sources (MercadoLibre, Properati, etc.)
- `raw_listings`: Raw scraped data
- `properties`: Normalized property data
- `property_history`: Change tracking
- `price_history`: Price evolution
- `property_images`: Image metadata
- `property_duplicates`: Duplicate detection

### Environment Variables

Key configurations in `.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/real_estate_cordoba

# Storage (local or MinIO)
STORAGE_TYPE=local
STORAGE_PATH=/path/to/images

# MercadoLibre API
ML_CLIENT_ID=your_client_id
ML_CLIENT_SECRET=your_secret

# Scraping
ENABLE_ZONAPROP=false
MAX_CONCURRENT_SCRAPERS=1
REQUEST_DELAY_MIN=2000
```

## 🛠️ Development

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch
```

### Manual Operations

```bash
# Deduplicate properties
node src/jobs/manual/deduplicate.js

# Clean old data
node src/jobs/manual/cleanup.js

# Export data
node src/jobs/manual/export.js
```

### Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs

# Database stats
psql real_estate_cordoba -c "SELECT COUNT(*) FROM properties;"
```

## 📊 API Endpoints

### Search Properties
```http
GET /api/properties/search
  ?city=Córdoba
  &type=apartment
  &operation=sale
  &minPrice=50000
  &maxPrice=150000
  &rooms=2
```

### Get Property Details
```http
GET /api/properties/:id
```

### Geospatial Search
```http
GET /api/properties/nearby
  ?lat=-31.4201
  &lng=-64.1888
  &radius=2000
```

### Price History
```http
GET /api/properties/:id/price-history
```

## 💰 Cost Analysis

### Current Setup (FREE)

| Component | Solution | Monthly Cost |
|-----------|----------|--------------|
| Database | PostgreSQL local | $0 |
| Storage | File system | $0 |
| Queue | pg-boss | $0 |
| APIs | MercadoLibre + Properati | $0 |
| **TOTAL** | | **$0** |

### Future Cloud Migration

| Component | Solution | Monthly Cost |
|-----------|----------|--------------|
| Database | Supabase/RDS | ~$25 |
| Storage | S3 + CloudFront | ~$20 |
| Queue | Redis Cloud | ~$10 |
| Hosting | Vercel/Railway | ~$20 |
| **TOTAL** | | **~$75** |

## 🚀 Migration to Production

When ready to scale:

1. **Database**: Export with `pg_dump`, import to Supabase/RDS
2. **Storage**: Upload images to S3, update URLs
3. **Queue**: Switch from pg-boss to BullMQ
4. **API**: Deploy to Vercel/Railway
5. **Workers**: Deploy to separate service

The code structure remains identical - only configuration changes!

## ⚖️ Legal & Ethical

- ✅ MercadoLibre API: Official, legal access
- ✅ Properati: Public dataset for research
- ⚠️ Web scraping: Use responsibly with rate limiting
- 📝 Always respect robots.txt and terms of service
- 🚫 Never use for spam or unauthorized commercial use

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- MercadoLibre for providing official API access
- Properati for public datasets
- OpenStreetMap for Nominatim geocoding
- All open-source contributors

## 📞 Support

- Create an issue for bugs
- Discussion forum for questions
- Email: contact@your-email.com

## 🎯 Roadmap

- [x] MercadoLibre integration
- [x] Properati sync
- [x] PostgreSQL setup
- [x] Image processing
- [ ] Frontend dashboard
- [ ] ML price predictions
- [ ] WhatsApp notifications
- [ ] Mobile app

---

**Built with ❤️ for the Argentine real estate community**