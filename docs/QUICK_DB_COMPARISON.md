# Quick Database Comparison - Real Estate Platform

**Last Updated:** November 11, 2025

## TL;DR Recommendation

**Development (0-3 months):** Neon Free Tier  
**Production (3+ months):** Supabase Pro ($25/month)

---

## Side-by-Side Comparison

| Feature | **Neon (Free)** | **Supabase (Free)** | **PlanetScale** |
|---------|----------------|-------------------|----------------|
| **Free Tier?** | ✅ Yes | ✅ Yes | ❌ No ($39/min) |
| **Projects** | 20 | 2 | N/A |
| **Storage** | 0.5 GB/project | 500 MB/project | 10 GB |
| **Total Free Storage** | 10 GB | 1 GB | N/A |
| **Compute** | 100 CU-hours | Always on* | Always on |
| **File Storage** | ❌ No | ✅ 1 GB | ❌ No |
| **PostGIS Version** | ✅ 3.3+ | ✅ 3.4+ | ❓ Unknown |
| **Connection Pooling** | ✅ 10K (PgBouncer) | ✅ 15 (Supavisor) | ✅ Yes |
| **Scale-to-zero** | ✅ Yes | ⚠️ 7 days pause | N/A |
| **Branching** | ✅ 10/project | ⚠️ Manual | ✅ Yes |
| **Real-time** | ❌ Manual | ✅ Built-in | ❌ Manual |
| **Auth** | ❌ No | ✅ Built-in | ❌ No |

*Supabase pauses after 7 days of inactivity

---

## For 400K Properties

### Storage Requirements

| Component | Estimated Size |
|-----------|---------------|
| Property data (400K rows) | ~1.5-2 GB |
| Price history | ~0.3-0.5 GB |
| Deduplication tables | ~0.1-0.2 GB |
| Indexes (spatial + B-tree) | ~0.3-0.5 GB |
| **Total** | **~2-3 GB** |

**Verdict:**
- ❌ Neon Free: Too small (0.5 GB)
- ❌ Supabase Free: Too small (500 MB)
- ✅ **Need paid tier** for full dataset

---

## Cost Comparison (Production)

### Running 24/7 with 3 GB Database

| Provider | Plan | Monthly Cost | What's Included |
|----------|------|--------------|-----------------|
| **Neon** | Launch | ~$82 | Database only |
| **Supabase** | Pro | $25 | DB + Storage + Auth + Real-time |
| **PlanetScale** | Scaler | $39 | Database only |

**Winner:** Supabase Pro (best value)

---

## PostGIS Support Comparison

| Feature | Neon | Supabase | PlanetScale |
|---------|------|----------|-------------|
| **Spatial Types** | ✅ All | ✅ All | ❓ Unknown |
| **GIST Indexes** | ✅ Yes | ✅ Yes | ❓ Unknown |
| **Distance Queries** | ✅ Full | ✅ Full + <-> | ❓ Unknown |
| **pgrouting** | ✅ Yes | ✅ Yes | ❓ Unknown |
| **H3 PostGIS** | ✅ Yes | ❌ No | ❓ Unknown |
| **Tiger Geocoder** | ✅ Yes | ✅ Yes | ❓ Unknown |

**Verdict:** Both Neon and Supabase fully support PostGIS

---

## Performance Expectations

### With Proper Indexing (400K rows)

| Query Type | Expected Time |
|------------|---------------|
| Point-in-radius (2km) | < 10ms |
| Nearest 10 properties | < 15ms |
| Complex filters + geo | < 30ms |
| Bounding box | < 5ms |

**Both Neon and Supabase deliver excellent performance**

---

## Migration Complexity

| From → To | Difficulty | Time | Method |
|-----------|-----------|------|--------|
| Local → Neon | ⭐ Easy | 15-30 min | pg_dump/restore |
| Local → Supabase | ⭐⭐ Moderate | 30-60 min | pg_dump/restore |
| Neon → Supabase | ⭐ Easy | 30-60 min | pg_dump/restore |

**All use standard PostgreSQL tools**

---

## Connection Pooling Details

### Neon (PgBouncer)

```
Max Connections: 10,000
Pool Mode: Transaction
URL Format: host-pooler.region.neon.tech
Cost: Free (included)
```

### Supabase (Supavisor)

```
Max Connections: 15 (Free), 30+ (Pro)
Pool Mode: Transaction (6543) + Session (5432)
URL Format: pooler.supabase.com:6543
Cost: Free (included)
```

---

## Decision Matrix

### Choose Neon If:
- ✅ Need multiple dev/staging environments (20 projects)
- ✅ Want database branching for preview deployments
- ✅ Building pure backend API (no auth/storage needed)
- ✅ Intermittent usage (scale-to-zero saves money)
- ✅ Fastest setup (< 1 minute)

### Choose Supabase If:
- ✅ Need production database NOW
- ✅ Want real-time features (WebSocket updates)
- ✅ Need auth + storage + database in one
- ✅ Budget-conscious ($25 vs $82/month)
- ✅ Building user-facing application
- ✅ Want to avoid multiple migrations

### Avoid PlanetScale If:
- ❌ Need free tier
- ❌ PostGIS is critical (support unconfirmed)
- ❌ Budget under $39/month

---

## Recommended Timeline

### Month 0-1: Setup
- Install Neon from Vercel Marketplace
- Migrate local database (pg_dump/restore)
- Enable PostGIS extension
- Test with sample data

### Month 1-3: Development
- Build on Neon free tier
- Keep database under 0.5 GB
- Use scale-to-zero to save compute
- Monitor usage and costs

### Month 3-6: Pre-Launch
- Evaluate data size
- If > 500 MB, plan Supabase migration
- Test migration in staging
- Optimize queries

### Month 6+: Production
- Migrate to Supabase Pro ($25/month)
- Add CDN for images (Cloudflare)
- Implement caching (Upstash Redis)
- Monitor and scale

---

## Quick Commands

### Neon Setup
```bash
# 1. Install from Vercel Marketplace
# 2. Get connection string from dashboard
# 3. Migrate
pg_dump local_db | psql $NEON_URL
psql $NEON_URL -c "CREATE EXTENSION postgis;"
```

### Supabase Setup
```bash
# 1. Create project via Vercel integration
# 2. Export from Neon
pg_dump $NEON_URL > backup.sql
# 3. Import to Supabase (use session pooler port 5432)
psql $SUPABASE_URL backup.sql
# 4. Enable PostGIS in dashboard
```

---

## Final Verdict

**Best Path for Real Estate Platform:**

1. **Start:** Neon Free (development)
2. **Scale:** Supabase Pro (production)
3. **Complement:** Upstash Redis (caching)
4. **Avoid:** PlanetScale, Turso, MongoDB

**Total Cost:** $0 → $25 → $45-100/month  
**Time to Production:** 3-6 months  
**PostGIS Support:** ✅ Full on both Neon and Supabase

---

For detailed analysis, see: `/docs/VERCEL_DATABASE_COMPARISON.md`
