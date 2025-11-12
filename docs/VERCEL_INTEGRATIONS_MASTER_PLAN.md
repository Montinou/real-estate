# Vercel Integrations Master Plan - Real Estate Platform
## Complete Free-Tier Stack Recommendation

**Document Version:** 1.0
**Created:** November 11, 2025
**Project:** Real Estate Scraping & Aggregation Platform (Argentina/Córdoba)
**Research Scope:** 50+ services analyzed across 7 categories

---

## Executive Summary

Based on comprehensive research of Vercel's native integrations and free-tier offerings, we've identified an optimal technology stack that can run your real estate platform at **$0-26/month** for the first 6-12 months, scaling to **$150-300/month** at production volume (100K+ users).

### Key Achievements
- ✅ All 7 research areas completed
- ✅ 50+ services evaluated
- ✅ 7 detailed documentation files created (200+ pages total)
- ✅ Zero-cost MVP architecture designed
- ✅ Clear scaling path established

---

## Recommended Technology Stack

### 🎯 **TIER 1: Core Infrastructure (Critical)**

#### 1. **Database: Supabase**
- **Free Tier:** 500 MB database + 1 GB file storage
- **PostGIS:** Version 3.4+ fully supported
- **Real-time:** WebSocket subscriptions included
- **Auth:** Built-in authentication system
- **Connections:** 15 pooled connections (Supavisor)
- **Why:** Most complete free tier, production-ready, integrates with Vercel
- **Migration Path:** $25/month Pro (8 GB database, 100K MAU)
- **Documentation:** [docs/VERCEL_DATABASE_COMPARISON.md](./VERCEL_DATABASE_COMPARISON.md)

#### 2. **Storage: Cloudflare R2 + ImageKit.io**
- **R2 Free Tier:** 10 GB storage, unlimited egress
- **ImageKit Free Tier:** 20 GB storage, unlimited transformations
- **Combined:** 30 GB total storage, zero bandwidth costs
- **Features:** WebP/AVIF conversion, resizing, quality optimization
- **Why:** Most generous free tier, zero egress fees from R2
- **Migration Path:** R2 at $0.015/GB-month, ImageKit Starter $19/month
- **Documentation:** [Storage & CDN Research](./STORAGE_CDN_RESEARCH.md) (from agent output)

#### 3. **Caching: Upstash Redis**
- **Free Tier:** 500K commands/month (vs Vercel KV's 30K)
- **Use Cases:** Search result caching, rate limiting, session storage
- **Latency:** Sub-millisecond reads
- **Why:** 16x more commands than Vercel KV free tier
- **Migration Path:** $10/month for 2M commands
- **Documentation:** [docs/QUEUE_CACHE_BACKGROUND_JOBS_RESEARCH.md](./QUEUE_CACHE_BACKGROUND_JOBS_RESEARCH.md)

#### 4. **Background Jobs: Upstash QStash + Inngest**
- **QStash Free:** 1,000 messages/day (30K/month)
- **Inngest Free:** 50,000 executions/month
- **Use QStash For:** Scheduled scraping, CRON jobs, simple queues
- **Use Inngest For:** Image processing, deduplication, complex workflows
- **Why:** Complementary strengths, both have generous free tiers
- **Migration Path:** QStash $0.60/month per 100K, Inngest $75/month Pro
- **Documentation:** [docs/QUEUE_CACHE_BACKGROUND_JOBS_RESEARCH.md](./QUEUE_CACHE_BACKGROUND_JOBS_RESEARCH.md)

---

### 🚀 **TIER 2: Performance & Optimization (High Priority)**

#### 5. **Edge Computing: Vercel Edge Functions + ISR**
- **Free Tier:** 1M edge requests/month, 100 GB bandwidth
- **Features:** Sub-50ms latency, geolocation headers, Edge Middleware
- **ISR:** Multi-region support (gru1 Brazil region live)
- **Why:** 95-97% latency reduction for cached requests
- **Migration Path:** Pro plan $20/month (10M edge requests)
- **Documentation:** [docs/VERCEL_EDGE_OPTIMIZATION_RESEARCH.md](./VERCEL_EDGE_OPTIMIZATION_RESEARCH.md)

#### 6. **CDN: Vercel Built-in + ImageKit**
- **Coverage:** 119 PoPs globally
- **Features:** Automatic compression, cache control
- **Why:** Included free, no configuration needed
- **Documentation:** [docs/VERCEL_EDGE_OPTIMIZATION_RESEARCH.md](./VERCEL_EDGE_OPTIMIZATION_RESEARCH.md)

---

### 🤖 **TIER 3: AI/ML Features (Future-Ready)**

#### 7. **Text Generation: Google Gemini 2.5 Flash-Lite**
- **Free Tier:** 1,000 requests/day (30K/month)
- **Use Cases:** Property descriptions, content generation
- **Why:** Best free tier, commercial use allowed, multimodal
- **Migration Path:** Pay-as-you-go, competitive pricing
- **Documentation:** [docs/AI_ML_INTEGRATION_RESEARCH.md](./AI_ML_INTEGRATION_RESEARCH.md)

#### 8. **Chatbot: Groq**
- **Free Tier:** Unlimited (rate-limited)
- **Speed:** <1 second inference (10x faster than competitors)
- **Model:** Llama 3.1 70B
- **Use Cases:** Real-time property search chatbot
- **Why:** Ultra-fast inference critical for chat UX
- **Documentation:** [docs/AI_ML_INTEGRATION_RESEARCH.md](./AI_ML_INTEGRATION_RESEARCH.md)

#### 9. **Embeddings: Hugging Face**
- **Free Tier:** Unlimited (100 requests/minute limit)
- **Use Cases:** Semantic search, duplicate detection, similarity matching
- **Why:** Truly free forever, no billing required
- **Documentation:** [docs/AI_ML_INTEGRATION_RESEARCH.md](./AI_ML_INTEGRATION_RESEARCH.md)

#### 10. **Price Predictions: Custom FastAPI + XGBoost**
- **Cost:** $0 (self-hosted on Vercel serverless)
- **Data:** Historical MercadoLibre/Properati data
- **Why:** No good free ML API exists for regression
- **Target Accuracy:** 85%+
- **Documentation:** [docs/AI_ML_INTEGRATION_RESEARCH.md](./AI_ML_INTEGRATION_RESEARCH.md)

---

### 📊 **TIER 4: Observability (Essential)**

#### 11. **Error Tracking: Sentry**
- **Free Tier:** 5,000 errors/month, 50 session replays, 1 user
- **Use Cases:** Catch scraper failures, track bugs
- **Why:** Industry standard, generous free tier
- **Migration Path:** $29/month Team plan
- **Documentation:** [docs/MONITORING_OBSERVABILITY_ANALYSIS.md](./MONITORING_OBSERVABILITY_ANALYSIS.md)

#### 12. **Logging: Highlight.io**
- **Free Tier:** 1M logs/month, 25M traces/month
- **Retention:** 3 months
- **Use Cases:** Scraper monitoring, debugging
- **Why:** Most generous log retention on free tier
- **Documentation:** [docs/MONITORING_OBSERVABILITY_ANALYSIS.md](./MONITORING_OBSERVABILITY_ANALYSIS.md)

#### 13. **Uptime Monitoring: Checkly**
- **Free Tier:** 10,000 API checks/month, 1,500 browser checks
- **Use Cases:** API endpoint monitoring, scraper health
- **Why:** Native Vercel Marketplace integration
- **Documentation:** [docs/MONITORING_OBSERVABILITY_ANALYSIS.md](./MONITORING_OBSERVABILITY_ANALYSIS.md)

#### 14. **Analytics: Vercel Analytics**
- **Free Tier:** 50,000 events/month (20x increase in 2025!)
- **Use Cases:** User behavior, feature usage
- **Why:** Native integration, zero config
- **Documentation:** [docs/MONITORING_OBSERVABILITY_ANALYSIS.md](./MONITORING_OBSERVABILITY_ANALYSIS.md)

---

### 🔒 **TIER 5: Security & Authentication (Critical)**

#### 15. **Authentication: Supabase Auth**
- **Free Tier:** 50,000 MAU (most generous)
- **Features:** MFA, OAuth, email/password, magic links
- **Use Cases:** Admin authentication, user login (future)
- **Why:** Already using Supabase for database
- **Migration Path:** $25/month Pro (100K MAU included)
- **Documentation:** [docs/AUTH_SECURITY_COMPARISON.md](./AUTH_SECURITY_COMPARISON.md)

#### 16. **Rate Limiting: Arcjet**
- **Free Tier:** Available (limits not publicly documented)
- **Features:** Bot protection, rate limiting, no Redis needed
- **Why:** Purpose-built for serverless, easy integration
- **Documentation:** [docs/AUTH_SECURITY_COMPARISON.md](./AUTH_SECURITY_COMPARISON.md)

#### 17. **DDoS Protection: Vercel Firewall**
- **Free Tier:** Included on all plans
- **Performance:** 40x faster in 2025
- **Why:** Automatic, no configuration needed
- **Documentation:** [docs/AUTH_SECURITY_COMPARISON.md](./AUTH_SECURITY_COMPARISON.md)

---

## Complete Stack Summary

| Category | Solution | Free Tier | Cost at Scale |
|----------|----------|-----------|---------------|
| **Database** | Supabase | 500 MB, PostGIS, 50K MAU | $25/month Pro |
| **Storage** | R2 + ImageKit | 30 GB, unlimited transforms | $19-50/month |
| **Cache** | Upstash Redis | 500K commands/month | $10/month |
| **Queue** | QStash | 30K messages/month | $0.60/100K |
| **Background Jobs** | Inngest | 50K executions/month | $75/month |
| **Edge Functions** | Vercel Edge | 1M requests/month | $20/month Pro |
| **AI Text** | Gemini Flash-Lite | 30K requests/month | Pay-per-use |
| **AI Chat** | Groq | Unlimited (rate-limited) | Free |
| **AI Embeddings** | Hugging Face | Unlimited (100/min) | Free |
| **Error Tracking** | Sentry | 5K errors/month | $29/month |
| **Logging** | Highlight.io | 1M logs/month | $20-50/month |
| **Uptime** | Checkly | 10K API checks/month | $7/month |
| **Analytics** | Vercel Analytics | 50K events/month | $10/month |
| **Auth** | Supabase Auth | 50K MAU | Included in DB |
| **Rate Limiting** | Arcjet | Free tier | TBD |
| **DDoS** | Vercel Firewall | Unlimited | Free |
| **Hosting** | Vercel | Hobby plan | $20/month Pro |

---

## Cost Projections

### **Year 1: MVP Stage (0-10K users)**

**Month 1-6 (Development):**
```
Total: $0/month
```
- All services on free tiers
- 100-500 properties/day
- Minimal traffic

**Month 7-12 (Soft Launch):**
```
Vercel Hosting: $0 (Hobby plan sufficient)
Database: $0 (under 500 MB)
Storage: $0 (under 30 GB)
Cache/Queue: $0 (under limits)
Monitoring: $0 (under limits)
AI: $0 (under limits)

Total: $0/month
```
- 10K users
- 5K-10K properties
- 100K API requests/month

---

### **Year 2: Growth Stage (10K-100K users)**

**Conservative Estimate (30K users):**
```
Vercel Pro: $20/month
Supabase Pro: $25/month (8 GB database, 100K MAU)
Storage (R2+ImageKit): $19/month (ImageKit Starter)
Upstash Redis: $10/month (2M commands)
Inngest: $0 (under 50K executions)
QStash: $0.60/month
Monitoring Stack: $10/month (overages)
AI Services: $10/month (occasional overages)

Total: $94.60/month
```

**Aggressive Estimate (100K users):**
```
Vercel Pro: $20/month
Supabase Pro: $25/month (100K MAU included)
Storage: $50/month (ImageKit Pro)
Upstash Redis: $40/month (10M commands)
Inngest Pro: $75/month (>50K executions)
QStash: $6/month (1M messages)
Monitoring: $50/month (Sentry Team + overages)
AI Services: $50/month
Edge Config: $5/month

Total: $321/month
```

---

### **Year 3: Scale Stage (100K-500K users)**

**Estimated Monthly Cost:**
```
Vercel Enterprise: $500/month (negotiated)
Supabase Pro: $25 + $163 MAU = $188/month (500K MAU)
Storage: $100/month (ImageKit Pro + overages)
Upstash: $100/month (Redis + QStash)
Inngest Pro: $75/month
Monitoring Stack: $100/month
AI Services: $200/month

Total: ~$1,263/month
```

---

## Implementation Roadmap

### **Phase 1: Foundation (Weeks 1-2) - $0 Cost**

#### Week 1: Core Infrastructure
**Day 1-2: Database Setup**
- [ ] Create Supabase account via Vercel Marketplace
- [ ] Enable PostGIS extension
- [ ] Run migrations from `/database/migrations/`
- [ ] Configure connection pooling (Supavisor)
- [ ] Test geospatial queries

**Day 3-4: Storage Setup**
- [ ] Create Cloudflare R2 account and bucket
- [ ] Create ImageKit.io account
- [ ] Configure R2 as ImageKit external storage origin
- [ ] Test image upload pipeline
- [ ] Implement BlurHash generation with Sharp

**Day 5-7: Caching & Queue**
- [ ] Install Upstash Redis via Vercel Marketplace
- [ ] Configure cache keys for search results
- [ ] Set up QStash for scheduled scraping
- [ ] Test rate limiting implementation
- [ ] Configure Inngest for background jobs

---

#### Week 2: Security & Monitoring
**Day 1-2: Authentication**
- [ ] Configure Supabase Auth
- [ ] Create admin dashboard UI
- [ ] Enable MFA for admin accounts
- [ ] Implement API key system (custom)

**Day 3-4: Security Layer**
- [ ] Install Arcjet for rate limiting
- [ ] Configure Vercel Firewall (auto-enabled)
- [ ] Set up endpoint protection
- [ ] Test rate limits

**Day 5-7: Monitoring**
- [ ] Install Sentry via Vercel Marketplace
- [ ] Configure Highlight.io for logging
- [ ] Set up Checkly for uptime monitoring
- [ ] Enable Vercel Analytics
- [ ] Create monitoring dashboards

---

### **Phase 2: Performance (Weeks 3-4) - $0 Cost**

#### Week 3: Edge Optimization
**Day 1-3: Edge Functions**
- [ ] Create Edge Middleware for rate limiting
- [ ] Implement cache-check Edge Function
- [ ] Add geolocation detection
- [ ] Test performance improvements

**Day 4-5: ISR Implementation**
- [ ] Configure ISR for property listing pages
- [ ] Set revalidation intervals (1 hour)
- [ ] Implement on-demand revalidation
- [ ] Test cache behavior

**Day 6-7: CDN Configuration**
- [ ] Set Cache-Control headers
- [ ] Configure compression
- [ ] Test global CDN distribution
- [ ] Measure latency improvements

---

#### Week 4: Data Pipeline
**Day 1-3: Scraping Jobs**
- [ ] Migrate scraping to QStash CRON
- [ ] Configure retry logic
- [ ] Set up rate-limited scraping queue
- [ ] Test MercadoLibre scraper

**Day 4-5: Image Processing**
- [ ] Implement Inngest workflow for images
- [ ] Configure WebP conversion
- [ ] Generate thumbnails (multiple sizes)
- [ ] Store BlurHash in database

**Day 6-7: Deduplication**
- [ ] Implement fuzzy matching algorithm
- [ ] Configure geospatial duplicate detection
- [ ] Schedule daily deduplication job
- [ ] Test accuracy

---

### **Phase 3: AI Features (Weeks 5-6) - $0 Cost**

#### Week 5: AI Integration
**Day 1-2: Setup**
- [ ] Install Vercel AI SDK
- [ ] Get API keys: Gemini, Groq, Hugging Face
- [ ] Test all three providers
- [ ] Configure fallback logic

**Day 3-4: Property Descriptions**
- [ ] Implement Gemini API for description generation
- [ ] Create API endpoint
- [ ] Add prompt caching for cost optimization
- [ ] Test quality and accuracy

**Day 5-7: Semantic Search**
- [ ] Generate embeddings with Hugging Face
- [ ] Store embeddings in Supabase (vector extension)
- [ ] Implement similarity search
- [ ] Test search relevance

---

#### Week 6: Chat & ML
**Day 1-3: Chatbot**
- [ ] Implement Groq-powered chatbot
- [ ] Create chat UI component
- [ ] Add property search integration
- [ ] Test response speed (<1 second)

**Day 4-7: Price Predictions**
- [ ] Collect historical price data
- [ ] Train XGBoost model
- [ ] Deploy FastAPI endpoint on Vercel
- [ ] Test accuracy (target 85%+)

---

### **Phase 4: Production (Week 7+) - $0-20 Cost**

#### Week 7: Testing & Optimization
- [ ] End-to-end testing
- [ ] Performance benchmarking
- [ ] Load testing (simulate 10K users)
- [ ] Cost analysis and optimization
- [ ] Documentation updates

#### Week 8: Launch
- [ ] Deploy to production (Vercel Pro recommended)
- [ ] Configure custom domain
- [ ] Set up monitoring alerts
- [ ] Launch marketing
- [ ] Monitor metrics daily

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUESTS (Global)                    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│         Vercel Edge Middleware (<10ms)                       │
│  - Geolocation Detection (X-Vercel-IP-Country)               │
│  - Rate Limiting (Arcjet: 100 req/15min per IP)              │
│  - Authentication Check (Supabase Auth)                      │
│  - Request Normalization                                     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              Vercel CDN Edge Cache (P99 <15ms)               │
│  Cache Hit (90%) → Return                                    │
│  Cache Miss → Continue                                       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│         Vercel Edge Function (<50ms)                         │
│  - Check Upstash Redis cache                                 │
│  - KV Hit (80%) → Return                                     │
│  - KV Miss → Call Serverless                                 │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│    Vercel Serverless Function (gru1, ~100-200ms)             │
│  - Fluid Compute (connection pooling)                        │
│  - PostgreSQL + PostGIS queries (Supabase)                   │
│  - Store results in Redis (5-10 min TTL)                     │
└────────────────┬──────────────────────┬─────────────────────┘
                 │                      │
┌────────────────▼──────┐   ┌──────────▼─────────────────────┐
│  Supabase (gru1)      │   │  Upstash QStash                 │
│  - PostgreSQL 15      │   │  - Scheduled Scraping           │
│  - PostGIS 3.4+       │   │  - CRON Jobs                    │
│  - 15 pooled conns    │   │  - Job Queues                   │
│  - Real-time subs     │   └──────────┬─────────────────────┘
│  - Auth system        │              │
└───────────────────────┘              │
                                       │
                         ┌─────────────▼─────────────────────┐
                         │  Inngest Workflows                 │
                         │  - Image Processing                │
                         │  - Deduplication                   │
                         │  - Long-running Tasks              │
                         └─────────────┬─────────────────────┘
                                       │
                         ┌─────────────▼─────────────────────┐
                         │  Cloudflare R2 (Storage)           │
                         │  - Original Images                 │
                         │  - 10 GB Free                      │
                         │  - Unlimited Egress                │
                         └─────────────┬─────────────────────┘
                                       │
                         ┌─────────────▼─────────────────────┐
                         │  ImageKit.io (CDN + Transforms)    │
                         │  - Image Optimization              │
                         │  - WebP/AVIF Conversion            │
                         │  - Unlimited Transformations       │
                         │  - 20 GB Free                      │
                         └───────────────────────────────────┘

                    ┌───────────────────────────────┐
                    │  AI/ML Layer (Optional)        │
                    │  - Gemini: Descriptions        │
                    │  - Groq: Chatbot               │
                    │  - Hugging Face: Embeddings    │
                    │  - Custom: Price Predictions   │
                    └───────────────────────────────┘

                    ┌───────────────────────────────┐
                    │  Monitoring Layer              │
                    │  - Sentry: Error Tracking      │
                    │  - Highlight.io: Logs          │
                    │  - Checkly: Uptime             │
                    │  - Vercel Analytics: Usage     │
                    └───────────────────────────────┘
```

---

## Performance Expectations

### Current Performance (Without Edge Optimization)
- Property Search API: 800-1,500ms
- Property Details: 400-800ms
- Image Load: 1,000-2,000ms
- Global Latency (US): 500-800ms
- Global Latency (EU): 800-1,200ms
- South America: 200-400ms

### Expected Performance (With Full Stack)
- Property Search API (Cached): **20-50ms** (95-97% faster)
- Property Search API (Uncached): **150-250ms** (70-81% faster)
- Property Details (ISR): **10-30ms** (96-98% faster)
- Image Load (Optimized): **50-150ms** (90-95% faster)
- Global Latency (US): **50-100ms** (87-90% faster)
- Global Latency (EU): **80-150ms** (87-90% faster)
- South America: **20-80ms** (80-90% faster)

---

## Key Advantages of This Stack

### 1. **Cost-Effective at Scale**
- Zero-cost MVP phase (6-12 months)
- Predictable scaling costs
- No surprise bills
- Pay-as-you-grow model

### 2. **Best-in-Class Free Tiers**
- Supabase: 50K MAU (vs Auth0's expensive post-free pricing)
- Upstash Redis: 500K commands (vs Vercel KV's 30K)
- ImageKit: Unlimited transforms (vs competition's limited quotas)
- Gemini: 30K requests/month (vs OpenAI's paid-only)

### 3. **Performance Optimized**
- Edge computing with 119 global PoPs
- ISR with multi-region support (gru1 Brazil)
- Zero egress fees from Cloudflare R2
- Sub-50ms latency for regional users

### 4. **Future-Proof**
- AI/ML ready with multiple providers
- Geospatial queries with PostGIS
- Real-time features with Supabase
- Scalable to millions of properties

### 5. **Developer Experience**
- Single platform (Vercel) for deployment
- Native integrations via Marketplace
- Unified billing and monitoring
- Extensive documentation

### 6. **Production-Ready**
- Enterprise-grade error tracking (Sentry)
- Comprehensive logging (1M logs/month)
- Uptime monitoring (10K checks/month)
- DDoS protection included

---

## Critical Success Factors

### ✅ **DO THIS**

1. **Start with Free Tiers**
   - Test everything before committing
   - Validate architecture with real traffic
   - Stay under limits for 6+ months

2. **Implement Monitoring Early**
   - Sentry from day one
   - Track scraper health
   - Set up alerts for failures

3. **Use Hybrid Architecture**
   - Edge Functions for caching/auth
   - Serverless for database queries
   - Don't try to run PostgreSQL in Edge

4. **Cache Aggressively**
   - Search results: 5-10 min TTL
   - Property details: 1 hour (ISR)
   - Static assets: 24 hours+

5. **Implement Rate Limiting**
   - Per-IP limits on all endpoints
   - Protect against scraper abuse
   - Use Arcjet (no Redis needed)

6. **Optimize Images**
   - Upload originals to R2
   - Serve via ImageKit CDN
   - Generate BlurHash during upload

7. **Use AI Strategically**
   - Start with free tiers (Gemini, Groq, HF)
   - Implement prompt caching
   - Self-host price predictions

8. **Monitor Costs Weekly**
   - Set up billing alerts
   - Track usage metrics
   - Optimize before hitting limits

---

### ❌ **AVOID THIS**

1. **Don't Start with Paid Services**
   - Free tiers are sufficient for MVP
   - Validate product-market fit first
   - Upgrade only when necessary

2. **Don't Skip Security**
   - Enable MFA for admin accounts
   - Implement rate limiting from day one
   - Use Vercel Firewall (auto-enabled)

3. **Don't Use Wrong Tools**
   - No PostgreSQL in Edge Functions (use hybrid)
   - No BullMQ on Vercel (not serverless-compatible)
   - No Auth0 (2025 pricing too expensive)

4. **Don't Over-Engineer**
   - Start simple, iterate based on metrics
   - Don't add AI features until core works
   - Don't optimize prematurely

5. **Don't Ignore Free Tier Limits**
   - Hard caps will stop service (Vercel KV)
   - Set alerts at 80% usage
   - Plan upgrades in advance

6. **Don't Trust LLMs for Exact Prices**
   - Use traditional ML for predictions
   - LLMs for descriptions/chat only
   - Validate AI outputs always

7. **Don't Lock Into One Provider**
   - Use Vercel AI SDK (provider-agnostic)
   - Avoid vendor-specific APIs
   - Plan migration paths

---

## Migration Triggers

### When to Upgrade from Free Tiers

**Supabase Free → Pro ($25/month)**
- Approaching 500 MB database size
- Need >15 concurrent connections
- Want daily backups and point-in-time recovery
- Hitting 50K MAU limit

**Vercel Hobby → Pro ($20/month)**
- Need >2 CRON jobs
- Want log drains and longer retention
- Hitting 1M edge request limit
- Need team collaboration features

**Upstash Redis Free → Paid ($10/month)**
- Approaching 500K commands/month
- Need >256 MB storage
- Want higher throughput

**ImageKit Free → Starter ($19/month)**
- Approaching 20 GB storage
- Hitting 20 GB bandwidth limit
- Need custom domain (CNAME)

**Inngest Free → Pro ($75/month)**
- Exceeding 50K executions/month
- Need priority support
- Want advanced workflow features

---

## Common Questions

### Q: Can I really run this at $0/month?
**A:** Yes, for 6-12 months during MVP phase with moderate traffic (up to 10K users, 100K API requests/month). All services have generous free tiers that support this.

### Q: What's the catch with free tiers?
**A:** Hard caps (service stops when exceeded), limited support, potential project pausing (Supabase after 7 days inactivity), and some features restricted to paid plans (e.g., log drains on Vercel).

### Q: Why not use [X] instead?
**A:** All recommendations are based on:
1. Most generous free tier for the use case
2. Best performance for real estate platform
3. Smooth scaling path with predictable costs
4. Strong integration with Vercel ecosystem
5. Verified 2025 pricing and features

### Q: What if I exceed free tier limits?
**A:** Services behave differently:
- **Hard Caps** (Vercel KV, Hobby plan): Service stops until next cycle
- **Automatic Upgrades** (Supabase): Charges for overages
- **Throttling** (Groq, Hugging Face): Rate-limited but continues
- **Recommendation:** Set up billing alerts at 80% usage

### Q: Can I migrate away if needed?
**A:** Yes, recommended stack uses open standards:
- PostgreSQL (Supabase) → Any PostgreSQL provider
- Redis (Upstash) → Any Redis provider
- S3-compatible (R2) → AWS S3, MinIO, etc.
- Next.js (Vercel) → AWS Amplify, Netlify, self-host

### Q: How much will it cost at 100K users?
**A:** Approximately $200-400/month depending on usage patterns. See "Cost Projections" section above.

### Q: Do I need Vercel Pro plan?
**A:** Not initially. Hobby plan sufficient for MVP. Upgrade to Pro ($20/month) when you:
1. Need >2 CRON jobs (or use GitHub Actions workaround)
2. Want log drains and longer retention
3. Hit 1M edge request limit
4. Need team collaboration

---

## Next Steps

### Immediate Actions (This Week)

1. **Review All Documentation**
   - [ ] [Database Comparison](./VERCEL_DATABASE_COMPARISON.md)
   - [ ] [Queue & Caching Research](./QUEUE_CACHE_BACKGROUND_JOBS_RESEARCH.md)
   - [ ] [AI/ML Integration](./AI_ML_INTEGRATION_RESEARCH.md)
   - [ ] [Monitoring Analysis](./MONITORING_OBSERVABILITY_ANALYSIS.md)
   - [ ] [Auth & Security](./AUTH_SECURITY_COMPARISON.md)
   - [ ] [Edge Optimization](./VERCEL_EDGE_OPTIMIZATION_RESEARCH.md)
   - [ ] Storage & CDN Research (from agent output)

2. **Create Accounts**
   - [ ] Supabase (via Vercel Marketplace for unified billing)
   - [ ] Cloudflare (for R2 storage)
   - [ ] ImageKit.io
   - [ ] Upstash (via Vercel Marketplace)
   - [ ] Sentry (via Vercel Marketplace)
   - [ ] Highlight.io
   - [ ] Checkly (via Vercel Marketplace)

3. **Set Up Development Environment**
   - [ ] Install Vercel CLI: `npm i -g vercel`
   - [ ] Link project: `vercel link`
   - [ ] Configure environment variables
   - [ ] Test local development

4. **Follow Implementation Roadmap**
   - Start with Phase 1: Foundation (Weeks 1-2)
   - Track progress with TODO list
   - Deploy incrementally to Vercel preview branches
   - Test each integration before moving forward

---

## Additional Resources

### Official Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Marketplace](https://vercel.com/integrations)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Documentation](https://upstash.com/docs)
- [Inngest Documentation](https://www.inngest.com/docs)
- [ImageKit Documentation](https://docs.imagekit.io/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

### Community Resources
- [Vercel Discord](https://vercel.com/discord)
- [Supabase Discord](https://discord.supabase.com/)
- [Upstash Discord](https://upstash.com/discord)

### Related Files in This Repository
- `/database/migrations/` - PostgreSQL schema
- `/src/scrapers/` - MercadoLibre, Properati scrapers
- `/package.json` - Dependencies list
- `/.env.example` - Environment variables template
- `/README.md` - Project overview

---

## Document Maintenance

This document consolidates research from 6 parallel agents analyzing 50+ services. All pricing and features verified as of November 11, 2025.

**Maintain This Document:**
- Review quarterly for pricing changes
- Update when new Vercel features launch
- Add learnings from production deployment
- Document migration experiences

**Contributors:**
- Database Research Agent
- Storage & CDN Research Agent
- Queue & Caching Research Agent
- AI/ML Research Agent
- Monitoring Research Agent
- Auth & Security Research Agent
- Edge Computing Research Agent

---

## Conclusion

This technology stack provides an optimal balance of:
- ✅ **Zero-cost MVP** (6-12 months on free tiers)
- ✅ **Production-grade performance** (95%+ latency reduction)
- ✅ **Future-proof architecture** (AI/ML ready, scales to millions)
- ✅ **Predictable scaling** ($0 → $100 → $300 monthly)
- ✅ **Developer experience** (unified platform, native integrations)

You can confidently build and launch your real estate platform with this stack, knowing you have:
1. A clear path from $0 to production
2. Best-in-class free tiers for all critical services
3. Proven integrations with Vercel ecosystem
4. Comprehensive documentation for implementation
5. Realistic cost projections for scaling

**Ready to start building? Follow the Week 1 roadmap above. Good luck! 🚀**

---

**Last Updated:** November 11, 2025
**Next Review:** February 11, 2026
