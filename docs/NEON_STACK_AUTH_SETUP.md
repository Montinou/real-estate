# Neon + Stack Auth Complete Setup Guide
## AI-Assisted Configuration with MCP Servers

**Last Updated:** November 11, 2025
**Project:** Real Estate Platform Argentina
**Current Stack:** Neon DB + Stack Auth + Vercel + Upstash

---

## Table of Contents

1. [Current Configuration Analysis](#current-configuration-analysis)
2. [Neon Auth vs Neon Authorize](#neon-auth-vs-neon-authorize)
3. [Stack Auth Integration](#stack-auth-integration)
4. [MCP Server Setup](#mcp-server-setup)
5. [SDK Installation](#sdk-installation)
6. [CLI Tools](#cli-tools)
7. [Getting Started Guides](#getting-started-guides)
8. [Next Steps](#next-steps)

---

## Current Configuration Analysis

### ✅ Already Configured (from .env.local)

**Database (Neon):**
```env
DATABASE_URL=postgresql://neondb_owner:npg_...@ep-noisy-tree-ahqmqvqd-pooler.c-3.us-east-1.aws.neon.tech/neondb
NEON_PROJECT_ID=crimson-river-73238641
PGHOST=ep-noisy-tree-ahqmqvqd-pooler.c-3.us-east-1.aws.neon.tech
PGDATABASE=neondb
```

**Authentication (Stack Auth):**
```env
NEXT_PUBLIC_STACK_PROJECT_ID=0ca7d94e-a1a5-47c2-9f7c-66d3ef606a65
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_p0wb0516sxs0t5r8m03jawchj85axbb08kac5qzs8qyf8
STACK_SECRET_SERVER_KEY=ssk_qgrj5rh1aq8vve0p1p9pxhfar53kz4tkw07cmzv78yr40
```

**Cache & Queue (Upstash):**
```env
KV_REST_API_URL=https://stunning-gnat-35694.upstash.io
KV_REST_API_TOKEN=AYtuAAInc...
REDIS_URL=rediss://default:...@stunning-gnat-35694.upstash.io:6379
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=eyJVc2VySUQiOiI...
```

**Error Tracking (Sentry):**
```env
NEXT_PUBLIC_SENTRY_DSN=https://ef619df911992eed3de8df4bc25c8cc4@o4509908785954816.ingest.us.sentry.io/4510347340283904
SENTRY_AUTH_TOKEN=5c9c8af7f73b8a675f16ffdbae0532bd5bff5da5279d9af63294751297c4cc93
SENTRY_ORG=stratix-bt
SENTRY_PROJECT=propt-tech-ai
```

**AI (Various Providers):**
```env
AI_GATEWAY_API_KEY=vck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HUGGINGFACESW_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**MercadoLibre API:**
```env
ML_APP_ID=your-app-id
ML_APP_SECRET_KEY=your-secret-key
```

### ❌ Missing Configuration

**Still Needed:**
- [ ] Cloudflare R2 (image storage) - R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID
- [ ] ImageKit.io (image CDN) - IMAGEKIT_URL_ENDPOINT, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY
- [ ] Google Gemini - GEMINI_API_KEY
- [ ] Highlight.io (logging) - NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID
- [ ] Checkly (uptime monitoring) - requires Vercel integration

---

## Neon Auth vs Neon Authorize

### Neon Auth (What You Have)

**Status:** ✅ Production-ready (launched Jan 2025)

**What It Is:**
- Fully managed authentication solution
- Automatically provisions and manages Stack Auth project
- Syncs user profiles to Neon database in real-time
- No webhooks or background jobs needed
- Users stored in `neon_auth.users_sync` table

**How It Works:**
1. User signs up/logs in via Stack Auth
2. Neon Auth automatically syncs profile to database
3. User data available in Postgres instantly
4. Can be queried like any other table

**Integration with Stack Auth:**
- One-click setup from Neon Console
- Stack Auth project auto-provisioned
- Can transfer ownership to your Stack Auth account
- Maintains sync even after transfer

**Key Benefit:** No vendor lock-in - data lives in your Postgres database

### Neon Authorize (Alternative Approach)

**Status:** Legacy approach, migrated to Neon Data API

**What It Was:**
- Row-Level Security (RLS) integration
- Used JWTs from auth providers (Clerk, Auth0, etc.)
- Required manual RLS policy setup
- More complex configuration

**Current Recommendation:** Use Neon Auth (which you already have) instead

---

## Stack Auth Integration

### What Is Stack Auth?

- Open-source authentication provider
- Integrated with Neon Auth
- Supports social OAuth (Google, GitHub, etc.)
- Free tier: 50,000 MAU
- Modern developer experience

### Your Current Setup

Based on `.env.local`, you have:
- Project ID: `0ca7d94e-a1a5-47c2-9f7c-66d3ef606a65`
- Publishable key configured
- Server secret key configured

### Enabling Row-Level Security (Optional)

If you want to add RLS for additional security:

1. **Get JWKS URL from Stack Auth:**
   - Go to Stack Auth Dashboard
   - Navigate to your project settings
   - Find JWKS URL (format: `https://api.stack-auth.com/api/v1/projects/<project-id>/.well-known/jwks`)

2. **Configure Neon RLS:**
   ```sql
   -- In Neon SQL Editor

   -- Enable RLS on your tables
   ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view all properties"
     ON properties
     FOR SELECT
     TO authenticated
     USING (true);

   CREATE POLICY "Users can manage their own listings"
     ON properties
     FOR ALL
     TO authenticated
     USING (user_id = auth.user_id());
   ```

3. **Configure Stack Auth JWT:**
   - Stack Auth automatically includes user_id in JWT
   - Neon Auth syncs this to database
   - RLS policies can use `auth.user_id()` function

### Users Table

Neon Auth automatically creates and syncs:

```sql
-- Schema: neon_auth
-- Table: users_sync

CREATE TABLE neon_auth.users_sync (
  id TEXT PRIMARY KEY,           -- Stack Auth user ID
  email TEXT,
  email_verified BOOLEAN,
  display_name TEXT,
  profile_image_url TEXT,
  signed_up_at TIMESTAMP,
  has_password BOOLEAN,
  auth_with_email BOOLEAN,
  client_metadata JSONB,
  server_metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## MCP Server Setup

Model Context Protocol (MCP) allows AI assistants like Claude Code to manage your infrastructure programmatically.

### Available MCP Servers for Your Stack

#### 1. Neon MCP Server

**What It Does:**
- Manage Neon projects and branches
- Run SQL queries via AI commands
- Create tables, modify schemas
- Database migrations
- Query your database with natural language

**Setup Options:**

**Option A: Remote Hosted (Recommended)**

Add to Claude Code config (`~/.config/claude/mcp_config.json` or project-level):

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/mcp"]
    }
  }
}
```

**Authentication:** OAuth (automatic on first use)

**Option B: Local with API Key**

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon",
        "start",
        "$NEON_API_KEY"
      ]
    }
  }
}
```

**Get Neon API Key:**
1. Go to Neon Console → Account Settings → API Keys
2. Create new API key
3. Add to environment: `export NEON_API_KEY="your_key_here"`

**Available Commands (via Claude Code):**
```
"List all my Neon projects"
"Create a new database branch for feature/auth"
"Run this query: SELECT * FROM properties LIMIT 10"
"Show me the schema for the properties table"
"Create a migration to add price_history column"
"Compare my dev branch with main"
```

#### 2. Vercel MCP Server

**What It Does:**
- Manage deployments
- Configure environment variables
- Analyze logs
- Manage projects

**Setup:**

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.vercel.com/mcp"]
    }
  }
}
```

**Authentication:** OAuth (automatic)

**Context-Aware Mode:**
```json
{
  "mcpServers": {
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

**Available Commands:**
```
"Deploy to production"
"Show logs from last deployment"
"Add environment variable GEMINI_API_KEY"
"List all environment variables"
"Create preview deployment"
```

#### 3. Upstash MCP Server (Community)

**Status:** No official MCP server yet, but can be built

**Alternative:** Use REST APIs directly or create custom MCP server

#### 4. Sentry MCP Server (Community)

**Status:** No official MCP server yet

**Alternative:** Use Sentry CLI or API

### Combined MCP Configuration

**Complete Claude Code config:**

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

**Where to Add:**
- **macOS/Linux:** `~/.config/claude/mcp_config.json`
- **Windows:** `%APPDATA%\Claude\mcp_config.json`
- **Project-level:** `.claude/mcp_config.json` (create this file)

---

## SDK Installation

### Currently Installed (from package.json)

Already have:
- `next` - Next.js framework
- `react` - React
- `pg` - PostgreSQL client
- `sharp` - Image processing
- `axios` - HTTP client
- `cheerio` - Web scraping
- `playwright` - Browser automation
- `winston` - Logging
- `zod` - Schema validation

### Required SDKs to Install

Run these commands:

```bash
# Neon serverless driver
npm install @neondatabase/serverless

# Upstash SDK
npm install @upstash/redis @upstash/qstash

# Vercel AI SDK
npm install ai @ai-sdk/google

# Google Gemini
npm install @google/generative-ai

# Groq SDK (if not installed)
npm install groq-sdk

# Hugging Face Inference
npm install @huggingface/inference

# ImageKit SDK
npm install imagekit-javascript

# Sentry Next.js
npm install @sentry/nextjs

# Stack Auth SDK (should already be installed)
npm install @stackframe/stack

# Cloudflare R2 (S3-compatible)
npm install @aws-sdk/client-s3
```

**All at once:**
```bash
npm install @neondatabase/serverless @upstash/redis @upstash/qstash ai @ai-sdk/google @google/generative-ai groq-sdk @huggingface/inference imagekit-javascript @sentry/nextjs @stackframe/stack @aws-sdk/client-s3
```

### SDK Usage Examples

**Neon Serverless Driver:**
```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const properties = await sql`SELECT * FROM properties LIMIT 10`;
```

**Upstash Redis:**
```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv(); // Uses KV_REST_API_URL and KV_REST_API_TOKEN
await redis.set('property:123', propertyData);
const cached = await redis.get('property:123');
```

**Upstash QStash:**
```typescript
import { Client } from '@upstash/qstash';

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

// Schedule scraping job
await qstash.publishJSON({
  url: 'https://proptech-ai.vercel.app/api/scrape',
  body: { source: 'mercadolibre' },
  delay: 3600, // 1 hour
});
```

**Vercel AI SDK + Gemini:**
```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const { text } = await generateText({
  model: google('gemini-1.5-flash'),
  prompt: 'Generate a property description for...',
});
```

**Stack Auth:**
```typescript
import { StackServerApp } from '@stackframe/stack';

const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
});

// Get current user
const user = await stackServerApp.getUser();
```

---

## CLI Tools

### Installed CLIs

✅ **Vercel CLI** (v48.2.9)
```bash
vercel --version
vercel login
vercel env ls
vercel deploy --prod
```

✅ **Neon CLI** (v2.17.1)
```bash
neonctl --version
neonctl auth  # Login with OAuth
neonctl projects list
neonctl branches list --project-id crimson-river-73238641
neonctl branches create --project-id crimson-river-73238641 --name feature/new-feature
neonctl sql "SELECT * FROM properties LIMIT 5" --project-id crimson-river-73238641
```

✅ **Upstash CLI**
```bash
upstash --version
upstash auth login
upstash redis list
upstash kafka list
```

### Additional CLIs to Install

**Sentry CLI:**
```bash
npm install -g @sentry/cli
sentry-cli --version
sentry-cli login
```

**ImageKit CLI (no official CLI, use SDK)**

**Cloudflare Wrangler:**
```bash
npm install -g wrangler
wrangler --version
wrangler login
wrangler r2 bucket list
```

---

## Getting Started Guides

### 1. Neon Database Setup

**Enable PostGIS:**
```sql
-- In Neon SQL Editor (console.neon.tech)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Test
SELECT PostGIS_Version();
```

**Create Properties Table:**
```sql
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  external_id TEXT UNIQUE,
  source TEXT NOT NULL,
  title TEXT,
  description TEXT,
  price DECIMAL(12, 2),
  currency TEXT DEFAULT 'ARS',
  property_type TEXT,
  operation_type TEXT,
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'AR',
  bedrooms INT,
  bathrooms INT,
  area_sqm DECIMAL(10, 2),
  images JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index
CREATE INDEX idx_properties_location ON properties USING GIST(location);

-- Create regular indexes
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_type ON properties(property_type, operation_type);
```

**Test Geospatial Query:**
```sql
-- Find properties within 2km of Córdoba city center
SELECT id, title, price,
  ST_Distance(
    location,
    ST_GeogFromText('POINT(-64.1810 -31.4201)')
  ) / 1000 as distance_km
FROM properties
WHERE ST_DWithin(
  location,
  ST_GeogFromText('POINT(-64.1810 -31.4201)'),
  2000  -- 2km in meters
)
ORDER BY distance_km
LIMIT 10;
```

### 2. Stack Auth Setup

**Install SDK (if not already):**
```bash
npm install @stackframe/stack
```

**Initialize in your app:**

**`app/layout.tsx`:**
```typescript
import { StackProvider, StackTheme } from '@stackframe/stack';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StackProvider
          projectId={process.env.NEXT_PUBLIC_STACK_PROJECT_ID!}
          publishableClientKey={process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!}
          urlSchema={{
            signIn: '/auth/signin',
            signUp: '/auth/signup',
            afterSignIn: '/dashboard',
            afterSignUp: '/onboarding',
          }}
        >
          {children}
        </StackProvider>
      </body>
    </html>
  );
}
```

**Protected Page Example:**
```typescript
// app/dashboard/page.tsx
import { useUser } from '@stackframe/stack';
import { redirect } from 'next/navigation';

export default function Dashboard() {
  const user = useUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div>
      <h1>Welcome, {user.displayName}</h1>
      <p>Email: {user.primaryEmail}</p>
    </div>
  );
}
```

**Server-Side Auth:**
```typescript
// app/api/properties/route.ts
import { StackServerApp } from '@stackframe/stack';
import { neon } from '@neondatabase/serverless';

const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
});

export async function GET(request: Request) {
  const user = await stackServerApp.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const properties = await sql`
    SELECT * FROM properties
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `;

  return Response.json({ properties });
}
```

### 3. Enable Neon Auth User Sync

**Check if users are syncing:**
```sql
-- Query synced users
SELECT * FROM neon_auth.users_sync;

-- Count users
SELECT COUNT(*) FROM neon_auth.users_sync;
```

**Link users to your properties:**
```sql
-- Add user_id column if not exists
ALTER TABLE properties ADD COLUMN user_id TEXT REFERENCES neon_auth.users_sync(id);

-- Create index
CREATE INDEX idx_properties_user_id ON properties(user_id);
```

### 4. Upstash Redis Caching

**Cache Property Search Results:**
```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function searchProperties(filters) {
  const cacheKey = `search:${JSON.stringify(filters)}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('Cache hit');
    return cached;
  }

  // Query database
  const sql = neon(process.env.DATABASE_URL);
  const results = await sql`SELECT * FROM properties WHERE...`;

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, results);

  return results;
}
```

**Rate Limiting:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '15 m'),
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    );
  }

  // Continue...
}
```

### 5. QStash Scheduled Scraping

**Schedule MercadoLibre Scraping:**
```typescript
import { Client } from '@upstash/qstash';

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

// Schedule daily scraping at 2 AM
await qstash.schedules.create({
  destination: 'https://proptech-ai.vercel.app/api/scrape/mercadolibre',
  cron: '0 2 * * *',  // Daily at 2 AM
});
```

**API Route Handler:**
```typescript
// app/api/scrape/mercadolibre/route.ts
import { verifySignature } from '@upstash/qstash/nextjs';

async function handler(req: Request) {
  // Your scraping logic
  const results = await scrapeMercadoLibre();

  return Response.json({
    success: true,
    properties: results.length
  });
}

export const POST = verifySignature(handler);
```

### 6. AI Integration

**Generate Property Descriptions with Gemini:**
```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function enhancePropertyDescription(property) {
  const { text } = await generateText({
    model: google('gemini-1.5-flash'),
    prompt: `Generate an engaging property description for:

    Type: ${property.type}
    Location: ${property.address}, ${property.city}
    Bedrooms: ${property.bedrooms}
    Bathrooms: ${property.bathrooms}
    Area: ${property.area_sqm} m²
    Price: ${property.currency} ${property.price}

    Make it appealing to potential buyers/renters in Argentina.`,
  });

  return text;
}
```

**Property Search Chatbot with Groq:**
```typescript
import Groq from 'groq-sdk';
import { neon } from '@neondatabase/serverless';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sql = neon(process.env.DATABASE_URL);

export async function chatWithProperties(userMessage: string) {
  // Get relevant context from database
  const recentProperties = await sql`
    SELECT * FROM properties
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a real estate assistant. Help users find properties in Córdoba, Argentina. Here are recent listings: ${JSON.stringify(recentProperties)}`,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
    model: 'llama3-70b-8192',
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content;
}
```

---

## Next Steps

### Immediate (This Week)

1. **Configure MCP Servers**
   - [ ] Add Neon MCP to Claude Code config
   - [ ] Add Vercel MCP to Claude Code config
   - [ ] Test natural language commands

2. **Install Missing SDKs**
   - [ ] Run: `npm install @neondatabase/serverless @upstash/redis ai @ai-sdk/google`
   - [ ] Update package.json

3. **Enable PostGIS**
   - [ ] Open Neon SQL Editor
   - [ ] Run: `CREATE EXTENSION IF NOT EXISTS postgis;`
   - [ ] Test with sample query

4. **Test Stack Auth**
   - [ ] Create test user in Stack Auth dashboard
   - [ ] Verify user appears in `neon_auth.users_sync` table
   - [ ] Test sign-in flow

### Short Term (This Month)

5. **Set Up Missing Services**
   - [ ] Cloudflare R2 bucket for images
   - [ ] ImageKit.io account and configuration
   - [ ] Google Gemini API key
   - [ ] Highlight.io logging

6. **Database Schema**
   - [ ] Create properties table with PostGIS
   - [ ] Create indexes for performance
   - [ ] Set up price_history table
   - [ ] Configure RLS policies (optional)

7. **Implement Caching**
   - [ ] Redis caching for search results
   - [ ] Rate limiting middleware
   - [ ] Session storage

8. **Schedule Scraping Jobs**
   - [ ] QStash cron for MercadoLibre
   - [ ] QStash cron for Properati
   - [ ] Error handling and retries

### Long Term (Next Quarter)

9. **AI Features**
   - [ ] Property description generator
   - [ ] Search chatbot
   - [ ] Price prediction model
   - [ ] Duplicate detection with embeddings

10. **Production Optimization**
    - [ ] Edge caching strategy
    - [ ] ISR for property pages
    - [ ] Image optimization pipeline
    - [ ] Monitoring and alerts

---

## AI-Assisted Commands (via Claude Code)

Once MCP servers are configured, you can use natural language:

**Database Management:**
```
"Show me all tables in my Neon database"
"Create a migration to add a price_history table"
"Query properties in Córdoba with price < 50000 USD"
"Enable PostGIS extension"
"Create a spatial index on the location column"
```

**Deployment:**
```
"Deploy my latest changes to Vercel production"
"Show logs from the last hour"
"Add GEMINI_API_KEY environment variable"
"Create a preview deployment for this branch"
```

**Development:**
```
"Create a new Neon branch for feature/search-filters"
"Run my database migrations on the dev branch"
"Compare schema between dev and main branches"
"Seed the database with sample properties"
```

---

## Resources

### Documentation

- **Neon:** https://neon.com/docs
- **Stack Auth:** https://docs.stack-auth.com
- **Upstash:** https://upstash.com/docs
- **Vercel:** https://vercel.com/docs
- **Sentry:** https://docs.sentry.io
- **Vercel AI SDK:** https://sdk.vercel.ai/docs

### MCP Servers

- **Neon MCP:** https://github.com/neondatabase/mcp-server-neon
- **Vercel MCP:** https://mcp.vercel.com

### Getting Started Examples

- **Neon + Stack Auth:** https://github.com/neondatabase-labs/stack-nextjs-neon-authorize
- **Neon Auth Demo:** https://github.com/neondatabase-labs/neon-auth-demo-app

### Community

- **Neon Discord:** https://discord.gg/neon
- **Vercel Discord:** https://vercel.com/discord
- **Stack Auth Discord:** https://discord.gg/stack-auth

---

**Ready to start?** Use Claude Code with MCP servers to manage your infrastructure via natural language! 🚀
