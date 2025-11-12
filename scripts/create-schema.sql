-- Properties table with PostGIS support
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL, -- 'mercadolibre', 'properati', 'zonaprop'

  -- Basic info
  title TEXT,
  description TEXT,
  url TEXT,

  -- Pricing
  price DECIMAL(12, 2),
  currency TEXT DEFAULT 'ARS',
  operation_type TEXT, -- 'sale', 'rent', 'temporary_rent'

  -- Property details
  property_type TEXT, -- 'apartment', 'house', 'land', 'commercial'
  bedrooms INT,
  bathrooms INT,
  area_sqm DECIMAL(10, 2),
  covered_area_sqm DECIMAL(10, 2),

  -- Location (PostGIS)
  location GEOGRAPHY(POINT, 4326), -- Lat/Lng as geography type
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'AR',
  postal_code TEXT,

  -- Media
  images JSONB, -- Array of image URLs
  blurhash TEXT,

  -- Metadata
  features JSONB, -- Array of features (pool, garage, etc.)
  metadata JSONB, -- Source-specific data

  -- Tracking
  user_id TEXT REFERENCES neon_auth.users_sync(id), -- Property owner/agent
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'deleted'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  scraped_at TIMESTAMP,
  last_seen_at TIMESTAMP
);

-- Spatial index for location queries (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(location);

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_operation ON properties(operation_type);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type, operation_type);
CREATE INDEX IF NOT EXISTS idx_properties_user ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties
  USING GIN(to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  price DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'ARS',
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_property ON price_history(property_id, recorded_at DESC);

-- Property duplicates detection
CREATE TABLE IF NOT EXISTS property_duplicates (
  id SERIAL PRIMARY KEY,
  property_id_1 INT REFERENCES properties(id),
  property_id_2 INT REFERENCES properties(id),
  similarity_score DECIMAL(3, 2), -- 0.00 to 1.00
  method TEXT, -- 'geospatial', 'fuzzy_text', 'price', 'combined'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id_1, property_id_2)
);

CREATE INDEX IF NOT EXISTS idx_duplicates_property1 ON property_duplicates(property_id_1);
CREATE INDEX IF NOT EXISTS idx_duplicates_property2 ON property_duplicates(property_id_2);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Test query: Find properties near Córdoba city center
-- SELECT
--   id,
--   title,
--   price,
--   currency,
--   ST_Distance(
--     location,
--     ST_GeogFromText('POINT(-64.1810 -31.4201)')
--   ) / 1000 as distance_km
-- FROM properties
-- WHERE location IS NOT NULL
--   AND ST_DWithin(
--     location,
--     ST_GeogFromText('POINT(-64.1810 -31.4201)'),
--     5000  -- 5km radius
--   )
-- ORDER BY distance_km
-- LIMIT 10;
