# Queue, Cache, and Background Job Solutions for Vercel - Comprehensive Research

## Executive Summary

This document provides a detailed comparison of queue, caching, and background job solutions available in the Vercel ecosystem for a real estate scraping platform. The analysis focuses on **free tier limits**, serverless compatibility, and optimal use cases for scraping orchestration, caching, and background processing.

### Quick Recommendations by Use Case

| Use Case | Primary Solution | Backup Solution | Rationale |
|----------|-----------------|-----------------|-----------|
| **API Rate Limiting** | Upstash Redis | Vercel KV | Low latency, proven rate limiting library |
| **Response Caching** | Upstash Redis | Next.js Cache | High throughput, global replication |
| **Job Scheduling (Cron)** | Upstash QStash | Vercel Cron | More flexible, better free tier |
| **Background Jobs** | Inngest | Trigger.dev | Generous free tier, no timeout limits |
| **Message Queue** | Upstash QStash | Inngest | Purpose-built for async messaging |
| **Image Processing** | Inngest | External Service | Step-based execution, no timeouts |

---

## 1. Upstash Redis - Caching & Rate Limiting

### Overview
Serverless Redis database optimized for edge environments with HTTP-based API that works perfectly with Vercel serverless functions.

### Free Tier Limits (2025)
- **Commands**: 500,000 per month (increased from 10K daily)
- **Storage**: 256MB data size
- **Bandwidth**: 10GB per month
- **Databases**: Up to 10 databases free
- **Performance**: 10,000 requests/second
- **Connection**: REST API (no persistent connections needed)

### Pay-As-You-Go Pricing
- **$0.20 per 100K requests** after free tier
- **First 200GB bandwidth included**, then $0.03/GB
- **Storage**: First 1GB free, then $0.25/GB
- **Max data size**: 100GB
- **Budget controls**: Auto rate limiting when budget exceeded

### Primary Use Cases

#### 1. API Rate Limiting
```javascript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Sliding window - best for scraping
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true,
});

// Per-source rate limiting
const { success, limit, remaining } = await ratelimit.limit(
  `scraper:${source}:${ipAddress}`
);
```

**Available Algorithms**:
- **Fixed Window**: Simple time-based windows (e.g., 10 req/10s)
- **Sliding Window**: Smooths bursts across window boundaries
- **Token Bucket**: Allows burst traffic with refill rate

#### 2. Response Caching
```javascript
// Cache MercadoLibre API responses
const cacheKey = `ml:listing:${listingId}`;
const cached = await redis.get(cacheKey);

if (cached) return cached;

const data = await fetchFromMercadoLibre(listingId);
await redis.setex(cacheKey, 3600, data); // 1 hour TTL
```

#### 3. Session Storage
```javascript
// Store scraping session state
await redis.hset(`session:${sessionId}`, {
  lastPage: pageNumber,
  totalProcessed: count,
  errors: errorCount,
  timestamp: Date.now()
});
```

### Serverless Compatibility
- **Perfect**: Native HTTP API, no persistent connections
- **Edge Ready**: Works on Vercel Edge, Cloudflare Workers, Fastly
- **Low Latency**: Global replication available
- **No Timeouts**: Stateless requests

### Best For Real Estate Scraping
1. **Rate limiting API calls** to MercadoLibre, Properati, ZonaProp
2. **Caching property listings** to reduce API calls
3. **Storing scraping progress** and session state
4. **Distributed locking** for deduplication jobs
5. **Temporary data** storage (queue metadata, job status)

### Limitations
- Not a full message queue (no guaranteed delivery)
- No built-in retry logic
- Storage costs increase with data volume
- 10K req/sec limit may bottleneck high-volume scraping

### Cost Projection for Real Estate Platform

**Assumptions**:
- 400K properties from MercadoLibre
- 100 scraping jobs per day
- 1M API responses cached
- Rate limiting on all requests

**Monthly Usage**:
- Rate limit checks: ~500K operations (within free tier)
- Cache operations: ~200K reads + 100K writes = 300K (within free tier)
- Storage: ~50MB cached data (within free tier)

**Estimated Cost**: **$0/month** (fits within free tier)

---

## 2. Upstash QStash - Message Queue & Scheduler

### Overview
Purpose-built serverless message queue and task scheduler with HTTP-based delivery, automatic retries, and CRON scheduling. Designed specifically for serverless environments.

### Free Tier Limits (2025)
- **Messages**: 1,000 messages per day (increased from 500)
- **Message Size**: 1MB max
- **Retry Count**: 3 retries
- **Max Delay**: 7 days
- **Active Schedules**: 10 CRON jobs
- **Soft Limits**: Service continues, you're asked to upgrade if consistently exceeding

### Pay-As-You-Go Pricing
- **$1 per 100,000 messages**
- **Unlimited** daily messages
- **10MB** max message size
- **5 retries** included
- **1 year** max delay
- **1,000** active schedules
- **No minimum payment** - pay only for what you use

### Fixed Plans
- **Fixed 1M**: $180/month (1M messages/day, 50MB messages, 100 retries)
- **Fixed 10M**: $420/month (10M messages/day)

### Prod Pack Add-On (+$200/month)
- Uptime SLA guarantee
- SOC-2 compliance
- Prometheus monitoring integration
- Datadog support

### Primary Use Cases

#### 1. Scheduled Scraping Jobs
```javascript
import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

// Schedule daily MercadoLibre scrape at 2 AM
await qstash.publishJSON({
  url: "https://your-api.vercel.app/api/scrape/mercadolibre",
  schedule: "0 2 * * *", // CRON expression
  body: {
    source: "mercadolibre",
    region: "cordoba"
  }
});
```

#### 2. Delayed Job Execution
```javascript
// Process property after 10 minutes
await qstash.publishJSON({
  url: "https://your-api.vercel.app/api/process-property",
  delay: 600, // seconds
  body: { propertyId: "123" }
});
```

#### 3. Fan-Out Processing
```javascript
// Send to multiple endpoints
await qstash.batchJSON([
  {
    destination: "https://api.vercel.app/api/process-images",
    body: { propertyId: "123" }
  },
  {
    destination: "https://api.vercel.app/api/check-duplicates",
    body: { propertyId: "123" }
  },
  {
    destination: "https://api.vercel.app/api/geocode",
    body: { propertyId: "123" }
  }
]);
```

#### 4. FIFO Queue
```javascript
// Guaranteed order processing
await qstash.queue({
  queueName: "image-processing",
  url: "https://api.vercel.app/api/process-image",
  body: { imageUrl: "..." }
});
```

### Key Features
- **Automatic Retries**: Exponential backoff on failure
- **Delivery Guarantees**: At-least-once delivery
- **Request Signing**: Verify requests came from QStash
- **Dead Letter Queue**: Handle failed jobs
- **Callbacks**: Success/failure webhooks
- **Deduplication**: Content-based deduplication

### Serverless Compatibility
- **Perfect**: Built specifically for serverless
- **HTTP-Only**: No persistent connections
- **Vercel Integration**: One-click marketplace install
- **Edge Compatible**: Works with Edge Functions

### Best For Real Estate Scraping
1. **Daily/hourly scraping schedules** (CRON jobs)
2. **Retry logic** for failed API requests
3. **Rate-limited queues** (process properties one at a time)
4. **Delayed processing** (wait before retry)
5. **Webhook handling** from external services
6. **Fan-out tasks** (geocoding, image processing, deduplication)

### Limitations
- Free tier limited to 10 schedules (need pay-as-you-go for more)
- 1MB message size on free tier (may not fit large property data)
- Not ideal for real-time processing (delivery latency ~1-2 seconds)
- No visibility into queue depth/status without Prod Pack

### Cost Projection for Real Estate Platform

**Assumptions**:
- 10 CRON jobs (daily scrapes, cleanups)
- 100 properties scraped per day
- 3 background tasks per property (images, geocode, dedupe)
- 300 messages per day

**Monthly Usage**:
- Scheduled jobs: 10 schedules (free tier)
- Property processing: 300 messages/day × 30 days = 9,000 messages
- Total: ~9,000 messages/month

**Estimated Cost**: **$0/month** (well within 30K free messages)

If scaling to 1,000 properties/day:
- 90,000 messages/month
- Cost: **$0.90/month**

---

## 3. Upstash Kafka - Event Streaming (DEPRECATED)

### Important Notice
**Upstash announced the deprecation of their Kafka service** in favor of Upstash Workflow. The service is being sunset, and new projects should not use it.

### Historical Context
Kafka was offered for serverless event streaming with:
- **Free tier**: 10,000 requests per day
- **Pricing**: $0.20 per 100K messages (single-zone)
- **Use cases**: Real-time data pipelines, IoT, event-driven architectures

### Migration Path
Upstash recommends migrating to:
1. **Upstash Workflow** (their new solution)
2. **Upstash QStash** (for job queuing)
3. **External Kafka providers** (Confluent, AWS MSK)

**Recommendation**: Do not use Upstash Kafka for new projects.

---

## 4. Inngest - Background Jobs & Workflows

### Overview
Durable workflow execution platform for background jobs with built-in step functions, retries, and scheduling. Code runs on your platform (Vercel), while Inngest manages orchestration.

### Free Tier Limits (2025)
- **Executions**: 50,000 per month
- **Events**: 100,000 per month
- **Concurrency**: 5 concurrent steps
- **Event Size**: 256KB max
- **Users**: 3 team members
- **Workers**: 3 workers (unlimited serverless)
- **Log Retention**: 24 hours
- **Metrics**: 30-minute granularity
- **Realtime**: 50 connections, 250K messages/day
- **No Credit Card Required**

### Pro Plan ($75/month)
- **Executions**: 1,000,000+ included, then $50 per 1M
- **Events**: Tiered pricing from $0.0000005 per event
- **Concurrency**: 100+ steps, then $25 per 25
- **Event Size**: 3MB max (vs 256KB free)
- **Users**: 15+, then $10/user
- **Workers**: 20, then $10/worker
- **Log Retention**: 7 days
- **Realtime**: 1,000+ connections

### Enterprise Plan
- Custom pricing
- 500-50K concurrency
- 90-day log retention
- SAML/RBAC
- Audit trails
- Dedicated Slack support

### Primary Use Cases

#### 1. Background Image Processing
```typescript
import { inngest } from "./client";

export const processPropertyImages = inngest.createFunction(
  { id: "process-property-images" },
  { event: "property/created" },
  async ({ event, step }) => {
    const property = event.data;

    // Step 1: Download images (retried independently)
    const images = await step.run("download-images", async () => {
      return await downloadImages(property.imageUrls);
    });

    // Step 2: Convert to WebP (retried independently)
    const webpImages = await step.run("convert-webp", async () => {
      return await convertToWebP(images);
    });

    // Step 3: Generate thumbnails (retried independently)
    const thumbnails = await step.run("generate-thumbnails", async () => {
      return await generateThumbnails(webpImages);
    });

    // Step 4: Upload to storage (retried independently)
    await step.run("upload-storage", async () => {
      return await uploadToStorage(thumbnails);
    });

    // Step 5: Update database
    await step.run("update-db", async () => {
      return await updatePropertyImages(property.id, thumbnails);
    });
  }
);
```

#### 2. Multi-Step Scraping Workflow
```typescript
export const scrapeMercadoLibre = inngest.createFunction(
  { id: "scrape-mercadolibre" },
  { cron: "0 2 * * *" }, // Daily at 2 AM
  async ({ step }) => {
    // Step 1: Fetch listings
    const listings = await step.run("fetch-listings", async () => {
      return await fetchMLListings();
    });

    // Step 2: Process each listing (fan-out)
    const results = await step.run("process-listings", async () => {
      return Promise.all(
        listings.map(listing => processListing(listing))
      );
    });

    // Step 3: Deduplicate
    await step.run("deduplicate", async () => {
      return await deduplicateProperties(results);
    });

    // Step 4: Send notification
    await step.run("notify", async () => {
      return await sendNotification(`Processed ${listings.length} listings`);
    });
  }
);
```

#### 3. Rate-Limited API Calls
```typescript
export const scrapeWithRateLimit = inngest.createFunction(
  {
    id: "scrape-rate-limited",
    concurrency: {
      limit: 2, // Only 2 concurrent executions
      key: "event.data.source" // Rate limit per source
    }
  },
  { event: "scrape/property" },
  async ({ event, step }) => {
    // Automatically rate-limited by Inngest
    const data = await step.run("fetch-property", async () => {
      return await fetchProperty(event.data.url);
    });

    // Sleep between requests
    await step.sleep("wait", "2s");

    return data;
  }
);
```

#### 4. Scheduled Jobs with Retries
```typescript
export const dailyCleanup = inngest.createFunction(
  {
    id: "daily-cleanup",
    retries: 5, // Retry up to 5 times
    throttle: {
      limit: 100, // Max 100 executions per period
      period: "1h"
    }
  },
  { cron: "0 0 * * *" }, // Daily at midnight
  async ({ step }) => {
    await step.run("clean-old-images", async () => {
      return await cleanOldImages();
    });
  }
);
```

### Key Features
- **Durable Execution**: Survives crashes, no data loss
- **Step Functions**: Each step retried independently
- **No Timeouts**: Long-running tasks supported
- **Built-in Scheduling**: CRON-like scheduling
- **Rate Limiting**: Per-function concurrency controls
- **Throttling**: Limit executions per time period
- **Sleep/Delay**: Built-in sleep between steps
- **Fan-Out**: Process arrays in parallel
- **Event-Driven**: Trigger functions from events
- **Local Development**: Test locally with Inngest dev server

### Serverless Compatibility
- **Perfect**: Designed for serverless
- **Vercel Native**: Code runs on Vercel functions
- **No Infrastructure**: Inngest handles queuing, state, retries
- **Preview Environments**: Works with Vercel preview deployments
- **One-Click Install**: Available in Vercel Marketplace

### Best For Real Estate Scraping
1. **Image processing pipelines** (download, convert, resize, upload)
2. **Multi-step scraping workflows** with retries
3. **Deduplication jobs** (long-running, needs checkpointing)
4. **Scheduled scrapes** with CRON
5. **Rate-limited API orchestration**
6. **Fan-out processing** (geocoding, enrichment)

### Limitations
- **Free tier concurrency**: Only 5 concurrent steps (can bottleneck)
- **Event size**: 256KB limit on free tier (property data may exceed)
- **Log retention**: Only 24 hours on free tier (debugging limited)
- **Learning curve**: New paradigm compared to traditional queues

### Cost Projection for Real Estate Platform

**Assumptions**:
- 100 properties scraped per day
- 3 steps per property (fetch, process, store)
- Image processing for 50 properties (10 steps each)
- Total: 300 + 500 = 800 executions/day

**Monthly Usage**:
- 24,000 executions/month (well within 50K free tier)

**Estimated Cost**: **$0/month**

If scaling to 1,000 properties/day:
- 240,000 executions/month
- Cost: ~$16/month + Pro plan ($75) = **$91/month**

However, Pro plan includes 1M executions, so actual cost would be **$75/month** flat.

---

## 5. Trigger.dev - Background Tasks & AI Workflows

### Overview
Platform for building long-running background tasks with TypeScript, hosted on Trigger.dev infrastructure. No timeouts, built-in retries, and dev/prod environments.

### Free Tier Limits (2025)
- **Monthly Usage**: $5 free credits
- **Concurrent Runs**: 10
- **Tasks**: Unlimited
- **Team Members**: 5
- **Environments**: Dev + Prod
- **Schedules**: 10 CRON jobs
- **Log Retention**: 1 day
- **Alert Destinations**: 1
- **Realtime Connections**: 10

### Hobby Plan ($10/month)
- **Monthly Usage**: $10 credits included
- **Concurrent Runs**: 25
- **Environments**: Dev, Staging, Prod
- **Preview Branches**: 5
- **Schedules**: 100
- **Log Retention**: 7 days
- **Alert Destinations**: 3
- **Realtime Connections**: 50

### Pro Plan ($50/month)
- **Monthly Usage**: $50 credits included
- **Concurrent Runs**: 100+ (add $50 per 50)
- **Team Members**: 25+ (add $20 per seat)
- **Preview Branches**: 20+ (add $10 per branch)
- **Schedules**: 1,000+ (add $10 per 1,000)
- **Log Retention**: 30 days
- **Alert Destinations**: 100+
- **Realtime Connections**: 500+

### Compute Pricing (Pay Per Second)
- **Micro**: $0.0000169/second (~$1/hour)
- **Small**: $0.0000338/second (~$2/hour)
- **Medium**: $0.0000844/second (~$5/hour)
- **Large**: $0.0001688/second (~$10/hour)
- **Large 2x**: $0.0003200/second (~$19/hour)
- **Run Invocation**: $0.000025 per run

### Primary Use Cases

#### 1. Image Processing Tasks
```typescript
import { task } from "@trigger.dev/sdk/v3";

export const processPropertyImages = task({
  id: "process-property-images",
  run: async (payload: { propertyId: string, imageUrls: string[] }) => {
    // No timeout limits!
    for (const url of payload.imageUrls) {
      const image = await downloadImage(url);
      const webp = await convertToWebP(image);
      const thumbnail = await generateThumbnail(webp);
      await uploadToStorage(thumbnail);
    }

    return { processed: payload.imageUrls.length };
  },
});
```

#### 2. Scheduled Scraping
```typescript
import { schedules } from "@trigger.dev/sdk/v3";

export const dailyScrape = schedules.task({
  id: "daily-scrape",
  cron: "0 2 * * *", // Daily at 2 AM
  run: async () => {
    const properties = await scrapeMercadoLibre();
    await saveToDatabase(properties);
    return { count: properties.length };
  },
});
```

#### 3. Long-Running Deduplication
```typescript
export const deduplicateProperties = task({
  id: "deduplicate-properties",
  run: async (payload: { batchSize: number }) => {
    let processed = 0;
    let page = 0;

    // Can run for hours without timeout
    while (true) {
      const properties = await fetchPropertiesPage(page, payload.batchSize);
      if (properties.length === 0) break;

      await findAndMergeDuplicates(properties);
      processed += properties.length;
      page++;
    }

    return { processed };
  },
});
```

### Key Features
- **No Timeouts**: Tasks run indefinitely
- **Hosted Code**: Code runs on Trigger.dev infrastructure (not Vercel)
- **Built-in Retries**: Automatic retry logic
- **Real-time Dashboard**: Monitor running tasks
- **Logs & Traces**: Debug with detailed logs
- **CRON Scheduling**: Native schedule support
- **Alerts**: Get notified on failures
- **TypeScript-First**: Excellent DX

### Serverless Compatibility
- **Different Model**: Code hosted on Trigger.dev, not Vercel
- **Webhook Trigger**: Trigger from Vercel via webhook
- **No Infrastructure**: Fully managed
- **Dev Environment**: Local development server

### Best For Real Estate Scraping
1. **Heavy image processing** (no timeout concerns)
2. **Large-scale deduplication** (hours-long jobs)
3. **Scheduled scrapes** with predictable timing
4. **AI tasks** (price prediction, image analysis)
5. **Long-running ETL** jobs

### Limitations
- **Code not on Vercel**: Runs on Trigger.dev infrastructure (adds latency)
- **Free tier limits**: Only $5 credits (~5 hours micro compute)
- **Learning curve**: Different deployment model
- **Vendor lock-in**: Code must be deployed to Trigger.dev

### Cost Projection for Real Estate Platform

**Assumptions**:
- 100 properties/day
- 5 minutes average processing time per property
- Micro compute tier

**Daily Usage**:
- 100 × 5 minutes = 500 minutes = 30,000 seconds
- Cost: 30,000 × $0.0000169 = **$0.51/day**

**Monthly Usage**:
- $0.51 × 30 = **$15.30/month**

**Free tier covers**: $5 / $0.51 = ~10 days

Would need **Hobby plan ($10/month)** which covers ~20 days, then **Pro plan ($50/month)**.

**Estimated Cost**: **$50-75/month** for sustained usage.

---

## 6. Vercel Cron Jobs - Built-in Scheduling

### Overview
Native Vercel feature for scheduled serverless/edge function invocations using CRON expressions.

### Limits by Plan

#### Hobby Plan (Free)
- **Max Cron Jobs**: 2 per account
- **Frequency**: Once per day only
- **Timing**: Within 1-hour window (e.g., 1:00-1:59 AM)
- **Reliability**: No guarantee of timely invocation
- **Per Project**: 20 cron jobs max (but account limited to 2)

#### Pro Plan ($20/month)
- **Max Cron Jobs**: 40 per account
- **Frequency**: Unlimited (any CRON expression)
- **Timing**: More precise
- **Per Project**: 20 cron jobs max

#### Enterprise Plan (Custom)
- **Max Cron Jobs**: 100 per account
- **Frequency**: Unlimited
- **Timing**: Most precise
- **Per Project**: 20 cron jobs max

### Configuration
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/scrape/mercadolibre",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cleanup",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

### Key Features
- **Native Integration**: Built into Vercel
- **No Extra Cost**: Included in all plans
- **CRON Syntax**: Standard cron expressions
- **Production Only**: Only runs on production deployments
- **No Preview Support**: Doesn't work with preview deployments
- **No Redirects**: Cron jobs don't follow 3xx redirects

### Serverless Compatibility
- **Perfect**: Native Vercel feature
- **Function Limits Apply**: Subject to same timeouts as functions
  - Hobby: 10 seconds
  - Pro: 60 seconds (300s with config)

### Best For Real Estate Scraping
1. **Daily/weekly scraping schedules** (if on Pro plan)
2. **Simple cleanup tasks**
3. **Trigger longer jobs** via QStash/Inngest

### Limitations
- **Hobby plan**: Only 2 jobs, once per day (not usable)
- **No retries**: Must implement your own retry logic
- **Timeout limits**: Subject to function execution limits
- **No queue**: Can't handle backlog
- **No visibility**: Limited observability
- **Production only**: Testing difficult

### Cost Projection for Real Estate Platform

**Hobby Plan**: Not viable (only 2 jobs, daily frequency)

**Pro Plan ($20/month)**:
- 10-20 scheduled jobs for different scrapers
- Invokes Vercel Functions (subject to function pricing)
- Need to trigger background jobs via QStash/Inngest

**Estimated Cost**: **$20/month** (Pro plan required)

**Recommendation**: Use QStash or Inngest instead for better features and free tier.

---

## 7. Vercel KV (Redis) - Vercel's Native Redis

### Overview
Vercel's managed Redis offering powered by Upstash, deeply integrated with Vercel platform.

### Free Tier (Hobby Plan)
- **Commands**: 30,000 per month
- **Storage**: 256MB
- **Max Request Size**: 1MB
- **Daily Limit**: 3,000 commands
- **Auto-Scaling**: No

### Pro Plan ($10/month)
- **Commands**: 2.5M per month
- **Storage**: 5GB
- **Max Request Size**: 10MB
- **Daily Limit**: 150,000 commands
- **Auto-Scaling**: Yes

### Comparison to Upstash Redis Direct

| Feature | Vercel KV | Upstash Redis Direct |
|---------|-----------|----------------------|
| Free Commands | 30K/month | 500K/month |
| Free Storage | 256MB | 256MB |
| Pro Pricing | $10/month | Pay-per-use |
| Integration | Native Vercel | Marketplace |
| Dashboard | Vercel Dashboard | Upstash Dashboard |

**Recommendation**: Use Upstash Redis directly for better free tier (500K vs 30K commands).

---

## 8. Alternative Solutions

### BullMQ + Redis
**Status**: Not recommended for Vercel

**Why**: BullMQ requires long-running worker processes that continuously poll Redis. Vercel's serverless functions are stateless and short-lived, making BullMQ incompatible.

**Issues**:
- Workers need persistent processes
- Can't deploy workers to Vercel
- Must deploy workers separately (Docker, Railway, etc.)

**Use Case**: Only if you have a separate worker server.

---

### Quirrel
**Status**: Deprecated

**History**: Serverless queue solution acquired by Netlify in 2022. Functionality integrated into Netlify and Vercel platforms. Open-source version maintained but no active development.

**Recommendation**: Use QStash or Inngest instead.

---

### Dispatched
**Status**: Third-party service

**Overview**: Lightweight queue service for serverless apps with HTTP API.

**Free Tier**: Unknown (not well documented)

**Recommendation**: Less mature than QStash/Inngest, limited documentation.

---

## 9. Recommended Architecture for Real Estate Scraping

### Optimal Stack
```
┌─────────────────────────────────────────────┐
│         Vercel Edge Functions               │
│  - API Routes                               │
│  - Rate Limiting (Upstash Redis)            │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│         Upstash Redis                       │
│  - Rate limiting (500K commands/month FREE) │
│  - Response caching                         │
│  - Session storage                          │
│  - Job metadata                             │
└─────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│         Upstash QStash                      │
│  - CRON scheduling (1K messages/day FREE)   │
│  - Job queue with retries                   │
│  - Delayed jobs                             │
│  - Fan-out tasks                            │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│         Inngest                             │
│  - Image processing (50K exec/month FREE)   │
│  - Multi-step workflows                     │
│  - Deduplication jobs                       │
│  - No timeout tasks                         │
└─────────────────────────────────────────────┘
```

### Use Case Mapping

#### 1. API Rate Limiting (MercadoLibre, ZonaProp)
**Solution**: Upstash Redis + @upstash/ratelimit

```typescript
// app/api/scrape/mercadolibre/route.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10s"),
});

export async function GET(request: Request) {
  const { success } = await ratelimit.limit("mercadolibre-api");

  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  // Make API call
  const data = await fetch("https://api.mercadolibre.com/...");
  return Response.json(data);
}
```

**Why**:
- 500K commands/month free (enough for rate limiting)
- Sub-millisecond latency
- Proven library with multiple algorithms

---

#### 2. Response Caching
**Solution**: Upstash Redis

```typescript
// lib/cache.ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function getCachedProperty(id: string) {
  const cached = await redis.get(`property:${id}`);
  if (cached) return cached;

  const property = await fetchFromDatabase(id);
  await redis.setex(`property:${id}`, 3600, property); // 1 hour
  return property;
}
```

**Why**:
- Reduce database queries
- Fast response times
- Global replication for low latency

---

#### 3. Scheduled Scraping (Daily/Hourly)
**Solution**: Upstash QStash

```typescript
// app/api/schedule/setup/route.ts
import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export async function POST() {
  // Schedule MercadoLibre scrape daily at 2 AM
  await qstash.publishJSON({
    url: "https://your-api.vercel.app/api/scrape/mercadolibre",
    schedule: "0 2 * * *",
    body: { source: "mercadolibre", region: "cordoba" }
  });

  // Schedule Properati sync twice daily
  await qstash.publishJSON({
    url: "https://your-api.vercel.app/api/scrape/properati",
    schedule: "0 2,14 * * *",
    body: { source: "properati" }
  });

  return Response.json({ success: true });
}
```

**Why**:
- More flexible than Vercel Cron (10 schedules vs 2 on Hobby)
- Built-in retries
- CRON expressions
- Free tier sufficient for 10 scrapers

---

#### 4. Image Processing Pipeline
**Solution**: Inngest

```typescript
// inngest/functions.ts
import { inngest } from "./client";
import sharp from "sharp";

export const processPropertyImages = inngest.createFunction(
  { id: "process-property-images" },
  { event: "property/images.process" },
  async ({ event, step }) => {
    const { propertyId, imageUrls } = event.data;

    // Step 1: Download images (retried on failure)
    const images = await step.run("download", async () => {
      return Promise.all(imageUrls.map(url => downloadImage(url)));
    });

    // Step 2: Convert to WebP
    const webpImages = await step.run("convert-webp", async () => {
      return Promise.all(images.map(async (img) => {
        return sharp(img).webp({ quality: 80 }).toBuffer();
      }));
    });

    // Step 3: Generate thumbnails (3 sizes)
    const thumbnails = await step.run("generate-thumbnails", async () => {
      return Promise.all(webpImages.map(async (img) => ({
        small: await sharp(img).resize(200, 150).toBuffer(),
        medium: await sharp(img).resize(400, 300).toBuffer(),
        large: await sharp(img).resize(800, 600).toBuffer(),
      })));
    });

    // Step 4: Upload to storage
    const uploadedUrls = await step.run("upload", async () => {
      return Promise.all(thumbnails.map(async (sizes, index) => ({
        original: await uploadToS3(webpImages[index], `${propertyId}-${index}.webp`),
        small: await uploadToS3(sizes.small, `${propertyId}-${index}-small.webp`),
        medium: await uploadToS3(sizes.medium, `${propertyId}-${index}-medium.webp`),
        large: await uploadToS3(sizes.large, `${propertyId}-${index}-large.webp`),
      })));
    });

    // Step 5: Update database
    await step.run("update-db", async () => {
      return await updatePropertyImages(propertyId, uploadedUrls);
    });

    return { propertyId, imagesProcessed: imageUrls.length };
  }
);
```

**Trigger from API**:
```typescript
// app/api/properties/route.ts
import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  const body = await request.json();

  // Save property to database
  const property = await saveProperty(body);

  // Trigger image processing in background
  await inngest.send({
    name: "property/images.process",
    data: {
      propertyId: property.id,
      imageUrls: body.images
    }
  });

  return Response.json({ success: true, propertyId: property.id });
}
```

**Why**:
- No timeout limits (can process 100s of images)
- Each step retried independently
- Free tier: 50K executions (enough for 100 properties/day with 10 images each)
- No infrastructure to manage

---

#### 5. Deduplication Jobs
**Solution**: Inngest

```typescript
// inngest/functions.ts
export const deduplicateProperties = inngest.createFunction(
  {
    id: "deduplicate-properties",
    concurrency: 1, // Run serially to avoid conflicts
  },
  { cron: "0 3 * * *" }, // Daily at 3 AM
  async ({ step }) => {
    let processedCount = 0;
    let page = 0;
    const batchSize = 100;

    while (true) {
      // Fetch batch of properties
      const properties = await step.run(`fetch-batch-${page}`, async () => {
        return await fetchPropertiesForDedup(page, batchSize);
      });

      if (properties.length === 0) break;

      // Find duplicates using PostGIS + fuzzy matching
      const duplicates = await step.run(`find-duplicates-${page}`, async () => {
        return await findDuplicates(properties);
      });

      // Merge duplicates
      await step.run(`merge-duplicates-${page}`, async () => {
        for (const group of duplicates) {
          await mergeDuplicateProperties(group);
        }
      });

      processedCount += properties.length;
      page++;

      // Sleep to avoid overloading database
      await step.sleep("rate-limit", "1s");
    }

    return { processedCount, pagesProcessed: page };
  }
);
```

**Why**:
- Can run for hours without timeout
- Checkpointing: If it fails at page 50, restarts from page 50
- Built-in rate limiting (concurrency: 1)
- Sleep between batches to avoid DB overload

---

#### 6. Rate-Limited Scraping Queue
**Solution**: QStash FIFO Queue

```typescript
// app/api/queue/enqueue/route.ts
import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export async function POST(request: Request) {
  const { urls } = await request.json();

  // Add to FIFO queue (processed one at a time)
  for (const url of urls) {
    await qstash.queue({
      queueName: "scraping-queue",
      url: "https://your-api.vercel.app/api/scrape/process",
      body: { url, source: "zonaprop" }
    });
  }

  return Response.json({ queued: urls.length });
}
```

```typescript
// app/api/scrape/process/route.ts
export async function POST(request: Request) {
  const { url, source } = await request.json();

  // Scrape with rate limiting
  const html = await fetch(url);
  const property = await parseProperty(html);

  // Save to database
  await saveProperty(property);

  // Add 2-second delay between requests (respect robots.txt)
  await new Promise(resolve => setTimeout(resolve, 2000));

  return Response.json({ success: true });
}
```

**Why**:
- FIFO guarantees: Properties processed in order
- Automatic rate limiting (one at a time)
- Built-in retries on failure
- Respects robots.txt delays

---

### Complete Integration Example

```typescript
// app/api/scrape/mercadolibre/route.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Client as QStashClient } from "@upstash/qstash";
import { inngest } from "@/inngest/client";

const redis = Redis.fromEnv();
const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN });
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10s"),
});

export async function GET(request: Request) {
  // 1. Rate limiting
  const { success } = await ratelimit.limit("mercadolibre-scraper");
  if (!success) {
    return new Response("Rate limited", { status: 429 });
  }

  // 2. Check cache
  const cacheKey = "ml:listings:cordoba";
  const cached = await redis.get(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  // 3. Fetch from API
  const response = await fetch(
    "https://api.mercadolibre.com/sites/MLA/search?state=TUxBUENPUmRvYmE"
  );
  const data = await response.json();

  // 4. Cache response
  await redis.setex(cacheKey, 3600, data); // 1 hour

  // 5. Queue each property for processing
  for (const item of data.results) {
    await qstash.publishJSON({
      url: "https://your-api.vercel.app/api/properties/process",
      body: {
        id: item.id,
        source: "mercadolibre",
        data: item
      }
    });
  }

  return Response.json({
    success: true,
    count: data.results.length
  });
}
```

```typescript
// app/api/properties/process/route.ts
export async function POST(request: Request) {
  const { id, source, data } = await request.json();

  // 1. Save to database
  const property = await saveProperty({
    externalId: id,
    source,
    title: data.title,
    price: data.price,
    location: data.location,
    // ...
  });

  // 2. Trigger image processing (Inngest)
  if (data.pictures && data.pictures.length > 0) {
    await inngest.send({
      name: "property/images.process",
      data: {
        propertyId: property.id,
        imageUrls: data.pictures.map(p => p.secure_url)
      }
    });
  }

  // 3. Trigger geocoding (Inngest)
  await inngest.send({
    name: "property/geocode",
    data: {
      propertyId: property.id,
      address: data.location.address_line
    }
  });

  return Response.json({ success: true, propertyId: property.id });
}
```

---

## 10. Cost Analysis & Comparison

### Free Tier Capacity

| Solution | Free Tier | Monthly Cost if Exceeded |
|----------|-----------|--------------------------|
| **Upstash Redis** | 500K commands | $0.20 per 100K |
| **Upstash QStash** | 30K messages | $1 per 100K |
| **Inngest** | 50K executions | $75 base + $50 per 1M |
| **Trigger.dev** | $5 credits (~5h compute) | $10-50/month |
| **Vercel Cron** | 2 jobs (Hobby), 40 (Pro) | $20/month (Pro plan) |

### Scenario: Real Estate Platform (Current Scale)

**Assumptions**:
- 100 properties scraped per day (3,000/month)
- 3 API sources (MercadoLibre, Properati, ZonaProp)
- Each property: 5 images, geocoding, deduplication
- Daily scheduled scrapes (3 sources)
- 10,000 API requests/day to scrapers

**Resource Usage**:

| Resource | Usage/Month | Cost |
|----------|-------------|------|
| **Rate limiting checks** | 300,000 (10K/day × 30) | $0 (within 500K free) |
| **Cache operations** | 150,000 | $0 (within 500K free) |
| **Scheduled scrapes** | 90 (3/day × 30) | $0 (within 30K free) |
| **Property processing** | 9,000 (300/day × 30) | $0 (within 30K free) |
| **Image processing** | 15,000 (500/day × 30) | $0 (within 50K free) |
| **Geocoding** | 3,000 | $0 (within 50K free) |
| **Deduplication** | 30 (1/day × 30) | $0 (within 50K free) |

**Total Monthly Cost**: **$0** (everything fits in free tiers)

---

### Scenario: Scaled Platform (1,000 properties/day)

**Resource Usage**:

| Resource | Usage/Month | Solution | Cost |
|----------|-------------|----------|------|
| **Rate limiting** | 3,000,000 | Upstash Redis | $10 (500K free + 2.5M × $0.20/100K) |
| **Cache operations** | 1,500,000 | Upstash Redis | Included above |
| **Scheduled scrapes** | 90 | QStash | $0 (within free) |
| **Property processing** | 90,000 | QStash | $0.60 (30K free + 60K × $1/100K) |
| **Image processing** | 150,000 | Inngest Pro | $75 (1M included) |
| **Geocoding** | 30,000 | Inngest Pro | Included |
| **Deduplication** | 30 | Inngest Pro | Included |

**Total Monthly Cost**: **~$86/month**

---

### Scenario: Enterprise Scale (10,000 properties/day)

**Resource Usage**:

| Resource | Usage/Month | Solution | Cost |
|----------|-------------|----------|------|
| **Rate limiting** | 30,000,000 | Upstash Redis | $59 (500K free + 29.5M × $0.20/100K) |
| **Cache operations** | 15,000,000 | Included above | $0 |
| **Scheduled scrapes** | 90 | QStash | $0 |
| **Property processing** | 900,000 | QStash | $8.70 (30K free + 870K × $1/100K) |
| **Image processing** | 1,500,000 | Inngest Pro | $100 ($75 + 0.5M × $50/1M) |
| **Geocoding** | 300,000 | Inngest Pro | Included |
| **Deduplication** | 30 | Inngest Pro | Included |

**Total Monthly Cost**: **~$168/month**

---

## 11. Decision Matrix

### By Use Case

| Use Case | Best Solution | Reasoning |
|----------|--------------|-----------|
| **API Rate Limiting** | Upstash Redis | Proven library, low latency, generous free tier |
| **Response Caching** | Upstash Redis | High performance, global replication, simple API |
| **CRON Scheduling** | Upstash QStash | More features than Vercel Cron, better free tier |
| **Message Queue** | Upstash QStash | Purpose-built, FIFO support, automatic retries |
| **Image Processing** | Inngest | No timeout limits, step functions, easy error handling |
| **Long-Running Jobs** | Inngest | Checkpointing, resume on failure, no timeout |
| **AI/ML Tasks** | Trigger.dev | Designed for AI workflows, no timeout, hosted compute |
| **Simple Schedules** | Vercel Cron (Pro) | Native integration if already on Pro plan |

### By Developer Experience

| Solution | Learning Curve | Documentation | Community | Tooling |
|----------|---------------|---------------|-----------|---------|
| **Upstash Redis** | Low | Excellent | Large | VS Code extension, CLI |
| **Upstash QStash** | Medium | Good | Medium | Dashboard, CLI |
| **Inngest** | Medium | Excellent | Growing | Dev server, VS Code, dashboard |
| **Trigger.dev** | Medium-High | Good | Small | Dev server, dashboard |
| **Vercel Cron** | Low | Good | Large | Vercel dashboard |

### By Serverless Fit

| Solution | Serverless Fit | Edge Compatible | Cold Start Impact |
|----------|---------------|-----------------|-------------------|
| **Upstash Redis** | Perfect | Yes | None (HTTP) |
| **Upstash QStash** | Perfect | Yes | None (HTTP) |
| **Inngest** | Perfect | Yes | Low (event-driven) |
| **Trigger.dev** | Good | No | Medium (webhook) |
| **Vercel Cron** | Perfect | Yes | Function cold start |

---

## 12. Final Recommendations

### For Your Real Estate Scraping Platform

**Phase 1: MVP (Current - 100 properties/day)**

```
Stack:
- Upstash Redis: Rate limiting + caching
- Upstash QStash: Scheduling + job queue
- Inngest: Image processing + deduplication

Cost: $0/month (everything in free tiers)
```

**Benefits**:
- Zero cost to start
- Production-ready
- Easy to scale
- Minimal infrastructure

**Implementation Priority**:
1. **Week 1**: Setup Upstash Redis for rate limiting
2. **Week 2**: Add QStash for scheduled scraping
3. **Week 3**: Implement Inngest for image processing
4. **Week 4**: Add deduplication jobs

---

**Phase 2: Growth (1,000 properties/day)**

```
Stack:
- Upstash Redis Pay-as-you-go: Rate limiting + caching
- Upstash QStash Pay-as-you-go: Scheduling + job queue
- Inngest Pro ($75/month): All background jobs

Cost: ~$86/month
```

**Scaling Actions**:
- Enable Upstash Redis auto-scaling
- Increase QStash message quota
- Upgrade to Inngest Pro for higher concurrency
- Add monitoring/alerting

---

**Phase 3: Scale (10,000+ properties/day)**

```
Stack:
- Upstash Redis Fixed Plan or AWS ElastiCache
- Upstash QStash Fixed 1M
- Inngest Pro with add-ons
- Separate worker servers for heavy tasks

Cost: ~$168-300/month
```

**Considerations**:
- Dedicated Redis instance for predictable costs
- Consider splitting hot/cold cache layers
- Evaluate Kafka/SQS for high-volume queuing
- Add CDN for image delivery (Cloudflare, CloudFront)

---

### Alternative Combinations

#### Minimalist Stack (Lowest Cost)
```
- Vercel Cron Pro: Scheduling
- Upstash Redis: Rate limiting + cache + queue metadata
- Manual image processing or offload to Cloudflare Images

Cost: $20/month (Vercel Pro)
```

**Pros**: Lowest cost
**Cons**: Limited features, must build retry logic, queue management

---

#### Maximum Features Stack
```
- Upstash Redis: Rate limiting + cache
- Inngest Pro: All background jobs + scheduling
- Trigger.dev Pro: Heavy AI/ML tasks

Cost: ~$125/month
```

**Pros**: Best DX, most features, no limitations
**Cons**: Higher cost, may be overkill for current scale

---

### Decision Tree

```
START: Do you need rate limiting?
│
├─ YES: Use Upstash Redis ✓
│
└─ Do you need scheduled jobs (CRON)?
   │
   ├─ YES: On Vercel Pro already?
   │   │
   │   ├─ YES: Use Vercel Cron (40 jobs included)
   │   │
   │   └─ NO: Use Upstash QStash (better free tier)
   │
   └─ Do you need background jobs (image processing, etc)?
      │
      ├─ YES: Jobs < 60 seconds?
      │   │
      │   ├─ YES: Use Vercel Functions + QStash
      │   │
      │   └─ NO: Use Inngest (no timeout)
      │
      └─ Do you need AI/ML workflows?
         │
         ├─ YES: Use Trigger.dev (AI-optimized)
         │
         └─ NO: Done!
```

---

## 13. Implementation Checklist

### Upstash Redis Setup
- [ ] Create Upstash account
- [ ] Create Redis database
- [ ] Install `@upstash/redis` and `@upstash/ratelimit`
- [ ] Add environment variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- [ ] Implement rate limiting on API routes
- [ ] Add caching layer for expensive queries
- [ ] Test with production load

### Upstash QStash Setup
- [ ] Create QStash topic
- [ ] Install `@upstash/qstash`
- [ ] Add environment variable (`QSTASH_TOKEN`)
- [ ] Create API endpoints for scheduled jobs
- [ ] Configure CRON schedules
- [ ] Implement job queues (FIFO if needed)
- [ ] Add signature verification
- [ ] Test scheduling and retries

### Inngest Setup
- [ ] Create Inngest account
- [ ] Install `inngest` package
- [ ] Add environment variables (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`)
- [ ] Create `inngest/` directory
- [ ] Define functions (image processing, deduplication, etc.)
- [ ] Create API route for Inngest webhook (`/api/inngest`)
- [ ] Test with `inngest dev`
- [ ] Deploy and verify in Inngest dashboard

### Monitoring Setup
- [ ] Add error tracking (Sentry, LogRocket)
- [ ] Setup alerting for failed jobs
- [ ] Monitor Redis memory usage
- [ ] Track QStash delivery rates
- [ ] Monitor Inngest function durations
- [ ] Create dashboard for key metrics

---

## 14. Common Pitfalls & Solutions

### Pitfall 1: Rate Limit Thrashing
**Problem**: Too many rate limit checks exhaust Redis quota

**Solution**:
- Use in-memory caching in `@upstash/ratelimit`
- Set appropriate TTLs
- Use coarser rate limits (per minute vs per second)

```typescript
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1m"), // 100 per minute vs 10 per 10s
  ephemeralCache: new Map(), // In-memory cache
});
```

---

### Pitfall 2: Large Message Payloads
**Problem**: QStash 1MB message limit exceeded

**Solution**:
- Store data in Redis/database, send only ID
- Use signed URLs for large files
- Split into multiple messages

```typescript
// Bad: Send entire property data
await qstash.publishJSON({
  url: "...",
  body: { property: largePropertyObject } // May exceed 1MB
});

// Good: Send only ID
await redis.setex(`job:${jobId}`, 3600, largePropertyObject);
await qstash.publishJSON({
  url: "...",
  body: { jobId } // Small payload
});
```

---

### Pitfall 3: Infinite Retry Loops
**Problem**: Failing job retries forever, consuming quota

**Solution**:
- Set max retries in QStash
- Implement dead letter queue
- Add exponential backoff

```typescript
await qstash.publishJSON({
  url: "...",
  body: { ... },
  retries: 3, // Max 3 retries
  callback: "https://api.vercel.app/api/job-failed" // DLQ
});
```

---

### Pitfall 4: Cold Start Delays
**Problem**: First request to Inngest function slow (cold start)

**Solution**:
- Keep functions "warm" with ping events
- Use smaller event payloads
- Optimize dependencies

```typescript
// Ping function every 5 minutes to keep warm
await qstash.publishJSON({
  url: "https://api.vercel.app/api/inngest",
  schedule: "*/5 * * * *",
  body: { name: "ping", data: {} }
});
```

---

### Pitfall 5: Exceeding Free Tier Silently
**Problem**: Unknowingly exceed free tier, incur costs

**Solution**:
- Set budget alerts in Upstash dashboard
- Monitor usage in Inngest dashboard
- Add usage tracking in code

```typescript
// Track Redis usage
const usage = await redis.info("stats");
console.log("Redis commands:", usage);

// Alert if approaching limit
if (usage.total_commands_processed > 450000) {
  await sendAlert("Approaching Redis limit");
}
```

---

## 15. Conclusion

### Best Stack for Real Estate Scraping (2025)

```
🎯 Recommended Solution:

1. Upstash Redis: Rate limiting + caching
   - Free tier: 500K commands/month
   - Cost: $0/month (free tier sufficient)

2. Upstash QStash: Scheduling + job queue
   - Free tier: 30K messages/month
   - Cost: $0/month initially, ~$1-10/month at scale

3. Inngest: Background jobs + workflows
   - Free tier: 50K executions/month
   - Cost: $0/month initially, $75/month at scale

Total Cost:
- Phase 1 (MVP): $0/month
- Phase 2 (Growth): ~$86/month
- Phase 3 (Scale): ~$168/month
```

### Why This Stack Wins

1. **Generous Free Tiers**: Can handle 100s of properties/day at zero cost
2. **Serverless Native**: Perfect fit for Vercel deployment
3. **No Vendor Lock-in**: Can migrate to alternatives if needed
4. **Battle-Tested**: Used by thousands of production apps
5. **Great DX**: Excellent documentation, tooling, and support
6. **Scales Smoothly**: Pay-as-you-go pricing, no cliff edges

### Next Steps

1. Start with Upstash Redis for rate limiting (Day 1 priority)
2. Add QStash for scheduled scraping (Week 1)
3. Implement Inngest for image processing (Week 2-3)
4. Monitor usage and optimize (Ongoing)
5. Scale up as traffic grows

### Resources

- **Upstash Redis**: https://upstash.com/docs/redis
- **Upstash QStash**: https://upstash.com/docs/qstash
- **Inngest**: https://www.inngest.com/docs
- **Vercel Marketplace**: https://vercel.com/marketplace
- **Rate Limiting Guide**: https://github.com/upstash/ratelimit-js

---

**Document Version**: 1.0
**Last Updated**: November 11, 2025
**Author**: AI Research Assistant
**Status**: Final
