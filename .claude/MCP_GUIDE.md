# MCP Servers Guide - Real Estate Platform

**Last Updated:** November 11, 2025

Model Context Protocol (MCP) servers allow Claude Code to interact directly with your infrastructure through natural language commands.

---

## 🔧 Configured MCP Servers

### 1. Neon MCP Server
**Purpose:** Manage Neon PostgreSQL database directly from Claude Code

**Natural Language Commands:**
```
"List all tables in my database"
"Show me the schema for the properties table"
"Run this query: SELECT COUNT(*) FROM properties WHERE city = 'Córdoba'"
"Create a new table called price_alerts"
"Enable PostGIS extension" (already done!)
"Show me database size and usage"
```

**Available Tools:**
- `neon_list_databases` - List all databases in project
- `neon_list_branches` - List all database branches
- `neon_create_branch` - Create database branch for testing
- `neon_run_query` - Execute SQL queries
- `neon_get_connection_string` - Get connection strings
- `neon_list_tables` - Show all tables

**Configuration:** Uses `NEON_API_KEY` from environment variables

---

### 2. Vercel MCP Server
**Purpose:** Deploy and manage Vercel project

**Natural Language Commands:**
```
"Deploy to production"
"Show me recent deployments"
"List all environment variables"
"Add GEMINI_API_KEY environment variable to production"
"Show deployment logs for the latest build"
"Cancel the current deployment"
"Get domain configuration"
```

**Available Tools:**
- `vercel_deploy` - Trigger new deployment
- `vercel_list_deployments` - Show recent deployments
- `vercel_get_deployment` - Get deployment details
- `vercel_cancel_deployment` - Cancel running deployment
- `vercel_list_env_vars` - List environment variables
- `vercel_create_env_var` - Add new environment variable
- `vercel_delete_env_var` - Remove environment variable
- `vercel_get_logs` - Fetch deployment logs
- `vercel_list_domains` - Show configured domains

**Configuration:** Automatically authenticated via Vercel CLI

---

### 3. Upstash MCP Server
**Purpose:** Interact with Upstash Redis for caching and queues

**Natural Language Commands:**
```
"Clear all Redis cache"
"Show me all keys in Redis"
"Get the value of cache key 'search:Cordoba:apartments'"
"Set a cache key 'test' with value 'hello' that expires in 60 seconds"
"Delete cache key 'old_search_results'"
"Show Redis database info"
```

**Available Tools:**
- `redis_get` - Get value by key
- `redis_set` - Set key-value pair
- `redis_del` - Delete key
- `redis_keys` - List all keys matching pattern
- `redis_flushall` - Clear entire cache
- `redis_ttl` - Check time-to-live for key
- `redis_expire` - Set expiration time
- `redis_info` - Get database information

**Configuration:** Uses `KV_REST_API_URL` and `KV_REST_API_TOKEN` from environment variables

---

## 🚀 Quick Start Examples

### Example 1: Database Management with Neon MCP

**You:** "Show me all properties in Córdoba with price over 100,000"

**Claude Code will:**
1. Connect to Neon via MCP
2. Execute: `SELECT * FROM properties WHERE city = 'Córdoba' AND price > 100000 LIMIT 50`
3. Return formatted results

---

### Example 2: Deployment with Vercel MCP

**You:** "Deploy my changes to production and show me the deployment status"

**Claude Code will:**
1. Trigger deployment via Vercel MCP
2. Monitor deployment progress
3. Show build logs if deployment fails
4. Provide deployment URL when successful

---

### Example 3: Cache Management with Upstash MCP

**You:** "Clear all search caches older than 1 hour"

**Claude Code will:**
1. List all keys matching `search:*`
2. Check TTL for each key
3. Delete keys with TTL < 3600 seconds
4. Report how many keys were deleted

---

## 🔐 Environment Variables Required

Make sure these are in your `.env.local`:

```bash
# Neon MCP (get from Neon Console > Account > API Keys)
NEON_API_KEY=your-neon-api-key

# Upstash MCP (already configured)
KV_REST_API_URL=https://stunning-gnat-35694.upstash.io
KV_REST_API_TOKEN=AYtuAAIncDI2MTFiMWYyYmUxYTE0NzBmOTNlZGViZWZkOTk5MTE0Y3AyMzU2OTQ

# Vercel (automatically configured via CLI)
VERCEL_TOKEN=xlZfF4ANIRFDqJDBLSlAWRMp
```

---

## 🧪 Testing MCP Servers

After configuring, restart Claude Code and try these test commands:

### Test Neon MCP:
```
"List all tables in my database"
```
Expected: Should show `properties`, `price_history`, `property_duplicates`

### Test Vercel MCP:
```
"Show me my recent deployments"
```
Expected: List of recent proptech-ai deployments

### Test Upstash MCP:
```
"Show me all keys in Redis"
```
Expected: List of cached keys (might be empty initially)

---

## 📝 Common Tasks via MCP

### Database Operations
```
"Create a backup branch of my database"
"Show me the size of my database"
"Export properties table to CSV"
"Run database migrations"
```

### Deployment Operations
```
"Deploy to preview environment"
"Rollback to previous deployment"
"Show me production environment variables"
"Enable Vercel Analytics"
```

### Cache Operations
```
"Show me cache hit rate"
"Warm up cache with top 10 searches"
"Clear expired cache entries"
"Monitor Redis memory usage"
```

---

## 🔍 Troubleshooting

### MCP Server Not Responding

**Check environment variables:**
```bash
echo $NEON_API_KEY
echo $KV_REST_API_URL
echo $VERCEL_TOKEN
```

**Restart Claude Code** after adding new MCP servers or environment variables.

### Permission Denied Errors

Make sure API keys have correct permissions:
- **Neon API Key:** Read + Write access
- **Vercel Token:** Deploy access
- **Upstash Token:** Read + Write access

### Connection Timeouts

MCP servers use `npx` to run on-demand. First run might be slower while downloading packages.

---

## 🌟 Advanced Usage

### Chaining MCP Commands

**You:** "Query my database for properties in Córdoba, cache the results in Redis with a 5-minute expiration, then deploy the updated cache logic to Vercel"

**Claude Code will:**
1. Use Neon MCP to query database
2. Use Upstash MCP to cache results
3. Use Vercel MCP to deploy changes
4. Verify each step completed successfully

### Automated Workflows

**You:** "Every time I update the properties table, clear the search cache and redeploy"

**Claude Code can:**
- Set up database triggers via Neon MCP
- Configure cache invalidation via Upstash MCP
- Automate deployments via Vercel MCP

---

## 📚 Additional Resources

- **Neon MCP Docs:** https://neon.tech/docs/mcp
- **Vercel MCP Docs:** https://vercel.com/docs/mcp
- **Upstash MCP Docs:** https://upstash.com/docs/mcp
- **MCP Protocol:** https://modelcontextprotocol.io

---

## 🎓 Pro Tips

1. **Be Specific:** Instead of "check database", say "show me row count for properties table"
2. **Use Natural Language:** MCPs understand context - no need for exact API syntax
3. **Chain Operations:** You can request multiple MCP operations in a single prompt
4. **Error Handling:** If MCP fails, Claude Code will show error and suggest fixes
5. **Dry Run:** Ask "what would happen if..." before running destructive operations

---

**Ready to use MCPs!** Just ask Claude Code to perform any of the operations above in natural language. 🚀
