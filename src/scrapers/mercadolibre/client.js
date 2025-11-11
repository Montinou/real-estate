/**
 * MercadoLibre API Client
 * Handles property search and data fetching from MercadoLibre
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class MercadoLibreClient {
  constructor(options = {}) {
    this.baseURL = 'https://api.mercadolibre.com';
    this.accessToken = options.accessToken || process.env.ML_ACCESS_TOKEN;
    this.refreshToken = options.refreshToken || process.env.ML_REFRESH_TOKEN;
    this.clientId = options.clientId || process.env.ML_CLIENT_ID;
    this.clientSecret = options.clientSecret || process.env.ML_CLIENT_SECRET;

    // Rate limiting
    this.requestDelay = options.requestDelay || 1000; // 1 request per second
    this.lastRequestTime = 0;

    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      tokenRefreshes: 0
    };

    if (!this.accessToken) {
      throw new Error('ML_ACCESS_TOKEN not found. Run node src/auth/mercadolibre-auth.js first');
    }
  }

  /**
   * Rate limiting - ensure minimum delay between requests
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestDelay) {
      const waitTime = this.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(url, params = {}, retries = 3) {
    await this.rateLimit();
    this.stats.totalRequests++;

    try {
      const response = await axios.get(url, {
        params,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      this.stats.successfulRequests++;
      return response.data;

    } catch (error) {
      // Handle token expiration
      if (error.response?.status === 401 && retries > 0) {
        console.log('🔄 Token expired, refreshing...');
        await this.refreshAccessToken();
        return this.makeRequest(url, params, retries - 1);
      }

      // Handle rate limiting
      if (error.response?.status === 429) {
        console.log('⏳ Rate limited, waiting 60 seconds...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        return this.makeRequest(url, params, retries - 1);
      }

      this.stats.failedRequests++;
      console.error('❌ API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      const response = await axios.post(`${this.baseURL}/oauth/token`, {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.stats.tokenRefreshes++;

      // Update .env file
      await this.updateEnvTokens(response.data);

      console.log('✅ Token refreshed successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Failed to refresh token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update tokens in .env file
   */
  async updateEnvTokens(tokenData) {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = await fs.readFile(envPath, 'utf8');

    const updates = {
      ML_ACCESS_TOKEN: tokenData.access_token,
      ML_REFRESH_TOKEN: tokenData.refresh_token
    };

    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'gm');
      envContent = envContent.replace(regex, `${key}=${value}`);
    }

    await fs.writeFile(envPath, envContent);
  }

  /**
   * Search properties in a specific location
   */
  async searchProperties(options = {}) {
    const params = {
      category: 'MLA1459', // Real Estate category
      limit: options.limit || 50,
      offset: options.offset || 0,
      sort: options.sort || 'relevance'
    };

    // Location filters
    if (options.state) params.state = options.state;
    if (options.city) params.city = options.city;
    if (options.neighborhood) params.neighborhood = options.neighborhood;

    // Geolocation search (lat,lng,radius)
    if (options.lat && options.lng) {
      params.item_location = `lat:${options.lat}_${options.lat},lon:${options.lng}_${options.lng}`;
    }

    // Property type filters
    if (options.propertyType) {
      const typeMap = {
        'apartment': 'MLA1472', // Departamento
        'house': 'MLA1466',     // Casa
        'ph': 'MLA1474',        // PH
        'land': 'MLA1468',      // Terreno
        'commercial': 'MLA50538' // Local comercial
      };
      if (typeMap[options.propertyType]) {
        params.property_type = typeMap[options.propertyType];
      }
    }

    // Operation type
    if (options.operation === 'rent') {
      params.operation = '242074'; // Alquiler
    } else if (options.operation === 'sale') {
      params.operation = '242073'; // Venta
    }

    // Price range
    if (options.minPrice) params.price = `${options.minPrice}-*`;
    if (options.maxPrice) params.price = `*-${options.maxPrice}`;
    if (options.minPrice && options.maxPrice) {
      params.price = `${options.minPrice}-${options.maxPrice}`;
    }

    // Room filters
    if (options.rooms) params.rooms = `${options.rooms}-*`;
    if (options.bedrooms) params.bedrooms = `${options.bedrooms}-*`;

    const url = `${this.baseURL}/sites/MLA/search`;
    return this.makeRequest(url, params);
  }

  /**
   * Search properties specifically in Córdoba
   */
  async searchCordobaProperties(options = {}) {
    return this.searchProperties({
      ...options,
      state: 'TUxBUENPUmRvYmE' // Córdoba state ID
    });
  }

  /**
   * Get detailed information for a property
   */
  async getPropertyDetails(itemId) {
    const url = `${this.baseURL}/items/${itemId}`;
    const item = await this.makeRequest(url);

    // Also get description
    try {
      const descUrl = `${this.baseURL}/items/${itemId}/description`;
      const description = await this.makeRequest(descUrl);
      item.full_description = description.plain_text || description.text;
    } catch (error) {
      console.log(`No description available for ${itemId}`);
    }

    return item;
  }

  /**
   * Get seller information
   */
  async getSellerInfo(sellerId) {
    const url = `${this.baseURL}/users/${sellerId}`;
    return this.makeRequest(url);
  }

  /**
   * Get property location details
   */
  async getLocationInfo(locationId) {
    const url = `${this.baseURL}/classified_locations/${locationId}`;
    return this.makeRequest(url);
  }

  /**
   * Iterator for fetching all properties matching criteria
   */
  async *fetchAllProperties(searchOptions = {}) {
    let offset = 0;
    let hasMore = true;
    const limit = 50; // Max allowed by API

    while (hasMore) {
      console.log(`📄 Fetching properties: offset=${offset}`);

      const results = await this.searchProperties({
        ...searchOptions,
        limit,
        offset
      });

      // Yield each property with details
      for (const item of results.results) {
        try {
          // Get full details for each property
          const details = await this.getPropertyDetails(item.id);
          yield details;
        } catch (error) {
          console.error(`Error fetching details for ${item.id}:`, error.message);
          // Yield basic info even if details fail
          yield item;
        }
      }

      // Check if there are more pages
      offset += limit;
      hasMore = results.paging.total > offset && results.results.length === limit;

      // Stop if we've reached a reasonable limit
      if (offset >= 1000) {
        console.log('📊 Reached maximum offset limit (1000)');
        hasMore = false;
      }
    }
  }

  /**
   * Get all Córdoba properties
   */
  async *fetchCordobaProperties() {
    yield* this.fetchAllProperties({
      state: 'TUxBUENPUmRvYmE' // Córdoba
    });
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Parse MercadoLibre property to normalized format
   */
  parseProperty(mlProperty) {
    const parsed = {
      external_id: mlProperty.id,
      url: mlProperty.permalink,
      title: mlProperty.title,

      // Price
      price: mlProperty.price,
      currency: mlProperty.currency_id,

      // Location
      country: 'AR',
      province: mlProperty.address?.state_name || mlProperty.location?.state?.name,
      city: mlProperty.address?.city_name || mlProperty.location?.city?.name,
      neighborhood: mlProperty.location?.neighborhood?.name,
      address: this.buildAddress(mlProperty),
      lat: mlProperty.location?.latitude,
      lng: mlProperty.location?.longitude,

      // Property details
      property_type: this.mapPropertyType(mlProperty),
      operation_type: this.mapOperationType(mlProperty),

      // Physical characteristics
      total_surface: this.getAttribute(mlProperty, 'TOTAL_AREA'),
      covered_surface: this.getAttribute(mlProperty, 'COVERED_AREA'),
      rooms: this.getAttribute(mlProperty, 'ROOMS'),
      bedrooms: this.getAttribute(mlProperty, 'BEDROOMS'),
      bathrooms: this.getAttribute(mlProperty, 'FULL_BATHROOMS'),
      garage_spaces: this.getAttribute(mlProperty, 'PARKING_LOTS'),

      // Description
      description: mlProperty.full_description || '',

      // Images
      images: mlProperty.pictures?.map(pic => ({
        url: pic.secure_url || pic.url,
        width: pic.size?.split('x')[0],
        height: pic.size?.split('x')[1]
      })) || [],

      // Seller
      seller: {
        id: mlProperty.seller_id,
        name: mlProperty.seller?.nickname,
        type: mlProperty.seller?.seller_reputation?.level_id
      },

      // Metadata
      condition: mlProperty.condition,
      created_date: mlProperty.date_created,
      updated_date: mlProperty.last_updated,
      status: mlProperty.status,

      // Raw data for reference
      raw_data: mlProperty
    };

    return parsed;
  }

  /**
   * Get attribute value from ML property
   */
  getAttribute(property, attributeId) {
    const attr = property.attributes?.find(a => a.id === attributeId);
    return attr?.value_struct?.number || parseFloat(attr?.value_name) || null;
  }

  /**
   * Build address string from ML property
   */
  buildAddress(property) {
    const parts = [];

    if (property.location?.address_line) {
      parts.push(property.location.address_line);
    } else {
      if (property.address?.street_name) parts.push(property.address.street_name);
      if (property.address?.street_number) parts.push(property.address.street_number);
    }

    if (property.location?.neighborhood?.name) {
      parts.push(property.location.neighborhood.name);
    }

    if (property.address?.city_name) {
      parts.push(property.address.city_name);
    }

    return parts.filter(Boolean).join(', ');
  }

  /**
   * Map ML property type to our schema
   */
  mapPropertyType(property) {
    const category = property.category_id;
    const typeMap = {
      'MLA1472': 'apartment',  // Departamento
      'MLA1466': 'house',      // Casa
      'MLA1474': 'ph',         // PH
      'MLA1468': 'land',       // Terreno
      'MLA50538': 'commercial' // Local comercial
    };

    return typeMap[category] || 'other';
  }

  /**
   * Map ML operation type to our schema
   */
  mapOperationType(property) {
    const operation = property.attributes?.find(a => a.id === 'OPERATION')?.value_name;

    if (operation?.toLowerCase().includes('alquiler')) return 'rent';
    if (operation?.toLowerCase().includes('venta')) return 'sale';
    if (operation?.toLowerCase().includes('temporal')) return 'temp_rent';

    return 'sale'; // default
  }
}

module.exports = MercadoLibreClient;