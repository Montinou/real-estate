# Vercel Environment Variables Setup
## Copy these to Vercel Dashboard

**Project:** proptech-ai
**Dashboard:** https://vercel.com/agustin-montoya-projects/proptech-ai/settings/environment-variables

---

## 🔐 Cloudflare R2 (Image Storage)

Add these variables to **production**, **preview**, and **development** environments:

```bash
# Variable Name: CLOUDFLARE_ACCOUNT_ID
# Value:
1154ac48d60dfeb452e573ed0be70bd6

# Variable Name: R2_BUCKET_NAME
# Value:
property-images

# Variable Name: R2_ACCESS_KEY_ID
# Value:
ea1f8609292ae71f3398a02abc152eb4

# Variable Name: R2_SECRET_ACCESS_KEY
# Value:
6153dfab6f334e90453ffe811a90d4a2fac8a02af57cc4ad4ffd076db464c89e

# Variable Name: R2_ENDPOINT
# Value:
https://1154ac48d60dfeb452e573ed0be70bd6.r2.cloudflarestorage.com
```

---

## 📝 Quick Add via CLI (Alternative)

If you prefer CLI, run these commands:

```bash
# Set Vercel token
export VERCEL_TOKEN="xlZfF4ANIRFDqJDBLSlAWRMp"

# Add to all environments
echo "1154ac48d60dfeb452e573ed0be70bd6" | vercel env add CLOUDFLARE_ACCOUNT_ID production
echo "1154ac48d60dfeb452e573ed0be70bd6" | vercel env add CLOUDFLARE_ACCOUNT_ID preview
echo "1154ac48d60dfeb452e573ed0be70bd6" | vercel env add CLOUDFLARE_ACCOUNT_ID development

echo "property-images" | vercel env add R2_BUCKET_NAME production
echo "property-images" | vercel env add R2_BUCKET_NAME preview
echo "property-images" | vercel env add R2_BUCKET_NAME development

echo "ea1f8609292ae71f3398a02abc152eb4" | vercel env add R2_ACCESS_KEY_ID production
echo "ea1f8609292ae71f3398a02abc152eb4" | vercel env add R2_ACCESS_KEY_ID preview
echo "ea1f8609292ae71f3398a02abc152eb4" | vercel env add R2_ACCESS_KEY_ID development

echo "6153dfab6f334e90453ffe811a90d4a2fac8a02af57cc4ad4ffd076db464c89e" | vercel env add R2_SECRET_ACCESS_KEY production
echo "6153dfab6f334e90453ffe811a90d4a2fac8a02af57cc4ad4ffd076db464c89e" | vercel env add R2_SECRET_ACCESS_KEY preview
echo "6153dfab6f334e90453ffe811a90d4a2fac8a02af57cc4ad4ffd076db464c89e" | vercel env add R2_SECRET_ACCESS_KEY development

echo "https://1154ac48d60dfeb452e573ed0be70bd6.r2.cloudflarestorage.com" | vercel env add R2_ENDPOINT production
echo "https://1154ac48d60dfeb452e573ed0be70bd6.r2.cloudflarestorage.com" | vercel env add R2_ENDPOINT preview
echo "https://1154ac48d60dfeb452e573ed0be70bd6.r2.cloudflarestorage.com" | vercel env add R2_ENDPOINT development
```

---

## ✅ Current Integration Status

**Fully Configured (11/14):**
- ✅ Neon Database
- ✅ Stack Auth
- ✅ Upstash Redis
- ✅ Upstash QStash
- ✅ Sentry
- ✅ Groq AI
- ✅ Hugging Face
- ✅ MercadoLibre API
- ✅ Vercel AI Gateway
- ✅ ImageKit (endpoint + keys)
- ✅ Cloudflare R2 (just configured)

**Still Missing (3/14):**
- ❌ Google Gemini API Key
- ❌ Highlight.io Project ID
- ❌ Checkly (optional)

---

## 🚀 Next Steps

### 1. Add R2 Variables to Vercel (NOW)
Choose one method above (Dashboard or CLI)

### 2. Link ImageKit to R2 (5 min)
- Go to: https://imagekit.io/dashboard#settings/integration
- Click "External Storage"
- Add Cloudflare R2:
  - Provider: S3-compatible
  - Endpoint: `https://1154ac48d60dfeb452e573ed0be70bd6.r2.cloudflarestorage.com`
  - Bucket: `property-images`
  - Access Key: `ea1f8609292ae71f3398a02abc152eb4`
  - Secret Key: `6153dfab6f334e90453ffe811a90d4a2fac8a02af57cc4ad4ffd076db464c89e`

### 3. Optional: Add Remaining Services
- **Gemini:** https://aistudio.google.com/apikey
- **Highlight.io:** https://app.highlight.io

---

## 📦 Test R2 Integration

Once configured, test with this code:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Test upload
await s3Client.send(
  new PutObjectCommand({
    Bucket: 'property-images',
    Key: 'test/hello.txt',
    Body: 'Hello from R2!',
  })
);

console.log('✅ R2 upload successful!');
```

---

**Updated:** November 11, 2025
**Status:** 11/14 integrations complete (79%)
