#!/usr/bin/env node
/**
 * Run Database Migrations
 * Executes all SQL migrations in order
 *
 * Usage:
 *   node scripts/run-migrations.js
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sql = neon(process.env.DATABASE_URL);

async function runMigrations() {
  console.log('🗄️  PropTech AI - Database Migrations');
  console.log('━'.repeat(50));

  try {
    // Get all migration files sorted
    const migrationsDir = join(__dirname, '../migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n📁 Found ${files.length} migration files\n`);

    for (const file of files) {
      console.log(`🔄 Running: ${file}...`);

      const filePath = join(migrationsDir, file);
      const migrationSQL = readFileSync(filePath, 'utf8');

      try {
        // Split SQL into individual statements (rough split by semicolon)
        // This handles most migrations but may need refinement for complex SQL
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          if (statement.length > 0) {
            try {
              await sql.query(statement + ';');
            } catch (err) {
              // Some statements might fail if already exist (e.g. CREATE INDEX IF NOT EXISTS)
              // Log but continue
              if (!err.message.includes('already exists')) {
                throw err;
              }
            }
          }
        }

        console.log(`✅ Completed: ${file}\n`);
      } catch (error) {
        console.error(`❌ Error in ${file}:`);
        console.error(error.message);
        console.error('\nStack:', error.stack);
        throw error;
      }
    }

    console.log('━'.repeat(50));
    console.log('✅ All migrations completed successfully!');
    console.log('━'.repeat(50));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
