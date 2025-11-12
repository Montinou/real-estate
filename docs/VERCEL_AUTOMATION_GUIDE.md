# Vercel Automation Guide
## CLI, MCP, and Programmatic Configuration

**Last Updated:** November 11, 2025
**Vercel CLI Version:** 48.2.9+
**MCP Status:** Public Beta

---

## Table of Contents
1. [Vercel CLI Capabilities](#vercel-cli-capabilities)
2. [Vercel MCP Server](#vercel-mcp-server)
3. [What Can Be Automated](#what-can-be-automated)
4. [What Requires Manual Setup](#what-requires-manual-setup)
5. [Automation Scripts](#automation-scripts)
6. [Best Practices](#best-practices)

---

## Vercel CLI Capabilities

### Authentication

**Token-Based (Recommended for CI/CD)**
```bash
# Set token via environment variable
export VERCEL_TOKEN="your_token_here"

# Or pass inline
vercel deploy --token "$VERCEL_TOKEN"
```

**Interactive Login**
```bash
vercel login
```

**Get Token**
```bash
# From Vercel Dashboard
# Settings > Tokens > Create Token
# Scope: Full Account or specific team
```

---

### Environment Variables (✅ Fully Automated)

**Add Variable**
```bash
# Syntax
vercel env add <name> [environment] --token $TOKEN

# Examples
echo "value" | vercel env add DATABASE_URL production --force
vercel env add API_KEY production < secret.txt
vercel env add DEBUG development --force

# Environments: production, preview, development
```

**List Variables**
```bash
vercel env ls [environment] --token $TOKEN
vercel env ls production --token $TOKEN
```

**Pull Variables**
```bash
# Pull to .env.local (development)
vercel env pull .env.local --token $TOKEN

# Pull specific environment
vercel env pull .env.production --environment=production --token $TOKEN
```

**Remove Variable**
```bash
vercel env rm <name> [environment] --token $TOKEN
vercel env rm OLD_API_KEY production --token $TOKEN
```

**Update Variable**
```bash
vercel env update <name> [environment] --token $TOKEN
echo "new_value" | vercel env update API_KEY production --force
```

---

### Project Management (✅ Fully Automated)

**Link Project**
```bash
# Interactive
vercel link

# Non-interactive
vercel link --yes --token $TOKEN --scope $TEAM_SLUG

# Creates .vercel directory with project metadata
```

**Pull Project Configuration**
```bash
# Pull latest config (vercel.json, .gitignore, env vars)
vercel pull --yes --environment=production --token $TOKEN
```

**List Projects**
```bash
vercel project ls --token $TOKEN
```

**Project Settings**
- ❌ Cannot be configured via CLI
- ⚠️ Requires REST API or web UI
- Settings include: build command, output directory, framework preset

---

### Integration Management (⚠️ Semi-Automated)

**Add Integration**
```bash
# Install integration (opens setup wizard)
vercel integration add <integration-name> --token $TOKEN

# Examples
vercel integration add supabase --token $TOKEN
vercel integration add upstash --token $TOKEN
vercel integration add sentry --token $TOKEN
```

**⚠️ Important:** Most integrations require:
1. OAuth flow (opens browser)
2. Resource creation (database, project, etc.)
3. Configuration through provider UI

**List Integrations**
```bash
vercel integration list --token $TOKEN
vercel integration list real-estate --token $TOKEN  # For specific project
```

**Open Integration Dashboard**
```bash
vercel integration open <integration-name> --token $TOKEN
```

**Remove Integration**
```bash
# Must remove all resources first
vercel integration remove <integration-name> --token $TOKEN
```

---

### Deployment (✅ Fully Automated)

**Deploy to Preview**
```bash
vercel deploy --token $TOKEN
```

**Deploy to Production**
```bash
vercel deploy --prod --token $TOKEN
```

**Deploy with Environment Variables**
```bash
vercel deploy --build-env API_KEY=value --prod --token $TOKEN
```

**Deploy from CI/CD**
```bash
# GitHub Actions example
- name: Deploy to Vercel
  run: |
    vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
    vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
    vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

### Domain Management (⚠️ Semi-Automated)

**Add Domain**
```bash
vercel domains add example.com --token $TOKEN
```

**List Domains**
```bash
vercel domains ls --token $TOKEN
```

**Remove Domain**
```bash
vercel domains rm example.com --token $TOKEN
```

**DNS Management**
```bash
vercel dns ls example.com --token $TOKEN
vercel dns add example.com A 1.2.3.4 --token $TOKEN
```

---

### Logs (✅ Automated)

**View Logs**
```bash
vercel logs --token $TOKEN
vercel logs --follow --token $TOKEN  # Real-time
vercel logs deployment-url --token $TOKEN
```

---

### Secrets (✅ Deprecated - Use `vercel env` instead)

```bash
# Legacy commands (still work but deprecated)
vercel secrets add secret-name value --token $TOKEN
vercel secrets ls --token $TOKEN
vercel secrets rm secret-name --token $TOKEN
```

---

## Vercel MCP Server

**URL:** `https://mcp.vercel.com`
**Status:** Public Beta (launched August 4, 2025)
**Protocol:** MCP (Model Context Protocol) with OAuth

### What is MCP?

Model Context Protocol standardizes how AI assistants (like Claude) interact with external systems. Vercel's MCP server lets AI tools manage your Vercel infrastructure through natural language.

### Capabilities

#### Public Tools (No Auth Required)
- ✅ Search Vercel documentation
- ✅ Navigate docs
- ✅ Get help with Vercel features

#### Authenticated Tools (OAuth Required)
- ✅ Manage projects
- ✅ Create deployments
- ✅ Analyze deployment logs
- ✅ Manage teams
- ✅ Configure project settings
- ✅ View/update environment variables (likely)
- ✅ Manage domains (likely)

### How to Use MCP

**1. With Claude Desktop/Code**

Add to your MCP configuration:
```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com",
      "oauth": {
        "provider": "vercel",
        "scopes": ["read", "write"]
      }
    }
  }
}
```

**2. Context-Aware Mode**

Use project-specific URL:
```
https://mcp.vercel.com/<team-slug>/<project-slug>
```

Benefits:
- Auto-fills project parameters
- Faster operations
- Reduced manual input

**3. Example AI Commands (via MCP)**

```
"Deploy my latest changes to production"
"Show me the logs for the last deployment"
"Add environment variable DATABASE_URL to production"
"List all projects in my team"
"Create a new preview deployment"
"Analyze why the last deployment failed"
```

### MCP vs CLI

| Feature | CLI | MCP (via AI) |
|---------|-----|--------------|
| **Speed** | Fast (direct) | Moderate (AI interpretation) |
| **Scripting** | Excellent | Not designed for scripts |
| **Complex Tasks** | Manual chaining | Natural multi-step execution |
| **Learning Curve** | Steep | Gentle (natural language) |
| **CI/CD** | Perfect | Not recommended |
| **Interactive** | Limited | Excellent |
| **Context Awareness** | Manual | Automatic |

**Recommendation:** Use CLI for automation/CI/CD, MCP for interactive development.

---

## What Can Be Automated

### ✅ Fully Automatable

1. **Environment Variables**
   - Add, update, remove, pull
   - All environments (production, preview, development)
   - Scripted bulk operations

2. **Deployments**
   - Preview and production
   - CI/CD integration
   - Build environment variables

3. **Project Linking**
   - Connect local to Vercel project
   - Team scope selection

4. **DNS Records**
   - Add, remove, list records
   - Domain verification (with TXT record)

5. **Logs Retrieval**
   - Real-time streaming
   - Historical logs
   - Deployment-specific logs

### ⚠️ Semi-Automatable

1. **Integration Installation**
   - Can trigger installation
   - Requires interactive OAuth/setup
   - Resource creation needs manual steps

2. **Domain Addition**
   - Can add programmatically
   - DNS verification requires external DNS provider access

3. **Team Management**
   - Can list teams
   - Invitations require email interaction

### ❌ Cannot Be Automated (Web UI Only)

1. **Account Creation**
   - Must sign up manually
   - Email verification required

2. **Payment Methods**
   - Must add via web UI
   - PCI compliance requirements

3. **Complex Integration Configuration**
   - Supabase project creation
   - Upstash database provisioning
   - Sentry project setup

4. **Advanced Project Settings**
   - Framework detection override
   - Custom build image
   - Performance settings

5. **Security Settings**
   - Deployment protection
   - Vercel Firewall rules (Enterprise)
   - Custom authentication

---

## What Requires Manual Setup

### Vercel Platform

**One-Time Setup**
- [ ] Create Vercel account
- [ ] Verify email
- [ ] (Optional) Add payment method for Pro plan
- [ ] (Optional) Create team
- [ ] Generate deployment token

### Integrations

#### Supabase
- [ ] Install via `vercel integration add supabase`
- [ ] Complete OAuth flow
- [ ] Create new project (or connect existing)
- [ ] Enable PostGIS extension in SQL editor
- [ ] Run database migrations
- [ ] Configure RLS policies

#### Upstash
- [ ] Install via `vercel integration add upstash`
- [ ] Complete OAuth flow
- [ ] Create Redis database
- [ ] (Optional) Create Kafka topic
- [ ] Environment variables auto-added

#### Sentry
- [ ] Install via `vercel integration add sentry`
- [ ] Complete OAuth flow
- [ ] Create/select project
- [ ] Configure error sampling
- [ ] Environment variables auto-added

#### Checkly
- [ ] Install via `vercel integration add checkly`
- [ ] Complete OAuth flow
- [ ] Create monitoring checks
- [ ] Configure alert channels

### Third-Party Services (No Vercel Integration)

#### Cloudflare R2
- [ ] Sign up at dash.cloudflare.com
- [ ] Create R2 bucket
- [ ] Generate API token (R2 permissions)
- [ ] Add to Vercel: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`

#### ImageKit.io
- [ ] Sign up at imagekit.io
- [ ] Create project
- [ ] Copy: URL Endpoint, Public Key, Private Key
- [ ] Add R2 bucket as external storage origin
- [ ] Add to Vercel: `IMAGEKIT_*` variables

#### Google Gemini
- [ ] Get API key: aistudio.google.com/apikey
- [ ] Add to Vercel: `GEMINI_API_KEY`

#### Groq
- [ ] Sign up: console.groq.com
- [ ] Create API key
- [ ] Add to Vercel: `GROQ_API_KEY`

#### Hugging Face
- [ ] Sign up: huggingface.co
- [ ] Create access token
- [ ] Add to Vercel: `HUGGINGFACE_TOKEN`

#### Highlight.io
- [ ] Sign up: app.highlight.io
- [ ] Create project
- [ ] Copy Project ID
- [ ] Add to Vercel: `NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID`

---

## Automation Scripts

### Complete Setup Script

Located at: [`scripts/setup-vercel-complete.sh`](../scripts/setup-vercel-complete.sh)

**Features:**
- Project linking
- Environment variable setup
- Integration installation prompts
- Third-party API key configuration
- Local .env file generation

**Usage:**
```bash
export VERCEL_TOKEN="your_token_here"
./scripts/setup-vercel-complete.sh
```

### CI/CD Deployment Script

**GitHub Actions Example:**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Vercel CLI
        run: npm i -g vercel

      - name: Pull Vercel Environment
        run: |
          vercel pull --yes --environment=production \
            --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: |
          vercel build --prod \
            --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: |
          vercel deploy --prebuilt --prod \
            --token=${{ secrets.VERCEL_TOKEN }}
```

### Bulk Environment Variable Script

```bash
#!/bin/bash

# Load from .env file
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    echo "Adding $key..."
    echo "$value" | vercel env add "$key" production --force --token "$VERCEL_TOKEN"
done < .env.production
```

### Integration Check Script

```bash
#!/bin/bash

echo "Checking installed integrations..."
vercel integration list --token "$VERCEL_TOKEN"

REQUIRED_INTEGRATIONS=("supabase" "upstash" "sentry")

for integration in "${REQUIRED_INTEGRATIONS[@]}"; do
    if vercel integration list --token "$VERCEL_TOKEN" | grep -q "$integration"; then
        echo "✓ $integration installed"
    else
        echo "✗ $integration NOT installed"
        echo "  Install: vercel integration add $integration"
    fi
done
```

---

## Best Practices

### 1. Token Management

**DO:**
- ✅ Use dedicated tokens for CI/CD
- ✅ Scope tokens to specific teams when possible
- ✅ Rotate tokens regularly (every 90 days)
- ✅ Store tokens in secrets manager (GitHub Secrets, 1Password, etc.)
- ✅ Use environment variables, never hardcode

**DON'T:**
- ❌ Commit tokens to git
- ❌ Share tokens across projects
- ❌ Use personal tokens for production
- ❌ Store tokens in plain text

### 2. Environment Variables

**DO:**
- ✅ Use `vercel env pull` to sync locally
- ✅ Set variables in all environments (production, preview, development)
- ✅ Use `NEXT_PUBLIC_*` prefix for client-side variables
- ✅ Generate secrets programmatically (JWT_SECRET, etc.)

**DON'T:**
- ❌ Store secrets in git (even .env files)
- ❌ Hardcode API keys in code
- ❌ Forget to update preview/development environments

### 3. CI/CD Pipeline

**DO:**
- ✅ Use `vercel pull` to get project config
- ✅ Use `vercel build` for reproducible builds
- ✅ Use `vercel deploy --prebuilt` for faster deployments
- ✅ Test in preview before production
- ✅ Use deployment protection for production

**DON'T:**
- ❌ Deploy directly without building
- ❌ Skip preview deployments
- ❌ Ignore deployment logs
- ❌ Use `--force` in production

### 4. Integration Management

**DO:**
- ✅ Install integrations through Vercel Marketplace (unified billing)
- ✅ Document required integrations in README
- ✅ Test integration removal/reinstall process
- ✅ Use integration-provided environment variables

**DON'T:**
- ❌ Manually configure what integrations can auto-configure
- ❌ Remove integrations without backing up data
- ❌ Mix manual and integration-managed resources

### 5. Scripting

**DO:**
- ✅ Use `set -e` to exit on error
- ✅ Add `--force` flag for non-interactive scripts
- ✅ Validate inputs before executing
- ✅ Log all actions with timestamps
- ✅ Test scripts in development first

**DON'T:**
- ❌ Assume commands succeed
- ❌ Ignore error output
- ❌ Run destructive commands without confirmation
- ❌ Use scripts without version control

---

## Advanced: REST API

For operations not supported by CLI, use Vercel REST API:

**Documentation:** https://vercel.com/docs/rest-api

**Common Use Cases:**
- Project settings configuration
- Deployment metadata
- Team member management
- Webhook configuration
- Domain verification status

**Example: Update Project Settings**
```bash
curl -X PATCH \
  "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "outputDirectory": ".next"
  }'
```

---

## Troubleshooting

### Common Issues

**1. "No project found"**
```bash
# Solution: Link project first
vercel link --yes --token "$VERCEL_TOKEN"
```

**2. "Authentication failed"**
```bash
# Solution: Verify token is valid
vercel whoami --token "$VERCEL_TOKEN"
```

**3. "Integration already installed"**
```bash
# Solution: Remove first or skip
vercel integration remove integration-name --token "$VERCEL_TOKEN"
```

**4. "Environment variable not found"**
```bash
# Solution: Pull latest config
vercel env pull .env.local --token "$VERCEL_TOKEN"
```

**5. "Deployment protection enabled"**
```bash
# Solution: Use correct token with write permissions
# Or disable deployment protection in dashboard
```

### Debug Mode

Enable verbose logging:
```bash
vercel --debug deploy --token "$VERCEL_TOKEN"
vercel -d integration list --token "$VERCEL_TOKEN"
```

---

## Summary

### What You CAN Automate (95% of Workflow)
✅ Environment variables (100%)
✅ Deployments (100%)
✅ Project management (100%)
✅ Domain DNS (90%)
✅ Integration installation (trigger only)

### What You CANNOT Automate (5% of Workflow)
❌ Initial account setup
❌ Integration OAuth flows
❌ Complex integration configuration
❌ Payment method addition
❌ Advanced security settings

### Recommended Approach

1. **Manual Setup (Once):**
   - Create Vercel account
   - Install integrations via web UI
   - Configure third-party services
   - Add payment method (if needed)

2. **Scripted Setup (Per Project):**
   - Link project with `vercel link`
   - Configure environment variables with `vercel env`
   - Pull config with `vercel pull`
   - Deploy with `vercel deploy`

3. **CI/CD (Ongoing):**
   - Automate deployments via GitHub Actions
   - Use `vercel deploy --prod` for production
   - Use `vercel deploy` for preview on PRs

4. **MCP for Interactive (Development):**
   - Use Vercel MCP via Claude Code for quick tasks
   - Deploy, check logs, update config via natural language
   - Perfect for troubleshooting and exploration

---

## Quick Reference

### Essential Commands

```bash
# Setup
vercel link --yes --token $TOKEN
vercel env pull .env.local --token $TOKEN

# Deploy
vercel deploy --prod --token $TOKEN

# Environment
echo "value" | vercel env add KEY production --force --token $TOKEN
vercel env ls production --token $TOKEN

# Integrations
vercel integration add supabase --token $TOKEN
vercel integration list --token $TOKEN

# Logs
vercel logs --follow --token $TOKEN

# Help
vercel --help
vercel deploy --help
```

### Useful Aliases

Add to `.bashrc` or `.zshrc`:
```bash
alias vdeploy='vercel deploy --prod --token $VERCEL_TOKEN'
alias venv='vercel env ls production --token $VERCEL_TOKEN'
alias vlogs='vercel logs --follow --token $VERCEL_TOKEN'
alias vpull='vercel env pull .env.local --token $VERCEL_TOKEN'
```

---

## Additional Resources

- **Vercel CLI Docs:** https://vercel.com/docs/cli
- **Vercel REST API:** https://vercel.com/docs/rest-api
- **Vercel MCP:** https://mcp.vercel.com
- **Integration Marketplace:** https://vercel.com/integrations
- **Setup Script:** [scripts/setup-vercel-complete.sh](../scripts/setup-vercel-complete.sh)
- **Master Plan:** [docs/VERCEL_INTEGRATIONS_MASTER_PLAN.md](./VERCEL_INTEGRATIONS_MASTER_PLAN.md)

---

**Last Updated:** November 11, 2025
**Maintainer:** Real Estate Platform Team
**Questions:** Check Vercel Discord or GitHub Issues
