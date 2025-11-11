/**
 * Pipeline de Procesamiento de Propiedades
 * Normaliza, deduplica y enriquece datos de propiedades
 */

const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

class PropertyProcessor {
  constructor() {
    this.db = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/real_estate_cordoba'
    });

    this.stats = {
      processed: 0,
      normalized: 0,
      deduplicated: 0,
      geocoded: 0,
      errors: 0
    };
  }

  async connect() {
    await this.db.connect();
    console.log('✅ Pipeline conectado a la base de datos');
  }

  async disconnect() {
    await this.db.end();
  }

  /**
   * Procesar todas las propiedades pendientes
   */
  async processPendingListings() {
    console.log('🔄 Buscando listings pendientes...');

    const pending = await this.db.query(`
      SELECT id, source_id, raw_data, external_id
      FROM raw_listings
      WHERE processing_status = 'pending'
      ORDER BY scraped_at ASC
      LIMIT 100
    `);

    console.log(`📊 Encontrados ${pending.rows.length} listings para procesar`);

    for (const listing of pending.rows) {
      await this.processListing(listing);
    }

    return this.stats;
  }

  /**
   * Procesar un listing individual
   */
  async processListing(listing) {
    try {
      console.log(`⚙️ Procesando ${listing.external_id}...`);

      // 1. Normalizar datos
      const normalized = await this.normalize(listing.raw_data);

      // 2. Buscar duplicados
      const duplicates = await this.findDuplicates(normalized);

      let propertyId;

      if (duplicates.length > 0) {
        // Actualizar propiedad existente
        propertyId = await this.updateProperty(duplicates[0].id, normalized);
        this.stats.deduplicated++;
      } else {
        // Crear nueva propiedad
        propertyId = await this.createProperty(normalized);
      }

      // 3. Geocodificar si no tiene coordenadas
      if (!normalized.lat && normalized.address) {
        await this.geocodeProperty(propertyId, normalized.address);
        this.stats.geocoded++;
      }

      // 4. Marcar como procesado
      await this.markAsProcessed(listing.id, propertyId);

      this.stats.processed++;
      this.stats.normalized++;

    } catch (error) {
      console.error(`❌ Error procesando ${listing.external_id}:`, error.message);
      await this.markAsError(listing.id, error.message);
      this.stats.errors++;
    }
  }

  /**
   * Normalizar datos según la fuente
   */
  async normalize(rawData) {
    // Detectar fuente por estructura de datos
    const source = this.detectSource(rawData);

    let normalized = {
      external_id: rawData.id || rawData.external_id,
      title: '',
      price: 0,
      currency: 'ARS',
      price_usd: 0,
      property_type: 'other',
      operation_type: 'sale',
      country: 'AR',
      province: '',
      city: '',
      neighborhood: '',
      address: '',
      lat: null,
      lng: null,
      total_surface: null,
      covered_surface: null,
      rooms: null,
      bedrooms: null,
      bathrooms: null,
      garage_spaces: null,
      description: '',
      features: {}
    };

    switch (source) {
      case 'mercadolibre':
        normalized = this.normalizeMercadoLibre(rawData);
        break;
      case 'properati':
        normalized = this.normalizeProperati(rawData);
        break;
      case 'zonaprop':
        normalized = this.normalizeZonaProp(rawData);
        break;
      default:
        console.warn('⚠️ Fuente desconocida, usando datos crudos');
    }

    // Calcular precio en USD
    normalized.price_usd = await this.convertToUSD(normalized.price, normalized.currency);

    // Limpiar y normalizar dirección
    normalized.address = this.normalizeAddress(normalized.address);

    // Validar tipos de datos
    normalized = this.validateTypes(normalized);

    return normalized;
  }

  /**
   * Detectar fuente de datos
   */
  detectSource(data) {
    if (data.permalink && data.permalink.includes('mercadolibre.com')) {
      return 'mercadolibre';
    }
    if (data.properati_url) {
      return 'properati';
    }
    if (data.url && data.url.includes('zonaprop.com')) {
      return 'zonaprop';
    }
    return 'unknown';
  }

  /**
   * Normalizar datos de MercadoLibre
   */
  normalizeMercadoLibre(data) {
    return {
      external_id: data.id,
      title: data.title,
      price: data.price,
      currency: data.currency_id,
      property_type: this.mapMLPropertyType(data.category_id),
      operation_type: this.mapMLOperationType(data),
      country: 'AR',
      province: data.address?.state_name || data.location?.state?.name || 'Córdoba',
      city: data.address?.city_name || data.location?.city?.name,
      neighborhood: data.location?.neighborhood?.name || '',
      address: this.buildMLAddress(data),
      lat: data.location?.latitude,
      lng: data.location?.longitude,
      total_surface: this.getMLAttribute(data, 'TOTAL_AREA'),
      covered_surface: this.getMLAttribute(data, 'COVERED_AREA'),
      rooms: this.getMLAttribute(data, 'ROOMS'),
      bedrooms: this.getMLAttribute(data, 'BEDROOMS'),
      bathrooms: this.getMLAttribute(data, 'FULL_BATHROOMS'),
      garage_spaces: this.getMLAttribute(data, 'PARKING_LOTS'),
      description: data.plain_text || data.description || '',
      features: {
        amenities: this.getMLAttribute(data, 'AMENITIES'),
        condition: data.condition,
        age: this.getMLAttribute(data, 'AGE')
      }
    };
  }

  /**
   * Normalizar datos de Properati
   */
  normalizeProperati(data) {
    return {
      external_id: data.id,
      title: data.title,
      price: data.price,
      currency: data.currency,
      property_type: this.mapProperatiType(data.property_type),
      operation_type: data.operation_type,
      country: 'AR',
      province: this.extractFromPlace(data.place_with_parent_names, 1),
      city: this.extractFromPlace(data.place_with_parent_names, 2),
      neighborhood: this.extractFromPlace(data.place_with_parent_names, 3),
      address: data.address || '',
      lat: data.lat,
      lng: data.lon,
      total_surface: data.surface_total_in_m2,
      covered_surface: data.surface_covered_in_m2,
      rooms: data.rooms,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      garage_spaces: data.parking_lots,
      description: data.description || '',
      features: {
        expenses: data.expenses,
        floor: data.floor
      }
    };
  }

  /**
   * Normalizar datos de ZonaProp
   */
  normalizeZonaProp(data) {
    // Implementar según estructura de ZonaProp
    return {};
  }

  /**
   * Buscar duplicados de una propiedad
   */
  async findDuplicates(normalized) {
    // Buscar por coordenadas (más confiable)
    if (normalized.lat && normalized.lng) {
      const result = await this.db.query(`
        SELECT id, title, address,
               ST_Distance(
                 location::geography,
                 ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
               ) as distance
        FROM properties
        WHERE ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          50  -- 50 metros de radio
        )
        AND property_type = $3
        ORDER BY distance
        LIMIT 1
      `, [normalized.lat, normalized.lng, normalized.property_type]);

      if (result.rows.length > 0) {
        return result.rows;
      }
    }

    // Buscar por dirección normalizada
    if (normalized.address && normalized.city) {
      const result = await this.db.query(`
        SELECT id, title, address,
               similarity(LOWER(address), LOWER($1)) as sim
        FROM properties
        WHERE city = $2
          AND property_type = $3
          AND similarity(LOWER(address), LOWER($1)) > 0.7
        ORDER BY sim DESC
        LIMIT 1
      `, [normalized.address, normalized.city, normalized.property_type]);

      if (result.rows.length > 0) {
        return result.rows;
      }
    }

    return [];
  }

  /**
   * Crear nueva propiedad
   */
  async createProperty(data) {
    const result = await this.db.query(`
      INSERT INTO properties (
        internal_code, title, price, currency, price_usd,
        property_type, operation_type, country, province, city,
        neighborhood, address, location,
        total_surface, covered_surface, rooms, bedrooms,
        bathrooms, garage_spaces, description, features,
        data_quality_score, status
      ) VALUES (
        $1, $2, $3, $4::currency_type, $5,
        $6::property_type, $7::operation_type, $8, $9, $10,
        $11, $12,
        CASE
          WHEN $13::FLOAT IS NOT NULL AND $14::FLOAT IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint($14::FLOAT, $13::FLOAT), 4326)
          ELSE NULL
        END,
        $15, $16, $17, $18, $19, $20, $21, $22,
        $23, 'active'::property_status
      ) RETURNING id
    `, [
      `${data.external_id}`,
      data.title,
      data.price,
      data.currency,
      data.price_usd,
      data.property_type,
      data.operation_type,
      data.country,
      data.province,
      data.city,
      data.neighborhood,
      data.address,
      data.lat,
      data.lng,
      data.total_surface,
      data.covered_surface,
      data.rooms,
      data.bedrooms,
      data.bathrooms,
      data.garage_spaces,
      data.description,
      data.features,
      this.calculateQualityScore(data)
    ]);

    return result.rows[0].id;
  }

  /**
   * Actualizar propiedad existente
   */
  async updateProperty(propertyId, data) {
    await this.db.query(`
      UPDATE properties SET
        title = $1,
        price = $2,
        price_usd = $3,
        description = $4,
        last_seen_at = NOW(),
        last_updated_at = NOW(),
        times_seen = times_seen + 1
      WHERE id = $5
    `, [
      data.title,
      data.price,
      data.price_usd,
      data.description,
      propertyId
    ]);

    return propertyId;
  }

  /**
   * Geocodificar dirección
   */
  async geocodeProperty(propertyId, address) {
    // Por ahora solo un placeholder - implementar con Nominatim
    console.log(`📍 Geocodificando: ${address}`);
    // TODO: Implementar geocodificación real
  }

  /**
   * Marcar listing como procesado
   */
  async markAsProcessed(listingId, propertyId) {
    await this.db.query(`
      UPDATE raw_listings SET
        processing_status = 'processed'::listing_status,
        processed_at = NOW(),
        property_id = $2
      WHERE id = $1
    `, [listingId, propertyId]);
  }

  /**
   * Marcar listing con error
   */
  async markAsError(listingId, errorMessage) {
    await this.db.query(`
      UPDATE raw_listings SET
        processing_status = 'error'::listing_status,
        error_message = $2,
        processing_attempts = processing_attempts + 1
      WHERE id = $1
    `, [listingId, errorMessage]);
  }

  /**
   * Convertir a USD
   */
  async convertToUSD(amount, currency) {
    if (currency === 'USD') return amount;
    if (currency === 'ARS') return amount / 1000; // Tasa aproximada
    if (currency === 'EUR') return amount * 1.1;  // Tasa aproximada
    return amount;
  }

  /**
   * Normalizar dirección
   */
  normalizeAddress(address) {
    if (!address) return '';

    return address
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/av\./g, 'avenida')
      .replace(/bv\./g, 'boulevard')
      .replace(/n°|nº|nro\./g, '')
      .trim();
  }

  /**
   * Calcular score de calidad de datos
   */
  calculateQualityScore(data) {
    let score = 0;
    let fields = 0;

    const checkField = (field, weight = 1) => {
      fields += weight;
      if (field && field !== null && field !== '') {
        score += weight;
      }
    };

    checkField(data.title, 2);
    checkField(data.price, 2);
    checkField(data.address, 2);
    checkField(data.lat);
    checkField(data.lng);
    checkField(data.total_surface);
    checkField(data.rooms);
    checkField(data.description);
    checkField(data.neighborhood);

    return fields > 0 ? score / fields : 0;
  }

  /**
   * Validar tipos de datos
   */
  validateTypes(data) {
    // Asegurar que los números sean números
    const numericFields = [
      'price', 'price_usd', 'total_surface', 'covered_surface',
      'rooms', 'bedrooms', 'bathrooms', 'garage_spaces'
    ];

    for (const field of numericFields) {
      if (data[field]) {
        data[field] = parseFloat(data[field]) || null;
      }
    }

    return data;
  }

  // Helpers para MercadoLibre
  mapMLPropertyType(categoryId) {
    const map = {
      'MLA1472': 'apartment',
      'MLA1466': 'house',
      'MLA1474': 'ph',
      'MLA1468': 'land',
      'MLA50538': 'commercial'
    };
    return map[categoryId] || 'other';
  }

  mapMLOperationType(data) {
    const operation = data.attributes?.find(a => a.id === 'OPERATION')?.value_name;
    if (operation?.toLowerCase().includes('alquiler')) return 'rent';
    if (operation?.toLowerCase().includes('venta')) return 'sale';
    return 'sale';
  }

  getMLAttribute(data, attributeId) {
    const attr = data.attributes?.find(a => a.id === attributeId);
    return attr?.value_struct?.number || parseFloat(attr?.value_name) || null;
  }

  buildMLAddress(data) {
    const parts = [];
    if (data.location?.address_line) {
      parts.push(data.location.address_line);
    }
    if (data.location?.neighborhood?.name) {
      parts.push(data.location.neighborhood.name);
    }
    if (data.address?.city_name) {
      parts.push(data.address.city_name);
    }
    return parts.filter(Boolean).join(', ');
  }

  extractFromPlace(placeString, index) {
    if (!placeString) return '';
    const parts = placeString.split('|');
    return parts[index] || '';
  }

  /**
   * Obtener estadísticas del procesamiento
   */
  getStats() {
    return this.stats;
  }
}

// Script de ejecución directa
if (require.main === module) {
  const processor = new PropertyProcessor();

  async function run() {
    try {
      console.log('🚀 Iniciando pipeline de procesamiento...\n');

      await processor.connect();
      const stats = await processor.processPendingListings();

      console.log('\n📊 Estadísticas finales:');
      console.log(`   Procesados: ${stats.processed}`);
      console.log(`   Normalizados: ${stats.normalized}`);
      console.log(`   Duplicados detectados: ${stats.deduplicated}`);
      console.log(`   Geocodificados: ${stats.geocoded}`);
      console.log(`   Errores: ${stats.errors}`);

    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      await processor.disconnect();
    }
  }

  run();
}

module.exports = PropertyProcessor;