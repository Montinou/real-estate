import * as cheerio from 'cheerio';

const html = await (await fetch('https://www.properati.com.ar/s/capital-federal/departamento/venta', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
})).text();

const $ = cheerio.load(html);
const snippets = $('.snippet').toArray();
console.log('Snippets found:', snippets.length);

if (snippets.length > 0) {
  const first = $(snippets[0]);
  console.log('\n=== First snippet structure ===');
  console.log('Has onclick:', first.attr('onclick') || 'NO');
  console.log('Has href:', first.attr('href') || 'NO');
  console.log('Link inside (a tag):', first.find('a').first().attr('href') || 'NO');
  console.log('Title:', first.find('.title').text().trim().substring(0, 60));
  console.log('Price:', first.find('.price').text().trim());
  console.log('\nSearching for property links...');
  first.find('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/propiedad/') || href && href.length > 20) {
      console.log(`  Link ${i}: ${href}`);
    }
  });
}
