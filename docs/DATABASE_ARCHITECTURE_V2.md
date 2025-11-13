# Arquitectura de Base de Datos Escalable - PropTech AI

## Principios de Diseño

1. **Normalización sin sacrificar performance** - Tablas normalizadas + materialized views
2. **Auditoría completa** - Tracking de cambios y soft deletes
3. **Extensibilidad** - JSONB para metadata sin cambiar schema
4. **Búsqueda geográfica** - PostGIS nativo de PostgreSQL
5. **Multiidioma** - i18n desde el schema
6. **Particionamiento** - Preparado para millones de registros
7. **Zero downtime migrations** - Migraciones sin interrupciones

---

## 1. Jerarquía Geográfica (Normalizada)

### `countries` - Países
```sql
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  code CHAR(2) UNIQUE NOT NULL,           -- ISO 3166-1 alpha-2 (AR, BR, UY)
  code_alpha3 CHAR(3) UNIQUE,             -- ISO 3166-1 alpha-3 (ARG, BRA, URY)
  numeric_code CHAR(3),                   -- ISO 3166-1 numeric (032, 076, 858)
  name JSONB NOT NULL,                    -- {"es": "Argentina", "en": "Argentina", "pt": "Argentina"}
  phone_code VARCHAR(10),                 -- +54, +55, +598
  currency_code CHAR(3),                  -- ARS, BRL, UYU
  timezone VARCHAR(50),                   -- America/Argentina/Buenos_Aires
  metadata JSONB DEFAULT '{}'::jsonb,     -- Campos adicionales sin cambiar schema
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ                  -- Soft delete
);

CREATE INDEX idx_countries_code ON countries(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_countries_active ON countries(is_active) WHERE deleted_at IS NULL;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales
INSERT INTO countries (code, code_alpha3, numeric_code, name, phone_code, currency_code, timezone) VALUES
  ('AR', 'ARG', '032', '{"es": "Argentina", "en": "Argentina", "pt": "Argentina"}'::jsonb, '+54', 'ARS', 'America/Argentina/Buenos_Aires'),
  ('BR', 'BRA', '076', '{"es": "Brasil", "en": "Brazil", "pt": "Brasil"}'::jsonb, '+55', 'BRL', 'America/Sao_Paulo'),
  ('UY', 'URY', '858', '{"es": "Uruguay", "en": "Uruguay", "pt": "Uruguai"}'::jsonb, '+598', 'UYU', 'America/Montevideo'),
  ('CL', 'CHL', '152', '{"es": "Chile", "en": "Chile", "pt": "Chile"}'::jsonb, '+56', 'CLP', 'America/Santiago'),
  ('PY', 'PRY', '600', '{"es": "Paraguay", "en": "Paraguay", "pt": "Paraguai"}'::jsonb, '+595', 'PYG', 'America/Asuncion');

COMMENT ON TABLE countries IS 'ISO 3166 country codes with i18n support';
COMMENT ON COLUMN countries.name IS 'JSONB with translations: {"es": "", "en": "", "pt": ""}';
```

### `states` - Estados/Provincias
```sql
CREATE TABLE states (
  id SERIAL PRIMARY KEY,
  country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,              -- ISO 3166-2 subdivision (CF, BA, CO)
  name JSONB NOT NULL,                    -- {"es": "Capital Federal", "en": "Federal District"}
  slug VARCHAR(100) NOT NULL,             -- capital-federal
  -- PostGIS: centroide del estado
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

CREATE INDEX idx_states_country ON states(country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_states_slug ON states(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_states_location ON states USING GIST(location) WHERE deleted_at IS NULL;
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales Argentina
INSERT INTO states (country_id, code, name, slug, population) VALUES
  ((SELECT id FROM countries WHERE code = 'AR'), 'CF', '{"es": "Capital Federal", "en": "Buenos Aires City"}'::jsonb, 'capital-federal', 3075646),
  ((SELECT id FROM countries WHERE code = 'AR'), 'BA', '{"es": "Buenos Aires", "en": "Buenos Aires Province"}'::jsonb, 'buenos-aires', 17569053),
  ((SELECT id FROM countries WHERE code = 'AR'), 'CO', '{"es": "Córdoba", "en": "Cordoba"}'::jsonb, 'cordoba', 3760450),
  ((SELECT id FROM countries WHERE code = 'AR'), 'SF', '{"es": "Santa Fe", "en": "Santa Fe"}'::jsonb, 'santa-fe', 3397532),
  ((SELECT id FROM countries WHERE code = 'AR'), 'MZ', '{"es": "Mendoza", "en": "Mendoza"}'::jsonb, 'mendoza', 1885904);

COMMENT ON TABLE states IS 'First-level administrative divisions (states, provinces)';
```

### `cities` - Ciudades
```sql
CREATE TABLE cities (
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

CREATE INDEX idx_cities_state ON cities(state_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cities_slug ON cities(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_cities_location ON cities USING GIST(location) WHERE deleted_at IS NULL;
CREATE INDEX idx_cities_boundary ON cities USING GIST(boundary) WHERE deleted_at IS NULL;
CREATE INDEX idx_cities_postal_codes ON cities USING GIN(postal_codes) WHERE deleted_at IS NULL;
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales CABA como ciudad única
INSERT INTO cities (state_id, name, slug, population) VALUES
  ((SELECT id FROM states WHERE code = 'CF'), '{"es": "Ciudad Autónoma de Buenos Aires", "en": "Autonomous City of Buenos Aires"}'::jsonb, 'caba', 3075646);

COMMENT ON TABLE cities IS 'Second-level administrative divisions';
COMMENT ON COLUMN cities.postal_codes IS 'Array of postal/zip codes for the city';
```

### `neighborhoods` - Barrios/Comunas
```sql
CREATE TABLE neighborhoods (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES neighborhoods(id), -- Para sub-barrios
  name JSONB NOT NULL,
  slug VARCHAR(100) NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  boundary GEOGRAPHY(POLYGON, 4326),      -- Límites exactos del barrio
  postal_codes VARCHAR(255)[],
  -- Clasificación del barrio
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

CREATE INDEX idx_neighborhoods_city ON neighborhoods(city_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_neighborhoods_parent ON neighborhoods(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_neighborhoods_slug ON neighborhoods(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_neighborhoods_location ON neighborhoods USING GIST(location) WHERE deleted_at IS NULL;
CREATE INDEX idx_neighborhoods_boundary ON neighborhoods USING GIST(boundary) WHERE deleted_at IS NULL;
CREATE INDEX idx_neighborhoods_category ON neighborhoods(category) WHERE deleted_at IS NULL;
CREATE TRIGGER update_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales - Barrios de CABA
INSERT INTO neighborhoods (city_id, name, slug, category) VALUES
  ((SELECT id FROM cities WHERE slug = 'caba'), '{"es": "Palermo", "en": "Palermo"}'::jsonb, 'palermo', 'mixed'),
  ((SELECT id FROM cities WHERE slug = 'caba'), '{"es": "Recoleta", "en": "Recoleta"}'::jsonb, 'recoleta', 'residential'),
  ((SELECT id FROM cities WHERE slug = 'caba'), '{"es": "Belgrano", "en": "Belgrano"}'::jsonb, 'belgrano', 'residential'),
  ((SELECT id FROM cities WHERE slug = 'caba'), '{"es": "Caballito", "en": "Caballito"}'::jsonb, 'caballito', 'residential'),
  ((SELECT id FROM cities WHERE slug = 'caba'), '{"es": "San Telmo", "en": "San Telmo"}'::jsonb, 'san-telmo', 'commercial');

-- Sub-barrios de Palermo (usando parent_id)
INSERT INTO neighborhoods (city_id, parent_id, name, slug, category) VALUES
  ((SELECT id FROM cities WHERE slug = 'caba'), (SELECT id FROM neighborhoods WHERE slug = 'palermo'), '{"es": "Palermo Chico", "en": "Palermo Chico"}'::jsonb, 'palermo-chico', 'residential'),
  ((SELECT id FROM cities WHERE slug = 'caba'), (SELECT id FROM neighborhoods WHERE slug = 'palermo'), '{"es": "Palermo Viejo", "en": "Old Palermo"}'::jsonb, 'palermo-viejo', 'mixed'),
  ((SELECT id FROM cities WHERE slug = 'caba'), (SELECT id FROM neighborhoods WHERE slug = 'palermo'), '{"es": "Palermo Hollywood", "en": "Palermo Hollywood"}'::jsonb, 'palermo-hollywood', 'commercial'),
  ((SELECT id FROM cities WHERE slug = 'caba'), (SELECT id FROM neighborhoods WHERE slug = 'palermo'), '{"es": "Palermo Soho", "en": "Palermo Soho"}'::jsonb, 'palermo-soho', 'commercial');

COMMENT ON TABLE neighborhoods IS 'Third-level divisions: neighborhoods, barrios, comunas';
COMMENT ON COLUMN neighborhoods.parent_id IS 'For hierarchical neighborhoods (sub-neighborhoods)';
```

---

## 2. Tabla Principal: Properties (Rediseñada)

```sql
CREATE TABLE properties (
  id BIGSERIAL PRIMARY KEY,               -- BIGSERIAL para millones de registros
  external_id VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) NOT NULL,            -- properati, mercadolibre, zonaprop

  -- Relaciones geográficas normalizadas
  country_id INTEGER REFERENCES countries(id),
  state_id INTEGER REFERENCES states(id),
  city_id INTEGER REFERENCES cities(id),
  neighborhood_id INTEGER REFERENCES neighborhoods(id),

  -- Ubicación exacta
  location GEOGRAPHY(POINT, 4326),        -- lat/lng de la propiedad
  address TEXT,                           -- Dirección completa
  address_components JSONB,               -- {street, number, floor, apartment, zip_code}

  -- Información básica
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,

  -- Precio
  price DECIMAL(15,2),
  currency CHAR(3) NOT NULL,              -- ISO 4217 (USD, ARS, EUR)
  price_usd DECIMAL(15,2),                -- Precio normalizado a USD (para comparar)
  price_history JSONB DEFAULT '[]'::jsonb,-- [{date, price, currency}, ...]

  -- Tipo y operación
  operation_type VARCHAR(20) NOT NULL,    -- sale, rent, temporary_rent
  property_type VARCHAR(50) NOT NULL,     -- apartment, house, land, commercial, office
  property_subtype VARCHAR(50),           -- studio, duplex, penthouse, etc.

  -- Características físicas
  bedrooms INTEGER,
  bathrooms INTEGER,
  half_bathrooms INTEGER,                 -- Toilettes
  parking_spaces INTEGER,
  area_sqm DECIMAL(10,2),                 -- Área total
  covered_area_sqm DECIMAL(10,2),         -- Área cubierta
  uncovered_area_sqm DECIMAL(10,2),       -- Área descubierta
  lot_size_sqm DECIMAL(10,2),             -- Tamaño del lote (para casas)
  floor INTEGER,                          -- Piso
  total_floors INTEGER,                   -- Total de pisos del edificio
  units_per_floor INTEGER,
  building_age INTEGER,                   -- Antigüedad en años

  -- Features (normalizado)
  features JSONB DEFAULT '[]'::jsonb,     -- ["pool", "gym", "24h_security", "balcony"]
  amenities JSONB DEFAULT '{}'::jsonb,    -- {pool: true, gym: true, doorman: true}

  -- Imágenes y multimedia
  images JSONB DEFAULT '[]'::jsonb,       -- [{url, title, order, width, height}, ...]
  videos JSONB DEFAULT '[]'::jsonb,
  virtual_tour_url TEXT,
  floor_plan_url TEXT,

  -- Metadata extensible
  metadata JSONB DEFAULT '{}'::jsonb,     -- Cualquier dato adicional sin cambiar schema

  -- Estado y visibilidad
  status VARCHAR(20) DEFAULT 'active',    -- active, inactive, sold, rented, pending
  is_featured BOOLEAN DEFAULT false,      -- Destacado
  is_verified BOOLEAN DEFAULT false,      -- Verificado por el equipo
  quality_score DECIMAL(3,2),             -- 0.00 - 10.00 (ML model)

  -- SEO y URLs
  slug VARCHAR(255) UNIQUE,               -- URL-friendly: palermo-2-ambientes-balcon-123

  -- Timestamps y auditoría
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_published_at TIMESTAMPTZ,
  sold_rented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT chk_price_positive CHECK (price >= 0),
  CONSTRAINT chk_area_positive CHECK (area_sqm >= 0),
  CONSTRAINT chk_quality_score CHECK (quality_score >= 0 AND quality_score <= 10)
);

-- Índices críticos para performance
CREATE INDEX idx_properties_external_id ON properties(external_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_source ON properties(source) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_country ON properties(country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_state ON properties(state_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_city ON properties(city_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_neighborhood ON properties(neighborhood_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_location ON properties USING GIST(location) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_price_usd ON properties(price_usd) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_properties_operation_type ON properties(operation_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_property_type ON properties(property_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_status ON properties(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_created_at ON properties(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_last_seen_at ON properties(last_seen_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_featured ON properties(is_featured) WHERE deleted_at IS NULL AND status = 'active';

-- Índice compuesto para búsquedas comunes
CREATE INDEX idx_properties_search ON properties(city_id, operation_type, property_type, status, price_usd)
  WHERE deleted_at IS NULL;

-- Full text search en título y descripción
CREATE INDEX idx_properties_fulltext ON properties
  USING GIN(to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, '')))
  WHERE deleted_at IS NULL;

-- Trigger para updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE properties IS 'Main properties table with geographic normalization and PostGIS support';
COMMENT ON COLUMN properties.price_history IS 'Array of price changes: [{date, price, currency}, ...]';
COMMENT ON COLUMN properties.features IS 'Array of feature tags: ["pool", "gym", "balcony"]';
COMMENT ON COLUMN properties.metadata IS 'Extensible JSONB field for additional data without schema changes';
```

---

## 3. Tablas de Soporte

### `property_features` - Catálogo de Features
```sql
CREATE TABLE property_features (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,        -- pool, gym, balcony, doorman
  name JSONB NOT NULL,                    -- {"es": "Piscina", "en": "Pool"}
  category VARCHAR(50),                   -- amenities, security, services
  icon VARCHAR(50),                       -- Material icon name
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO property_features (key, name, category) VALUES
  ('pool', '{"es": "Piscina", "en": "Pool"}'::jsonb, 'amenities'),
  ('gym', '{"es": "Gimnasio", "en": "Gym"}'::jsonb, 'amenities'),
  ('doorman', '{"es": "Portero", "en": "Doorman"}'::jsonb, 'security'),
  ('24h_security', '{"es": "Seguridad 24h", "en": "24h Security"}'::jsonb, 'security'),
  ('balcony', '{"es": "Balcón", "en": "Balcony"}'::jsonb, 'features'),
  ('terrace', '{"es": "Terraza", "en": "Terrace"}'::jsonb, 'features'),
  ('garage', '{"es": "Cochera", "en": "Garage"}'::jsonb, 'parking'),
  ('laundry', '{"es": "Lavadero", "en": "Laundry"}'::jsonb, 'services');

COMMENT ON TABLE property_features IS 'Catalog of all possible property features with i18n';
```

### `property_views` - Analytics de vistas
```sql
CREATE TABLE property_views (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER,                        -- Si está autenticado
  session_id VARCHAR(255),                -- Para usuarios anónimos
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_views_property ON property_views(property_id);
CREATE INDEX idx_property_views_user ON property_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_property_views_viewed_at ON property_views(viewed_at DESC);

-- Particionamiento por mes (para alta escala)
-- Se puede implementar con pg_partman
COMMENT ON TABLE property_views IS 'Analytics tracking for property views';
```

---

## 4. Materialized Views para Performance

### Vista para búsquedas frecuentes
```sql
CREATE MATERIALIZED VIEW mv_properties_search AS
SELECT
  p.id,
  p.external_id,
  p.title,
  p.slug,
  p.price,
  p.currency,
  p.price_usd,
  p.operation_type,
  p.property_type,
  p.bedrooms,
  p.bathrooms,
  p.area_sqm,
  p.location,
  p.images,
  p.is_featured,
  p.quality_score,
  p.created_at,
  -- Geographic data (denormalized for speed)
  co.code as country_code,
  co.name as country_name,
  s.slug as state_slug,
  s.name as state_name,
  c.slug as city_slug,
  c.name as city_name,
  n.slug as neighborhood_slug,
  n.name as neighborhood_name,
  -- Full address for search
  p.address || ' ' ||
    (n.name->>'es') || ' ' ||
    (c.name->>'es') || ' ' ||
    (s.name->>'es') as full_address,
  -- Search vector
  to_tsvector('spanish',
    COALESCE(p.title, '') || ' ' ||
    COALESCE(p.description, '') || ' ' ||
    COALESCE(n.name->>'es', '') || ' ' ||
    COALESCE(c.name->>'es', '')
  ) as search_vector
FROM properties p
LEFT JOIN countries co ON p.country_id = co.id
LEFT JOIN states s ON p.state_id = s.id
LEFT JOIN cities c ON p.city_id = c.id
LEFT JOIN neighborhoods n ON p.neighborhood_id = n.id
WHERE p.deleted_at IS NULL
  AND p.status = 'active';

CREATE UNIQUE INDEX idx_mv_properties_search_id ON mv_properties_search(id);
CREATE INDEX idx_mv_properties_search_location ON mv_properties_search USING GIST(location);
CREATE INDEX idx_mv_properties_search_price ON mv_properties_search(price_usd);
CREATE INDEX idx_mv_properties_search_city ON mv_properties_search(city_slug);
CREATE INDEX idx_mv_properties_search_neighborhood ON mv_properties_search(neighborhood_slug);
CREATE INDEX idx_mv_properties_search_fulltext ON mv_properties_search USING GIN(search_vector);

COMMENT ON MATERIALIZED VIEW mv_properties_search IS 'Denormalized view for fast property searches - refresh every 5min';

-- Refresh automático cada 5 minutos (con pg_cron)
-- SELECT cron.schedule('refresh-mv-properties', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_properties_search');
```

### Vista de estadísticas por barrio
```sql
CREATE MATERIALIZED VIEW mv_neighborhood_stats AS
SELECT
  n.id as neighborhood_id,
  n.slug,
  n.name,
  c.id as city_id,
  c.slug as city_slug,
  -- Stats
  COUNT(p.id) as total_properties,
  COUNT(p.id) FILTER (WHERE p.operation_type = 'sale') as properties_for_sale,
  COUNT(p.id) FILTER (WHERE p.operation_type = 'rent') as properties_for_rent,
  AVG(p.price_usd) FILTER (WHERE p.operation_type = 'sale') as avg_sale_price_usd,
  AVG(p.price_usd) FILTER (WHERE p.operation_type = 'rent') as avg_rent_price_usd,
  MIN(p.price_usd) FILTER (WHERE p.operation_type = 'sale') as min_sale_price_usd,
  MAX(p.price_usd) FILTER (WHERE p.operation_type = 'sale') as max_sale_price_usd,
  AVG(p.area_sqm) as avg_area_sqm,
  AVG(p.quality_score) as avg_quality_score,
  MAX(p.updated_at) as last_updated
FROM neighborhoods n
JOIN cities c ON n.city_id = c.id
LEFT JOIN properties p ON p.neighborhood_id = n.id
  AND p.deleted_at IS NULL
  AND p.status = 'active'
WHERE n.deleted_at IS NULL
GROUP BY n.id, n.slug, n.name, c.id, c.slug;

CREATE UNIQUE INDEX idx_mv_neighborhood_stats_id ON mv_neighborhood_stats(neighborhood_id);

COMMENT ON MATERIALIZED VIEW mv_neighborhood_stats IS 'Aggregated statistics per neighborhood';
```

---

## 5. Funciones Útiles

### Búsqueda geográfica por radio
```sql
CREATE OR REPLACE FUNCTION search_properties_by_radius(
  lat DECIMAL,
  lng DECIMAL,
  radius_meters INTEGER DEFAULT 5000,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  property_id BIGINT,
  distance_meters INTEGER,
  title TEXT,
  price_usd DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    CAST(ST_Distance(
      p.location,
      ST_MakePoint(lng, lat)::geography
    ) AS INTEGER) as distance,
    p.title,
    p.price_usd
  FROM properties p
  WHERE p.location IS NOT NULL
    AND p.deleted_at IS NULL
    AND p.status = 'active'
    AND ST_DWithin(
      p.location,
      ST_MakePoint(lng, lat)::geography,
      radius_meters
    )
  ORDER BY p.location <-> ST_MakePoint(lng, lat)::geography
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM search_properties_by_radius(-34.6037, -58.3816, 2000);
```

### Función para generar slug único
```sql
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
  -- Convertir a slug base
  base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 100);

  -- Agregar ID si está disponible
  IF p_id IS NOT NULL THEN
    final_slug := base_slug || '-' || p_id;
  ELSE
    final_slug := base_slug;
  END IF;

  -- Verificar unicidad
  WHILE EXISTS (SELECT 1 FROM properties WHERE slug = final_slug AND (p_id IS NULL OR id != p_id)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar slug
CREATE OR REPLACE FUNCTION set_property_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_property_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_property_slug
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_property_slug();
```

---

## 6. Estrategia de Migración (Zero Downtime)

### Paso 1: Crear nuevas tablas sin afectar las existentes
```sql
-- Ejecutar todos los CREATE TABLE de arriba
-- Esto no afecta la tabla properties actual
```

### Paso 2: Agregar columnas a properties (nullable)
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS state_id INTEGER REFERENCES states(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS neighborhood_id INTEGER REFERENCES neighborhoods(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_usd DECIMAL(15,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_properties_country_id ON properties(country_id);
CREATE INDEX IF NOT EXISTS idx_properties_state_id ON properties(state_id);
CREATE INDEX IF NOT EXISTS idx_properties_city_id ON properties(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood_id ON properties(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
```

### Paso 3: Migrar datos existentes
```javascript
// Script: scripts/migrate-to-geographic-structure.js
// Lee properties, crea/busca geographic entities, actualiza FKs
```

### Paso 4: Hacer columnas NOT NULL gradualmente
```sql
-- Solo después de migrar el 100%
ALTER TABLE properties ALTER COLUMN country_id SET NOT NULL;
ALTER TABLE properties ALTER COLUMN state_id SET NOT NULL;
ALTER TABLE properties ALTER COLUMN city_id SET NOT NULL;
-- neighborhood_id puede ser NULL (propiedades rurales)
```

### Paso 5: Deprecar campos legacy
```sql
-- Marcar como deprecated
COMMENT ON COLUMN properties.city IS 'DEPRECATED: Use city_id instead';
COMMENT ON COLUMN properties.state IS 'DEPRECATED: Use state_id instead';
COMMENT ON COLUMN properties.country IS 'DEPRECATED: Use country_id instead';

-- Después de 6 meses, eliminar
-- ALTER TABLE properties DROP COLUMN city;
-- ALTER TABLE properties DROP COLUMN state;
-- ALTER TABLE properties DROP COLUMN country;
```

---

## 7. Performance Tips

### Particionamiento (para 10M+ registros)
```sql
-- Particionar properties por país
CREATE TABLE properties_ar PARTITION OF properties
  FOR VALUES IN ((SELECT id FROM countries WHERE code = 'AR'));

CREATE TABLE properties_br PARTITION OF properties
  FOR VALUES IN ((SELECT id FROM countries WHERE code = 'BR'));
```

### Vacuum y Analyze automáticos
```sql
-- Configurar autovacuum agresivo para properties
ALTER TABLE properties SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);
```

### Connection pooling
```javascript
// Usar PgBouncer o neon.config en producción
const sql = neon(process.env.DATABASE_URL, {
  fetchConnectionCache: true,
  fullResults: false
});
```

---

## Resumen de Ventajas

✅ **Escalable a millones de registros**: BIGSERIAL, índices, particionamiento
✅ **Búsqueda geográfica nativa**: PostGIS integrado
✅ **Auditoría completa**: created_at, updated_at, deleted_at
✅ **Soft deletes**: No se pierden datos nunca
✅ **Extensible sin migrations**: JSONB metadata
✅ **Multiidioma**: JSONB con {es, en, pt}
✅ **SEO-friendly**: Slugs automáticos únicos
✅ **Performance**: Materialized views, índices estratégicos
✅ **Zero downtime migrations**: Columnas nullable → NOT NULL gradualmente
✅ **Analytics ready**: property_views, neighborhood_stats

¿Implementamos esta estructura completa ahora?
