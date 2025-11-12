#!/usr/bin/env node
import * as cheerio from 'cheerio';

const urls = [
  'https://www.properati.com.ar/s/capital-federal/departamento/venta',
  'https://www.properati.com.ar/s/capital-federal/departamento/venta?page=2',
];

for (const url of urls) {
  console.log(`\n🔍 Testing: ${url}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  const snippets = $('.snippet').toArray();
  console.log(`   Found ${snippets.length} listings`);

  // Get first 3 property URLs
  console.log('   First 3 URLs:');
  snippets.slice(0, 3).forEach((snippet, i) => {
    const href = $(snippet).find('a').first().attr('href');
    const id = href?.split('/').pop()?.substring(0, 20);
    console.log(`     ${i + 1}. ${id}`);
  });

  // Check for pagination links
  const paginationLinks = $('a[href*="page="]').toArray();
  console.log(`   Pagination links found: ${paginationLinks.length}`);
  if (paginationLinks.length > 0) {
    paginationLinks.slice(0, 3).forEach(link => {
      console.log(`     - ${$(link).attr('href')}`);
    });
  }
}
