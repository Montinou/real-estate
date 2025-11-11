-- 001_initial_schema.sql
-- PostgreSQL schema for Real Estate Scraper
-- Requires PostgreSQL 15+ with PostGIS extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create custom types
DROP TYPE IF EXISTS property_type CASCADE;
CREATE TYPE property_type AS ENUM (
    'apartment',
    'house',
    'ph',
    'land',
    'commercial',
    'office',
    'warehouse',
    'garage',
    'other'
);

DROP TYPE IF EXISTS operation_type CASCADE;
CREATE TYPE operation_type AS ENUM (
    'sale',
    'rent',
    'temp_rent'
);

DROP TYPE IF EXISTS property_status CASCADE;
CREATE TYPE property_status AS ENUM (
    'active',
    'inactive',
    'sold',
    'rented',
    'reserved',
    'suspended'
);

DROP TYPE IF EXISTS currency_type CASCADE;
CREATE TYPE currency_type AS ENUM (
    'ARS',
    'USD',
    'EUR'
);

DROP TYPE IF EXISTS listing_status CASCADE;
CREATE TYPE listing_status AS ENUM (
    'pending',
    'processing',
    'processed',
    'error',
    'skipped'
);

-- 1. SOURCES table - Data sources configuration
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    base_url TEXT NOT NULL,
    scraper_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    reliability_score DECIMAL(3,2) DEFAULT 0.80 CHECK (reliability_score >= 0 AND reliability_score <= 1),
    last_scrape_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    total_scraped INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RAW_LISTINGS table - Raw scraped data storage
CREATE TABLE IF NOT EXISTS raw_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,

    -- Raw data storage
    raw_data JSONB NOT NULL,

    -- Quick access fields for search
    title TEXT,
    price_raw VARCHAR(100),
    location_raw TEXT,

    -- Processing metadata
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    processing_status listing_status DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    processing_attempts INTEGER DEFAULT 0,
    error_message TEXT,
    property_id UUID, -- Will reference properties table after processing

    -- Tracking
    checksum VARCHAR(64), -- MD5 or SHA256 of raw_data for change detection
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    times_seen INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(source_id, external_id)
);

-- 3. PROPERTIES table - Master normalized property data
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    internal_code VARCHAR(50) UNIQUE,

    -- Property classification
    property_type property_type NOT NULL,
    operation_type operation_type NOT NULL,
    status property_status DEFAULT 'active',

    -- Location data
    country VARCHAR(2) DEFAULT 'AR',
    province VARCHAR(100),
    city VARCHAR(200),
    neighborhood VARCHAR(200),
    address TEXT,
    street_name VARCHAR(200),
    street_number VARCHAR(20),
    floor VARCHAR(20),
    apartment VARCHAR(20),
    postal_code VARCHAR(20),

    -- Geospatial data (PostGIS)
    location GEOMETRY(Point, 4326), -- WGS84 coordinate system
    location_confidence DECIMAL(3,2) CHECK (location_confidence >= 0 AND location_confidence <= 1),
    location_source VARCHAR(50), -- 'api', 'geocoding', 'manual'

    -- Pricing
    price DECIMAL(15,2),
    currency currency_type DEFAULT 'ARS',
    price_usd DECIMAL(15,2),
    price_per_m2 DECIMAL(12,2),
    expenses DECIMAL(12,2),
    expenses_currency currency_type DEFAULT 'ARS',

    -- Physical characteristics
    total_surface DECIMAL(10,2),
    covered_surface DECIMAL(10,2),
    uncovered_surface DECIMAL(10,2),
    rooms INTEGER CHECK (rooms >= 0),
    bedrooms INTEGER CHECK (bedrooms >= 0),
    bathrooms INTEGER CHECK (bathrooms >= 0),
    garage_spaces INTEGER CHECK (garage_spaces >= 0),
    age_years INTEGER CHECK (age_years >= 0),
    floors_count INTEGER CHECK (floors_count >= 0),

    -- Descriptions
    title TEXT,
    description TEXT,

    -- Additional features as JSONB
    features JSONB DEFAULT '{}', -- {amenities: [], services: [], orientation: "north", etc}

    -- Tracking metadata
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_price_change_at TIMESTAMPTZ,
    status_changed_at TIMESTAMPTZ,
    times_seen INTEGER DEFAULT 1,
    days_on_market INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (COALESCE(status_changed_at, NOW()) - first_seen_at)) / 86400
    ) STORED,

    -- Data quality
    data_quality_score DECIMAL(3,2) DEFAULT 0.50 CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by VARCHAR(100),

    -- Deduplication
    duplicate_cluster_id UUID,
    is_canonical BOOLEAN DEFAULT true,
    merge_confidence DECIMAL(3,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROPERTY_HISTORY table - Track all changes
CREATE TABLE IF NOT EXISTS property_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Full snapshot of property at this time
    snapshot JSONB NOT NULL,

    -- What changed
    changed_fields TEXT[] DEFAULT '{}',
    changes_summary JSONB DEFAULT '{}', -- {field: {old: value, new: value}}
    change_type VARCHAR(50), -- 'price_change', 'status_change', 'update', etc.

    -- Metadata
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    source_id UUID REFERENCES sources(id),
    raw_listing_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRICE_HISTORY table - Dedicated price tracking
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    price DECIMAL(15,2) NOT NULL,
    currency currency_type NOT NULL,
    price_usd DECIMAL(15,2),
    exchange_rate DECIMAL(12,4),

    price_change_amount DECIMAL(15,2),
    price_change_percentage DECIMAL(5,2),

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_id UUID REFERENCES sources(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROPERTY_DUPLICATES table - Duplicate detection and management
CREATE TABLE IF NOT EXISTS property_duplicates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    canonical_property_id UUID REFERENCES properties(id),

    -- Matching details
    similarity_score DECIMAL(5,4) CHECK (similarity_score >= 0 AND similarity_score <= 1),
    match_method VARCHAR(50), -- 'coordinates', 'address', 'fuzzy_title', 'image_hash'
    match_details JSONB DEFAULT '{}',

    -- Verification
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by VARCHAR(100),
    is_confirmed BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(property_id)
);

-- 7. PROPERTY_IMAGES table
CREATE TABLE IF NOT EXISTS property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- URLs
    original_url TEXT NOT NULL,
    local_path TEXT,
    thumbnail_url TEXT,
    card_url TEXT,
    gallery_url TEXT,
    full_url TEXT,

    -- Metadata
    display_order INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type VARCHAR(50),

    -- Deduplication
    image_hash VARCHAR(64), -- MD5/SHA256 for duplicate detection
    blur_hash VARCHAR(100), -- BlurHash for progressive loading

    -- Processing status
    is_downloaded BOOLEAN DEFAULT false,
    is_processed BOOLEAN DEFAULT false,
    download_attempts INTEGER DEFAULT 0,
    last_error TEXT,

    -- Source tracking
    source_url TEXT,
    source_attribution TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROPERTY_SOURCES table - M2M relationship between properties and sources
CREATE TABLE IF NOT EXISTS property_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    external_id VARCHAR(255) NOT NULL,
    external_url TEXT,

    -- Tracking
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    times_seen INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    -- Source-specific data
    source_data JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(property_id, source_id)
);

-- 9. SEARCH_ALERTS table - User saved searches
CREATE TABLE IF NOT EXISTS search_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User identification (if you add auth later)
    user_id VARCHAR(100),
    email VARCHAR(255),

    -- Search criteria
    name VARCHAR(200) NOT NULL,
    search_params JSONB NOT NULL, -- All search parameters

    -- Alert configuration
    is_active BOOLEAN DEFAULT true,
    frequency VARCHAR(50) DEFAULT 'daily', -- 'instant', 'daily', 'weekly'
    last_run_at TIMESTAMPTZ,
    last_match_at TIMESTAMPTZ,
    matches_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. METRICS table - System metrics and statistics
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    metric_type VARCHAR(100) NOT NULL, -- 'scrape_stats', 'api_usage', 'performance'
    metric_name VARCHAR(200) NOT NULL,
    metric_value DECIMAL(20,4),
    metric_data JSONB DEFAULT '{}',

    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_raw_listings_status ON raw_listings(processing_status);
CREATE INDEX idx_raw_listings_source_external ON raw_listings(source_id, external_id);
CREATE INDEX idx_raw_listings_data ON raw_listings USING gin(raw_data);
CREATE INDEX idx_raw_listings_scraped_at ON raw_listings(scraped_at DESC);

CREATE INDEX idx_properties_type_operation ON properties(property_type, operation_type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_province_city ON properties(province, city);
CREATE INDEX idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX idx_properties_price_usd ON properties(price_usd);
CREATE INDEX idx_properties_rooms ON properties(rooms);
CREATE INDEX idx_properties_surface ON properties(total_surface);
CREATE INDEX idx_properties_created ON properties(created_at DESC);
CREATE INDEX idx_properties_cluster ON properties(duplicate_cluster_id) WHERE duplicate_cluster_id IS NOT NULL;
CREATE INDEX idx_properties_canonical ON properties(is_canonical);

-- Full text search indexes
CREATE INDEX idx_properties_title_search ON properties USING gin(to_tsvector('spanish', title));
CREATE INDEX idx_properties_description_search ON properties USING gin(to_tsvector('spanish', description));

-- Fuzzy matching indexes
CREATE INDEX idx_properties_title_trgm ON properties USING gin(title gin_trgm_ops);
CREATE INDEX idx_properties_address_trgm ON properties USING gin(address gin_trgm_ops);

CREATE INDEX idx_property_history_property ON property_history(property_id);
CREATE INDEX idx_property_history_recorded ON property_history(recorded_at DESC);

CREATE INDEX idx_price_history_property ON price_history(property_id);
CREATE INDEX idx_price_history_recorded ON price_history(recorded_at DESC);

CREATE INDEX idx_property_duplicates_cluster ON property_duplicates(cluster_id);
CREATE INDEX idx_property_duplicates_property ON property_duplicates(property_id);

CREATE INDEX idx_property_images_property ON property_images(property_id, display_order);
CREATE INDEX idx_property_images_hash ON property_images(image_hash) WHERE image_hash IS NOT NULL;

CREATE INDEX idx_property_sources_property ON property_sources(property_id);
CREATE INDEX idx_property_sources_source ON property_sources(source_id);

-- Insert default sources
INSERT INTO sources (name, display_name, base_url, is_active) VALUES
    ('mercadolibre', 'MercadoLibre', 'https://api.mercadolibre.com', true),
    ('properati', 'Properati', 'https://www.properati.com.ar', true),
    ('zonaprop', 'ZonaProp', 'https://www.zonaprop.com.ar', false),
    ('argenprop', 'ArgenProp', 'https://www.argenprop.com', false),
    ('inmuebles24', 'Inmuebles24', 'https://www.inmuebles24.com', false)
ON CONFLICT (name) DO NOTHING;

-- Add update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raw_listings_updated_at BEFORE UPDATE ON raw_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_images_updated_at BEFORE UPDATE ON property_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_sources_updated_at BEFORE UPDATE ON property_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_alerts_updated_at BEFORE UPDATE ON search_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();