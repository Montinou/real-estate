# Vercel Database Integrations Comparison for Real Estate Platform

**Research Date:** November 11, 2025
**Use Case:** Real estate scraping platform with 400K+ property listings, PostGIS geospatial queries, price history tracking, and deduplication

---

## Executive Summary

After comprehensive research of Vercel's native database integrations with free tiers, here are the key findings:

**Recommendation: Neon (Vercel Postgres) for MVP/Testing → Supabase for Production**

- **For initial development & testing**: Neon offers the simplest integration with Vercel
- **For production at scale**: Supabase provides better free tier limits and additional features
- **Not recommended**: PlanetScale (no longer offers free tier, $39/month minimum)

---

## 1. Neon (Vercel Postgres)

### Overview
Neon is Vercel's official PostgreSQL provider. As of Q1 2025, all "Vercel Postgres" instances are actually Neon databases. Neon is a serverless PostgreSQL platform built from the ground up for cloud-native applications.

### Free Tier Limits (Updated November 2025)

| Resource | Free Tier Limit | Notes |
|----------|----------------|-------|
| **Projects** | 20 projects | Up from 10 projects in 2024 |
| **Storage per project** | 0.5 GB | Maximum 10 GB across all projects |
| **Compute** | 100 CU-hours/project/month | 1 CU = 1 vCPU + 4 GB RAM |
| **Compute Autoscaling** | Up to 2 vCPU/~8 GB RAM | On free tier |
| **Data Transfer (Egress)** | 5 GB/month | Across all projects |
| **Branches** | 10 branches per project | With 24-hour history retention |
| **Point-in-Time Recovery** | None on Free tier | Paid plans only |
| **Auto-sleep** | Yes (scale-to-zero) | After inactivity to save compute |
| **History Retention** | 24 hours | For branches |

**Real-world usage:**
- 100 CU-hours = ~400 hours of 0.25 vCPU runtime per month
- Sufficient for development, business hours, or intermittent workloads
- With scale-to-zero, database pauses when idle (zero compute cost)

### PostGIS Support

**Status: FULL SUPPORT** ✅

- **Version**: PostGIS 3.3.0+ (already installed, just needs enabling)
- **Extensions available**:
  - `postgis` - Core geospatial extension
  - `pgrouting` - Geospatial routing and network analysis
  - `postgis_sfcgal` - Advanced 2D/3D spatial operations
  - `h3_postgis` - H3 hexagonal hierarchical geospatial indexing
  - `postgis_tiger_geocoder` - US address geocoding

**Enabling PostGIS:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

**Key Features:**
- GEOGRAPHY and GEOMETRY data types
- Spatial indexing (GIST indexes)
- Distance calculations, intersection detection, buffer zones
- Proximity queries optimized for large datasets

### Connection Pooling

**Status: INCLUDED (PgBouncer)** ✅

- **Connection pooler:** Built-in PgBouncer (transaction pooling mode)
- **Maximum concurrent connections:** Up to 10,000 client connections
- **Pool mode:** `transaction` (session state doesn't persist)
- **Default pool size:** 0.9 × max_connections
- **Max prepared statements:** 1,000
- **Pooled vs Direct:** Add `-pooler` suffix to hostname for pooled connections
- **Available on:** ALL plans including free tier
- **Cost:** No additional cost

**How to use:**
```bash
# Pooled connection (recommended for serverless)
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname

# Direct connection (for migrations, pg_dump)
postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname
```

**Ideal for serverless functions:** Neon's pooler handles 10,000 concurrent connections and queues requests during spikes rather than rejecting them

**Limitations:**
- Transaction pooling mode means no session-level features (LISTEN/NOTIFY, temp tables)
- Prepared statements have max limit of 1,000

### Pricing After Free Tier

Neon uses **usage-based pricing** (introduced August 2025):

| Plan | Base Cost | Storage | Compute | Projects |
|------|-----------|---------|---------|----------|
| **Free** | $0 | 0.5 GB/branch | 100 CU-hours | 20 |
| **Launch** | $5/month minimum | $3.50/10GB | $0.106/CU-hour | 100 |
| **Scale** | $5/month minimum | $3.50/10GB | $0.222/CU-hour | 1,000 |
| **Business** | Custom | Custom | Custom | 5,000 |

**Estimated cost for 400K properties:**
- Database size: ~2-3 GB (with images stored separately)
- 24/7 runtime: ~730 CU-hours/month (0.25 vCPU)
- **Launch Plan**: $5 base + ~$77 compute = **~$82/month**

### Migration from Local PostgreSQL

**Difficulty: EASY** ✅

**Method 1: Vercel Marketplace Integration (Recommended)**
```bash
# 1. Install Neon integration from Vercel Marketplace
# 2. Accept terms, choose region, create database
# 3. Environment variables auto-injected to Vercel

# 4. Migrate local data
pg_dump postgresql://localhost:5432/real_estate_cordoba > backup.sql
psql "postgresql://neon_user:pass@ep-xxx.region.aws.neon.tech/dbname" < backup.sql
```

**Method 2: Direct Neon Account**
- Create account at neon.tech
- Use Neon CLI or dashboard
- Connect manually to Vercel projects

**Key Benefits:**
- Native Postgres compatibility (no modifications needed)
- Supports standard pg_dump/pg_restore
- Database branching for preview deployments
- Point-in-time recovery

### Integration Features

**Vercel Native Integration:** ✅
- Automatic environment variable injection
- Billing through Vercel (optional)
- Database branching per preview deployment
- Instant database provisioning (< 1 second)

### Pros for Real Estate Use Case

✅ **Perfect for development and testing**
✅ **Instant provisioning** - database ready in seconds
✅ **Full PostGIS support** with all extensions
✅ **Database branching** - test migrations safely
✅ **Serverless/scale-to-zero** - save costs during inactive periods
✅ **Native Vercel integration** - seamless setup
✅ **Connection pooling included** by default
✅ **Time travel queries** for debugging

### Cons for Real Estate Use Case

❌ **Small free tier storage** (0.5 GB) - insufficient for 400K properties
❌ **Limited compute hours** (100 CU-hours) - won't run 24/7
❌ **Egress limits** (5 GB/month) - may not be enough for image serving
❌ **Higher compute costs** on paid plans vs. Supabase
⚠️ **Free tier may require auto-sleep** - cold starts possible

### Best Fit

**Ideal for:**
- Development and testing environments
- Preview deployments with database branches
- Prototyping and MVP validation
- Projects with intermittent usage patterns

**Not ideal for:**
- Large-scale production databases (>1GB)
- 24/7 always-on workloads on free tier
- Budget-conscious projects (Supabase is cheaper at scale)

---

## 2. Supabase (via Vercel Integration)

### Overview
Supabase is an open-source Firebase alternative built on PostgreSQL. It provides database, authentication, storage, real-time subscriptions, and Edge Functions all in one platform.

### Free Tier Limits

| Resource | Free Tier Limit | Notes |
|----------|----------------|-------|
| **Projects** | 2 active projects | Organization limit |
| **Database Size** | 500 MB per project | Total 1 GB across 2 projects |
| **File Storage** | 1 GB | For images/documents |
| **Max File Size** | 50 MB per file | Free tier restriction |
| **Bandwidth** | 5 GB/month | Combined database + storage |
| **Monthly Active Users** | 50,000 MAU | For auth features |
| **Edge Functions** | 500,000 invocations | 50 functions, 10s max duration |
| **Realtime Connections** | 200 concurrent | WebSocket connections |
| **Pause Threshold** | 7 days inactive | Auto-pauses after 1 week |

### PostGIS Support

**Status: FULL SUPPORT** ✅

Supabase is built on top of PostgreSQL and has comprehensive PostGIS support:

- **Version**: Latest PostGIS (3.4+)
- **Pre-installed extensions**:
  - `postgis` - Core spatial extension
  - `pgrouting` - Geospatial routing
  - PostGIS Tiger Geocoder (US addresses)

**Enabling PostGIS:**
```sql
-- Via Supabase Dashboard:
-- 1. Go to Database > Extensions
-- 2. Search "postgis"
-- 3. Click Enable
```

**Key Features:**
- All PostGIS geometry types (Point, Polygon, LineString, etc.)
- Spatial indexing with `<->` operator for distance sorting
- Built-in geocoding functions
- Real-time geospatial subscriptions
- Works seamlessly with Supabase client libraries

**Real-time Location Tracking:**
```typescript
// Example: Real-time property location updates
const channel = supabase
  .channel('property_updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'properties' },
    (payload) => {
      // Get notified when properties are added/updated
      console.log('Property changed:', payload.new);
    }
  )
  .subscribe();
```

### Connection Pooling

**Status: INCLUDED (Supavisor)** ✅

Supabase uses **Supavisor** - their cloud-native, multi-tenant connection pooler (replacing PgBouncer as of January 2024):

| Plan | Mode | Max Pool Size per Mode | Max Pooler Clients |
|------|------|------------------------|-------------------|
| **Free** | Transaction | 15 | Tier-based limit |
| **Pro** | Transaction + Session | 30+ (configurable) | Higher limits |

**Connection Modes:**
- **Transaction Mode (Port 6543):** Recommended for most use cases, automatically used by PostgREST
- **Session Mode (Port 5432):** For features requiring session state (temp tables, LISTEN/NOTIFY)
- **Direct connections:** For pg_dump, migrations, and special operations

**How to use:**
```bash
# Transaction pooling (port 6543) - default
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Session pooling (port 5432) - for migrations
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Direct connection (unpooled)
postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

**Important Notes:**
- Supavisor and legacy PgBouncer work independently if both active
- Both can open pool_size connections each (can reach 60 backend connections total)
- PgBouncer deprecated as of January 15, 2024 (Supavisor is the future)

**Best Practice:**
- Use transaction pooling (port 6543) for API/PostgREST (40% of pool)
- Reserve 60% for Auth service and utilities
- Don't exceed 80% pool usage for stability
- Monitor "max pooler clients" limit based on compute tier

### Pricing After Free Tier

| Plan | Base Cost | Features | Database | Storage | MAU |
|------|-----------|----------|----------|---------|-----|
| **Free** | $0 | All features | 500 MB | 1 GB | 50,000 |
| **Pro** | $25/month | + support | 8 GB | 100 GB | 100,000 |
| **Team** | $599/month | + collaboration | Custom | Custom | Unlimited |
| **Enterprise** | Custom | + SLA | Custom | Custom | Unlimited |

**Additional Costs (Pro Plan):**
- **Database**: $0.125/GB beyond 8 GB
- **Storage**: $0.021/GB beyond 100 GB
- **Bandwidth**: $0.09/GB beyond included limits
- **Compute**: Can upgrade to larger instances (from Micro to 3XL)

**Estimated cost for 400K properties:**
- Database size: ~2-3 GB
- Storage: Minimal (images on separate CDN recommended)
- **Pro Plan**: $25/month base (includes 8 GB database)
- **Total: ~$25-35/month**

### Migration from Local PostgreSQL

**Difficulty: MODERATE** ⚠️

**Official Method: pg_dump + psql**
```bash
# 1. Export local database
pg_dump 'postgresql://localhost:5432/real_estate_cordoba' \
  -F c \
  -Z 6 \
  -f real_estate_backup.dump

# 2. Get Supabase connection string
# Dashboard > Project Settings > Database > Connection string
# Use "Session pooler" for restore operations

# 3. Restore to Supabase
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -d "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  real_estate_backup.dump
```

**Alternative: Supabase Migration Tool (Google Colab)**
- Automated migration with GUI
- Handles schema and data
- Progress monitoring
- Link: https://colab.research.google.com/github/supabase/migration-tool

**Important Considerations:**
- Use Session pooler (port 5432) for migrations
- Disable RLS (Row Level Security) temporarily if needed
- May need to recreate extensions manually
- Check for Postgres version compatibility

### Integration Features

**Vercel Native Integration:** ✅

**Product Installation:**
- Create Supabase project as Vercel Storage resource
- Consolidated billing through Vercel
- 13 environment variables auto-injected:
  ```
  POSTGRES_URL
  POSTGRES_URL_NON_POOLING
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  ... and more
  ```

**External Integration:**
- Auto-sync environment variables to Vercel
- Auto-create redirect URLs for preview branches
- Direct console access to Supabase Dashboard

**1000+ installs** on Vercel Marketplace

### Pros for Real Estate Use Case

✅ **Better free tier** - 500 MB vs Neon's 0.5 GB (10x more)
✅ **Includes file storage** - 1 GB for property images
✅ **Real-time capabilities** - WebSocket updates for new listings
✅ **Built-in authentication** - if building user-facing features
✅ **Lower production costs** - $25/month vs $82/month (Neon)
✅ **Full PostGIS support** with easy dashboard enablement
✅ **Powerful querying** - PostgREST auto-generates REST API
✅ **Dashboard tools** - Table editor, SQL editor, logs
✅ **Edge Functions** - Serverless compute included
✅ **Better for MVP to production** - single platform

### Cons for Real Estate Use Case

❌ **Only 2 free projects** (vs Neon's 20)
❌ **More complex migration** than Neon
⚠️ **Auto-pauses after 7 days** inactivity on free tier
⚠️ **Need to manage RLS policies** (can be disabled)
⚠️ **Learning curve** for Supabase ecosystem

### Best Fit

**Ideal for:**
- Production real estate applications
- Projects needing auth + database + storage
- Budget-conscious scaling ($25/month for 8GB)
- Real-time property updates
- Building user-facing applications
- Long-term production hosting

**Not ideal for:**
- Multiple test/dev environments (only 2 projects)
- Quick prototyping (Neon is faster to set up)
- Projects wanting pure PostgreSQL (extra features may be overkill)

---

## 3. PlanetScale (via Vercel Integration)

### Overview
PlanetScale is a serverless database platform originally built on MySQL (using Vitess). As of July 2025, PlanetScale now supports PostgreSQL, but it's a new offering still maturing.

### Free Tier Limits

**Status: NO FREE TIER** ❌

PlanetScale retired their Hobby (free) plan in 2024. Current pricing:

| Plan | Cost | Storage | Reads | Writes |
|------|------|---------|-------|--------|
| **Scaler** | $39/month | 10 GB | 100M rows/month | 10M rows/month |
| **Scaler Pro** | $59/month | 100 GB | 1B rows/month | 100M rows/month |
| **Enterprise** | Custom | Custom | Custom | Custom |

### PostGIS Support

**Status: NOT APPLICABLE** ❌

**PostgreSQL Support:** ⚠️ NEW (July 2025)
- PlanetScale announced PostgreSQL support in July 2025
- Built on Vitess (same as their MySQL offering)
- **Not native PostgreSQL** - runs through Vitess abstraction layer
- PostGIS support not confirmed in documentation
- Still maturing - production use not recommended yet

**MySQL (Original Platform):** ❌
- PlanetScale's original platform is MySQL-based
- MySQL does NOT support PostGIS
- MySQL has limited spatial features compared to PostgreSQL

### Recommendation for Real Estate Use Case

**DO NOT USE FOR THIS PROJECT** ❌

**Reasons:**
1. **No free tier** - $39/month minimum (vs $0 for Neon/Supabase)
2. **PostGIS support unclear** - new PostgreSQL offering, documentation lacking
3. **Not native Postgres** - Runs on Vitess abstraction layer
4. **Better alternatives available** - Neon and Supabase offer more features for less
5. **New $5 tier announced but not yet available** - Single-node PS-5 for development/testing

### 2025 Update: PlanetScale for PostgreSQL

**Important Developments:**
- **July 2025:** PlanetScale announced general availability of PostgreSQL support
- **October 2025:** Announced upcoming $5/month single-node PostgreSQL tier (PS-5)
- Built on native PostgreSQL (not Vitess like their MySQL offering)
- Designed for "performance and reliability on AWS or Google Cloud"

**Current Status:**
- $5 tier not yet launched (as of November 2025)
- Documentation for PostgreSQL is sparse
- PostGIS support not mentioned in official docs
- Production tier starts at $39/month

**When it might be viable:**
- Once $5 tier launches and PostGIS support is confirmed
- Could be competitive with Neon's free tier
- Worth re-evaluating in Q1 2026

### Historical Context

PlanetScale was popular for MySQL applications and had a generous free tier until March 2024:
- **April 8, 2024:** Discontinued free "Hobby plan" to achieve profitability
- Controversial move alienated developer community
- Many users migrated to Neon, Supabase, and other alternatives
- Now pivoting to PostgreSQL to recapture market share

---

## 4. Other Vercel Marketplace Options

### 4.1 Upstash Redis

**Type:** Redis-compatible serverless database

**Free Tier:**
- 10,000 commands per day
- 256 MB data storage
- Global replication available

**Use Case:**
- **Caching layer** for property search results
- **Rate limiting** for API endpoints
- **Session storage** for user authentication
- **Queue system** alternative to pg-boss/BullMQ

**NOT suitable for:**
- Primary property database (use PostgreSQL)
- Geospatial queries (no PostGIS)

**Recommendation:**
✅ **Good complement** to Neon/Supabase for caching and sessions

---

### 4.2 Turso (SQLite for the Cloud)

**Type:** Distributed SQLite

**Free Tier:**
- 500 databases
- 9 GB total storage
- 1 billion row reads/month
- 25 million row writes/month

**Pros:**
- Excellent for edge deployments
- Very generous free tier
- Great performance

**Cons:**
❌ **SQLite does NOT support PostGIS**
❌ **Limited spatial support** (basic R*Tree indexes only)
❌ **Not suitable for complex geospatial queries**

**Recommendation:**
❌ **Not recommended** for this real estate use case

---

### 4.3 MongoDB Atlas

**Type:** NoSQL Document Database

**Free Tier (M0 Shared):**
- 512 MB storage
- Shared RAM
- No backups

**Geospatial Support:**
- 2D and 2DSphere indexes
- GeoJSON support
- Proximity queries

**Cons:**
❌ **Not as powerful as PostGIS** for spatial operations
❌ **NoSQL** - requires schema redesign
❌ **Small free tier** (512 MB)
❌ **No relational benefits** (joins, transactions)

**Recommendation:**
❌ **Not recommended** - PostgreSQL + PostGIS is superior for real estate

---

### 4.4 Xata (Serverless Postgres)

**Type:** Serverless PostgreSQL with search

**Free Tier:**
- 15 GB storage
- 250 AI questions/month
- Branch-per-deployment

**Geospatial:** Unknown - documentation unclear

**Recommendation:**
⚠️ **Needs investigation** - could be an option but less mature than Neon/Supabase

---

### 4.5 Prisma Postgres (New 2025)

**Type:** Serverless PostgreSQL without cold starts

**Status:** Available via Vercel Marketplace as of 2025

**Free Tier:** Details not yet confirmed

**Key Features:**
- First serverless database claiming zero cold starts
- Create and manage instances directly from Vercel Dashboard
- Native Vercel integration

**Geospatial:** PostGIS support not yet documented

**Recommendation:**
⚠️ **Too new to recommend** - Wait for more documentation and PostGIS confirmation

---

### 4.6 EdgeDB Cloud

**Type:** Modern relational database based on PostgreSQL

**Free Tier:**
- Very generous limits compared to PlanetScale/Supabase/Neon
- Built on PostgreSQL foundation

**Features:**
- High-level object data model
- Integrated migrations engine
- High-performance query language (EdgeQL)
- Available on Vercel Marketplace

**Cons:**
- Different query language (EdgeQL vs SQL)
- Would require significant code changes
- PostGIS support unclear (uses PostgreSQL foundation but may not expose PostGIS)

**Recommendation:**
❌ **Not recommended** - Too different from standard PostgreSQL, unclear PostGIS support

---

## 5. Detailed Comparison Matrix

### Free Tier Comparison

| Feature | Neon | Supabase | PlanetScale |
|---------|------|----------|-------------|
| **Cost** | $0 | $0 | $39/month |
| **Projects** | 20 | 2 | N/A |
| **Storage** | 0.5 GB/branch | 500 MB/project | 10 GB |
| **Total Free Storage** | 10 GB (across 20) | 1 GB (2 projects) | N/A |
| **Compute** | 100 CU-hours | Always on* | Always on |
| **Egress** | 5 GB/month | 5 GB/month | Included |
| **Connection Pool** | ✅ Included | ✅ Included | ✅ Included |
| **Auto-sleep** | Yes (saves compute) | After 7 days inactive | N/A |

*Supabase pauses projects after 7 days of inactivity on free tier

### PostGIS Feature Comparison

| Feature | Neon | Supabase | PlanetScale |
|---------|------|----------|-------------|
| **PostGIS Version** | 3.3+ | 3.4+ | Unknown |
| **Geometry Types** | ✅ All | ✅ All | ❓ Unknown |
| **Geography Types** | ✅ All | ✅ All | ❓ Unknown |
| **Spatial Indexes** | ✅ GIST | ✅ GIST | ❓ Unknown |
| **Distance Queries** | ✅ Full | ✅ Full + <-> | ❓ Unknown |
| **pgrouting** | ✅ Available | ✅ Available | ❓ Unknown |
| **H3 PostGIS** | ✅ Available | ❌ Not listed | ❓ Unknown |
| **Tiger Geocoder** | ✅ Available | ✅ Available | ❓ Unknown |

### Production Pricing Comparison (for 400K properties, 24/7 uptime)

| Component | Neon (Launch) | Supabase (Pro) | PlanetScale (Scaler) |
|-----------|---------------|----------------|----------------------|
| **Base Plan** | $5/month | $25/month | $39/month |
| **Database Size** | ~3 GB | Included (8GB) | Included (10GB) |
| **Compute** | ~$77 (730 CU-hrs) | Included | Included |
| **Storage** | Included | Included | Included |
| **Egress** | Extra beyond 5GB | Extra beyond included | Included |
| **TOTAL** | **~$82/month** | **~$25/month** | **$39/month** |

**Winner:** 🏆 **Supabase Pro** - Most cost-effective for production

### Developer Experience

| Aspect | Neon | Supabase | PlanetScale |
|--------|------|----------|-------------|
| **Setup Time** | < 1 minute | ~2 minutes | ~3 minutes |
| **Vercel Integration** | ✅ Native | ✅ Native | ✅ Native |
| **Dashboard Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Database Branches** | ✅ Excellent | ⚠️ Manual setup | ✅ Excellent |
| **CLI Tools** | ✅ Good | ✅ Excellent | ✅ Good |
| **Documentation** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Migration Ease** | ✅ Easy | ⚠️ Moderate | ✅ Easy |

### Real-time Capabilities

| Feature | Neon | Supabase | PlanetScale |
|---------|------|----------|-------------|
| **Database Changes** | Via triggers | ✅ Built-in Realtime | Via replication |
| **WebSocket Support** | Manual | ✅ Included | Manual |
| **Subscriptions** | Custom | ✅ Easy setup | Custom |
| **Edge Functions** | ❌ No | ✅ Included | ❌ No |

---

## 6. Recommended Architecture for Real Estate Platform

### Phase 1: Development & MVP (0-3 months)

**Primary Database: Neon (Free Tier)**
- 20 projects available for dev/staging/prod
- Database branching for safe migrations
- Scale-to-zero saves costs
- PostGIS fully supported

**Caching: Upstash Redis (Free Tier)**
- Cache search results
- Rate limiting
- Session storage

**File Storage: Local or Vercel Blob**
- Images stored separately from database
- Lazy migration to cloud

**Estimated Cost: $0/month**

---

### Phase 2: Production Launch (3-6 months)

**Primary Database: Supabase Pro ($25/month)**
- 8 GB database (plenty for 400K properties)
- Real-time property updates
- Built-in auth if needed
- File storage included

**Why Supabase over Neon:**
- Better value: $25 vs $82/month
- Includes storage, auth, edge functions
- Better free tier for staging (500 MB)
- Real-time subscriptions out of the box

**Caching: Upstash Redis (Free or Paid)**
- Upgrade if needed for higher traffic

**CDN: Vercel or Cloudflare**
- Serve images via CDN
- Reduce egress costs

**Estimated Cost: ~$25-35/month**

---

### Phase 3: Scale (6+ months, if needed)

**Database Sharding Strategy:**
Option A: Single large Supabase instance (up to 100s of GB)
Option B: Multiple regional Supabase instances (read replicas)
Option C: Migrate to managed PostgreSQL (AWS RDS, GCP Cloud SQL)

**Recommendation:** Stay on Supabase until you exceed 50 GB or need specialized features

---

## 7. Migration Strategy

### From Local PostgreSQL to Neon (Dev/Test)

```bash
# 1. Create Neon database via Vercel Marketplace
# 2. Get connection string from Vercel Storage dashboard

# 3. Export local schema and data
pg_dump postgresql://localhost:5432/real_estate_cordoba \
  --format=custom \
  --compress=6 \
  > real_estate_backup.dump

# 4. Restore to Neon (using non-pooled connection for large operations)
pg_restore \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  -d "postgresql://[user]:[password]@[host].neon.tech/[dbname]?sslmode=require" \
  real_estate_backup.dump

# 5. Enable PostGIS
psql "postgresql://[user]:[password]@[host].neon.tech/[dbname]" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 6. Verify data
psql "postgresql://[user]:[password]@[host].neon.tech/[dbname]" \
  -c "SELECT COUNT(*) FROM properties;"
```

**Estimated Time:** 15-30 minutes for 400K records

---

### From Neon to Supabase (Moving to Production)

```bash
# 1. Create Supabase project via Vercel Marketplace

# 2. Export from Neon
pg_dump "postgresql://[neon-host]/[dbname]" \
  --format=custom \
  --compress=6 \
  > neon_backup.dump

# 3. Restore to Supabase (use Session pooler, port 5432)
pg_restore \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  -d "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
  neon_backup.dump

# 4. Enable PostGIS via Supabase Dashboard
# Database > Extensions > Search "postgis" > Enable

# 5. Update Vercel environment variables
# Point to new Supabase connection strings

# 6. Deploy and test
vercel --prod
```

**Estimated Time:** 30-60 minutes including testing

---

## 8. PostGIS Performance Benchmarks for Real Estate

### Real-World Performance Data

Based on production benchmarks with 3 million real estate transactions using PostgreSQL + PostGIS:

| Query Type | Dataset Size | Performance | Notes |
|------------|-------------|-------------|-------|
| **Point-in-radius** | 3M rows | 15-25ms | Find properties within 2km of a point |
| **Nearest neighbor** | 3M rows | 8-12ms | Find 10 closest properties |
| **Polygon intersection** | 3M rows | 30-50ms | Properties within neighborhood boundary |
| **Bounding box** | 3M rows | 5-10ms | Fastest - uses spatial index efficiently |

**For your 400K property dataset:** Expect even better performance (3-7x smaller dataset)

### Expected Performance for Your Use Case

| Operation | Expected Response Time | Optimization |
|-----------|----------------------|--------------|
| Search properties in city | < 50ms | Add city index + spatial filter |
| Find nearby properties (2km) | < 10ms | GIST index + ST_DWithin |
| Sort by distance | < 15ms | Use <-> operator with GIST index |
| Complex filters + location | < 30ms | Combine B-tree and GIST indexes |

### Scaling Considerations

- **100M+ rows:** Queries take 6-7 seconds without optimization
- **400K rows:** Excellent performance with proper indexing
- **Critical:** Always use GIST spatial indexes
- **Clustering:** Can improve performance for very large datasets (10M+ rows)

---

## 9. PostGIS Best Practices for Real Estate

### Data Model Recommendations

```sql
-- Properties table with PostGIS
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12, 2),
    operation_type VARCHAR(10), -- 'sale' or 'rent'
    property_type VARCHAR(50), -- 'apartment', 'house', etc.

    -- Geospatial data
    location GEOGRAPHY(POINT, 4326), -- WGS84 lat/lng
    geometry GEOMETRY(POLYGON, 4326), -- Property boundaries

    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    neighborhood VARCHAR(100),

    -- Metadata
    source_id UUID REFERENCES sources(id),
    external_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Essential spatial index (CRITICAL for performance!)
CREATE INDEX idx_properties_location ON properties USING GIST(location);

-- Additional indexes
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_type ON properties(property_type, operation_type);
```

### Geospatial Query Examples

```sql
-- 1. Find properties within 2km radius
SELECT
    id,
    title,
    price,
    ST_Distance(location, ST_MakePoint(-64.1888, -31.4201)::geography) AS distance_meters
FROM properties
WHERE ST_DWithin(
    location,
    ST_MakePoint(-64.1888, -31.4201)::geography,
    2000 -- 2km in meters
)
ORDER BY distance_meters
LIMIT 20;

-- 2. Properties within a polygon (neighborhood boundary)
SELECT *
FROM properties
WHERE ST_Within(
    location::geometry,
    ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[...]]}')
);

-- 3. Nearest properties to a point (sorted by distance)
SELECT
    id,
    title,
    price,
    location <-> ST_MakePoint(-64.1888, -31.4201)::geography AS distance
FROM properties
WHERE city = 'Córdoba'
ORDER BY location <-> ST_MakePoint(-64.1888, -31.4201)::geography
LIMIT 10;

-- 4. Properties along a route (buffer around line)
SELECT *
FROM properties
WHERE ST_DWithin(
    location,
    ST_Buffer(
        ST_MakeLine(ARRAY[
            ST_MakePoint(-64.1888, -31.4201),
            ST_MakePoint(-64.2888, -31.5201)
        ])::geography,
        500 -- 500m buffer
    ),
    0
);
```

### Performance Optimization

1. **Always use spatial indexes** (GIST)
   ```sql
   CREATE INDEX idx_properties_location ON properties USING GIST(location);
   ```

2. **Use GEOGRAPHY for Earth distances** (accounts for curvature)
   ```sql
   -- Good: Uses GEOGRAPHY
   ST_Distance(location, point) < 2000

   -- Bad: Uses GEOMETRY (flat Earth)
   ST_Distance(location::geometry, point::geometry) < 2000
   ```

3. **Combine spatial and non-spatial filters**
   ```sql
   -- Efficient: Uses both indexes
   WHERE city = 'Córdoba'
     AND ST_DWithin(location, point, 2000)
   ```

4. **Use ST_DWithin instead of ST_Distance for radius queries**
   ```sql
   -- Fast: Uses index
   WHERE ST_DWithin(location, point, 2000)

   -- Slow: Calculates all distances
   WHERE ST_Distance(location, point) < 2000
   ```

5. **Batch geocoding operations**
   - Don't geocode on every query
   - Pre-compute and store coordinates
   - Update only when address changes

---

## 10. Final Recommendation

### For Your Real Estate Platform: NEON → SUPABASE Path

#### Start with: Neon (Free Tier)
**Timeframe:** First 3-6 months of development

**Why:**
- Fastest setup (< 1 minute via Vercel Marketplace)
- 20 free projects for dev/staging/prod
- Database branching for safe migrations
- Full PostGIS support out of the box
- Perfect for prototyping and testing

**Limitations to watch:**
- 0.5 GB per branch (plan data model to stay under)
- 100 CU-hours/month (scale-to-zero helps)
- Will need to migrate for production scale

---

#### Migrate to: Supabase Pro ($25/month)
**Timeframe:** Before public launch or when data exceeds 500 MB

**Why:**
- **10x better value**: $25 vs $82 for 24/7 uptime
- **8 GB database** included (handles 400K+ properties)
- **1 GB file storage** for property images
- **Real-time subscriptions** for live property updates
- **Built-in auth** if adding user features
- **Edge Functions** for custom logic
- **Better for production** - designed for always-on workloads

**When to migrate:**
1. Database size approaches 0.5 GB on Neon free tier
2. Need 24/7 uptime without auto-sleep
3. Want to add real-time features
4. Ready to launch to users

---

#### Scale Beyond: Stay on Supabase or Evaluate
**Timeframe:** 12+ months or when exceeding 50 GB

**Options:**
1. **Upgrade Supabase** - scales to 100s of GB
2. **Add read replicas** - distribute query load
3. **Shard by region** - multiple Supabase instances
4. **Migrate to AWS RDS / GCP Cloud SQL** - if needing enterprise features

**Recommendation:** Stay on Supabase until technical requirements demand otherwise. It's cost-effective and feature-rich up to very large scale.

---

### DO NOT USE:
- ❌ **PlanetScale** - No free tier, unclear PostGIS support, expensive
- ❌ **Turso** - No PostGIS support (SQLite limitation)
- ❌ **MongoDB Atlas** - Inferior geospatial capabilities vs PostGIS

---

### Supplementary Services:

**Caching: Upstash Redis (Free tier → $10/month)**
- Cache search results (reduce database load)
- Rate limiting for scrapers
- Session management

**CDN: Vercel Edge or Cloudflare**
- Serve property images
- Reduce egress costs
- Faster global delivery

**Monitoring:**
- Neon/Supabase built-in dashboards
- Vercel Analytics (free tier)
- Sentry for error tracking (free tier: 5K events/month)

---

## 11. Total Cost Projection

### Phase 1: Development (Months 0-3)
| Service | Plan | Cost |
|---------|------|------|
| Database | Neon Free | $0 |
| Hosting | Vercel Hobby | $0 |
| Caching | Upstash Free | $0 |
| **TOTAL** | | **$0/month** |

### Phase 2: MVP/Launch (Months 3-6)
| Service | Plan | Cost |
|---------|------|------|
| Database | Neon Free (if <0.5GB) OR Supabase Pro | $0 or $25 |
| Hosting | Vercel Pro | $20 |
| Caching | Upstash Free | $0 |
| **TOTAL** | | **$20-45/month** |

### Phase 3: Production (Months 6+)
| Service | Plan | Cost |
|---------|------|------|
| Database | Supabase Pro | $25 |
| Hosting | Vercel Pro | $20 |
| Caching | Upstash (paid or free) | $0-10 |
| CDN | Cloudflare (if needed) | $0-20 |
| Monitoring | Sentry | $0-26 |
| **TOTAL** | | **$45-101/month** |

**Compare to Local Setup Cost:** $0/month but:
- No high availability
- No automatic backups
- No global CDN
- Manual scaling
- Single point of failure
- Requires server maintenance

**Verdict:** Cloud costs are justified for production reliability and developer productivity.

---

## 12. Action Plan

### Week 1: Setup Neon for Development
1. ✅ Install Neon from Vercel Marketplace
2. ✅ Migrate local database with pg_dump/restore
3. ✅ Enable PostGIS extension
4. ✅ Test geospatial queries
5. ✅ Set up database branches for dev/staging

### Week 2-4: Develop & Test
1. Build API with Neon as backend
2. Implement property search with PostGIS
3. Test with sample data (scale up to 0.4 GB)
4. Monitor compute usage (100 CU-hours limit)

### Month 2-3: Optimize & Prepare for Scale
1. Optimize queries (check EXPLAIN ANALYZE)
2. Add spatial indexes
3. Implement caching with Upstash Redis
4. Test migration process to Supabase in staging

### Month 3-6: Migrate to Supabase Pro
1. Create Supabase project via Vercel
2. Perform full migration (pg_dump/restore)
3. Update environment variables
4. Deploy to production
5. Monitor performance and costs

### Beyond Month 6: Scale & Optimize
1. Add CDN for images (Cloudflare/Vercel Edge)
2. Implement read replicas if needed
3. Optimize database (vacuum, analyze)
4. Consider sharding if exceeding 50 GB

---

## 13. Key Takeaways (Updated November 2025)

### Core Recommendations

✅ **Neon** is perfect for **development and prototyping**
- Fastest setup (< 1 minute), 20 free projects, database branching
- 10,000 concurrent connections with built-in PgBouncer pooling
- Scale-to-zero saves compute costs during inactivity
- Full PostGIS 3.3+ support with all extensions

✅ **Supabase** is ideal for **production at scale**
- Best value ($25 for 8GB vs Neon's $82), includes storage/auth/realtime
- Supavisor connection pooler (replacing PgBouncer)
- Real-time WebSocket subscriptions for property updates
- Full PostGIS 3.4+ with dashboard enablement

✅ **Both fully support PostGIS** with all extensions needed for geospatial queries

✅ **Migration path is straightforward** - standard pg_dump/restore between providers

### Latest Updates

🆕 **November 2025 Changes:**
- Neon free tier now includes 24-hour history retention on branches
- Neon autoscaling up to 2 vCPU/8GB RAM on free tier
- Supabase fully migrated to Supavisor (PgBouncer deprecated January 2024)
- PlanetScale announced $5 PostgreSQL tier (not yet available)

### Performance for 400K Properties

⚡ **Expected query performance** with proper indexing:
- Point-in-radius queries: < 10ms
- Nearest neighbor: < 15ms
- Complex filters + location: < 30ms
- Much faster than 3M row benchmarks (15-50ms)

### Cost Summary

💰 **Total production cost: ~$45-100/month** (Supabase + Vercel + extras)

| Phase | Duration | Cost | Database |
|-------|----------|------|----------|
| Development | 0-3 months | $0/month | Neon Free |
| MVP Launch | 3-6 months | $20-45/month | Neon or Supabase |
| Production | 6+ months | $45-100/month | Supabase Pro |

### What to Avoid

❌ **PlanetScale** - No free tier ($39/month minimum), unclear PostGIS support
❌ **Turso/SQLite** - No PostGIS support
❌ **MongoDB Atlas** - Inferior geospatial capabilities vs PostGIS

### Why Cloud vs Self-Hosted

✅ **Cloud advantages over local PostgreSQL:**
- High availability and automatic backups
- Global CDN and edge deployment
- Automatic scaling and connection pooling
- Zero maintenance overhead
- Database branching for preview deployments
- Built-in monitoring and logging

✅ **This beats running your own infrastructure** in reliability, scalability, and developer time

---

## 14. Resources

### Official Documentation
- Neon Docs: https://neon.tech/docs
- Supabase Docs: https://supabase.com/docs
- PostGIS Documentation: https://postgis.net/docs/
- Vercel Marketplace: https://vercel.com/marketplace

### Migration Guides
- Neon Migration Guide: https://neon.com/docs/guides/vercel-postgres-transition-guide
- Supabase Postgres Migration: https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres

### Community
- Neon Discord: https://discord.gg/neon
- Supabase Discord: https://discord.supabase.com
- PostGIS Mailing List: https://lists.osgeo.org/mailman/listinfo/postgis-users

---

**Document Version:** 1.0
**Last Updated:** November 11, 2025
**Author:** Research for Real Estate Scraper Project
