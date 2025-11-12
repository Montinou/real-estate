# Monitoring, Analytics & Observability Solutions for Real Estate Platform

**Date:** November 11, 2025
**Last Verified:** November 11, 2025
**Platform:** Vercel-hosted real estate scraping platform
**Focus:** Free tier solutions for error tracking, performance monitoring, analytics, and observability

---

## Executive Summary

This document provides a comprehensive analysis of monitoring and observability solutions for a real estate platform that scrapes property data from MercadoLibre, Properati, and other sources. The platform is hosted on Vercel (Hobby plan) and requires monitoring for:

- Error tracking and logging
- API performance monitoring
- Scraper job monitoring and success rates
- Database query performance
- Uptime monitoring
- Future: User analytics when frontend is built

**Key Finding:** For Vercel Hobby plan users, **Log Drains are NOT available** (requires Pro plan). This significantly impacts monitoring options and requires application-level logging solutions.

### What's New in 2025

**Major Updates:**
- **Vercel Analytics:** Free tier increased to 50K events/month (20x from 2.5K)
- **Vercel Marketplace:** Sentry, Checkly, and Dash0 added as native integrations (April 2025)
- **Trace Drains:** New feature for exporting traces alongside logs (Pro/Enterprise only)
- **Highlight.io:** Acquired by LaunchDarkly (April 2025) - service remains operational with same pricing
- **Sentry Free Tier:** Reduced to 1 user (previously unlimited), added 50 session replays
- **Checkly:** Enhanced free tier - 1,500 browser checks (up from 1,000), 10-second minimum frequency
- **Vercel Drains Pricing:** Updated to $0.50/GB (down from $10/5GB)

**Key Takeaway:** Free tiers remain generous across the board, making comprehensive monitoring possible at zero cost for most scraping platforms.

---

## Monitoring Solutions Comparison

### 1. Vercel Native Analytics & Speed Insights

#### Vercel Analytics
**Type:** Web Analytics (Page views & Custom Events)

**Free Tier (Hobby Plan) - VERIFIED 2025:**
- **Events:** 50,000 events/month (20x increase from previous 2.5K limit)
- **Cost:** FREE for Hobby users
- **Retention:** Standard retention included
- **Limitation:** Events shared across ALL projects in account

**Features:**
- Automatic page view tracking
- Custom event tracking
- Real User Monitoring (RUM)
- Dashboard in Vercel UI
- Web Vitals tracking

**After Free Tier:**
- Collection paused after 3-day grace period
- Must wait 7 days to resume (updated from 30 days)
- No billing option on Hobby plan
- Hard stop prevents unexpected charges

**Integration Complexity:** ⭐ (Native, zero config)

**Best For:**
- Frontend page view analytics
- Basic user interaction tracking
- Free, no-config solution

**NOT Suitable For:**
- Backend API monitoring
- Scraper job tracking
- Error logging
- Server-side events

---

#### Vercel Speed Insights
**Type:** Performance Monitoring (Web Vitals)

**Free Tier (Hobby Plan) - VERIFIED 2025:**
- **Data Points:** 2,500 data points/month
- **Cost:** FREE for Hobby users
- **Features:** Real User Monitoring only
- **Metrics:** Core Web Vitals (LCP, FID, CLS, TTFB, INP)

**After Free Tier:**
- Collection pauses after 3-day grace period
- Must wait 30 days to resume
- No overage charges on Hobby plan

**Limitations:**
- Cannot test staging environments (RUM only)
- Tied to Vercel platform
- Requires package installation
- Hard cap at 2,500 data points

**Integration Complexity:** ⭐ (Add package, simple setup)

**Best For:**
- Frontend performance monitoring
- Real user experience tracking
- Core Web Vitals compliance

**NOT Suitable For:**
- API performance monitoring
- Scraper monitoring
- Backend observability

---

### 2. Error Tracking & APM Solutions

#### Sentry
**Type:** Error Tracking & Performance Monitoring

**Free Tier - VERIFIED 2025:**
- **Events:** 5,000 errors/month
- **Session Replays:** 50/month
- **Retention:** 90 days
- **Team Members:** 1 user only (changed from unlimited)
- **Projects:** Unlimited
- **Features:**
  - Error grouping & tracking
  - Stack traces with source maps
  - Release tracking
  - Basic performance monitoring
  - Integrations (Slack, Discord, etc.)
  - Limited session replay

**Vercel Integration:**
- Available in Vercel Marketplace
- Automatic source maps upload
- Unified billing option (for new users)
- No migration path for existing Sentry orgs

**Pricing After Free Tier:**
- Developer: $26/month (50K errors)
- Team: $80/month (100K errors)
- Business: Custom

**Integration Complexity:** ⭐⭐ (Requires SDK installation)

**Best For:**
- Frontend & backend error tracking
- Stack trace analysis
- Release monitoring
- Most popular solution

**Limitations:**
- 5K errors may be limiting for high-traffic scraping
- Performance monitoring basic on free tier
- No log management

**Recommendation:** ⭐⭐⭐⭐⭐ **HIGHLY RECOMMENDED**
- Industry standard for error tracking
- Generous free tier for initial development
- Excellent debugging tools
- Easy Vercel integration

---

#### Highlight.io
**Type:** Full-Stack Observability (Session Replay, Errors, Logs, Traces)

**Free Tier (FREE FOREVER) - VERIFIED 2025:**
- **Sessions:** 500/month
- **Errors:** 1,000/month
- **Logs:** 1,000,000/month
- **Traces:** 25,000,000/month
- **Team Members:** Up to 15 seats
- **Retention:** 3 months
- **Cost:** $0 forever

**Features:**
- Session replay (frontend)
- Error monitoring
- Log management
- Distributed tracing
- AI error grouping
- Open source

**Important Update - LaunchDarkly Acquisition (April 2025):**
- Acquired by LaunchDarkly in April 2025
- Service remains fully operational
- No changes to pricing or features
- Will remain open source
- Integration timeline: 6-12 months
- No LaunchDarkly account required to use Highlight

**Vercel Integration:**
- Direct integration available
- Automatic source maps via Vercel integration
- Sends build logs, function logs, static logs
- Available in Vercel Marketplace

**Pricing After Free Tier:**
- Pay-as-you-go: $50/month minimum
- Business: $800/month

**Integration Complexity:** ⭐⭐ (SDK + integration setup)

**Best For:**
- Full-stack visibility
- Generous log limits (1M logs!)
- Session replay for debugging
- Tracing support

**Limitations:**
- Only 500 sessions (but 1M logs compensates)
- Requires Vercel integration for function logs

**Recommendation:** ⭐⭐⭐⭐⭐ **EXCELLENT FOR SCRAPING PLATFORM**
- 1M logs/month covers scraper monitoring
- Trace support for complex workflows
- Open source option available
- Great for debugging scraping issues

---

#### New Relic
**Type:** Full Platform Observability (APM, Infrastructure, Logs, Synthetics)

**Free Tier (No Credit Card Required) - VERIFIED 2025:**
- **Data Ingest:** 100 GB/month (perpetually free)
- **Full Platform Users:** 1 (full access to all features)
- **Basic Users:** Unlimited (queries & dashboards only)
- **Retention:** Minimum 8 days
- **Synthetic Checks:** 500/month
- **Ping Monitors:** Unlimited

**Features:**
- Full APM with tracing
- Infrastructure monitoring
- Kubernetes monitoring
- Log management
- Browser & Mobile RUM
- Database performance monitoring
- 780+ integrations
- Default logs obfuscation (credit cards, SSN)

**What Happens After 100GB:**
- Email alert at 85% usage
- On-screen notification
- Must upgrade to continue data ingestion
- Data ingestion stops if limit exceeded

**Vercel Integration:**
- Available via OpenTelemetry
- Function logs & traces
- Pre-built dashboards

**Pricing After Free Tier:**
- Standard: $0.30/GB + $99/user/month
- Pro: $0.50/GB + $349/user/month
- Enterprise: Custom

**Integration Complexity:** ⭐⭐⭐ (OpenTelemetry setup required)

**Best For:**
- Enterprise-grade observability
- Comprehensive monitoring needs
- Large data volumes (100GB!)
- Professional projects

**Limitations:**
- Only 1 full user on free tier
- Complex setup for advanced features
- Overkill for small projects

**Recommendation:** ⭐⭐⭐⭐ **BEST FOR SCALING**
- Most generous data limit (100GB)
- Professional-grade features
- Good for growing platforms
- Unlimited ping monitors

---

### 3. Log Management Solutions

#### Axiom
**Type:** Log Management & Analytics

**Free Tier (Personal Plan - Forever Free) - VERIFIED 2025:**
- **Data Ingest:** 500 GB/month
- **Storage:** 25 GB
- **Retention:** 30 days maximum
- **Query Compute:** 10 GB-hours/month
- **Datasets:** 2 max
- **Users:** 1
- **Monitors:** 3
- **Features:**
  - Query, stream, monitor, dashboard
  - Email & Discord notifications
  - No credit card required

**IMPORTANT - Vercel Integration Changes (2024-2025):**
- **Log Drains require Vercel Pro plan** (as of May 2024)
- Vercel charges $0.50 per GB data transfer (updated pricing)
- Hobby plan users: Use `next-axiom` or `axiom-js` libraries instead

**Workaround for Hobby Plan:**
- Install `next-axiom` package
- Send logs from application code
- Bypasses Vercel Log Drains limitation
- Works perfectly on free Hobby plan

**Pricing After Free Tier:**
- Pro: Starting at $25/month
- 1,000 GB/month data ingest
- 100 GB storage
- 100 GB-hours/month query compute

**Integration Complexity:**
- ⭐⭐ (With Log Drains on Pro plan)
- ⭐⭐⭐ (Application-level integration on Hobby)

**Best For:**
- Heavy logging needs (500GB!)
- Real-time log streaming
- Long retention (30 days)
- Scraper monitoring

**Limitations:**
- Single user on free tier
- Only 2 datasets
- Requires Pro plan for Log Drains (or use library)

**Recommendation:** ⭐⭐⭐⭐⭐ **BEST LOG SOLUTION**
- Massive 500GB free allowance
- 30-day retention
- Perfect for scraper logging
- Use `next-axiom` to bypass Log Drains requirement

---

#### Better Stack (formerly Logtail)
**Type:** Log Management

**Free Tier - VERIFIED 2025:**
- **Data Ingest:** 3 GB/month
- **Retention:** 3 days only
- **Monitors & Heartbeats:** 10 included
- **Team Members:** Unlimited
- **Features:**
  - Schema-less storage
  - Real-time live tail
  - Drag & drop query builder
  - SQL query support
  - VRL log transformation
  - Log volume alerts

**Vercel Integration:**
- Vercel Marketplace integration (Better Stack Telemetry)
- Requires Vercel Pro for Log Drains
- Alternative: Use `@logtail/next` library on Hobby plan
- Setup takes under 5 minutes

**Pricing After Free Tier:**
- Nano: $25-30/month (30GB, 7-day retention)
- Additional ingestion: $0.45/GB
- Extended retention: $0.025/GB weekly (varies by region)

**Integration Complexity:**
- ⭐⭐ (With Log Drains)
- ⭐⭐⭐ (Application-level)

**Best For:**
- Simple logging needs
- Immediate troubleshooting
- Unlimited team access

**Limitations:**
- Only 3GB (very limited for scrapers)
- 3-day retention (inadequate)
- Not suitable for long-term analysis

**Recommendation:** ⭐⭐ **NOT RECOMMENDED FOR SCRAPERS**
- Too limited for scraping platform
- 3-day retention insufficient
- Axiom offers 166x more data (500GB vs 3GB)

---

### 4. Uptime & Synthetic Monitoring

#### Checkly
**Type:** API & Synthetic Monitoring (Playwright-based)

**Free Tier (Hobby Plan) - VERIFIED 2025:**
- **API Checks:** 10,000 runs/month
- **Browser Checks:** 1,500 runs/month (updated from 1,000)
- **Uptime Monitors:** 10
- **Locations:** 4 global
- **Frequency:** Minimum 10 seconds (updated from 2 minutes)
- **Team Members:** 1 (single user account)
- **Data Retention:** 30 days aggregated
- **Alerts:** Email, Slack, webhooks (no SMS/phone)

**Hard Cap:** When limits reached, checks STOP running

**Vercel Integration:**
- Vercel Marketplace launch partner (April 2025)
- Monitors deployments
- Preview & production checks
- Core Web Vitals on every build
- Automatic deployment monitoring

**Pricing After Free Tier:**
- Team: $40/month (50K API runs, 6K browser runs)
- Additional usage available

**Integration Complexity:** ⭐⭐ (Marketplace integration)

**Best For:**
- API endpoint monitoring
- Uptime checks
- Pre-deployment testing
- Playwright E2E tests

**Limitations:**
- Hard cap (checks stop when limit reached)
- Single user
- 2-minute minimum frequency

**Recommendation:** ⭐⭐⭐⭐ **GREAT FOR API MONITORING**
- 10K API checks covers most needs
- Vercel integration valuable
- Playwright-based (modern)
- Free tier adequate for scraper endpoints

---

### 5. Full-Stack Observability Platforms

#### Grafana Cloud
**Type:** Unified Observability (Metrics, Logs, Traces, Dashboards)

**Free Tier - VERIFIED 2025 ("The Actually Useful Free Plan"):**
- **Metrics:** 10,000 active series, 14-day retention (Prometheus)
- **Logs:** 50 GB/month, 14-day retention
- **Traces:** 50 GB/month, 14-day retention
- **Profiles:** 50 GB/month, 14-day retention
- **Users:** 3 active visualization users
- **IRM Users:** 3 active incident response users
- **k6 Testing:** 500 VUk/month, 14-day retention
- **Enterprise Data Sources:** 20+ plugins included
- **Pre-built Solutions:** 100+ available
- **Support:** Community only
- **No Credit Card Required**

**Vercel Integration:**
- Plugin available (public preview)
- Query Vercel API data
- One-click install on Cloud
- Visualize deployments, logs, etc.
- Requires Vercel Pro for Log Drains

**Pricing After Free Tier:**
- Pay-as-you-go (custom pricing)
- Pro: Monthly, on-demand
- Enterprise: Annual contracts

**Integration Complexity:** ⭐⭐⭐ (Requires OpenTelemetry setup)

**Best For:**
- Teams familiar with Grafana
- Custom dashboards
- Multiple data sources
- Professional environments

**Limitations:**
- Only 3 users
- Requires Vercel Pro for Log Drains
- Learning curve for Grafana

**Recommendation:** ⭐⭐⭐ **GOOD FOR TEAMS**
- Comprehensive free tier
- Industry-standard dashboards
- Better for teams (not solo devs)
- Complex setup for beginners

---

#### Dash0
**Type:** OpenTelemetry-Native Observability

**Free Tier:**
- **Pricing Model:** 100% consumption-based
- **No base fee** (previously $50/month)
- **Retention:** 30 days (vs Vercel's 3 days)
- **Features:**
  - Traces, logs, metrics
  - Custom dashboards
  - Alerting
  - Advanced filtering

**Vercel Integration:**
- Vercel Marketplace launch partner
- Automatic Log Drain setup
- Sets OpenTelemetry env variables
- Single sign-on
- Integrated billing

**Important:** No traditional "free tier" - pay only for usage

**Pricing:**
- Pay-as-you-go per GB ingested
- No minimum commitment
- Unified billing through Vercel

**Integration Complexity:** ⭐ (One-click Vercel Marketplace)

**Best For:**
- Pay-only-for-usage model
- Extended retention (30 days)
- OpenTelemetry standards
- Vercel-native integration

**Limitations:**
- Requires Vercel Pro plan (Log Drains)
- No free allowance (pure consumption)
- New platform (less mature)

**Recommendation:** ⭐⭐⭐ **CONSIDER WHEN SCALING**
- Good for variable workloads
- Fair pricing model
- Not free but no minimum
- Better on Vercel Pro

---

#### Datadog
**Type:** Enterprise Observability Platform

**Free Tier:**
- **NO FREE TIER** for APM
- Requires paid plans
- Trial available

**Vercel Integration:**
- Available but requires:
  - Vercel Pro/Enterprise (for Log Drains)
  - Paid Datadog plan
  - $0.50/GB for Vercel Drains

**Pricing:**
- APM: $31-40/host/month
- Infrastructure: $15/host/month
- Logs: $0.10/GB ingested

**Integration Complexity:** ⭐⭐⭐⭐ (Complex setup)

**Recommendation:** ❌ **NOT RECOMMENDED FOR HOBBY PROJECTS**
- No free tier
- Expensive for small projects
- Overkill for scraping platform

---

### 6. Product Analytics (Future Frontend)

#### PostHog
**Type:** Product Analytics, Session Replay, Feature Flags, A/B Testing

**Free Tier (90% of companies use free) - VERIFIED 2025:**
- **Product Analytics:** 1,000,000 events/month
- **Session Replay:** 5,000 recordings/month
- **Feature Flags:** 1,000,000 requests/month
- **A/B Testing:** Included
- **Surveys:** 1,500 responses/month
- **Error Tracking:** 100,000 exceptions/month
- **Retention:** 7 years
- **Team Members:** Unlimited
- **All Features Included:** No feature limitations
- **No Credit Card Required**

**Important Behavior:**
- Data ingestion **STOPS** when free tier limits are reached
- Must upgrade immediately to continue
- Can be problematic during unexpected traffic spikes
- No grace period

**Vercel Integration:**
- Excellent Next.js support
- React Server Components support
- Reverse proxy via Vercel rewrites
- Simple configuration

**Pricing After Free Tier:**
- Usage-based per product
- Product Analytics: $0.000031/event after 1M (drops to $0.000007 above 10M)
- Billing limits available to prevent surprises

**Integration Complexity:** ⭐⭐ (SDK + Next.js config)

**Best For:**
- Product analytics (not operational)
- User behavior tracking
- Feature flags
- A/B testing
- Session replay

**Limitations:**
- Not for operational monitoring
- Not for API/backend monitoring
- Frontend-focused

**Recommendation:** ⭐⭐⭐⭐⭐ **BEST FOR FUTURE FRONTEND**
- Incredibly generous free tier
- 1M events covers most startups
- Session replay included
- Feature flags included
- Save for when frontend is built

---

## Critical Vercel Hobby Plan Limitations

### Log Drains Restriction

**IMPORTANT:** As of May 2024, Vercel Drains (formerly Log Drains) are **ONLY available on Pro and Enterprise plans**.

**Update April 2025:** Vercel introduced "Trace Drains" alongside Log Drains, expanding observability data export capabilities. Major monitoring partners (Sentry, Checkly, Dash0) joined the Vercel Marketplace with native integrations.

**Impact:**
- Cannot use Log Drains with: Axiom, Better Stack, Datadog, New Relic, Dash0
- Vercel charges $0.50 per GB data transfer (updated pricing for Pro/Enterprise)
- Hobby plan: Logs retained for only 1 hour
- Trace Drains also require Pro/Enterprise plan

**Workarounds:**

1. **Application-Level Logging**
   - Install logging libraries directly in code
   - Send logs from your functions to external services
   - Examples: `next-axiom`, `@logtail/next`, `winston` + HTTP transport

2. **OpenTelemetry Manual Instrumentation**
   - Add OpenTelemetry SDK to your code
   - Export traces/logs directly to services
   - Bypasses Vercel Log Drains

3. **API-Based Logging**
   - Call external logging APIs from your code
   - More overhead but works on Hobby plan
   - Example: Axios to Axiom API, Sentry API

### Cron Jobs Limitation

**Vercel Cron Jobs:**
- Hobby plan: Only 2 cron jobs
- Pro plan: 40 cron jobs
- Enterprise: 100 cron jobs

**Free Alternatives:**
1. **GitHub Actions** (FREE, unlimited)
   - Scheduled workflows
   - Trigger Vercel endpoints via HTTP
   - 2,000 minutes/month free
   - Most flexible option

2. **Upstash QStash** (Pay-per-use, ~FREE for small scale)
   - HTTP-based cron scheduler
   - Reliable serverless cron
   - $1 per 100,000 requests
   - Built-in retries (3 on free tier)
   - Schedule dates up to 1 week ahead (free tier)
   - Perfect for Vercel serverless
   - No fixed monthly cost

3. **EasyCron** (FREE tier)
   - 300 executions/day
   - 3 recurring cron jobs
   - 60-second timeout
   - Basic but reliable

---

## Recommended Stack for Real Estate Scraping Platform

### Immediate Implementation (Vercel Hobby Plan)

#### Core Monitoring Stack:

1. **Error Tracking: Sentry** (FREE - 5K errors/month)
   - Frontend & backend errors
   - Scraper error monitoring
   - Stack traces with source maps
   - Slack/Discord alerts

   **Setup:**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. **Logs & Observability: Highlight.io** (FREE - 1M logs/month)
   - 1M logs covers all scraper logging
   - 25M traces for complex workflows
   - Vercel integration for function logs
   - Session replay (when frontend built)

   **Setup:**
   ```bash
   npm install --save @highlight-run/next
   # Enable Vercel integration in Highlight dashboard
   ```

3. **API Uptime: Checkly** (FREE - 10K API checks/month)
   - Monitor scraper endpoints
   - Check MercadoLibre API availability
   - Alert on failures
   - Vercel deployment checks

   **Setup:**
   - Install from Vercel Marketplace
   - Configure API checks

4. **Scraper Cron Jobs: GitHub Actions** (FREE - unlimited)
   - Schedule scraper runs
   - Trigger Vercel API endpoints
   - No 2-cron limit

   **Setup:**
   ```yaml
   # .github/workflows/scraper.yml
   on:
     schedule:
       - cron: '0 */6 * * *'  # Every 6 hours
   ```

#### Optional but Valuable:

5. **Vercel Analytics** (FREE - 50K events/month)
   - Track API endpoint usage
   - Custom scraper events
   - Zero config

   **Setup:**
   ```bash
   npm install @vercel/analytics
   ```

6. **Vercel Speed Insights** (FREE)
   - Frontend performance (future)
   - Web Vitals tracking

   **Setup:**
   ```bash
   npm install @vercel/speed-insights
   ```

---

### Future: When Upgrading to Vercel Pro

**If/when you upgrade to Pro ($20/month):**

1. **Enable Log Drains** to Axiom
   - Switch from application logging to Log Drains
   - Automatic log collection
   - Cleaner code (remove logging libraries)

2. **Add Dash0** for unified observability
   - Pay-per-use model
   - 30-day retention
   - Native Vercel integration

3. **Increase Cron Jobs** to 40
   - More granular scraper schedules
   - Region-specific cron jobs

---

### When Frontend is Built

**Add Product Analytics:**

1. **PostHog** (FREE - 1M events/month)
   - User behavior tracking
   - Feature flags for rollouts
   - A/B testing for UI
   - Session replay
   - Error tracking (frontend)

**Setup:**
```bash
npm install posthog-js
# Configure Next.js rewrites for reverse proxy
```

---

## Implementation Priority

### Phase 1: Essential Monitoring (Week 1)

**Priority: CRITICAL**

1. **Sentry** - Error tracking
   - Catch unhandled exceptions
   - Track scraper failures
   - Alert on critical errors

2. **Highlight.io** - Logging
   - Application-level logging
   - Structured logs for scrapers
   - Query/filter logs for debugging

3. **GitHub Actions** - Cron jobs
   - Replace/supplement Vercel cron (2 limit)
   - Schedule scraper runs
   - Trigger API endpoints

**Estimated Setup Time:** 4-6 hours

---

### Phase 2: Reliability Monitoring (Week 2)

**Priority: HIGH**

4. **Checkly** - API monitoring
   - Monitor scraper API endpoints
   - Check external API availability
   - Alert on downtime

5. **Vercel Analytics** - Usage tracking
   - Track API endpoint calls
   - Custom scraper events
   - Monitor traffic patterns

**Estimated Setup Time:** 2-3 hours

---

### Phase 3: Performance Optimization (Month 2)

**Priority: MEDIUM**

6. **Database Query Monitoring**
   - Add query logging to Highlight.io
   - Track slow queries
   - Optimize based on logs

7. **Custom Dashboards**
   - Grafana Cloud (optional)
   - Or use Highlight.io dashboards
   - Key metrics: scrape success rate, processing time, errors

**Estimated Setup Time:** 4-6 hours

---

### Phase 4: Frontend Analytics (When Built)

**Priority: FUTURE**

8. **PostHog** - Product analytics
   - User behavior tracking
   - Feature usage
   - Session replay
   - A/B testing

9. **Vercel Speed Insights** - Performance
   - Web Vitals
   - Real user monitoring
   - Performance budgets

**Estimated Setup Time:** 3-4 hours

---

## Cost Analysis

### Current Configuration (Hobby Plan)

| Service | Free Tier | Usage Estimate | Cost |
|---------|-----------|----------------|------|
| Vercel Hobby | 100GB bandwidth, 100GB-hours | Full usage | $0 |
| Sentry | 5K errors/month | ~2K estimated | $0 |
| Highlight.io | 1M logs, 25M traces | ~500K logs | $0 |
| Checkly | 10K API checks | ~5K checks | $0 |
| GitHub Actions | 2,000 minutes | ~200 minutes | $0 |
| Vercel Analytics | 50K events | ~20K events | $0 |
| **TOTAL** | | | **$0/month** |

**Zero Cost** for comprehensive monitoring on Hobby plan!

---

### If Scaling Beyond Free Tiers

| Service | Overage Cost | Threshold | Estimated Cost |
|---------|--------------|-----------|----------------|
| Vercel Pro | $20/month base | When need Log Drains | $20 |
| Sentry | $26/month | >5K errors | $26 |
| Highlight.io | $50/month min | >500 sessions | $50 |
| Checkly | $7/month | >10K checks | $7 |
| Axiom (via Log Drains) | $0 (free 500GB) | Pro plan required | $0 |
| **Worst Case Total** | | | **$103/month** |

**Most Likely:** Stay on free tiers for 6-12 months

---

## Scraper-Specific Monitoring Strategy

### Key Metrics to Track

#### Scraper Health
- **Success Rate:** % of successful scrapes per source
- **Error Rate:** Errors per 1000 requests
- **Response Time:** Average time per scrape
- **Data Quality:** % of complete records
- **Rate Limits:** Hits vs. limits per source

#### Infrastructure
- **Memory Usage:** Per serverless function
- **CPU Usage:** Processing time
- **Database Connections:** Pool usage
- **Queue Depth:** Pending jobs (if using BullMQ)
- **Storage:** Database size growth

#### Business Metrics
- **New Listings:** Per day/week
- **Updated Listings:** Changes detected
- **Coverage:** % of target areas scraped
- **Freshness:** Time since last scrape per region

---

### Logging Best Practices for Scrapers

```javascript
// Example: Structured logging with Highlight.io
import { H } from '@highlight-run/next';

async function scrapeMercadoLibre(region) {
  const startTime = Date.now();

  try {
    H.track('scraper_started', {
      source: 'mercadolibre',
      region: region,
      timestamp: new Date().toISOString()
    });

    const listings = await fetchListings(region);

    H.track('scraper_completed', {
      source: 'mercadolibre',
      region: region,
      listings_found: listings.length,
      duration_ms: Date.now() - startTime,
      success: true
    });

    return listings;

  } catch (error) {
    H.track('scraper_failed', {
      source: 'mercadolibre',
      region: region,
      error: error.message,
      duration_ms: Date.now() - startTime,
      success: false
    });

    // Also send to Sentry for error tracking
    Sentry.captureException(error, {
      tags: { source: 'mercadolibre', region },
      extra: { duration_ms: Date.now() - startTime }
    });

    throw error;
  }
}
```

---

### Alert Configuration Priorities

#### Critical Alerts (Immediate Action)

1. **Scraper Complete Failure**
   - All scrapers failing for 30+ minutes
   - Channel: SMS + Slack + Email

2. **Database Connection Failures**
   - Cannot connect to Supabase
   - Channel: SMS + Slack

3. **API Auth Failures**
   - MercadoLibre OAuth expired
   - Channel: Email + Slack

#### High Priority Alerts (1-hour response)

4. **Individual Scraper Failures**
   - Single source failing for 2+ hours
   - Channel: Slack + Email

5. **High Error Rate**
   - >10% error rate for 1 hour
   - Channel: Slack + Email

6. **Rate Limit Hits**
   - Approaching or hitting rate limits
   - Channel: Slack

#### Medium Priority Alerts (Daily review)

7. **Data Quality Issues**
   - >20% incomplete records
   - Channel: Email

8. **Performance Degradation**
   - Response times >5 seconds average
   - Channel: Email

9. **Low Coverage**
   - <80% of expected listings found
   - Channel: Email

---

## Alternative Monitoring Strategies

### Budget Option: Self-Hosted

If you want maximum control and zero external costs:

1. **Self-hosted Grafana + Loki + Prometheus**
   - Host on DigitalOcean ($6/month droplet)
   - Full control, unlimited logs
   - Requires maintenance

2. **Self-hosted Sentry**
   - Open source version
   - Unlimited events
   - Complex setup

**Cost:** $6-12/month (hosting only)
**Effort:** High (setup & maintenance)
**Recommendation:** ⭐⭐ Not worth the effort vs. free tiers

---

### Premium Option: Datadog

For enterprise needs or when budget allows:

- **Best-in-class observability**
- Expensive ($100-500/month easily)
- Only consider when:
  - Raised funding
  - Revenue >$10K/month
  - Team >5 people

**Recommendation:** ⭐⭐⭐⭐⭐ When you can afford it

---

## Conclusion & Final Recommendations

### The Optimal Free Stack

For a real estate scraping platform on Vercel Hobby plan:

1. **Sentry** - Error tracking (5K errors/month)
2. **Highlight.io** - Logs & traces (1M logs/month)
3. **Checkly** - API uptime monitoring (10K checks/month)
4. **GitHub Actions** - Cron scheduling (unlimited)
5. **Vercel Analytics** - Basic usage tracking (50K events/month)

**Total Cost:** $0/month
**Coverage:** Comprehensive monitoring for 6-12 months
**Effort:** ~8-10 hours setup

---

### When to Upgrade

**Upgrade to Vercel Pro ($20/month) when:**
- Need >2 cron jobs managed by Vercel
- Want automatic Log Drains (easier setup)
- Need faster function execution (Pro has better limits)

**Add paid monitoring when:**
- >5K errors/month (upgrade Sentry)
- >1M logs/month (unlikely for scrapers)
- Need 24/7 support

---

### Next Steps

1. **This Week:**
   - Install Sentry
   - Install Highlight.io
   - Set up basic error tracking

2. **Next Week:**
   - Configure Checkly for API monitoring
   - Migrate cron jobs to GitHub Actions
   - Add Vercel Analytics

3. **Month 2:**
   - Build custom dashboards in Highlight.io
   - Optimize based on performance data
   - Document runbooks for alerts

4. **Month 3:**
   - Evaluate if still within free tiers
   - Consider Pro upgrade if needed
   - Plan for frontend analytics (PostHog)

---

## Additional Resources

### Documentation Links

- **Vercel Analytics:** https://vercel.com/docs/analytics
- **Vercel Speed Insights:** https://vercel.com/docs/speed-insights
- **Sentry Vercel Integration:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Highlight.io Vercel:** https://www.highlight.io/docs/general/integrations/vercel-integration
- **Axiom next-axiom:** https://github.com/axiomhq/next-axiom
- **Checkly Vercel:** https://www.checklyhq.com/docs/integrations/vercel/
- **PostHog Next.js:** https://posthog.com/docs/libraries/next-js
- **New Relic Vercel:** https://docs.newrelic.com/docs/logs/forward-logs/vercel-integration/

### GitHub Actions Cron Examples

```yaml
# .github/workflows/scrape-mercadolibre.yml
name: Scrape MercadoLibre
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Scraper API
        run: |
          curl -X POST https://your-domain.vercel.app/api/scrape/mercadolibre \
            -H "Authorization: Bearer ${{ secrets.API_KEY }}" \
            -H "Content-Type: application/json"
```

### Monitoring Dashboard Example

Key metrics for your Highlight.io or Grafana dashboard:

```
┌─────────────────────────────────────────┐
│  Real Estate Scraper Dashboard          │
├─────────────────────────────────────────┤
│                                         │
│  Scraper Health (Last 24h)             │
│  ┌─────────────┬─────────┬──────────┐ │
│  │ Source      │ Success │ Listings │ │
│  ├─────────────┼─────────┼──────────┤ │
│  │ MercadoLibre│  98.5%  │  1,247   │ │
│  │ Properati   │  95.2%  │    843   │ │
│  │ Other       │  100%   │    156   │ │
│  └─────────────┴─────────┴──────────┘ │
│                                         │
│  Error Rate: 1.8% (Last hour)          │
│  [████████████████░░░░] 1.8%           │
│                                         │
│  Avg Response Time: 2.3s               │
│  [███████████████████░] Good           │
│                                         │
│  Active Alerts: 0 🟢                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Quick Comparison Table: Free Tier Limits 2025

| Service | Category | Key Free Limits | Best For | Vercel Hobby Compatible |
|---------|----------|----------------|----------|------------------------|
| **Vercel Analytics** | Web Analytics | 50K events/month | Page views, basic tracking | ✅ Native |
| **Vercel Speed Insights** | Performance | 2.5K data points/month | Web Vitals, RUM | ✅ Native |
| **Sentry** | Errors | 5K errors, 50 replays, 1 user | Error tracking | ✅ SDK |
| **Highlight.io** | Full Observability | 1M logs, 25M traces, 500 sessions | Scraper logging | ✅ SDK + Integration |
| **Axiom** | Logs | 500GB ingest, 30-day retention | Heavy logging needs | ✅ next-axiom library |
| **Better Stack** | Logs | 3GB, 3-day retention | Basic logging | ✅ @logtail/next library |
| **New Relic** | APM/Full Platform | 100GB ingest, 1 full user | Enterprise-grade monitoring | ✅ OpenTelemetry |
| **Grafana Cloud** | Observability | 50GB logs/traces, 10K metrics | Custom dashboards | ⚠️ Complex setup |
| **Checkly** | API/Uptime | 10K API checks, 1.5K browser | API monitoring | ✅ Marketplace |
| **PostHog** | Product Analytics | 1M events, 5K replays | Future frontend analytics | ✅ SDK |
| **Dash0** | Observability | Pay-per-use, no free tier | When scaling up | ❌ Requires Pro plan |
| **Datadog** | Enterprise APM | No free tier | Enterprise only | ❌ Expensive |

**Legend:**
- ✅ = Works on Hobby plan with noted method
- ⚠️ = Possible but complex
- ❌ = Not practical for Hobby plan

---

## Final Recommendation Summary

### For Immediate Implementation (Week 1):
1. **Sentry** - Error tracking (FREE: 5K errors/month)
2. **Highlight.io** - Logs & traces (FREE: 1M logs/month)
3. **GitHub Actions** - Cron scheduling (FREE: unlimited schedules)

### Add in Week 2:
4. **Checkly** - API uptime monitoring (FREE: 10K checks/month)
5. **Vercel Analytics** - Usage tracking (FREE: 50K events/month)

### Future Additions:
6. **PostHog** - Product analytics when frontend is built (FREE: 1M events/month)
7. **Axiom** - If you need more than 1M logs/month (FREE: 500GB/month)

### Total Monthly Cost: $0
### Estimated Setup Time: 8-12 hours
### Coverage: Comprehensive monitoring for 6-12 months of growth

---

**Document Version:** 2.0
**Last Updated:** November 11, 2025
**Last Verified:** November 11, 2025
**Author:** Research compiled for real-estate platform monitoring strategy
**Changes in v2.0:** Updated all free tier limits for 2025, added Highlight.io acquisition info, updated Vercel pricing, added 2025 marketplace integrations
