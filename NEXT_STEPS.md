# 🚀 Next Steps - Real Estate Platform Setup

**Current Status:** Infrastructure researched, integrations identified, SDK list ready
**Date:** November 11, 2025

---

## ✅ What You Already Have

From your `.env.local` analysis, these are **fully configured**:

1. ✅ **Neon Database** - PostgreSQL with PostGIS support (project: crimson-river-73238641)
2. ✅ **Stack Auth** - User authentication via Neon Auth (auto-syncing to DB)
3. ✅ **Upstash Redis** - Caching (500K commands/month free)
4. ✅ **Upstash QStash** - Job queue and CRON (30K messages/month free)
5. ✅ **Sentry** - Error tracking (5K errors/month free)
6. ✅ **Groq AI** - Fast LLM for chatbot (unlimited free)
7. ✅ **Hugging Face** - Embeddings (unlimited free)
8. ✅ **MercadoLibre API** - Real estate scraping
9. ✅ **Vercel AI Gateway** - AI provider management

**Cost so far:** $0/month 🎉

---

## 🎯 Immediate Actions (This Week)

### 1. Enable PostGIS Extension (5 minutes)

**Why:** Required for geospatial queries (find properties within radius, nearest neighbors)

```bash
# Option A: Via Neon Console
# 1. Go to: https://console.neon.tech
# 2. Select project: crimson-river-73238641
# 3. Open SQL Editor
# 4. Run:

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

# 5. Verify:
SELECT PostGIS_Version();
```

**Option B: Via Neon CLI**
```bash
neonctl sql "CREATE EXTENSION IF NOT EXISTS postgis;" \
  --project-id crimson-river-73238641
```

**Option C: Via MCP (once configured)**
```
"Enable PostGIS extension on my Neon database"
```

---

### 2. Configure MCP Servers (10 minutes)

**Why:** Enable AI-assisted infrastructure management through Claude Code

**Create file:** `.claude/mcp_config.json`

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/mcp"]
    },
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.vercel.com/agustin-montoya-projects/proptech-ai/mcp"
      ]
    }
  }
}
```

**Test it:**
```
After saving, restart Claude Code and try:
"List all my Neon projects"
"Show me recent Vercel deployments"
```

---

### 3. Install Missing SDKs (15 minutes)

**Why:** These SDKs are needed for the recommended integrations

```bash
cd /Users/agustinmontoya/Projectos/real-estate

# Install all at once
npm install \
  @neondatabase/serverless \
  @upstash/redis \
  @upstash/qstash \
  ai \
  @ai-sdk/google \
  @google/generative-ai \
  groq-sdk \
  @huggingface/inference \
  imagekit-javascript \
  @sentry/nextjs \
  @stackframe/stack \
  @aws-sdk/client-s3

# Verify installation
npm list | grep -E "(neon|upstash|ai|groq|hugging|imagekit|sentry|stack)"
```

---

### 4. Create Database Schema (30 minutes)

**Why:** Set up tables for property storage with geospatial support

**Run in Neon SQL Editor:**

```sql
-- Properties table with PostGIS
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL, -- 'mercadolibre', 'properati', 'zonaprop'

  -- Basic info
  title TEXT,
  description TEXT,
  url TEXT,

  -- Pricing
  price DECIMAL(12, 2),
  currency TEXT DEFAULT 'ARS',
  operation_type TEXT, -- 'sale', 'rent', 'temporary_rent'

  -- Property details
  property_type TEXT, -- 'apartment', 'house', 'land', 'commercial'
  bedrooms INT,
  bathrooms INT,
  area_sqm DECIMAL(10, 2),
  covered_area_sqm DECIMAL(10, 2),

  -- Location (PostGIS)
  location GEOGRAPHY(POINT, 4326), -- Lat/Lng as geography type
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'AR',
  postal_code TEXT,

  -- Media
  images JSONB, -- Array of image URLs
  blurhash TEXT,

  -- Metadata
  features JSONB, -- Array of features (pool, garage, etc.)
  metadata JSONB, -- Source-specific data

  -- Tracking
  user_id TEXT REFERENCES neon_auth.users_sync(id), -- Property owner/agent
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'deleted'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  scraped_at TIMESTAMP,
  last_seen_at TIMESTAMP
);

-- Spatial index for location queries (CRITICAL for performance)
CREATE INDEX idx_properties_location ON properties USING GIST(location);

-- Regular indexes
CREATE INDEX idx_properties_source ON properties(source);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_operation ON properties(operation_type);
CREATE INDEX idx_properties_type ON properties(property_type, operation_type);
CREATE INDEX idx_properties_user ON properties(user_id);
CREATE INDEX idx_properties_status ON properties(status) WHERE status = 'active';
CREATE INDEX idx_properties_created ON properties(created_at DESC);

-- Full-text search index
CREATE INDEX idx_properties_search ON properties
  USING GIN(to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- Price history table
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  price DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'ARS',
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_property ON price_history(property_id, recorded_at DESC);

-- Property duplicates detection
CREATE TABLE property_duplicates (
  id SERIAL PRIMARY KEY,
  property_id_1 INT REFERENCES properties(id),
  property_id_2 INT REFERENCES properties(id),
  similarity_score DECIMAL(3, 2), -- 0.00 to 1.00
  method TEXT, -- 'geospatial', 'fuzzy_text', 'price', 'combined'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id_1, property_id_2)
);

CREATE INDEX idx_duplicates_property1 ON property_duplicates(property_id_1);
CREATE INDEX idx_duplicates_property2 ON property_duplicates(property_id_2);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Test query: Find properties near Córdoba city center
SELECT
  id,
  title,
  price,
  currency,
  ST_Distance(
    location,
    ST_GeogFromText('POINT(-64.1810 -31.4201)')
  ) / 1000 as distance_km
FROM properties
WHERE location IS NOT NULL
  AND ST_DWithin(
    location,
    ST_GeogFromText('POINT(-64.1810 -31.4201)'),
    5000  -- 5km radius
  )
ORDER BY distance_km
LIMIT 10;
```

---

### 5. Test Stack Auth User Sync (5 minutes)

**Why:** Verify Neon Auth is syncing users from Stack Auth

```sql
-- Check synced users
SELECT * FROM neon_auth.users_sync;

-- Count users
SELECT COUNT(*) as total_users FROM neon_auth.users_sync;

-- Show recent users
SELECT
  id,
  email,
  display_name,
  signed_up_at,
  email_verified
FROM neon_auth.users_sync
ORDER BY signed_up_at DESC
LIMIT 10;
```

**If no users appear:**
1. Create a test user in Stack Auth dashboard
2. Wait ~30 seconds for sync
3. Query again

---

## 🔧 Short-Term Setup (This Month)

### 6. Set Up Missing Services (2-3 hours)

#### A. Cloudflare R2 (Image Storage)

**Sign up:** https://dash.cloudflare.com

**Steps:**
1. Go to R2 Object Storage
2. Create bucket: `property-images`
3. Make public (or create public domain)
4. Generate API token with R2 permissions
5. Add to Vercel:
   ```bash
   echo "your-account-id" | vercel env add CLOUDFLARE_ACCOUNT_ID production
   echo "your-access-key" | vercel env add R2_ACCESS_KEY_ID production
   echo "your-secret-key" | vercel env add R2_SECRET_ACCESS_KEY production
   ```

**Free tier:** 10 GB storage, unlimited egress

---

#### B. ImageKit.io (Image CDN)

**Sign up:** https://imagekit.io

**Steps:**
1. Create account and project
2. Get credentials from Dashboard:
   - URL Endpoint
   - Public Key
   - Private Key
3. Go to Settings > External Storage
4. Add Cloudflare R2 as origin:
   - Type: S3-compatible
   - Endpoint: Your R2 bucket URL
   - Access Key & Secret from step 6A
5. Add to Vercel:
   ```bash
   echo "https://ik.imagekit.io/your-id" | vercel env add NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT production
   echo "public_xxx" | vercel env add NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY production
   echo "private_xxx" | vercel env add IMAGEKIT_PRIVATE_KEY production
   ```

**Free tier:** 20 GB storage, 20 GB bandwidth, unlimited transformations

---

#### C. Google Gemini (AI Descriptions)

**Get API Key:** https://aistudio.google.com/apikey

**Steps:**
1. Sign in with Google account
2. Create API key
3. Add to Vercel:
   ```bash
   echo "your-api-key" | vercel env add GEMINI_API_KEY production
   ```

**Free tier:** 1,000 requests/day (30K/month)

---

#### D. Highlight.io (Logging)

**Sign up:** https://app.highlight.io

**Steps:**
1. Create account
2. Create new project
3. Get Project ID from settings
4. Add to Vercel:
   ```bash
   echo "your-project-id" | vercel env add NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID production
   ```

**Free tier:** 1M logs/month, 3-month retention

---

#### E. Checkly (Uptime Monitoring)

**Install via Vercel:**
```bash
vercel integration add checkly
```

Follow OAuth flow, configure monitoring checks.

**Free tier:** 10K API checks/month, 1.5K browser checks

---

### 7. Implement Core Features (1-2 weeks)

#### A. Property Search API with Redis Caching

Create: `app/api/properties/search/route.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';

const sql = neon(process.env.DATABASE_URL!);
const redis = Redis.fromEnv();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'Córdoba';
  const maxPrice = searchParams.get('maxPrice');
  const propertyType = searchParams.get('type');

  // Create cache key
  const cacheKey = `search:${city}:${maxPrice}:${propertyType}`;

  // Check cache (5 min TTL)
  const cached = await redis.get(cacheKey);
  if (cached) {
    return Response.json({ properties: cached, cached: true });
  }

  // Query database
  const properties = await sql`
    SELECT * FROM properties
    WHERE city = ${city}
      AND status = 'active'
      ${maxPrice ? sql`AND price <= ${maxPrice}` : sql``}
      ${propertyType ? sql`AND property_type = ${propertyType}` : sql``}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  // Cache results
  await redis.setex(cacheKey, 300, properties);

  return Response.json({ properties, cached: false });
}
```

#### B. Schedule MercadoLibre Scraping with QStash

Create: `app/api/scrape/mercadolibre/route.ts`

```typescript
import { verifySignature } from '@upstash/qstash/nextjs';
import { scrapeMercadoLibre } from '@/lib/scrapers/mercadolibre';

async function handler(request: Request) {
  const results = await scrapeMercadoLibre();

  return Response.json({
    success: true,
    properties: results.length,
    timestamp: new Date().toISOString()
  });
}

export const POST = verifySignature(handler);
```

**Schedule in Upstash Console:**
- URL: `https://your-app.vercel.app/api/scrape/mercadolibre`
- Schedule: `0 */6 * * *` (every 6 hours)
- Method: POST

#### C. AI Property Description Generator

Create: `app/api/ai/generate-description/route.ts`

```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(request: Request) {
  const property = await request.json();

  const { text } = await generateText({
    model: google('gemini-1.5-flash'),
    prompt: `Generate an engaging property description in Spanish for:

    Tipo: ${property.type}
    Ubicación: ${property.address}, ${property.city}
    Dormitorios: ${property.bedrooms}
    Baños: ${property.bathrooms}
    Superficie: ${property.area_sqm} m²
    Precio: ${property.currency} ${property.price}

    Hazlo atractivo para compradores/inquilinos en Argentina.`,
  });

  return Response.json({ description: text });
}
```

---

## 📈 Long-Term Goals (Next 3 Months)

### 8. Advanced Features

- [ ] **Real-time Property Search Chatbot** (Groq + Neon)
- [ ] **Semantic Search with Embeddings** (Hugging Face + pgvector)
- [ ] **Price Prediction ML Model** (Custom XGBoost)
- [ ] **Duplicate Detection Pipeline** (Geospatial + Fuzzy matching)
- [ ] **Email Alerts for New Listings** (Resend.com)
- [ ] **Property Comparison Tool**
- [ ] **Market Trends Dashboard**
- [ ] **Mobile App** (React Native)

### 9. Performance Optimization

- [ ] **Edge Caching** with Vercel Edge Functions
- [ ] **ISR** for property listing pages
- [ ] **Image Optimization Pipeline** (R2 → ImageKit)
- [ ] **Database Query Optimization**
- [ ] **Rate Limiting** per user/IP

### 10. Production Readiness

- [ ] **Monitoring Dashboards** (Sentry + Highlight + Checkly)
- [ ] **Automated Testing** (Playwright)
- [ ] **CI/CD Pipeline** (GitHub Actions)
- [ ] **Documentation** (Swagger/OpenAPI)
- [ ] **Security Audit** (Vercel Firewall + Arcjet)

---

## 🎓 Learning Resources

### Documentation
- **Neon Auth + Stack Auth:** [docs/NEON_STACK_AUTH_SETUP.md](docs/NEON_STACK_AUTH_SETUP.md)
- **Complete Stack Guide:** [docs/VERCEL_INTEGRATIONS_MASTER_PLAN.md](docs/VERCEL_INTEGRATIONS_MASTER_PLAN.md)
- **Database Comparison:** [docs/VERCEL_DATABASE_COMPARISON.md](docs/VERCEL_DATABASE_COMPARISON.md)
- **AI Integration:** [docs/AI_ML_INTEGRATION_RESEARCH.md](docs/AI_ML_INTEGRATION_RESEARCH.md)
- **Automation Guide:** [docs/VERCEL_AUTOMATION_GUIDE.md](docs/VERCEL_AUTOMATION_GUIDE.md)

### Official Docs
- Neon: https://neon.com/docs
- Stack Auth: https://docs.stack-auth.com
- Upstash: https://upstash.com/docs
- Vercel: https://vercel.com/docs
- ImageKit: https://docs.imagekit.io

---

## 🚦 Current Status Summary

**Infrastructure:** ✅ Excellent progress (70% complete)
**Database:** ⚠️ Needs PostGIS enabled + schema created
**Authentication:** ✅ Fully configured
**Caching:** ✅ Fully configured
**Image Storage:** ❌ Needs setup (R2 + ImageKit)
**AI Services:** ⚠️ Partially configured (need Gemini)
**Monitoring:** ⚠️ Partially configured (need Highlight + Checkly)

**Estimated time to full MVP:** 2-3 weeks
**Current monthly cost:** $0
**Projected cost at launch:** $0-25/month

---

## ❓ Need Help?

**Use Claude Code with MCP:**
- "Enable PostGIS on my Neon database"
- "Show me my database tables"
- "Deploy this to Vercel production"
- "Add GEMINI_API_KEY environment variable"

**Check Documentation:**
- All guides are in `docs/` folder
- Updated .env.example in root
- Complete code examples included

**Next conversation starter:**
"Let's enable PostGIS and create the database schema"
or
"Help me set up Cloudflare R2 and ImageKit"

---

**Ready to build? Let's start with step 1-5 this week! 🚀**
