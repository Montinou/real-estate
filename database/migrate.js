#!/usr/bin/env node

/**
 * Database Migration Runner
 * Executes SQL migration files in order
 */

const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/real_estate_cordoba'
});

/**
 * Run all migrations in order
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...\n');

    // Connect to database
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${sqlFiles.length} migration files\n`);

    // Run each migration
    for (const file of sqlFiles) {
      // Check if already executed
      const result = await client.query(
        'SELECT * FROM migrations WHERE filename = $1',
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`📝 Running ${file}...`);

      // Read and execute SQL
      const sqlPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(sqlPath, 'utf8');

      try {
        await client.query(sql);

        // Record migration
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );

        console.log(`✅ ${file} executed successfully\n`);
      } catch (error) {
        console.error(`❌ Error in ${file}:`, error.message);
        throw error;
      }
    }

    // Verify database setup
    console.log('🔍 Verifying database setup...\n');

    const tables = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      ORDER BY tablename
    `);

    console.log('Tables created:');
    tables.rows.forEach(row => {
      console.log(`  ✅ ${row.tablename}`);
    });

    // Check extensions
    const extensions = await client.query(`
      SELECT extname FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'postgis', 'pg_trgm')
    `);

    console.log('\nExtensions enabled:');
    extensions.rows.forEach(row => {
      console.log(`  ✅ ${row.extname}`);
    });

    // Count sources
    const sources = await client.query('SELECT COUNT(*) as count FROM sources');
    console.log(`\n📊 Data sources configured: ${sources.rows[0].count}`);

    console.log('\n🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Check if database exists
async function checkDatabase() {
  const dbName = process.env.DATABASE_NAME || 'real_estate_cordoba';
  const checkClient = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default database
  });

  try {
    await checkClient.connect();

    const result = await checkClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`📦 Creating database ${dbName}...`);
      await checkClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database ${dbName} created\n`);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    throw error;
  } finally {
    await checkClient.end();
  }
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   Real Estate Scraper - DB Migration');
  console.log('═══════════════════════════════════════\n');

  try {
    await checkDatabase();
    await runMigrations();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runMigrations, checkDatabase };