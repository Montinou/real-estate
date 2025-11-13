-- Migration 002: Create states table
-- First-level administrative divisions (provinces, states)

CREATE TABLE IF NOT EXISTS states (
  id SERIAL PRIMARY KEY,
  country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,              -- ISO 3166-2 subdivision (CF, BA, CO)
  name JSONB NOT NULL,                    -- {"es": "Capital Federal", "en": "Federal District"}
  slug VARCHAR(100) NOT NULL,             -- capital-federal
  location GEOGRAPHY(POINT, 4326),        -- Centro geográfico
  boundary GEOGRAPHY(MULTIPOLYGON, 4326), -- Límites del estado (opcional)
  population INTEGER,                     -- Para estadísticas
  area_km2 DECIMAL(10,2),                 -- Área en km²
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(country_id, code),
  UNIQUE(country_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_states_country ON states(country_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_states_slug ON states(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_states_location ON states USING GIST(location) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales - Provincias principales de Argentina
INSERT INTO states (country_id, code, name, slug, population)
SELECT
  c.id,
  unnest(ARRAY['CF', 'BA', 'CO', 'SF', 'MZ', 'TU', 'SA', 'ER', 'MI', 'CH']),
  unnest(ARRAY[
    '{"es": "Ciudad Autónoma de Buenos Aires", "en": "Buenos Aires City"}'::jsonb,
    '{"es": "Buenos Aires", "en": "Buenos Aires Province"}'::jsonb,
    '{"es": "Córdoba", "en": "Cordoba"}'::jsonb,
    '{"es": "Santa Fe", "en": "Santa Fe"}'::jsonb,
    '{"es": "Mendoza", "en": "Mendoza"}'::jsonb,
    '{"es": "Tucumán", "en": "Tucuman"}'::jsonb,
    '{"es": "Salta", "en": "Salta"}'::jsonb,
    '{"es": "Entre Ríos", "en": "Entre Rios"}'::jsonb,
    '{"es": "Misiones", "en": "Misiones"}'::jsonb,
    '{"es": "Chaco", "en": "Chaco"}'::jsonb
  ]),
  unnest(ARRAY['caba', 'buenos-aires', 'cordoba', 'santa-fe', 'mendoza', 'tucuman', 'salta', 'entre-rios', 'misiones', 'chaco']),
  unnest(ARRAY[3075646, 17569053, 3760450, 3397532, 1885904, 1687305, 1333365, 1385961, 1280960, 1204541])
FROM countries c
WHERE c.code = 'AR'
ON CONFLICT (country_id, code) DO NOTHING;

-- Comments
COMMENT ON TABLE states IS 'First-level administrative divisions (states, provinces)';
COMMENT ON COLUMN states.location IS 'Geographic center point (latitude, longitude)';
COMMENT ON COLUMN states.boundary IS 'State boundaries as PostGIS multipolygon';
