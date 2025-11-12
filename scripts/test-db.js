#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function testDB() {
  try {
    console.log('Testing database connection...\n');

    // Count properties
    const count = await sql`SELECT COUNT(*) as total FROM properties`;
    console.log('Total properties:', count[0].total);

    // Get latest 5
    const latest = await sql`
      SELECT title, city, price, currency, created_at
      FROM properties
      ORDER BY created_at DESC
      LIMIT 5
    `;

    console.log('\nLatest 5 properties:');
    latest.forEach((prop, i) => {
      console.log(`  ${i + 1}. ${prop.title.substring(0, 50)}`);
      console.log(`     ${prop.city} - ${prop.currency} ${prop.price}`);
      console.log(`     Created: ${prop.created_at}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDB();
