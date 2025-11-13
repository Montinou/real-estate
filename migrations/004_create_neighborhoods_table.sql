-- Migration 004: Create neighborhoods table
-- Third-level divisions: neighborhoods, barrios, comunas

CREATE TABLE IF NOT EXISTS neighborhoods (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES neighborhoods(id), -- Para sub-barrios
  name JSONB NOT NULL,
  slug VARCHAR(100) NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  boundary GEOGRAPHY(POLYGON, 4326),      -- Límites exactos del barrio
  postal_codes VARCHAR(255)[],
  category VARCHAR(50),                   -- residential, commercial, mixed, industrial
  safety_score DECIMAL(3,2),              -- 0.00 - 10.00
  walkability_score DECIMAL(3,2),         -- 0.00 - 10.00
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(city_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON neighborhoods(city_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neighborhoods_parent ON neighborhoods(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neighborhoods_slug ON neighborhoods(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neighborhoods_location ON neighborhoods USING GIST(location) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neighborhoods_boundary ON neighborhoods USING GIST(boundary) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_neighborhoods_category ON neighborhoods(category) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales - Barrios principales de CABA
INSERT INTO neighborhoods (city_id, name, slug, category)
SELECT
  c.id,
  unnest(ARRAY[
    '{"es": "Palermo", "en": "Palermo"}'::jsonb,
    '{"es": "Recoleta", "en": "Recoleta"}'::jsonb,
    '{"es": "Belgrano", "en": "Belgrano"}'::jsonb,
    '{"es": "Caballito", "en": "Caballito"}'::jsonb,
    '{"es": "San Telmo", "en": "San Telmo"}'::jsonb,
    '{"es": "Villa Urquiza", "en": "Villa Urquiza"}'::jsonb,
    '{"es": "Villa del Parque", "en": "Villa del Parque"}'::jsonb,
    '{"es": "Constitución", "en": "Constitucion"}'::jsonb,
    '{"es": "Núñez", "en": "Nunez"}'::jsonb,
    '{"es": "Almagro", "en": "Almagro"}'::jsonb
  ]),
  unnest(ARRAY['palermo', 'recoleta', 'belgrano', 'caballito', 'san-telmo', 'villa-urquiza', 'villa-del-parque', 'constitucion', 'nunez', 'almagro']),
  unnest(ARRAY['mixed', 'residential', 'residential', 'residential', 'commercial', 'residential', 'residential', 'mixed', 'residential', 'mixed'])
FROM cities c
JOIN states s ON c.state_id = s.id
JOIN countries co ON s.country_id = co.id
WHERE co.code = 'AR' AND s.code = 'CF' AND c.slug = 'caba'
ON CONFLICT (city_id, slug) DO NOTHING;

-- Sub-barrios de Palermo (usando parent_id)
INSERT INTO neighborhoods (city_id, parent_id, name, slug, category)
SELECT
  c.id,
  (SELECT id FROM neighborhoods WHERE slug = 'palermo' AND city_id = c.id),
  unnest(ARRAY[
    '{"es": "Palermo Chico", "en": "Palermo Chico"}'::jsonb,
    '{"es": "Palermo Viejo", "en": "Old Palermo"}'::jsonb,
    '{"es": "Palermo Hollywood", "en": "Palermo Hollywood"}'::jsonb,
    '{"es": "Palermo Soho", "en": "Palermo Soho"}'::jsonb
  ]),
  unnest(ARRAY['palermo-chico', 'palermo-viejo', 'palermo-hollywood', 'palermo-soho']),
  unnest(ARRAY['residential', 'mixed', 'commercial', 'commercial'])
FROM cities c
JOIN states s ON c.state_id = s.id
JOIN countries co ON s.country_id = co.id
WHERE co.code = 'AR' AND s.code = 'CF' AND c.slug = 'caba'
ON CONFLICT (city_id, slug) DO NOTHING;

-- Comments
COMMENT ON TABLE neighborhoods IS 'Third-level divisions: neighborhoods, barrios, comunas';
COMMENT ON COLUMN neighborhoods.parent_id IS 'For hierarchical neighborhoods (sub-neighborhoods)';
COMMENT ON COLUMN neighborhoods.category IS 'Type: residential, commercial, mixed, industrial';
