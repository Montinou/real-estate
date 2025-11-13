-- Migration 005: Alter properties table - Add geographic columns
-- This is a NON-BREAKING migration (adds nullable columns)

-- Add new geographic foreign keys (nullable initially)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS state_id INTEGER REFERENCES states(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS neighborhood_id INTEGER REFERENCES neighborhoods(id);

-- Add PostGIS location column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Add other useful columns
ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_usd DECIMAL(15,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_properties_country_id ON properties(country_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_state_id ON properties(state_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_city_id ON properties(city_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_id ON properties(neighborhood_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(location) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_properties_price_usd ON properties(price_usd) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at);

-- Create composite index for common searches
CREATE INDEX IF NOT EXISTS idx_properties_search_composite
  ON properties(city_id, operation_type, property_type, status, price_usd)
  WHERE deleted_at IS NULL;

-- Marklegacy columns as deprecated (comments only, not removing yet)
COMMENT ON COLUMN properties.city IS 'DEPRECATED: Use city_id + JOINs instead. Will be removed in future migration.';
COMMENT ON COLUMN properties.state IS 'DEPRECATED: Use state_id + JOINs instead. Will be removed in future migration.';
COMMENT ON COLUMN properties.country IS 'DEPRECATED: Use country_id + JOINs instead. Will be removed in future migration.';
COMMENT ON COLUMN properties.neighborhood IS 'DEPRECATED: Use neighborhood_id + JOINs instead. Will be removed in future migration.';

-- Add comments to new columns
COMMENT ON COLUMN properties.location IS 'PostGIS point (lat, lng) for geographic searches';
COMMENT ON COLUMN properties.metadata IS 'Extensible JSONB field for additional data without schema changes';
COMMENT ON COLUMN properties.price_usd IS 'Normalized price in USD for cross-currency comparisons';
COMMENT ON COLUMN properties.slug IS 'URL-friendly identifier, auto-generated from title';
COMMENT ON COLUMN properties.deleted_at IS 'Soft delete timestamp';

-- Trigger for auto-generating slug
CREATE OR REPLACE FUNCTION generate_property_slug(
  p_title TEXT,
  p_id BIGINT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convertir a slug base (remover acentos y caracteres especiales)
  base_slug := lower(
    unaccent(
      regexp_replace(p_title, '[^a-zA-Z0-9áéíóúñ]+', '-', 'g')
    )
  );
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 100);

  -- Agregar ID si está disponible
  IF p_id IS NOT NULL THEN
    final_slug := base_slug || '-' || p_id;
  ELSE
    final_slug := base_slug;
  END IF;

  -- Verificar unicidad
  WHILE EXISTS (
    SELECT 1 FROM properties
    WHERE slug = final_slug
    AND (p_id IS NULL OR id != p_id)
    AND deleted_at IS NULL
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar slug en INSERT
CREATE OR REPLACE FUNCTION set_property_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_property_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Solo crear el trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_set_property_slug'
  ) THEN
    CREATE TRIGGER trigger_set_property_slug
      BEFORE INSERT ON properties
      FOR EACH ROW
      EXECUTE FUNCTION set_property_slug();
  END IF;
END $$;

-- Add trigger for updated_at if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_properties_updated_at'
  ) THEN
    CREATE TRIGGER update_properties_updated_at
      BEFORE UPDATE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMENT ON TABLE properties IS 'Main properties table with geographic normalization and PostGIS support';
