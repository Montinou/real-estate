#!/usr/bin/env node

/**
 * Monitor del Sistema de Scraping
 * Muestra estadísticas en tiempo real
 */

const { Client } = require('pg');
require('dotenv').config();

const db = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/real_estate_cordoba'
});

async function showStats() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        MONITOR DE PROPIEDADES INMOBILIARIAS           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  // Estadísticas generales
  const stats = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM properties) as total_properties,
      (SELECT COUNT(*) FROM raw_listings) as total_raw,
      (SELECT COUNT(*) FROM raw_listings WHERE processing_status = 'pending') as pending,
      (SELECT COUNT(*) FROM raw_listings WHERE processing_status = 'processed') as processed,
      (SELECT COUNT(*) FROM raw_listings WHERE processing_status = 'error') as errors,
      (SELECT COUNT(*) FROM property_images) as total_images,
      (SELECT COUNT(DISTINCT duplicate_cluster_id) FROM properties WHERE duplicate_cluster_id IS NOT NULL) as duplicate_clusters
  `);

  const s = stats.rows[0];

  console.log('📊 ESTADÍSTICAS GENERALES');
  console.log('─────────────────────────');
  console.log(`🏠 Propiedades únicas: ${s.total_properties}`);
  console.log(`📝 Listings totales: ${s.total_raw}`);
  console.log(`⏳ Pendientes de procesar: ${s.pending}`);
  console.log(`✅ Procesados: ${s.processed}`);
  console.log(`❌ Con errores: ${s.errors}`);
  console.log(`🖼️ Imágenes: ${s.total_images}`);
  console.log(`🔄 Clusters de duplicados: ${s.duplicate_clusters}`);
  console.log('');

  // Estadísticas por fuente
  const sources = await db.query(`
    SELECT
      s.display_name,
      COUNT(r.id) as total,
      SUM(CASE WHEN r.processing_status = 'processed' THEN 1 ELSE 0 END) as processed,
      MAX(r.scraped_at) as last_scrape
    FROM sources s
    LEFT JOIN raw_listings r ON s.id = r.source_id
    GROUP BY s.id, s.display_name
    ORDER BY total DESC
  `);

  console.log('📡 ESTADÍSTICAS POR FUENTE');
  console.log('────────────────────────────');
  for (const source of sources.rows) {
    const lastScrape = source.last_scrape
      ? new Date(source.last_scrape).toLocaleString('es-AR')
      : 'Nunca';
    console.log(`${source.display_name}:`);
    console.log(`  Total: ${source.total || 0}`);
    console.log(`  Procesados: ${source.processed || 0}`);
    console.log(`  Último scraping: ${lastScrape}`);
  }
  console.log('');

  // Estadísticas por tipo de propiedad
  const types = await db.query(`
    SELECT
      property_type,
      operation_type,
      COUNT(*) as count,
      ROUND(AVG(price_usd)) as avg_price_usd,
      ROUND(MIN(price_usd)) as min_price_usd,
      ROUND(MAX(price_usd)) as max_price_usd
    FROM properties
    WHERE status = 'active'
    GROUP BY property_type, operation_type
    ORDER BY count DESC
    LIMIT 10
  `);

  console.log('🏢 TOP 10 TIPOS DE PROPIEDAD');
  console.log('────────────────────────────');
  console.log('Tipo            | Op    | Cant | Precio Promedio USD');
  console.log('────────────────┼───────┼──────┼────────────────────');

  for (const type of types.rows) {
    const typeStr = type.property_type.padEnd(15);
    const opStr = type.operation_type.padEnd(5);
    const countStr = type.count.toString().padEnd(4);
    const priceStr = type.avg_price_usd ? `$${type.avg_price_usd.toLocaleString()}` : 'N/A';
    console.log(`${typeStr} | ${opStr} | ${countStr} | ${priceStr}`);
  }
  console.log('');

  // Estadísticas por ubicación
  const locations = await db.query(`
    SELECT
      city,
      neighborhood,
      COUNT(*) as count
    FROM properties
    WHERE city IS NOT NULL
    GROUP BY city, neighborhood
    ORDER BY count DESC
    LIMIT 5
  `);

  console.log('📍 TOP 5 UBICACIONES');
  console.log('────────────────────');
  for (const loc of locations.rows) {
    const location = loc.neighborhood
      ? `${loc.city} - ${loc.neighborhood}`
      : loc.city;
    console.log(`${location}: ${loc.count} propiedades`);
  }
  console.log('');

  // Últimas propiedades agregadas
  const latest = await db.query(`
    SELECT
      title,
      price,
      currency,
      city,
      created_at
    FROM properties
    ORDER BY created_at DESC
    LIMIT 5
  `);

  console.log('🆕 ÚLTIMAS PROPIEDADES AGREGADAS');
  console.log('──────────────────────────────────');
  for (const prop of latest.rows) {
    const price = prop.price
      ? `${prop.currency} ${prop.price.toLocaleString()}`
      : 'Sin precio';
    const title = prop.title?.substring(0, 50) || 'Sin título';
    const time = new Date(prop.created_at).toLocaleString('es-AR');
    console.log(`• ${title}`);
    console.log(`  ${price} | ${prop.city || 'Sin ubicación'}`);
    console.log(`  ${time}`);
  }
  console.log('');

  // Estado del sistema
  const systemStatus = await db.query(`
    SELECT
      pg_database_size('real_estate_cordoba') as db_size,
      (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections
  `);

  const dbSizeMB = (systemStatus.rows[0].db_size / 1024 / 1024).toFixed(2);

  console.log('⚙️ ESTADO DEL SISTEMA');
  console.log('────────────────────');
  console.log(`💾 Tamaño de base de datos: ${dbSizeMB} MB`);
  console.log(`🔌 Conexiones activas: ${systemStatus.rows[0].active_connections}`);
  console.log(`📅 Última actualización: ${new Date().toLocaleString('es-AR')}`);

  // Recomendaciones
  console.log('');
  console.log('💡 RECOMENDACIONES');
  console.log('─────────────────');

  if (s.pending > 100) {
    console.log('⚠️ Tienes muchos listings pendientes. Ejecuta:');
    console.log('   node src/pipeline/processor.js');
  }

  if (s.errors > 10) {
    console.log('⚠️ Hay listings con errores. Revisa:');
    console.log('   SELECT error_message FROM raw_listings WHERE processing_status = \'error\'');
  }

  if (s.duplicate_clusters > 100) {
    console.log('⚠️ Muchos duplicados detectados. Considera revisar:');
    console.log('   SELECT * FROM property_duplicates');
  }

  console.log('');
  console.log('──────────────────────────────────────────────────────────');
  console.log('Presiona Ctrl+C para salir | Actualización cada 10 segundos');
}

async function monitor() {
  try {
    await db.connect();
    console.log('Conectando a la base de datos...');

    // Actualizar cada 10 segundos
    setInterval(async () => {
      try {
        await showStats();
      } catch (error) {
        console.error('Error actualizando estadísticas:', error.message);
      }
    }, 10000);

    // Primera ejecución
    await showStats();

  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    console.log('');
    console.log('Asegúrate de que PostgreSQL esté corriendo:');
    console.log('  docker-compose up -d postgres');
    process.exit(1);
  }
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
  console.log('\n\n👋 Cerrando monitor...');
  await db.end();
  process.exit(0);
});

// Ejecutar
monitor();