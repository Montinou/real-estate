# Authentication & Security Solutions for Real Estate Platform
## Comprehensive Comparison of Vercel-Integrated Solutions (2025)

Last Updated: 2025-11-11 (Refreshed with latest 2025 pricing and features)

---

## Executive Summary

This document compares authentication and security solutions that integrate with Vercel, focusing on **FREE TIER LIMITS** for a real estate scraping platform that needs:
- Admin authentication for scraper management
- API key management for external access
- Rate limiting and DDoS protection
- Future user authentication (saved searches, alerts)

### Quick Recommendations

| Use Case | Best Solution | Why |
|----------|---------------|-----|
| **Admin-Only (Current)** | **Supabase Auth** | Already using Supabase, 50K MAU free, complete auth solution |
| **Future User Scale** | **Clerk** | 10K MAU free, best DX, easy Vercel integration |
| **Enterprise SSO** | **WorkOS** | 1M MAU free, enterprise-focused |
| **Rate Limiting** | **Arcjet + Vercel Firewall** | Free bot protection + DDoS mitigation |

### Key Insights (2025 Updates)

**MAJOR PRICING CHANGES:**
- ⚠️ **Auth0 WARNING:** Pricing has dramatically increased in 2025. Now pure usage-based at $0.10-$1.00 per MAU (was ~$0.05-0.07). At 30K users, costs jump from $0 to $3,000-7,200/month. **NOT RECOMMENDED** for cost-conscious startups.
- ✅ **Supabase remains best value:** 50K MAU free (highest), then only $3.25 per 1K MAU on Pro tier. Most cost-effective for growth.
- ✅ **WorkOS surprise winner:** 1M MAU free for basic auth (unprecedented generosity), but SSO costs $49/connection.

**FREE TIER WINNERS:**
1. **WorkOS:** 1,000,000 MAU free (but basic auth only, SSO is paid)
2. **Supabase:** 50,000 MAU free (includes MFA, OAuth, real-time)
3. **Auth0:** 25,000 MAU free (but expensive after, no MFA/RBAC)
4. **Clerk:** 10,000 MAU free (excellent DX, pre-built UI)
5. **Descope:** 7,500 MAU free (includes MFA, but expensive tier jump)

**SECURITY HIGHLIGHTS:**
- ✅ **Vercel Firewall DDoS protection is FREE** on all plans (improved 40x faster in 2025)
- ✅ **Arcjet** offers free tier for rate limiting, bot protection, and security (no Redis needed)
- ✅ New AI security agents in Vercel Marketplace (CodeRabbit, Corridor, Sourcery) for advanced monitoring

**BEST FOR REAL ESTATE SCRAPING PLATFORM:**
- **Phase 1 (Admin):** Supabase Auth + Arcjet + Vercel Firewall = $0/month
- **Phase 2 (Users):** Stay on Supabase until 50K MAU = $0/month
- **Phase 3 (Scale):** Supabase Pro at 100K MAU = $25/month
- **Total Year 1 Cost:** $0 for most startups

---

## 1. CLERK - Modern Authentication Platform

### Overview
Clerk provides complete user management with pre-built UI components, optimized for modern web applications with excellent Next.js integration.

### Free Tier Limits (2025)
```
Monthly Active Users (MAU): 10,000
Monthly Active Orgs (MAO): 100 (2+ members, ≥1 active)
Dashboard Seats: 3 ($10/mo for additional)
```

### Features Included in Free Tier
**Authentication:**
- ✅ Up to 3 social OAuth providers (Google, GitHub, etc.)
- ✅ Email/password authentication
- ✅ Magic links (passwordless email)
- ✅ OTP (one-time passwords)
- ✅ Web3 wallet authentication
- ✅ Sign-in tokens
- ✅ Automatic account linking
- ❌ MFA (requires $100/mo Enhanced Auth add-on)

**Security:**
- ✅ Brute-force protection & account lockout
- ✅ ML-based bot protection
- ✅ Disposable email blocking
- ✅ Custom JWT templates
- ❌ User bans (Pro tier only)

**Organizations (Multi-tenancy):**
- ✅ Basic RBAC (role-based access)
- ✅ Invitation emails
- ✅ Up to 5 members per organization
- ❌ Advanced RBAC (requires $100/mo add-on)

**API & Webhooks:**
- ✅ Webhook data synchronization
- ✅ REST API access
- ❌ API rate limits not publicly documented

**Support:**
- ✅ Community Discord
- ❌ Email support (billing/registration issues only)

### Pricing After Free Tier
```
Pro Plan: $25/month base (after exhausting 10K MAU)

Usage Charges:
- Additional MAUs: $0.02 each
- Additional MAOs: $1.00 each

Add-ons ($100/month each):
- Enhanced Authentication (MFA, device tracking, Enterprise SSO)
- Enhanced Administration (user impersonation, audit logs)
- Enhanced Organizations (domain restrictions, custom roles)
```

### Integration with Next.js
```javascript
// Excellent - Official SDK
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}
```

### Vercel Integration
- ✅ Available in Vercel Marketplace
- ✅ Billing through Vercel (unified invoice)
- ✅ Auto-sync environment variables
- ✅ One-click setup

### Best Fit For
✅ **EXCELLENT** for your platform because:
- Generous 10K MAU free tier covers growth
- Pre-built UI components save development time
- Strong Next.js integration
- Admin dashboard included
- API keys can be managed through metadata

### Cost Example (12 months)
```
Month 1-6: 500 admins + 2,000 users = FREE
Month 7-12: 500 admins + 8,000 users = FREE
Year 2: 500 admins + 15,000 users = $25/mo + ($0.02 × 5,000) = $125/mo
```

---

## 2. SUPABASE AUTH - Open Source Authentication

### Overview
Part of the Supabase platform (PostgreSQL + Auth + Storage + Realtime). Since you're already considering Supabase for your database, this provides unified authentication.

### Free Tier Limits (2025)
```
Monthly Active Users (MAU): 50,000 (MOST GENEROUS!)
Third-Party MAU: 50,000 (OAuth providers)
Total Users: Unlimited
Projects: 2 active (paused after 7 days inactivity)
Audit Trail: 1 hour retention
Database Storage: 500MB
Bandwidth: 5GB
```

### Features Included in Free Tier
**Authentication:**
- ✅ Unlimited total users
- ✅ Social OAuth providers (Google, GitHub, etc.)
- ✅ Email/password authentication
- ✅ Magic links (passwordless)
- ✅ Phone authentication (SMS/WhatsApp)
- ✅ Anonymous sign-ins
- ✅ Basic Multi-Factor Authentication (TOTP)
- ✅ Custom SMTP server support
- ❌ Advanced MFA (phone-based, recovery codes)
- ❌ SSO/SAML 2.0 (Pro tier)

**Security:**
- ✅ Row Level Security (RLS) policies
- ✅ JWT-based authentication
- ✅ Automatic token refresh
- ❌ Leaked password protection (Pro tier)
- ❌ Single session per user (Pro tier)
- ❌ Session timeouts (Pro tier)
- ❌ Auth Hooks (Pro tier)

**Rate Limits:**
- ✅ Configurable per endpoint
- ✅ Built-in DDoS protection
- ⚠️ Limits vary by endpoint (see docs)

**API & Webhooks:**
- ✅ REST API
- ✅ Real-time subscriptions
- ✅ Database webhooks
- ✅ Auth webhooks (Pro tier)

**Support:**
- ✅ Community Discord
- ✅ GitHub issues
- ❌ Email support (Pro tier)

### Pricing After Free Tier
```
Pro Plan: $25/month includes:
- 100,000 MAU ($0.00325 per MAU beyond)
- 100,000 third-party MAU ($0.00325 per MAU beyond)
- 8GB database space
- 250GB bandwidth
- 7-day audit logs
- Email support (24hr SLA)
- Daily backups
- No project pausing

Add-ons (Pro tier):
- Advanced MFA (Phone): $75 for first project, $10 for additional
- SSO (SAML 2.0): 50 MAU included, $0.015 per MAU beyond

Team Plan: $599/month
- All Pro features
- 100,000 MAU included
- 28-day audit logs
- Priority support

Enterprise: Custom pricing
```

### Integration with Next.js
```javascript
// Good - Official SDK
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Component() {
  const supabase = createClientComponentClient()

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }
}
```

### Vercel Integration
- ✅ Available in Vercel Marketplace
- ✅ Billing through Vercel
- ✅ Auto-sync environment variables
- ✅ Zero-config deployment

### Best Fit For
✅ **HIGHLY RECOMMENDED** for your platform because:
- **50K MAU free tier is the most generous**
- Already integrated with your PostgreSQL database
- Row-level security for data isolation
- Real-time subscriptions for live updates
- Open-source (can self-host if needed)
- Unified platform (DB + Auth + Storage + Realtime)

### Cost Example (12 months)
```
Month 1-12: 500 admins + 30,000 users = FREE (under 50K MAU)
Year 2: 500 admins + 80,000 users = $25/mo (Pro tier needed)
```

### Important Consideration
⚠️ **Project Inactivity**: Free projects pause after 7 days of inactivity. For production, consider Pro tier ($25/mo) for no pausing.

---

## 3. AUTH0 by Okta - Enterprise Authentication

### Overview
Mature enterprise authentication platform with extensive features. Recently acquired by Okta, offering robust security and compliance.

### Free Tier Limits (2025)
```
Monthly Active Users (MAU):
- B2C: 25,000 external users (VERY GENEROUS)
- B2B: Included in B2C MAU count
Monthly API Calls: 1,000
Tenants: 1
Organizations: 5 maximum
Admin Roles: 3
Custom Domains: 1
```

### Features Included in Free Tier
**Authentication:**
- ✅ Password authentication
- ✅ Social OAuth (unlimited providers)
- ✅ Branded login forms
- ✅ Universal login
- ❌ MFA/Multi-Factor Authentication (paid only)
- ❌ Passwordless (paid only)

**Security:**
- ✅ Basic security protections
- ✅ Anomaly detection
- ❌ Breached password detection (paid)
- ❌ Bot detection (paid)
- ❌ RBAC (paid only)

**API & Webhooks:**
- ✅ REST API
- ✅ Management API
- ⚠️ Limited API calls (not clearly documented)

**Support:**
- ✅ Community forum
- ❌ Email/ticket support (paid)

### Pricing After Free Tier
```
B2C Essentials: Base 100K MAU
- MAU Pricing: $0.10 per MAU (volume discounts at 250K+, 500K+)
- API Calls: 1,000/month included
- Tenants: 3
- Organizations: 10
- Standard support

B2C Professional: Base 100K MAU
- MAU Pricing: $0.24 per MAU (tiered discounts up to 33%)
- API Calls: 5,000/month included
- Tenants: 6
- Organizations: 15
- Forms/Actions: 15
- MFA, breach detection included
- Email & ticket support

B2B Essentials: Base 100K MAU
- MAU Pricing: $0.30 per MAU (volume discounts up to 37%)
- Enterprise Connections: 3
- SCIM support
- Unlimited organizations

B2B Professional: Base 100K MAU
- MAU Pricing: $1.00 per MAU (volume discounts up to 76%)
- API Calls: $0.004 per call (5K-300K range)
- Enterprise Connections: 5 base + $100 per additional
- Advanced SSO features

Enterprise: Custom pricing
```

### Integration with Next.js
```javascript
// Good - Auth0 Next.js SDK
import { UserProvider } from '@auth0/nextjs-auth0/client'

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  )
}
```

### Vercel Integration
- ✅ Available in Vercel Marketplace
- ✅ Based on Auth0 Next.js SDK
- ⚠️ Only supports Next.js applications

### Best Fit For
❌ **NOT RECOMMENDED** for your platform:
- ✅ Generous 25K B2C MAU free tier
- ✅ Mature, enterprise-grade
- ❌ NO MFA on free tier (critical for admin access)
- ❌ NO RBAC on free tier
- ❌❌ VERY expensive after free tier (pure usage-based at $0.10-1.00 per MAU)
- ❌ Limited API calls (1,000/month)
- ❌ "Growth penalty" pricing model - costs can explode quickly

### Cost Example (12 months)
```
Month 1-12: Under 25K users = FREE
Year 2 (B2C Essentials): 30K users = (30,000 × $0.10) = $3,000/mo
Year 2 (B2C Professional): 30K users = (30,000 × $0.24) = $7,200/mo

⚠️ WARNING: Auth0 pricing has increased significantly in 2025
- No longer offers low base monthly fee
- Pure usage-based pricing makes it expensive at scale
```

---

## 4. NEXTAUTH.JS (Auth.js) - Open Source Solution

### Overview
NextAuth.js (now called Auth.js) is a completely open-source authentication library for Next.js and other frameworks. Self-hosted, no external service required.

### Free Tier Limits (2025)
```
Cost: FREE (open-source)
Users: UNLIMITED
Features: ALL INCLUDED
Restrictions: NONE
```

### Features Included
**Authentication:**
- ✅ 50+ OAuth providers (Google, GitHub, etc.)
- ✅ Email/password (with adapter)
- ✅ Magic links
- ✅ Credentials provider (custom)
- ✅ JWT or database sessions
- ✅ Account linking
- ✅ Role-based access control (DIY)

**Security:**
- ✅ CSRF protection
- ✅ Signed cookies
- ✅ JWT encryption
- ✅ Built-in security best practices
- ⚠️ MFA requires custom implementation

**Database Support:**
- ✅ PostgreSQL, MySQL, MongoDB, etc.
- ✅ Supabase adapter available
- ✅ Prisma ORM integration
- ✅ Custom adapters

**API & Webhooks:**
- ⚠️ Build your own webhook system
- ⚠️ No built-in admin UI

**Support:**
- ✅ GitHub Discussions
- ✅ Extensive documentation
- ✅ Active community

### Pricing After Free Tier
```
N/A - Completely free forever
Self-hosted infrastructure costs only
```

### Integration with Next.js
```javascript
// Excellent - Purpose-built for Next.js
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const { handlers, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
})
```

### Vercel Integration
- ✅ Perfect deployment on Vercel
- ✅ Auto-detects Vercel environment
- ✅ No marketplace integration needed
- ✅ Environment variables handled automatically

### Best Fit For
✅ **EXCELLENT** for your platform if:
- You want full control and ownership
- You have development resources
- You're comfortable with DIY approach
- You want zero vendor lock-in
- Budget is extremely tight

❌ **NOT IDEAL** if:
- You want pre-built admin UI
- You need out-of-box MFA
- Limited development time
- Need enterprise support

### Cost Example (12 months)
```
All months: $0 (only infrastructure costs)
```

### Implementation Complexity
```
Time Investment:
- Basic setup: 2-4 hours
- Custom UI: 8-16 hours
- MFA implementation: 8-24 hours
- Admin dashboard: 16-40 hours
```

---

## 5. DESCOPE - Authentication & User Management

### Overview
No-code/low-code authentication platform focused on developer experience with visual workflow builder for complex auth flows.

### Free Tier Limits (2025)
```
Monthly Active Users (MAU): 7,500
Tenants: 10
SSO Connections: 3
Federated Apps (OIDC): 1
Test Users: 5
M2M Access Keys: 1,000
SMS/Voice Deliveries: 100/month
```

### Features Included in Free Tier
**Authentication:**
- ✅ All authentication methods:
  - Biometrics (Face ID, Touch ID)
  - Passkeys (WebAuthn)
  - Email magic links
  - OTP (SMS, email, WhatsApp)
  - Social login (all providers)
  - Authenticator apps (TOTP)
- ✅ MFA / step-up authentication
- ✅ Web3 wallet authentication
- ❌ Google One Tap (Pro tier)

**Security:**
- ✅ Role-based access control (RBAC)
- ✅ Secure session management
- ✅ 99% SLA
- ❌ Bot protection (Growth tier)
- ❌ SCIM provisioning (Growth tier)

**Organizations:**
- ✅ Multi-tenancy support
- ✅ Self-service admin widgets
- ✅ Third-party connectors

**API & Webhooks:**
- ✅ REST API
- ✅ SDKs for all major frameworks
- ✅ Descope Flows (visual workflow editor)

**Consent & Privacy:**
- 2,000 monthly active consents
- 2,000 monthly active tokens

**Support:**
- ✅ Community support
- ❌ Web/Slack support (Pro tier)

### Pricing After Free Tier
```
Pro Plan: $249/month (billed annually)
- 10,000 MAUs
- 35 tenants
- 5 SSO connections
- Custom domains
- 99.99% SLA
- Web & Slack support

Growth Plan: $799/month (billed annually)
- 25,000 MAUs
- 100 tenants
- 10 SSO connections
- Bot protection
- Fine-grained authorization
- Multi-region support

Enterprise: Custom pricing
- Unlimited features
- Dedicated support
```

### Integration with Next.js
```javascript
// Good - Official SDK
import { Descope } from '@descope/nextjs-sdk'

export default function Login() {
  return (
    <Descope
      flowId="sign-up-or-in"
      onSuccess={(e) => console.log(e.detail.user)}
    />
  )
}
```

### Vercel Integration
- ✅ Available in Vercel Marketplace
- ✅ Can integrate with any Next.js app
- ⚠️ Separate billing (not through Vercel)

### Best Fit For
⚠️ **MODERATE FIT** for your platform:
- ✅ MFA included in free tier
- ✅ Visual workflow builder (no-code)
- ✅ Generous auth method variety
- ❌ Only 7,500 MAU (less than Clerk's 10K)
- ❌ Expensive after free tier ($249/mo vs $25/mo)
- ❌ Overkill for simple admin authentication

### Cost Example (12 months)
```
Month 1-8: Under 7,500 users = FREE
Month 9-12: 8,000 users = $249/mo (must upgrade)
Year 2: 15,000 users = $249/mo
```

---

## 6. WORKOS - Enterprise-Ready Authentication

### Overview
Enterprise-focused authentication platform designed for B2B SaaS. Specializes in SSO, Directory Sync, and organizational features.

### Free Tier Limits (2025)
```
User Management & Auth: 1,000,000 MAU FREE (!!!)
SSO Connections: Pay per connection
Directory Sync: Pay per connection
```

### Features Included in Free Tier
**Authentication (AuthKit):**
- ✅ User Management: 1M MAU FREE
- ✅ Email/password authentication
- ✅ Social OAuth providers
- ✅ Magic links
- ✅ MFA (multi-factor authentication)
- ✅ Session management
- ✅ Beautiful pre-built UI (used by Vercel, Linear, Supabase)

**Organizations:**
- ✅ Multi-tenancy support
- ✅ Organization switching
- ✅ Member management

**API & Webhooks:**
- ✅ REST API
- ✅ Webhooks
- ✅ Admin Portal (user management UI)

**Support:**
- ✅ Community support
- ✅ Documentation
- ⚠️ Email support (paid tiers)

### Pricing After Free Tier
```
SSO (Enterprise SSO): $49/month per connection
- SAML 2.0
- OpenID Connect
- Google Workspace
- Microsoft Azure AD
- Okta

Directory Sync: $49/month per connection
- SCIM 2.0 provisioning
- Automatic user sync

User Management Scaling:
- First 1M MAU: FREE
- Each additional 1M MAU: $2,500/month

Custom Domains: $99/month
```

### Integration with Next.js
```javascript
// Good - Official SDK
import { WorkOS } from '@workos-inc/node'

const workos = new WorkOS(process.env.WORKOS_API_KEY)

// AuthKit integration
import { authkitMiddleware } from '@workos-inc/authkit-nextjs'

export default authkitMiddleware()
```

### Vercel Integration
- ✅ Available in Vercel Marketplace
- ✅ Seamless Vercel auth integration
- ✅ Used by Vercel themselves (proven at scale)

### Best Fit For
⚠️ **EXCELLENT FOR ENTERPRISE** but:
- ✅✅✅ 1M MAU FREE is unmatched
- ✅ Perfect for B2B SaaS with enterprise customers
- ✅ Best-in-class SSO implementation
- ❌ Overkill for simple admin authentication
- ❌ SSO costs $49/connection (expensive if needed)
- ⚠️ Better for user-facing products, not internal admin tools

### Cost Example (12 months)
```
Basic auth (under 1M users): FREE forever
+ 3 enterprise SSO customers: $49 × 3 = $147/mo
+ Custom domain: $99/mo
Total: $246/mo
```

---

## 7. VERCEL FIREWALL & DDOS PROTECTION

### Overview
Vercel's native security layer providing DDoS mitigation, bot protection, and Web Application Firewall capabilities. **Automatically included** with all Vercel plans.

### Free Tier (Hobby Plan) Features
```
✅ Automatic DDoS Mitigation: ALL PLANS (FREE)
✅ Layer 3 & 4 Protection: Network-wide
✅ Real-time Attack Detection: P50 = 2.5s, P99 = 3.5s
✅ Platform-wide Firewall: Zero configuration
```

**DDoS Protection Capabilities:**
- ✅ TCP flood protection
- ✅ SYN flood protection
- ✅ Large-scale attack mitigation
- ✅ Automatic traffic filtering
- ✅ No action required from users

**Performance (2025 Improvements):**
- Mitigation speed: 40x faster than before
- Time to mitigation: As fast as 0.5 seconds
- P99 response: 3.5 seconds
- P50 response: 2.5 seconds

### Paid Tier Features (Pro/Enterprise)
```
Web Application Firewall (WAF): Available on all paid plans
- Custom security rules
- IP blocking/allowlisting
- Managed rulesets
- Attack Challenge Mode
- Geographic filtering
- Advanced bot detection
```

**Access Control:**
- Member, viewer, developer, and admin roles can configure WAF
- Custom protection strategies
- Real-time rule updates

### Pricing
```
Hobby (Free): DDoS protection included
Pro ($20/user/month): DDoS + WAF access
Enterprise (Custom): Advanced WAF features
```

### Integration
- ✅ Automatic - no code changes needed
- ✅ Zero configuration for DDoS protection
- ✅ Dashboard control for WAF (paid plans)

### Best Fit For
✅ **ESSENTIAL** for your platform:
- ✅ FREE DDoS protection on all plans
- ✅ Automatic protection (no setup)
- ✅ Protects API endpoints automatically
- ✅ Essential for scrapers (prevent abuse)
- ⚠️ WAF requires Pro plan ($20/mo) for custom rules

---

## 8. ARCJET - Application Security Layer

### Overview
Developer-first security layer providing rate limiting, bot protection, email validation, and attack prevention. Integrates directly into your code with simple SDK.

### Free Tier Limits (2025)
```
✅ Rate limiting: Available on all plans
✅ Bot protection: Available on all plans
✅ Email validation: Available on all plans
✅ Attack protection: Available on all plans
⚠️ Specific request limits: Not publicly documented
```

**Features:**
- ✅ No infrastructure required (no Redis needed!)
- ✅ State management handled by Arcjet
- ✅ Local AI security model (announced 2025)
- ✅ Three rate limit algorithms:
  - Fixed window
  - Sliding window
  - Token bucket

**Performance:**
- API call overhead: 10-20ms per request
- Real-time decision making
- Local execution (Wasm-powered)
- Local AI security model (2025 feature)

**Funding & Adoption:**
- Series A funded (2025)
- 1,000+ developers
- 500+ production applications
- Open-source core

### Features Included
**Rate Limiting:**
```javascript
// Example: Free tier client quotas
import arcjet, { tokenBucket } from "@arcjet/next"

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    tokenBucket({
      mode: "LIVE",
      characteristics: ["userId"],
      refillRate: 10, // tokens per interval
      interval: 60, // seconds
      capacity: 100, // max tokens
    }),
  ],
})
```

**Bot Protection:**
- ✅ ML-based detection
- ✅ Real-time blocking
- ✅ Custom rules

**Email Validation:**
- ✅ Disposable email detection
- ✅ Free email provider detection
- ✅ Invalid format detection

**Attack Protection:**
- ✅ AI scraper blocking
- ✅ Malicious bot detection
- ✅ Suspicious pattern recognition

### Pricing
```
Free Plan: Available (limits not clearly documented)
Usage: May be usage-based pricing
Enterprise: Custom pricing

⚠️ Specific pricing tiers not publicly available on website
Recommendation: Sign up for free account to see limits
```

### Integration with Next.js
```javascript
// Excellent - Code-first approach
import arcjet, { shield } from "@arcjet/next"

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: "LIVE",
    }),
  ],
})

export async function POST(req: Request) {
  const decision = await aj.protect(req)

  if (decision.isDenied()) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  // Continue with request...
}
```

### Vercel Integration
- ✅ Available in Vercel Marketplace
- ✅ Works with Edge Functions
- ✅ Compatible with all frameworks (Next.js, SvelteKit, etc.)
- ✅ Templates available

### Best Fit For
✅ **EXCELLENT** for your platform:
- ✅ Rate limiting without Redis (cost saving!)
- ✅ Protect scraper endpoints from abuse
- ✅ Bot detection for API security
- ✅ Fast performance (10-20ms overhead)
- ✅ Code-as-infrastructure approach
- ⚠️ Free tier limits unclear (test before committing)

### Usage Example for Real Estate Platform
```javascript
// Protect scraper API endpoints
import arcjet, { tokenBucket, detectBot } from "@arcjet/next"

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    // Rate limit API calls
    tokenBucket({
      mode: "LIVE",
      characteristics: ["ip"],
      refillRate: 10,
      interval: 60,
      capacity: 50,
    }),
    // Block malicious bots
    detectBot({
      mode: "LIVE",
      block: ["AUTOMATED"],
    }),
  ],
})

// Apply to admin endpoints
export async function POST(req: Request) {
  const decision = await aj.protect(req)
  if (decision.isDenied()) {
    return new Response("Rate limited", { status: 429 })
  }
  // Process scraping job...
}
```

---

## 9. VERCEL EDGE CONFIG - Rate Limiting Data Store

### Overview
Edge Config is a global, low-latency data store for feature flags, IP blocking, and configuration data. Can be used for simple rate limiting without external databases.

### Free Tier Limits (Hobby Plan)
```
Stores: 1 store maximum
Storage Size: 8 KB maximum
Reads: First 100,000 FREE
Writes: First 100 FREE
Backup Retention: 7 days
Propagation: Up to 10 seconds globally
```

### Paid Tier Limits
```
Pro Plan ($20/user/month):
- Stores: 3 maximum
- Storage: 64 KB maximum
- Reads: First 100K free, then $3.00 per 1M reads
- Writes: First 100 free, then $5.00 per 500 writes
- Backup: 90 days

Enterprise (Custom pricing):
- Stores: 10 maximum
- Storage: 512 KB maximum
- Same pricing as Pro for operations
- Backup: 365 days
```

### Use Cases for Authentication/Security
**IP Blocking:**
```javascript
import { get } from '@vercel/edge-config'

export async function middleware(request) {
  const ip = request.ip
  const blockedIPs = await get('blocked_ips')

  if (blockedIPs.includes(ip)) {
    return new Response('Forbidden', { status: 403 })
  }
}
```

**Feature Flags:**
```javascript
// Enable/disable scrapers
const scrapers = await get('enabled_scrapers')
if (scrapers.mercadolibre) {
  await scrapeMercadoLibre()
}
```

**Simple Rate Limiting:**
⚠️ Not recommended for true rate limiting (use Arcjet instead)
- Limited to 100 writes on free tier
- Better for IP blocking and feature flags

### Integration
- ✅ Built into Vercel platform
- ✅ Edge runtime compatible
- ✅ Global CDN distribution
- ✅ No external dependencies

### Best Fit For
⚠️ **LIMITED USE** for your platform:
- ✅ IP blocking for abusive scrapers
- ✅ Feature flags for scraper control
- ✅ A/B testing configurations
- ❌ Not suitable for rate limiting (use Arcjet)
- ❌ 8KB storage is very limited
- ❌ 100 writes/month is restrictive

### Cost Example
```
Hobby: 1 store, 8KB, 100K reads, 100 writes = FREE
Pro: 3 stores, 64KB, 1M reads = $20/mo + $3 = $23/mo
```

---

## 10. ADDITIONAL VERCEL MARKETPLACE SECURITY INTEGRATIONS (2025)

### Overview
In addition to the major solutions above, Vercel Marketplace now includes AI-powered security agents and services (announced October 2025).

### Security-Focused AI Agents

#### CodeRabbit
**Purpose:** AI-powered code review with security focus
**Features:**
- ✅ Analyzes pull requests for security vulnerabilities
- ✅ Code quality and best practices feedback
- ✅ Automatic security pattern detection
- ⚠️ Pricing not disclosed (contact for details)

**Use Case:** Continuous security auditing during development

#### Corridor
**Purpose:** Real-time application threat monitoring
**Features:**
- ✅ Real-time security threat detection
- ✅ Suspicious pattern recognition
- ✅ Pre-production alerts
- ✅ GitHub integration
- ⚠️ Pricing not disclosed

**Use Case:** Runtime security monitoring and alerting

#### Sourcery
**Purpose:** Instant code reviews for security and bugs
**Features:**
- ✅ Every code change reviewed
- ✅ Security risk detection
- ✅ Bug prevention
- ✅ GitHub integration
- ⚠️ Pricing not disclosed

**Use Case:** Automated security code reviews

### Integration Features (All Agents)
- ✅ Unified authentication through Vercel
- ✅ Single onboarding flow with GitHub
- ✅ Automatic repository monitoring
- ✅ Billing through Vercel platform
- ✅ Native Vercel platform integration

### Recommendation for Your Platform
⚠️ **OPTIONAL** - Consider after core security is established:
- These are premium security add-ons
- Better suited for larger teams
- Pricing likely not in free tier range
- Core platform (Supabase + Arcjet) should be prioritized first
- Consider these in Phase 4+ when scaling security operations

---

## COMPARISON MATRIX

### Authentication Solutions

| Feature | Clerk | Supabase Auth | Auth0 | NextAuth.js | Descope | WorkOS |
|---------|-------|---------------|-------|-------------|---------|---------|
| **Free MAU** | 10,000 | 50,000 | 25,000 | Unlimited | 7,500 | 1,000,000 |
| **Social OAuth** | 3 providers | Unlimited | Unlimited | 50+ providers | Unlimited | Unlimited |
| **Email/Password** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Magic Links** | ✅ | ✅ | ❌ (paid) | ✅ | ✅ | ✅ |
| **MFA (Free)** | ❌ | ✅ Basic | ❌ | ⚠️ DIY | ✅ | ✅ |
| **RBAC (Free)** | ✅ Basic | ✅ (RLS) | ❌ | ⚠️ DIY | ✅ | ✅ |
| **Pre-built UI** | ✅ | ⚠️ Limited | ✅ | ❌ | ✅ | ✅ |
| **Admin Dashboard** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Webhooks** | ✅ | ✅ | ✅ | ⚠️ DIY | ✅ | ✅ |
| **API Keys Mgmt** | ⚠️ Metadata | ✅ Native | ⚠️ External | ⚠️ DIY | ✅ | ✅ |
| **Vercel Integration** | ✅ Marketplace | ✅ Marketplace | ✅ Marketplace | ✅ Native | ⚠️ SDK only | ✅ Marketplace |
| **Next.js DX** | Excellent | Good | Good | Excellent | Good | Good |
| **Price After Free** | $25/mo | $25/mo | Usage-based | $0 | $249/mo | $0 (until SSO) |
| **Cost per 1K MAU** | $0.02 | $3.25 | $100-1,000 | $0 | ~$33 | $0 |

### Security Solutions

| Feature | Vercel Firewall | Arcjet | Edge Config | express-rate-limit |
|---------|----------------|--------|-------------|-------------------|
| **DDoS Protection** | ✅ Free | ❌ | ❌ | ❌ |
| **Rate Limiting** | ⚠️ Paid (WAF) | ✅ Free | ⚠️ Limited | ✅ Free (DIY) |
| **Bot Protection** | ⚠️ Paid (WAF) | ✅ Free | ❌ | ❌ |
| **IP Blocking** | ⚠️ Paid (WAF) | ✅ | ✅ Free | ✅ Free (DIY) |
| **Infrastructure** | Zero | Zero | Zero | Redis recommended |
| **Setup Complexity** | Automatic | Low | Low | Medium |
| **Free Tier Limits** | DDoS unlimited | Undocumented | 100K reads | Unlimited (DIY) |
| **Paid Pricing** | $20/mo (WAF) | TBD | $20/mo (Pro) | $0 (self-hosted) |
| **Edge Runtime** | ✅ | ✅ | ✅ | ⚠️ Node.js only |
| **Vercel Integration** | ✅ Native | ✅ Marketplace | ✅ Native | ⚠️ Manual |

---

## RECOMMENDATIONS FOR YOUR REAL ESTATE PLATFORM

### Phase 1: Admin Authentication (Current Need)

#### RECOMMENDED: Supabase Auth
**Why:**
- ✅ You're already planning to use Supabase for database
- ✅ 50,000 MAU free tier (most generous)
- ✅ Built-in MFA for admin security
- ✅ Row-level security for data isolation
- ✅ API keys can be stored in Supabase tables
- ✅ Unified platform (DB + Auth + Storage)
- ✅ Real-time subscriptions for live scraper status

**Implementation:**
```javascript
// app/layout.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export default async function RootLayout({ children }) {
  const supabase = createServerComponentClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html>
      <body>
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Estimated Setup Time:** 4-8 hours

---

### Phase 2: Rate Limiting & Security (Immediate Need)

#### RECOMMENDED: Arcjet + Vercel Firewall
**Why:**
- ✅ Vercel Firewall provides FREE DDoS protection (automatic)
- ✅ Arcjet handles rate limiting without Redis
- ✅ Bot protection for scraper endpoints
- ✅ Code-first approach (no infrastructure)
- ✅ Fast performance (10-20ms overhead)

**Implementation:**
```javascript
// app/api/scrape/route.ts
import arcjet, { tokenBucket, detectBot } from "@arcjet/next"

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    // Rate limit scraping requests
    tokenBucket({
      mode: "LIVE",
      characteristics: ["userId"], // or "ip" for public endpoints
      refillRate: 10,  // 10 requests
      interval: 3600,  // per hour
      capacity: 50,    // burst up to 50
    }),
    // Block malicious bots
    detectBot({
      mode: "LIVE",
      block: ["AUTOMATED", "SUSPICIOUS"],
    }),
  ],
})

export async function POST(req: Request) {
  const decision = await aj.protect(req)

  if (decision.isDenied()) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429 }
    )
  }

  // Process scraping job
  await triggerScraperJob(req.body)
  return NextResponse.json({ success: true })
}
```

**Estimated Setup Time:** 2-4 hours

---

### Phase 3: Future User Features (Saved Searches, Alerts)

#### OPTION A: Continue with Supabase Auth (RECOMMENDED)
**Why:**
- ✅ Already integrated
- ✅ 50K MAU covers significant growth
- ✅ No additional cost until 50K users
- ✅ Consistent platform

**When to Scale:** Stay on free tier until 50K MAU, then upgrade to Pro ($25/mo)

#### OPTION B: Switch to Clerk
**Only if:**
- ❌ You need advanced organization features
- ❌ You want pre-built user profile UIs
- ❌ You need advanced admin impersonation
- ⚠️ Trade-off: More expensive at scale ($0.02/MAU vs Supabase $25/mo for 100K)

---

### Phase 4: API Key Management for External Access

#### RECOMMENDED: Supabase + Custom Solution
**Why:**
- ✅ Store API keys in Supabase database
- ✅ Use Supabase RLS for security
- ✅ Hash API keys (bcrypt/SHA-256)
- ✅ Full control over permissions

**Schema:**
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  key_hash TEXT NOT NULL,
  name TEXT,
  rate_limit_per_hour INT DEFAULT 1000,
  permissions JSONB DEFAULT '{"read": true, "write": false}',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- RLS Policy
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id);
```

**API Key Middleware:**
```javascript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createHash } from 'crypto'

export async function middleware(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')

  if (apiKey) {
    const keyHash = createHash('sha256').update(apiKey).digest('hex')
    const supabase = createMiddlewareClient()

    const { data: key } = await supabase
      .from('api_keys')
      .select('*, user:user_id(*)')
      .eq('key_hash', keyHash)
      .single()

    if (!key || (key.expires_at && new Date(key.expires_at) < new Date())) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Check rate limit with Arcjet
    const decision = await arcjet.protect(req, {
      characteristics: [key.id],
      requested: 1,
    })

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    // Update last used
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', key.id)

    // Attach user to request
    req.headers.set('x-user-id', key.user_id)
  }

  return NextResponse.next()
}
```

**Estimated Setup Time:** 6-10 hours

---

## IMPLEMENTATION ROADMAP

### Week 1: Core Authentication
```
Day 1-2: Supabase Setup
- [ ] Create Supabase project (Vercel Marketplace)
- [ ] Enable auth providers (Google, Email)
- [ ] Setup RLS policies
- [ ] Configure environment variables

Day 3-4: Authentication UI
- [ ] Install @supabase/auth-helpers-nextjs
- [ ] Create login/signup pages
- [ ] Implement auth middleware
- [ ] Setup protected routes

Day 5: Admin Features
- [ ] Create admin dashboard
- [ ] Implement MFA for admin accounts
- [ ] Setup role-based permissions
```

### Week 2: Security Layer
```
Day 1-2: Arcjet Integration
- [ ] Sign up for Arcjet free account
- [ ] Install @arcjet/next
- [ ] Configure rate limiting rules
- [ ] Add bot protection

Day 3-4: Endpoint Protection
- [ ] Protect scraper API routes
- [ ] Protect search API routes
- [ ] Add rate limit headers
- [ ] Implement rate limit feedback UI

Day 5: Testing & Monitoring
- [ ] Test rate limiting with curl
- [ ] Test bot detection
- [ ] Setup logging (Winston)
- [ ] Create monitoring dashboard
```

### Week 3: API Key System
```
Day 1-2: Database Schema
- [ ] Create api_keys table
- [ ] Setup RLS policies
- [ ] Create helper functions
- [ ] Add indexes

Day 3-4: API Key Generation
- [ ] Create API key generation UI
- [ ] Implement key hashing
- [ ] Add expiration logic
- [ ] Create revocation system

Day 5: API Key Middleware
- [ ] Implement authentication middleware
- [ ] Add rate limiting per key
- [ ] Setup usage tracking
- [ ] Create usage dashboard
```

### Week 4: Polish & Documentation
```
Day 1-2: Admin Dashboard
- [ ] User management UI
- [ ] API key management UI
- [ ] Scraper control panel
- [ ] Analytics dashboard

Day 3-4: Documentation
- [ ] API documentation
- [ ] Authentication guide
- [ ] Rate limit documentation
- [ ] Security best practices

Day 5: Deployment & Testing
- [ ] Deploy to Vercel
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance testing
```

---

## COST PROJECTIONS

### Year 1 (Development & Launch)
```
Months 1-6: 10 admins + 500 beta users
- Supabase: FREE (under 50K MAU)
- Arcjet: FREE (basic tier)
- Vercel: FREE (Hobby plan)
- Total: $0/month

Months 7-12: 10 admins + 5,000 users
- Supabase: FREE (under 50K MAU)
- Arcjet: FREE
- Vercel: FREE
- Total: $0/month
```

### Year 2 (Growth)
```
Months 13-18: 20 admins + 30,000 users
- Supabase: FREE (under 50K MAU)
- Arcjet: FREE or ~$50/mo (if usage-based)
- Vercel: $20/mo (Pro for team features)
- Total: $20-70/month

Months 19-24: 20 admins + 80,000 users
- Supabase: $25/mo (Pro tier needed)
- Arcjet: ~$100/mo (estimated)
- Vercel: $20/mo
- Total: $145/month
```

### Year 3 (Scale)
```
100,000+ users
- Supabase: $25/mo (Pro covers 100K MAU)
- Arcjet: ~$200/mo (estimated)
- Vercel: $20/mo + overage
- Total: $245-300/month

Or switch to Supabase dedicated instance at scale
```

---

## MIGRATION SCENARIOS

### If You Outgrow Free Tiers

#### Scenario 1: Hit Supabase 50K MAU Limit
**Solution:** Upgrade to Pro ($25/mo for 100K MAU)
- Cost increase: $0 → $25/mo
- Gains: 100K MAU, better support, 7-day logs
- No code changes required

#### Scenario 2: Need Enterprise SSO (Future)
**Solutions:**
1. **Stick with Supabase** + implement custom SAML ($0 dev cost, takes time)
2. **Add WorkOS** for SSO only ($49/mo per connection)
3. **Switch to Auth0 Professional** ($240/mo, overkill for your use case)

**Recommendation:** Use WorkOS for enterprise SSO if needed, keep Supabase for regular auth

#### Scenario 3: Arcjet Rate Limits Exceeded
**Solution:**
1. Optimize rate limiting rules (reduce API calls)
2. Cache more aggressively
3. Upgrade Arcjet tier (pricing TBD)
4. Alternative: Self-host with Upstash Redis + custom rate limiting

---

## SECURITY BEST PRACTICES

### Admin Access
```
✅ DO:
- Enable MFA for all admin accounts
- Use hardware keys (YubiKey) for super admins
- Implement IP allowlisting for admin panel
- Log all admin actions (audit trail)
- Rotate API keys quarterly
- Use separate staging/production environments

❌ DON'T:
- Share admin credentials
- Use weak passwords
- Disable rate limiting for admins
- Store API keys in git
- Allow admin access from untrusted networks
```

### API Security
```
✅ DO:
- Hash API keys before storing (SHA-256 minimum)
- Implement key rotation
- Add expiration dates to keys
- Rate limit per key
- Log all API usage
- Validate webhook signatures

❌ DON'T:
- Store plaintext API keys
- Use API keys in client-side code
- Allow unlimited rate limits
- Expose internal endpoints
- Skip input validation
```

### Scraper Protection
```
✅ DO:
- Rate limit scraper triggers (prevent abuse)
- Validate webhook payloads
- Use job queues (prevent DoS)
- Monitor scraper health
- Implement circuit breakers
- Log all scraper activity

❌ DON'T:
- Allow public scraper triggers
- Run scrapers synchronously
- Ignore rate limits from sources
- Store credentials in code
- Skip error handling
```

---

## FINAL RECOMMENDATION SUMMARY

### ✅ RECOMMENDED STACK (FREE TIER OPTIMIZED)

```
Authentication: Supabase Auth
- 50K MAU free
- MFA included
- Already using Supabase DB
- Total cost: $0/mo (until 50K users)

Security: Arcjet + Vercel Firewall
- DDoS: Vercel Firewall (automatic, free)
- Rate limiting: Arcjet (free tier)
- Bot protection: Arcjet (free tier)
- Total cost: $0-50/mo

API Keys: Custom (Supabase DB)
- Store in Supabase
- Manage with RLS
- Full control
- Total cost: $0/mo

Deployment: Vercel
- Hobby plan initially
- Upgrade to Pro when team grows
- Total cost: $0/mo → $20/mo
```

**Total Monthly Cost:**
- Months 1-12: $0/month
- Year 2: $0-70/month (depending on growth)
- At scale (100K users): $145-300/month

---

### 🎯 QUICK START CHECKLIST

```
Week 1: Authentication
[ ] Sign up for Supabase via Vercel Marketplace
[ ] Enable Google OAuth + Email auth
[ ] Install @supabase/auth-helpers-nextjs
[ ] Create login/signup pages
[ ] Protect admin routes with middleware
[ ] Enable MFA for admin accounts

Week 2: Security
[ ] Sign up for Arcjet free account
[ ] Install @arcjet/next
[ ] Add rate limiting to API routes
[ ] Enable bot protection
[ ] Test with curl/Postman
[ ] Monitor with logs

Week 3: API Keys
[ ] Create api_keys table in Supabase
[ ] Setup RLS policies
[ ] Build API key generation UI
[ ] Implement auth middleware
[ ] Add usage tracking
[ ] Create admin dashboard

Week 4: Deploy
[ ] Push to GitHub
[ ] Connect Vercel
[ ] Configure environment variables
[ ] Test in production
[ ] Monitor errors (Vercel dashboard)
[ ] Setup alerts
```

---

## ADDITIONAL RESOURCES

### Documentation Links
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Arcjet Docs:** https://docs.arcjet.com/
- **Vercel Firewall:** https://vercel.com/docs/security/vercel-firewall
- **Next.js Middleware:** https://nextjs.org/docs/app/building-your-application/routing/middleware

### Code Examples
- **Supabase Auth Helpers:** https://github.com/supabase/auth-helpers
- **Arcjet Examples:** https://github.com/arcjet/arcjet-js/tree/main/examples
- **Next.js Auth Patterns:** https://github.com/vercel/next.js/tree/canary/examples/auth-with-supabase

### Community
- **Supabase Discord:** https://discord.supabase.com/
- **Vercel Community:** https://community.vercel.com/
- **Arcjet Community:** https://community.fly.io/tag/arcjet

---

## QUESTIONS TO ASK BEFORE FINAL DECISION

1. **Timeline:** How quickly do you need authentication live?
   - < 1 week: Use Supabase (fastest setup)
   - > 1 month: Consider NextAuth.js (more control)

2. **Budget:** What's your 12-month budget?
   - $0/mo: Supabase + Arcjet + Vercel Free
   - $50/mo: Add Vercel Pro for team features
   - $100+/mo: Consider Clerk for better DX

3. **Scale:** Expected users in Year 1?
   - < 10K: Any solution works
   - 10K-50K: Supabase is perfect
   - 50K+: Plan for Supabase Pro ($25/mo)

4. **Team:** How many developers?
   - Solo: Supabase (less maintenance)
   - Team: Clerk (better collaboration features)

5. **Enterprise:** Need SSO/SAML?
   - No: Supabase is sufficient
   - Yes: Add WorkOS when needed ($49/mo per connection)

---

**Last Updated:** 2025-11-11 (Latest pricing verified)
**Document Version:** 2.0
**Next Review:** Before Phase 1 implementation

---

## CHANGELOG

### 2025-11-11 v2.0 - Latest Pricing Update (Verified from Official Sources)
- ✅ Updated Auth0 pricing to reflect 2025 usage-based model (MAJOR price increases)
- ✅ Verified Supabase free tier: 50K MAU confirmed with detailed limits
- ✅ Updated Clerk pricing: 10K MAU free tier confirmed
- ✅ Added Arcjet Series A funding info and adoption stats (1,000+ developers)
- ✅ Verified Vercel Firewall DDoS protection is FREE on all plans (40x faster in 2025)
- ✅ Updated Supabase Pro tier pricing: $0.00325 per MAU beyond 100K
- ✅ Confirmed WorkOS 1M MAU free tier (unprecedented)
- ✅ Updated cost comparison matrix with accurate per-MAU pricing
- ⚠️ WARNING: Auth0 no longer cost-competitive after free tier ($100-1,000 per 1K MAU)

### 2025-11-11 v1.0 - Initial Research
- Researched 9 authentication/security solutions
- Compared free tier limits across all platforms
- Created cost projections for 3-year timeline
- Developed implementation roadmap
- Recommended Supabase + Arcjet + Vercel stack
