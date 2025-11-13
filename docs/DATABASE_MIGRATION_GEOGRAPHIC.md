# Migración a Estructura Geográfica Escalable

## Problema Actual

La tabla `properties` tiene campos de texto plano para ubicación:
- `address`, `neighborhood`, `city`, `state`, `country` (TEXT)
- No hay normalización
- Duplicación masiva de datos
- Búsquedas geográficas ineficientes

## Estructura Propuesta (Normalizada)

### 1. Tabla: `countries` (países)
```sql
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  code CHAR(2) UNIQUE NOT NULL,  -- AR, BR, UY
  name VARCHAR(100) NOT NULL,     -- Argentina
  name_es VARCHAR(100),            -- Argentina
  name_en VARCHAR(100),            -- Argentina
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO countries (code, name) VALUES
  ('AR', 'Argentina'),
  ('BR', 'Brasil'),
  ('UY', 'Uruguay'),
  ('CL', 'Chile');
```

### 2. Tabla: `states` (provincias/estados)
```sql
CREATE TABLE states (
  id SERIAL PRIMARY KEY,
  country_id INTEGER NOT NULL REFERENCES countries(id),
  code VARCHAR(10),                -- BA, CF, CO
  name VARCHAR(100) NOT NULL,      -- Buenos Aires
  name_es VARCHAR(100),
  name_en VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_id, code)
);

CREATE INDEX idx_states_country ON states(country_id);

-- Datos iniciales Argentina
INSERT INTO states (country_id, code, name) VALUES
  ((SELECT id FROM countries WHERE code = 'AR'), 'CF', 'Capital Federal'),
  ((SELECT id FROM countries WHERE code = 'AR'), 'BA', 'Buenos Aires'),
  ((SELECT id FROM countries WHERE code = 'AR'), 'CO', 'Córdoba'),
  ((SELECT id FROM countries WHERE code = 'AR'), 'MZ', 'Mendoza');
```

### 3. Tabla: `cities` (ciudades)
```sql
CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  state_id INTEGER NOT NULL REFERENCES states(id),
  name VARCHAR(100) NOT NULL,
  name_es VARCHAR(100),
  name_en VARCHAR(100),
  slug VARCHAR(100),               -- palermo, recoleta
  -- PostGIS para búsqueda geográfica
  location GEOGRAPHY(POINT, 4326), -- lat/lng
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, slug)
);

CREATE INDEX idx_cities_state ON cities(state_id);
CREATE INDEX idx_cities_location ON cities USING GIST(location);

-- Datos iniciales CABA
INSERT INTO cities (state_id, name, slug) VALUES
  ((SELECT id FROM states WHERE code = 'CF'), 'Palermo', 'palermo'),
  ((SELECT id FROM states WHERE code = 'CF'), 'Recoleta', 'recoleta'),
  ((SELECT id FROM states WHERE code = 'CF'), 'Belgrano', 'belgrano'),
  ((SELECT id FROM states WHERE code = 'CF'), 'Caballito', 'caballito');
```

### 4. Tabla: `neighborhoods` (barrios)
```sql
CREATE TABLE neighborhoods (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(id),
  name VARCHAR(100) NOT NULL,
  name_es VARCHAR(100),
  name_en VARCHAR(100),
  slug VARCHAR(100),
  location GEOGRAPHY(POINT, 4326),
  -- Polígono para delimitar el barrio
  boundary GEOGRAPHY(POLYGON, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_id, slug)
);

CREATE INDEX idx_neighborhoods_city ON neighborhoods(city_id);
CREATE INDEX idx_neighborhoods_location ON neighborhoods USING GIST(location);
CREATE INDEX idx_neighborhoods_boundary ON neighborhoods USING GIST(boundary);

-- Datos iniciales Palermo
INSERT INTO neighborhoods (city_id, name, slug) VALUES
  ((SELECT id FROM cities WHERE slug = 'palermo'), 'Palermo Chico', 'palermo-chico'),
  ((SELECT id FROM cities WHERE slug = 'palermo'), 'Palermo Viejo', 'palermo-viejo'),
  ((SELECT id FROM cities WHERE slug = 'palermo'), 'Palermo Hollywood', 'palermo-hollywood'),
  ((SELECT id FROM cities WHERE slug = 'palermo'), 'Palermo Soho', 'palermo-soho');
```

### 5. Tabla: `properties` (actualizada)
```sql
-- Agregar nuevas columnas con foreign keys
ALTER TABLE properties ADD COLUMN country_id INTEGER REFERENCES countries(id);
ALTER TABLE properties ADD COLUMN state_id INTEGER REFERENCES states(id);
ALTER TABLE properties ADD COLUMN city_id INTEGER REFERENCES cities(id);
ALTER TABLE properties ADD COLUMN neighborhood_id INTEGER REFERENCES neighborhoods(id);

-- Agregar coordenadas geográficas
ALTER TABLE properties ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- Índices para búsqueda eficiente
CREATE INDEX idx_properties_country ON properties(country_id);
CREATE INDEX idx_properties_state ON properties(state_id);
CREATE INDEX idx_properties_city ON properties(city_id);
CREATE INDEX idx_properties_neighborhood ON properties(neighborhood_id);
CREATE INDEX idx_properties_location ON properties USING GIST(location);

-- Mantener campos de texto legacy para compatibilidad
-- Después de migración completa, se pueden eliminar:
-- ALTER TABLE properties DROP COLUMN address;
-- ALTER TABLE properties DROP COLUMN neighborhood;
-- ALTER TABLE properties DROP COLUMN city;
-- ALTER TABLE properties DROP COLUMN state;
-- ALTER TABLE properties DROP COLUMN country;
```

## Ventajas de la Nueva Estructura

✅ **Normalización**: Cada ciudad existe UNA sola vez
✅ **Consistencia**: No más "Buenos Aires" vs "Bs As" vs "CABA"
✅ **Búsqueda geográfica**: PostGIS permite "propiedades a 5km"
✅ **Multiidioma**: Nombres en español e inglés
✅ **URLs amigables**: Slugs para `/ar/capital-federal/palermo`
✅ **Escalable**: Agregar países/ciudades sin tocar properties
✅ **Análisis**: "Top 10 barrios más caros" es una simple JOIN

## Búsquedas Eficientes

**Ejemplo 1: Propiedades en un radio de 5km**
```sql
SELECT p.*
FROM properties p
JOIN cities c ON p.city_id = c.id
WHERE ST_DWithin(
  p.location,
  ST_MakePoint(-58.3816, -34.6037)::geography,  -- Obelisco
  5000  -- 5km en metros
);
```

**Ejemplo 2: Barrios más caros por ciudad**
```sql
SELECT
  c.name as city,
  n.name as neighborhood,
  AVG(p.price) as avg_price,
  COUNT(*) as properties
FROM properties p
JOIN neighborhoods n ON p.neighborhood_id = n.id
JOIN cities c ON n.city_id = c.id
WHERE p.currency = 'USD'
GROUP BY c.id, n.id, c.name, n.name
ORDER BY avg_price DESC
LIMIT 10;
```

**Ejemplo 3: URLs SEO-friendly**
```sql
SELECT
  co.code as country,
  s.code as state,
  c.slug as city,
  n.slug as neighborhood,
  p.id
FROM properties p
JOIN neighborhoods n ON p.neighborhood_id = n.id
JOIN cities c ON n.city_id = c.id
JOIN states s ON c.state_id = s.id
JOIN countries co ON s.country_id = co.id
WHERE p.id = 123;

-- Resultado: ar/cf/palermo/palermo-chico/123
```

## Plan de Migración

### Fase 1: Crear nuevas tablas (no destructivo)
```bash
psql $DATABASE_URL -f migrations/001_create_geographic_tables.sql
```

### Fase 2: Migrar datos existentes
```bash
node scripts/migrate-geographic-data.js
```

Este script:
1. Lee properties existentes
2. Crea/busca country, state, city, neighborhood
3. Actualiza foreign keys en properties
4. Mantiene campos legacy intactos

### Fase 3: Actualizar scrapers
Modificar `scrape-local.js` para:
1. Buscar/crear city_id, neighborhood_id
2. Intentar geocodificar address → location (lat/lng)
3. Guardar IDs en vez de texto

### Fase 4: Actualizar API/Dashboard
Cambiar queries para usar JOINs en vez de campos TEXT

### Fase 5: Eliminar campos legacy (opcional)
Una vez todo migrado y probado, eliminar campos de texto

## Geocodificación

Para obtener coordenadas (lat/lng):

**Opción 1: Nominatim (gratuito, open source)**
```javascript
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PropTech-AI/1.0' }
  });
  const data = await response.json();
  if (data[0]) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    };
  }
  return null;
}
```

**Opción 2: Google Maps API (pago, más preciso)**
```javascript
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_API_KEY}`;
```

## Consultas de Ejemplo con Nueva Estructura

```sql
-- Buscar propiedades en Palermo bajo USD 200k
SELECT p.*, c.name as city, n.name as neighborhood
FROM properties p
JOIN neighborhoods n ON p.neighborhood_id = n.id
JOIN cities c ON n.city_id = c.id
WHERE c.slug = 'palermo'
  AND p.currency = 'USD'
  AND p.price < 200000
  AND p.status = 'active';

-- Top 5 barrios con más propiedades
SELECT
  n.name,
  COUNT(*) as total,
  AVG(p.price) as avg_price
FROM properties p
JOIN neighborhoods n ON p.neighborhood_id = n.id
WHERE p.status = 'active'
GROUP BY n.id, n.name
ORDER BY total DESC
LIMIT 5;

-- Propiedades cerca de una ubicación
SELECT
  p.*,
  ST_Distance(p.location, ST_MakePoint(-58.3816, -34.6037)::geography) as distance_meters
FROM properties p
WHERE p.location IS NOT NULL
  AND ST_DWithin(
    p.location,
    ST_MakePoint(-58.3816, -34.6037)::geography,
    2000  -- 2km
  )
ORDER BY distance_meters;
```

## Próximos Pasos

1. ¿Quieres que implemente la migración ahora?
2. ¿Empezamos con las tablas geográficas?
3. ¿Migramos los 15 properties existentes como prueba?
