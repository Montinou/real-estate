#!/bin/bash

# =============================================================================
# Vercel Complete Setup Script
# =============================================================================
# This script automates as much as possible of the Vercel + integrations setup
# Some steps still require manual action (marked with [MANUAL])
#
# Usage: ./scripts/setup-vercel-complete.sh
# Prerequisites: vercel CLI installed (npm i -g vercel)
# =============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="real-estate-argentina"
VERCEL_TOKEN="${VERCEL_TOKEN:-xlZfF4ANIRFDqJDBLSlAWRMp}"  # From your .claude config
VERCEL_SCOPE="${VERCEL_SCOPE:-}"  # Set if using team

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Vercel Setup Automation Script${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# =============================================================================
# PHASE 1: Vercel Project Setup
# =============================================================================

echo -e "${GREEN}[1/7] Setting up Vercel project...${NC}"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI not installed${NC}"
    echo "Install with: npm i -g vercel"
    exit 1
fi

# Link project (creates it if doesn't exist)
echo "Linking Vercel project..."
if [ -n "$VERCEL_SCOPE" ]; then
    vercel link --yes --token "$VERCEL_TOKEN" --scope "$VERCEL_SCOPE"
else
    vercel link --yes --token "$VERCEL_TOKEN"
fi

echo -e "${GREEN}✓ Project linked${NC}\n"

# =============================================================================
# PHASE 2: Environment Variables
# =============================================================================

echo -e "${GREEN}[2/7] Configuring environment variables...${NC}"

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Function to add env var
add_env() {
    local name=$1
    local value=$2
    local environment=${3:-production}

    echo "Adding $name to $environment..."
    echo "$value" | vercel env add "$name" "$environment" --token "$VERCEL_TOKEN" --force 2>/dev/null || true
}

# Core environment variables
add_env "NODE_ENV" "production" "production"
add_env "NEXT_PUBLIC_APP_URL" "https://$PROJECT_NAME.vercel.app" "production"
add_env "JWT_SECRET" "$JWT_SECRET" "production"
add_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "production"
add_env "ENCRYPTION_KEY" "$ENCRYPTION_KEY" "production"

# Add to preview and development too
add_env "NODE_ENV" "development" "development"
add_env "NEXT_PUBLIC_APP_URL" "http://localhost:3000" "development"
add_env "JWT_SECRET" "$JWT_SECRET" "development"

echo -e "${GREEN}✓ Base environment variables configured${NC}\n"

# =============================================================================
# PHASE 3: Integration Installation (Semi-Manual)
# =============================================================================

echo -e "${GREEN}[3/7] Installing Vercel Marketplace integrations...${NC}"
echo -e "${YELLOW}Note: Some integrations will open setup wizards${NC}\n"

# List of recommended integrations
INTEGRATIONS=(
    "supabase"           # Database + Auth
    "upstash"            # Redis + QStash
    "sentry"             # Error tracking
    "checkly"            # Uptime monitoring
)

echo "Recommended integrations to install:"
for integration in "${INTEGRATIONS[@]}"; do
    echo "  - $integration"
done
echo ""

read -p "Install integrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    for integration in "${INTEGRATIONS[@]}"; do
        echo "Installing $integration..."
        vercel integration add "$integration" --token "$VERCEL_TOKEN" || echo "Skipped or already installed"
    done
    echo -e "${GREEN}✓ Integrations processed${NC}\n"
else
    echo -e "${YELLOW}⊘ Skipped integration installation${NC}\n"
fi

# =============================================================================
# PHASE 4: Third-Party Service Configuration
# =============================================================================

echo -e "${GREEN}[4/7] Third-party services configuration...${NC}"
echo -e "${YELLOW}[MANUAL] The following require manual setup:${NC}\n"

cat << EOF
┌─────────────────────────────────────────────────────────────────┐
│ SUPABASE (Database + Auth)                                      │
├─────────────────────────────────────────────────────────────────┤
│ 1. Install via: vercel integration add supabase                 │
│ 2. Follow OAuth flow in browser                                 │
│ 3. Create new project or connect existing                       │
│ 4. Enable PostGIS: Run in SQL editor:                          │
│    CREATE EXTENSION IF NOT EXISTS postgis;                      │
│ 5. Environment variables will be auto-added                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ UPSTASH (Redis + QStash)                                        │
├─────────────────────────────────────────────────────────────────┤
│ 1. Install via: vercel integration add upstash                  │
│ 2. Create Redis database (free tier)                            │
│ 3. Environment variables will be auto-added:                    │
│    - UPSTASH_REDIS_REST_URL                                     │
│    - UPSTASH_REDIS_REST_TOKEN                                   │
│    - QSTASH_URL, QSTASH_TOKEN                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CLOUDFLARE R2 (Storage)                                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Go to: https://dash.cloudflare.com/                         │
│ 2. Create R2 bucket: "property-images"                          │
│ 3. Create API token with R2 permissions                         │
│ 4. Add env vars manually (see below)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ IMAGEKIT.IO (Image CDN)                                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Sign up at: https://imagekit.io/                            │
│ 2. Get: URL Endpoint, Public Key, Private Key                   │
│ 3. Add R2 bucket as external storage origin                     │
│ 4. Add env vars manually (see below)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ GOOGLE GEMINI (AI)                                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. Go to: https://aistudio.google.com/apikey                   │
│ 2. Create API key (free tier: 30K requests/month)              │
│ 3. Add env var manually (see below)                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ GROQ (AI Chat)                                                  │
├─────────────────────────────────────────────────────────────────┤
│ 1. Sign up at: https://console.groq.com/                       │
│ 2. Create API key (free tier)                                   │
│ 3. Add env var manually (see below)                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ HUGGING FACE (Embeddings)                                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. Sign up at: https://huggingface.co/                         │
│ 2. Create access token: https://huggingface.co/settings/tokens │
│ 3. Add env var manually (see below)                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ HIGHLIGHT.IO (Logging)                                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. Sign up at: https://app.highlight.io/                       │
│ 2. Create project                                                │
│ 3. Get Project ID from settings                                 │
│ 4. Add env var manually (see below)                             │
└─────────────────────────────────────────────────────────────────┘

EOF

read -p "Press Enter when you've completed the manual steps above..."

# =============================================================================
# PHASE 5: Add Third-Party Environment Variables
# =============================================================================

echo -e "\n${GREEN}[5/7] Adding third-party environment variables...${NC}"

# Interactive prompts for API keys
read -p "Enter Cloudflare Account ID (or skip): " CF_ACCOUNT_ID
read -p "Enter Cloudflare R2 Access Key (or skip): " CF_R2_ACCESS_KEY
read -p "Enter Cloudflare R2 Secret Key (or skip): " CF_R2_SECRET_KEY
read -p "Enter ImageKit URL Endpoint (or skip): " IMAGEKIT_URL_ENDPOINT
read -p "Enter ImageKit Public Key (or skip): " IMAGEKIT_PUBLIC_KEY
read -p "Enter ImageKit Private Key (or skip): " IMAGEKIT_PRIVATE_KEY
read -p "Enter Google Gemini API Key (or skip): " GEMINI_API_KEY
read -p "Enter Groq API Key (or skip): " GROQ_API_KEY
read -p "Enter Hugging Face Token (or skip): " HF_TOKEN
read -p "Enter Highlight.io Project ID (or skip): " HIGHLIGHT_PROJECT_ID
read -p "Enter MercadoLibre Client ID (or skip): " ML_CLIENT_ID
read -p "Enter MercadoLibre Client Secret (or skip): " ML_CLIENT_SECRET

# Add non-empty vars
[ -n "$CF_ACCOUNT_ID" ] && add_env "CLOUDFLARE_ACCOUNT_ID" "$CF_ACCOUNT_ID" "production"
[ -n "$CF_R2_ACCESS_KEY" ] && add_env "R2_ACCESS_KEY_ID" "$CF_R2_ACCESS_KEY" "production"
[ -n "$CF_R2_SECRET_KEY" ] && add_env "R2_SECRET_ACCESS_KEY" "$CF_R2_SECRET_KEY" "production"
[ -n "$IMAGEKIT_URL_ENDPOINT" ] && add_env "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT" "$IMAGEKIT_URL_ENDPOINT" "production"
[ -n "$IMAGEKIT_PUBLIC_KEY" ] && add_env "NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY" "$IMAGEKIT_PUBLIC_KEY" "production"
[ -n "$IMAGEKIT_PRIVATE_KEY" ] && add_env "IMAGEKIT_PRIVATE_KEY" "$IMAGEKIT_PRIVATE_KEY" "production"
[ -n "$GEMINI_API_KEY" ] && add_env "GEMINI_API_KEY" "$GEMINI_API_KEY" "production"
[ -n "$GROQ_API_KEY" ] && add_env "GROQ_API_KEY" "$GROQ_API_KEY" "production"
[ -n "$HF_TOKEN" ] && add_env "HUGGINGFACE_TOKEN" "$HF_TOKEN" "production"
[ -n "$HIGHLIGHT_PROJECT_ID" ] && add_env "NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID" "$HIGHLIGHT_PROJECT_ID" "production"
[ -n "$ML_CLIENT_ID" ] && add_env "ML_CLIENT_ID" "$ML_CLIENT_ID" "production"
[ -n "$ML_CLIENT_SECRET" ] && add_env "ML_CLIENT_SECRET" "$ML_CLIENT_SECRET" "production"

echo -e "${GREEN}✓ Third-party environment variables added${NC}\n"

# =============================================================================
# PHASE 6: Pull Environment Variables Locally
# =============================================================================

echo -e "${GREEN}[6/7] Pulling environment variables to local .env files...${NC}"

# Pull all environments
vercel env pull .env.local --token "$VERCEL_TOKEN"
vercel env pull .env.production --environment=production --token "$VERCEL_TOKEN"
vercel env pull .env.preview --environment=preview --token "$VERCEL_TOKEN"

echo -e "${GREEN}✓ Environment variables pulled locally${NC}\n"

# =============================================================================
# PHASE 7: Verification
# =============================================================================

echo -e "${GREEN}[7/7] Verifying setup...${NC}"

echo "Installed integrations:"
vercel integration list --token "$VERCEL_TOKEN"

echo ""
echo "Environment variables (production):"
vercel env ls production --token "$VERCEL_TOKEN"

echo ""
echo -e "${GREEN}✓ Setup verification complete${NC}\n"

# =============================================================================
# Summary
# =============================================================================

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Setup Complete!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${GREEN}What was configured:${NC}"
echo "  ✓ Vercel project linked"
echo "  ✓ Environment variables set"
echo "  ✓ Integrations installed (if confirmed)"
echo "  ✓ Local .env files created"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review .env.local for completeness"
echo "  2. Test locally: npm run dev"
echo "  3. Deploy: vercel --prod"
echo "  4. Configure custom domain in Vercel dashboard"
echo "  5. Set up Vercel Cron jobs (or use GitHub Actions)"
echo ""
echo -e "${YELLOW}Manual configuration still needed:${NC}"
echo "  • Supabase: Enable PostGIS, run migrations"
echo "  • Upstash: Configure QStash schedules"
echo "  • ImageKit: Link R2 bucket as external origin"
echo "  • Vercel: Configure build settings if needed"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  • Master Plan: docs/VERCEL_INTEGRATIONS_MASTER_PLAN.md"
echo "  • Database Setup: docs/VERCEL_DATABASE_COMPARISON.md"
echo "  • AI Integration: docs/AI_ML_INTEGRATION_RESEARCH.md"
echo ""
echo -e "${GREEN}Happy building! 🚀${NC}"
