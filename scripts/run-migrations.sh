#!/bin/bash
# Run Database Migrations using psql
# Usage: ./scripts/run-migrations.sh

set -e  # Exit on error

# Load environment variables
export $(cat .env.local | grep DATABASE_URL | xargs)

echo "🗄️  PropTech AI - Database Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Count migration files
migration_count=$(ls migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "📁 Found $migration_count migration files"
echo ""

# Run each migration
for file in migrations/*.sql; do
  if [ -f "$file" ]; then
    echo "🔄 Running: $(basename $file)..."
    psql "$DATABASE_URL" -f "$file" -v ON_ERROR_STOP=1 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "✅ Completed: $(basename $file)"
      echo ""
    else
      echo "❌ Error in: $(basename $file)"
      exit 1
    fi
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All migrations completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
