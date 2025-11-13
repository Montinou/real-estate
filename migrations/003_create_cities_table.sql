-- Migration 003: Create cities table
-- Second-level administrative divisions

CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  slug VARCHAR(100) NOT NULL,
  location GEOGRAPHY(POINT, 4326),        -- Centro de la ciudad
  boundary GEOGRAPHY(MULTIPOLYGON, 4326), -- Límites de la ciudad
  population INTEGER,
  area_km2 DECIMAL(10,2),
  timezone VARCHAR(50),                   -- Puede diferir del país
  postal_codes VARCHAR(255)[],            -- Array de códigos postales
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(state_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cities_location ON cities USING GIST(location) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cities_boundary ON cities USING GIST(boundary) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cities_postal_codes ON cities USING GIN(postal_codes) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales - CABA como ciudad principal
INSERT INTO cities (state_id, name, slug, population)
SELECT
  s.id,
  '{"es": "Ciudad Autónoma de Buenos Aires", "en": "Autonomous City of Buenos Aires"}'::jsonb,
  'caba',
  3075646
FROM states s
JOIN countries c ON s.country_id = c.id
WHERE c.code = 'AR' AND s.code = 'CF'
ON CONFLICT (state_id, slug) DO NOTHING;

-- Otras ciudades importantes de Argentina
INSERT INTO cities (state_id, name, slug, population)
SELECT
  s.id,
  unnest(ARRAY[
    '{"es": "La Plata", "en": "La Plata"}'::jsonb,
    '{"es": "Mar del Plata", "en": "Mar del Plata"}'::jsonb
  ]),
  unnest(ARRAY['la-plata', 'mar-del-plata']),
  unnest(ARRAY[799523, 614350])
FROM states s
JOIN countries c ON s.country_id = c.id
WHERE c.code = 'AR' AND s.code = 'BA'
ON CONFLICT (state_id, slug) DO NOTHING;

INSERT INTO cities (state_id, name, slug, population)
SELECT
  s.id,
  '{"es": "Córdoba", "en": "Cordoba"}'::jsonb,
  'cordoba',
  1391000
FROM states s
JOIN countries c ON s.country_id = c.id
WHERE c.code = 'AR' AND s.code = 'CO'
ON CONFLICT (state_id, slug) DO NOTHING;

INSERT INTO cities (state_id, name, slug, population)
SELECT
  s.id,
  '{"es": "Rosario", "en": "Rosario"}'::jsonb,
  'rosario',
  948312
FROM states s
JOIN countries c ON s.country_id = c.id
WHERE c.code = 'AR' AND s.code = 'SF'
ON CONFLICT (state_id, slug) DO NOTHING;

INSERT INTO cities (state_id, name, slug, population)
SELECT
  s.id,
  '{"es": "Mendoza", "en": "Mendoza"}'::jsonb,
  'mendoza',
  115041
FROM states s
JOIN countries c ON s.country_id = c.id
WHERE c.code = 'AR' AND s.code = 'MZ'
ON CONFLICT (state_id, slug) DO NOTHING;

-- Comments
COMMENT ON TABLE cities IS 'Second-level administrative divisions';
COMMENT ON COLUMN cities.postal_codes IS 'Array of postal/zip codes for the city';
