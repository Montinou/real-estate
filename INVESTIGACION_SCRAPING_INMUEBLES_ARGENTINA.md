# Investigación Completa: Scraping de Inmuebles en Argentina (Córdoba)

**Fecha:** 2025-11-10
**Objetivo:** Motor de procesamiento automatizado para scraping de propiedades inmobiliarias en Argentina, con foco en Córdoba
**Estado:** Investigación Completa - Ready for Implementation

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Fuentes de Datos Disponibles](#fuentes-de-datos-disponibles)
3. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
4. [Almacenamiento de Imágenes](#almacenamiento-de-imágenes)
5. [Motor de Procesamiento Automatizado](#motor-de-procesamiento-automatizado)
6. [Estrategia de Implementación](#estrategia-de-implementación)
7. [Consideraciones Legales](#consideraciones-legales)
8. [Costos y Presupuesto](#costos-y-presupuesto)
9. [Roadmap de Desarrollo](#roadmap-de-desarrollo)
10. [Referencias y Recursos](#referencias-y-recursos)

---

## 🎯 Resumen Ejecutivo

### Objetivo del Proyecto
Crear un motor automatizado de scraping, procesamiento y almacenamiento de datos de inmuebles de múltiples fuentes en Argentina, especialmente enfocado en la provincia de Córdoba, con capacidad de:

- Scrapear múltiples portales inmobiliarios
- Normalizar y deduplicar datos de diferentes fuentes
- Almacenar y servir imágenes optimizadas
- Trackear historial de precios y cambios
- Detectar propiedades vendidas/inactivas
- Proveer API para búsquedas avanzadas

### Hallazgos Clave

1. **Acceso Legal Disponible**: MercadoLibre y Properati ofrecen acceso oficial a datos
2. **Volumen Significativo**: ~65,000+ propiedades disponibles solo en Córdoba
3. **Stack Recomendado**: Supabase + Crawlee + BullMQ + ScraperAPI
4. **Inversión Inicial MVP**: ~$335/mes para 50k propiedades
5. **Tiempo de Implementación**: 12-16 semanas para MVP completo

### Recomendación Principal

**Comenzar con fuentes legales (MercadoLibre API + Properati BigQuery)** para validar el modelo de negocio, y luego expandir progresivamente a scraping controlado de otras fuentes con protocolos éticos y rate limiting respetuoso.

---

## 📊 Fuentes de Datos Disponibles

### 1. MercadoLibre Inmuebles ✅ **RECOMENDADO**

**API Oficial:** SÍ - OAuth 2.0

#### Características
- **Cobertura:** 400,000+ listings en Argentina
- **Documentación:** https://developers.mercadolibre.com.ar/
- **Autenticación:** OAuth 2.0 estándar
- **Rate Limits:** No especificados públicamente (consultar docs)
- **Costo:** GRATIS (solo necesitas registrar tu app)

#### Endpoints Principales
```bash
# Búsqueda de inmuebles
GET /sites/MLA/search?category=MLA1459

# Detalle de propiedad
GET /items/{ITEM_ID}

# Búsqueda geolocalizada
GET /sites/MLA/search?item_location=lat:$LAT1_LAT2,lon:$LON1_LON2&category=MLA1459
```

#### Datos Disponibles
- ID único (formato MLA + números)
- Título y descripción completa
- Precio y moneda (ARS/USD)
- Ubicación con coordenadas (lat/lon)
- Tipo de inmueble y operación
- Atributos estructurados: ambientes, baños, m²
- Imágenes múltiples
- Información del vendedor con reputación

#### Ejemplo de Respuesta
```json
{
  "id": "MLA2544295250",
  "title": "Departamento 2 ambientes Nueva Córdoba",
  "price": 85000,
  "currency_id": "USD",
  "latitude": -31.4201,
  "longitude": -64.1888,
  "attributes": [
    {
      "id": "MLA1459-INMUEBLE",
      "name": "Inmueble",
      "value_name": "Departamento"
    },
    {
      "id": "MLA1466-AMBQTY",
      "name": "Ambientes",
      "value_name": "2"
    },
    {
      "id": "MLA1466-MTRS",
      "name": "Superficie cubierta (m²)",
      "value_name": "45"
    }
  ],
  "pictures": [...],
  "seller": {
    "id": 123456,
    "nickname": "INMOBILIARIA_XYZ"
  }
}
```

#### Ventajas
- ✅ 100% legal y con soporte oficial
- ✅ Datos estructurados de alta calidad
- ✅ No requiere scraping ni proxies
- ✅ OAuth 2.0 estándar de industria
- ✅ Documentación completa en español

---

### 2. Properati ✅ **RECOMENDADO**

**Dataset Público:** SÍ - Google BigQuery

#### Características
- **Cobertura:** 2,000,000+ propiedades (Argentina, Brasil, México, Chile, Colombia, Perú)
- **Córdoba:** 10,572 inmuebles
- **Acceso:** Google BigQuery (base de datos pública)
- **Propósito:** Académicos, periodistas, investigadores
- **Costo:** **GRATIS**

#### Acceso
1. Ir a Google Cloud Marketplace
2. Buscar "Properati Property Data Argentina"
3. Conectar a tu proyecto de BigQuery
4. Consultas SQL estándar

#### Schema del Dataset

```sql
-- Campos principales
SELECT
    id,                              -- ID único
    created_on,                      -- Fecha de publicación
    property_type,                   -- "Apartment", "House", "PH", etc.
    operation_type,                  -- "sale", "rent"
    lat, lon,                        -- Coordenadas
    place_with_parent_names,         -- "Argentina|Córdoba|Córdoba|Nueva Córdoba"
    price,                           -- Precio original
    price_aprox_usd,                 -- Precio en USD
    currency,
    price_usd_per_m2,
    rooms, bedrooms,                 -- Ambientes y dormitorios
    surface_total_in_m2,
    surface_covered_in_m2,
    floor,
    expenses,                        -- Expensas
    title, description,
    properati_url
FROM `properati-data-public.properties_ar.properties_ar`
WHERE place_with_parent_names LIKE '%Córdoba%'
```

#### Ejemplo de Query
```sql
-- Departamentos en venta en Nueva Córdoba
SELECT
    id,
    title,
    price_aprox_usd,
    rooms,
    surface_total_in_m2,
    properati_url
FROM `properati-data-public.properties_ar.properties_ar`
WHERE
    place_with_parent_names LIKE '%Nueva Córdoba%'
    AND property_type = 'Apartment'
    AND operation_type = 'sale'
    AND price_aprox_usd BETWEEN 50000 AND 150000
ORDER BY price_aprox_usd
LIMIT 100
```

#### Ventajas
- ✅ 100% legal y oficial
- ✅ Datos históricos masivos
- ✅ Gratis para uso no comercial
- ✅ Schema bien estructurado
- ✅ Múltiples países LATAM
- ✅ Ideal para análisis de mercado

---

### 3. ZonaProp ⚠️ **RIESGO MEDIO**

**API Oficial:** NO
**Scrapeabilidad:** Medio-Alto

#### Características
- **Cobertura Córdoba:** 54,648 propiedades (la más grande)
- **Protecciones:** JavaScript rendering, 403 Forbidden para bots
- **Rate Limiting:** Probable (no confirmado)
- **Robots.txt:** Restrictivo (bloquea paginación >5, ciertos patrones)

#### Datos Disponibles (vía scraping)
- 33+ campos extraíbles
- URL, título, descripción
- Precio (ARS/USD)
- Ubicación completa + coordenadas
- Tipo de propiedad y operación
- Ambientes, baños, superficie (total y cubierta)
- Imágenes múltiples
- Datos de inmobiliaria
- Expensas, fecha de publicación, número de visitas

#### Protecciones Técnicas
- **403 Forbidden** para user-agents no estándar
- **JavaScript rendering** obligatorio (SPA)
- **reCAPTCHA** en registro/login
- Bloqueo de IPs reportado por desarrolladores

#### Robots.txt - Restricciones
```
Disallow: /develop/
Disallow: /mails/
Disallow: /tracking/g/*
Disallow: *?duplicated=true
Disallow: *?labs=
Disallow: /*-ubicado-en-* (excepto /propiedades/)
Disallow: páginas 6+ en paginación

Allow: /propiedades/*-ubicado-en-*
Allow: páginas 2-5
Allow: *-orden-precio-ascendente.html
```

#### Términos de Servicio
- ⚠️ No permiso explícito para scraping
- ⚠️ Pueden bloquear IPs
- ⚠️ No se permite extracción masiva de datos

#### Estrategia de Scraping (si se implementa)
```javascript
// Rate limiting OBLIGATORIO
const config = {
  maxRequestsPerSecond: 0.5,        // 1 request cada 2 segundos
  randomDelay: [2000, 5000],        // Delays aleatorios 2-5 seg
  respectRobotsTxt: true,           // Respetar robots.txt
  userAgent: 'RealEstateAggregator/1.0 (+https://mysite.com; contact@email.com)',
  maxConcurrency: 1,                // Sin paralelización
  retryDelay: 60000,                // 1 minuto en retry
  headless: 'new',                  // Modo headless moderno
  stealthPlugin: true               // Anti-detección
}
```

#### Scrapers Existentes (GitHub)
- **mauroeparis/scrappdept** - Multi-portal scraper (Python)
- **rodrigouroz/housing_scrapper** - Incluye ZonaProp (Python)
- **Sotrosca/zona-prop-scraper** - Específico ZonaProp (Python)

---

### 4. Argenprop ❌ **ALTO RIESGO - NO RECOMENDADO**

**API Oficial:** NO
**Scrapeabilidad:** Medio-Alto con alto riesgo legal

#### Características
- **Cobertura:** 430,000+ propiedades en Argentina
- **Protecciones:** reCAPTCHA, bloqueo agresivo de bots
- **Robots.txt:** MUY restrictivo (70+ bots bloqueados)

#### ⚠️ ADVERTENCIA LEGAL - MUY IMPORTANTE
**Argenprop PROHÍBE EXPLÍCITAMENTE el scraping en sus términos:**

- ❌ **Prohibido extraer contenido** (scraping) del sitio o base de datos
- ❌ **Prohibido obtener listas de inventario** o información privada
- ❌ **Pueden bloquear IPs** por scraping (confirmado)
- ❌ **Violación de derechos de autor** - materiales protegidos
- ⚖️ **Jurisdicción:** Tribunales Comerciales Nacionales, Capital Federal, Argentina
- ⚖️ **Ley aplicable:** Leyes de la República Argentina

#### Recomendación
**NO IMPLEMENTAR** scraping de Argenprop para uso comercial. Alto riesgo legal y de bloqueo permanente.

---

### 5. Inmuebles24 ⚠️ **RIESGO MEDIO**

**API Oficial:** NO
**Propietario:** Grupo Navent (mismo que ZonaProp) / QuintoAndar

#### Características
- Tecnología y backend compartidos con ZonaProp
- Robots.txt idéntico a ZonaProp
- 403 Forbidden para bots
- APIs privadas protegidas

#### Recomendación
Tratamiento similar a ZonaProp. Si se implementa scraping, usar mismas precauciones.

---

### 6. La Voz Clasificados ⚠️ **MUY DIFÍCIL**

**API Oficial:** NO
**Scrapeabilidad:** Muy difícil

#### Características
- **Enfoque:** Regional Córdoba
- **Protecciones:** Muy agresivas, bloqueo total a herramientas automáticas
- **Status:** No pudimos acceder en la investigación (Claude Code bloqueado)

#### Recomendación
Dejar para fase avanzada, requiere investigación adicional y técnicas especializadas.

---

### 7. Otras Fuentes

#### CordobaProp
- Portal regional específico de Córdoba
- Profesionales registrados en CPI
- Sin API pública conocida
- Menor volumen pero 100% enfocado en Córdoba

#### RE/MAX
- Red de franquicias inmobiliarias
- 80,338 propiedades en Córdoba
- Sin API pública
- Listings duplicados en otros portales

---

## 🏗️ Arquitectura de Base de Datos

### Elección de Base de Datos

**Recomendación: PostgreSQL 15+ con Supabase**

#### Justificación

**PostgreSQL:**
- ✅ Datos estructurados y relacionales
- ✅ **PostGIS** para búsquedas geoespaciales
- ✅ **JSONB** para flexibilidad por fuente
- ✅ **pg_trgm** para fuzzy matching (deduplicación)
- ✅ Triggers y funciones para automatización
- ✅ TimescaleDB para series temporales (historial de precios)
- ✅ Madurez y ecosistema robusto

**Supabase:**
- ✅ Consistencia con tu stack actual
- ✅ PostgreSQL completo con extensiones
- ✅ Row-Level Security (RLS)
- ✅ Real-time subscriptions
- ✅ API REST/GraphQL automática
- ✅ Studio visual para administración
- ✅ Backups automáticos diarios

**Descartando NoSQL:**
- Las propiedades tienen estructura común suficiente
- Relaciones importantes (fuentes, historial, deduplicación)
- PostgreSQL con JSONB ofrece flexibilidad híbrida

---

### Modelo de Datos Completo

#### Diagrama de Alto Nivel

```
┌─────────────────┐
│     SOURCES     │ ← Fuentes de scraping
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   RAW_LISTINGS  │ ← Datos crudos sin procesar
└────────┬────────┘
         │
         ↓ (Processing & Deduplication)
         │
┌─────────────────┐
│   PROPERTIES    │ ← Propiedades normalizadas (MASTER)
└────────┬────────┘
         │
         ├→ PROPERTY_HISTORY     ← Historial de cambios
         ├→ PRICE_HISTORY        ← Track de precios
         ├→ PROPERTY_DUPLICATES  ← Clusters de duplicados
         ├→ PROPERTY_IMAGES      ← Imágenes
         └→ PROPERTY_SOURCES     ← Relación M2M con fuentes
```

#### Tablas Principales

##### 1. SOURCES
```sql
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,           -- 'zonaprop', 'mercadolibre'
    display_name VARCHAR(200) NOT NULL,          -- 'ZonaProp', 'MercadoLibre'
    base_url TEXT NOT NULL,
    scraper_config JSONB,                        -- Config del scraper
    is_active BOOLEAN DEFAULT true,
    reliability_score DECIMAL(3,2) DEFAULT 0.80, -- 0-1
    last_scrape_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### 2. RAW_LISTINGS (Datos Crudos)
```sql
CREATE TABLE raw_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES sources(id),
    external_id VARCHAR(255) NOT NULL,           -- ID en la fuente
    url TEXT NOT NULL,

    raw_data JSONB NOT NULL,                     -- JSON completo

    -- Campos extraídos para búsqueda rápida
    title TEXT,
    price_raw VARCHAR(100),
    location_raw TEXT,

    -- Metadata
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    processing_status listing_status DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    property_id UUID REFERENCES properties(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);

CREATE INDEX idx_raw_listings_status ON raw_listings(processing_status);
CREATE INDEX idx_raw_listings_data ON raw_listings USING gin(raw_data);
```

##### 3. PROPERTIES (Master - Normalizado)
```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identificación
    internal_code VARCHAR(50) UNIQUE,

    -- Tipo
    property_type property_type NOT NULL,        -- ENUM
    operation_type operation_type NOT NULL,      -- ENUM
    status property_status DEFAULT 'active',     -- ENUM

    -- Ubicación
    country VARCHAR(2) DEFAULT 'AR',
    province VARCHAR(100),                       -- Córdoba, Buenos Aires, etc.
    city VARCHAR(200),
    neighborhood VARCHAR(200),
    address TEXT,
    street_name VARCHAR(200),
    street_number VARCHAR(20),
    floor VARCHAR(20),
    apartment VARCHAR(20),
    postal_code VARCHAR(20),

    -- Geolocalización (PostGIS)
    location GEOMETRY(Point, 4326),              -- WGS84
    location_confidence DECIMAL(3,2),            -- 0-1

    -- Precio
    price DECIMAL(15,2),
    currency currency_type DEFAULT 'ARS',        -- ENUM
    price_usd DECIMAL(15,2),
    expenses DECIMAL(12,2),
    expenses_currency currency_type DEFAULT 'ARS',

    -- Características
    total_surface DECIMAL(10,2),
    covered_surface DECIMAL(10,2),
    rooms INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    garage_spaces INTEGER,
    age_years INTEGER,

    -- Descripción
    title TEXT,
    description TEXT,

    -- Features adicionales (JSONB flexible)
    features JSONB,                              -- {amenities: [...], services: [...]}

    -- Metadata
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_price_change_at TIMESTAMPTZ,
    status_changed_at TIMESTAMPTZ,
    times_seen INTEGER DEFAULT 1,

    -- Calidad
    data_quality_score DECIMAL(3,2) DEFAULT 0.50,
    is_verified BOOLEAN DEFAULT false,

    -- Deduplicación
    duplicate_cluster_id UUID,
    is_canonical BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices críticos
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_operation ON properties(operation_type);
CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_province_city ON properties(province, city);
CREATE INDEX idx_properties_price_usd ON properties(price_usd);
CREATE INDEX idx_properties_title_trgm ON properties USING gin(title gin_trgm_ops);
CREATE INDEX idx_properties_features ON properties USING gin(features);
```

##### 4. PROPERTY_HISTORY (Historial de Cambios)
```sql
CREATE TABLE property_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    snapshot JSONB NOT NULL,                     -- Snapshot completo
    changed_fields TEXT[],                       -- ['price', 'status']
    changes_summary JSONB,                       -- {field: {old, new}}

    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    source_id UUID REFERENCES sources(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_history_property ON property_history(property_id);
CREATE INDEX idx_property_history_recorded ON property_history(recorded_at DESC);
```

##### 5. PRICE_HISTORY (Series Temporales con TimescaleDB)
```sql
CREATE TABLE price_history (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    price DECIMAL(15,2) NOT NULL,
    currency currency_type NOT NULL,
    price_usd DECIMAL(15,2),
    exchange_rate DECIMAL(12,4),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_id UUID REFERENCES sources(id),

    PRIMARY KEY (property_id, recorded_at)
);

-- Convertir a hypertable de TimescaleDB
SELECT create_hypertable('price_history', 'recorded_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE
);

CREATE INDEX idx_price_history_property ON price_history(property_id, recorded_at DESC);
```

##### 6. PROPERTY_DUPLICATES (Deduplicación)
```sql
CREATE TABLE property_duplicates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    canonical_property_id UUID REFERENCES properties(id),

    similarity_score DECIMAL(5,4),               -- 0-1
    match_method VARCHAR(50),                    -- 'coordinates', 'address', 'fuzzy'
    match_details JSONB,

    detected_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(property_id)
);

CREATE INDEX idx_property_duplicates_cluster ON property_duplicates(cluster_id);
CREATE INDEX idx_property_duplicates_property ON property_duplicates(property_id);
```

##### 7. PROPERTY_IMAGES
```sql
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    url TEXT NOT NULL,
    thumbnail_url TEXT,

    display_order INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    image_hash VARCHAR(64),                      -- MD5/SHA256 para dedupe

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_images_property ON property_images(property_id, display_order);
CREATE INDEX idx_property_images_hash ON property_images(image_hash);
```

##### 8. PROPERTY_SOURCES (Relación M2M)
```sql
CREATE TABLE property_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    external_url TEXT,

    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    times_seen INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, source_id)
);

CREATE INDEX idx_property_sources_property ON property_sources(property_id);
CREATE INDEX idx_property_sources_source ON property_sources(source_id);
```

---

### Estrategia de Deduplicación

#### Algoritmo Multi-Etapa

```sql
CREATE OR REPLACE FUNCTION deduplicate_property(p_property_id UUID)
RETURNS TABLE(duplicate_id UUID, similarity_score DECIMAL, match_method VARCHAR)
AS $$
DECLARE
    prop RECORD;
    potential_dup RECORD;
    score DECIMAL;
BEGIN
    SELECT * INTO prop FROM properties WHERE id = p_property_id;

    -- ETAPA 1: Match por coordenadas (radio 50m)
    FOR potential_dup IN
        SELECT
            p2.id,
            ST_Distance(prop.location::geography, p2.location::geography) as distance
        FROM properties p2
        WHERE p2.id != prop.id
          AND ST_DWithin(prop.location::geography, p2.location::geography, 50)
    LOOP
        score := 1.0 - (potential_dup.distance / 50.0);
        RETURN QUERY SELECT potential_dup.id, score, 'coordinates'::VARCHAR;
    END LOOP;

    -- ETAPA 2: Match por dirección + características
    FOR potential_dup IN
        SELECT
            p2.id,
            similarity(
                LOWER(CONCAT(prop.street_name, prop.street_number, prop.apartment)),
                LOWER(CONCAT(p2.street_name, p2.street_number, p2.apartment))
            ) as address_sim,
            CASE
                WHEN prop.total_surface IS NOT NULL AND p2.total_surface IS NOT NULL THEN
                    1.0 - ABS(prop.total_surface - p2.total_surface) / GREATEST(prop.total_surface, p2.total_surface)
                ELSE 0
            END as surface_sim
        FROM properties p2
        WHERE p2.id != prop.id
          AND p2.city = prop.city
          AND p2.neighborhood = prop.neighborhood
          AND p2.property_type = prop.property_type
    LOOP
        score := (potential_dup.address_sim * 0.6 + potential_dup.surface_sim * 0.4);

        IF score >= 0.75 THEN
            RETURN QUERY SELECT potential_dup.id, score, 'address_features'::VARCHAR;
        END IF;
    END LOOP;

    -- ETAPA 3: Fuzzy matching de título
    FOR potential_dup IN
        SELECT
            p2.id,
            similarity(LOWER(prop.title), LOWER(p2.title)) as title_sim
        FROM properties p2
        WHERE p2.id != prop.id
          AND p2.city = prop.city
          AND similarity(LOWER(prop.title), LOWER(p2.title)) > 0.8
    LOOP
        RETURN QUERY SELECT potential_dup.id, potential_dup.title_sim, 'fuzzy_title'::VARCHAR;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

#### Campos Clave para Matching

1. **Coordenadas** (máxima prioridad)
   - Radio de 50 metros con PostGIS
   - Score: 1.0 - (distancia/50)

2. **Dirección normalizada** (alta prioridad)
   - Calle + número + piso + depto
   - Fuzzy matching con pg_trgm
   - Peso: 60%

3. **Características físicas** (media prioridad)
   - Superficie (tolerancia ±5%)
   - Peso: 40%

4. **Título** (baja prioridad)
   - Fuzzy matching > 0.8
   - Para casos edge

---

### Queries Optimizadas

#### Búsqueda Geoespacial
```sql
-- Propiedades en venta, radio 2km de coordenada
SELECT
    p.*,
    ST_Distance(
        p.location::geography,
        ST_SetSRID(ST_MakePoint(-64.1888, -31.4201), 4326)::geography
    ) / 1000 AS distance_km
FROM properties p
WHERE
    p.operation_type = 'sale'
    AND p.property_type = 'apartment'
    AND p.status = 'active'
    AND ST_DWithin(
        p.location::geography,
        ST_SetSRID(ST_MakePoint(-64.1888, -31.4201), 4326)::geography,
        2000
    )
ORDER BY distance_km
LIMIT 50;
```

#### Búsqueda Fuzzy
```sql
-- Match con typos
SELECT
    p.*,
    similarity(p.neighborhood, 'nueva cordoba') as sim_score
FROM properties p
WHERE
    p.city = 'Córdoba'
    AND p.neighborhood % 'nueva cordoba'
    AND p.status = 'active'
ORDER BY sim_score DESC
LIMIT 50;
```

#### Historial de Precios con Variación
```sql
-- Cambios de precio últimos 30 días
SELECT
    p.id,
    p.address,
    ph.price,
    ph.recorded_at,
    LAG(ph.price) OVER (PARTITION BY p.id ORDER BY ph.recorded_at) as previous_price,
    ROUND(
        ((ph.price - LAG(ph.price) OVER (PARTITION BY p.id ORDER BY ph.recorded_at))
        / LAG(ph.price) OVER (PARTITION BY p.id ORDER BY ph.recorded_at) * 100)::numeric,
        2
    ) as price_change_pct
FROM properties p
JOIN price_history ph ON p.id = ph.property_id
WHERE ph.recorded_at > NOW() - INTERVAL '30 days'
ORDER BY p.id, ph.recorded_at DESC;
```

---

### Estimación de Almacenamiento

| Tabla | Registros | Tamaño/Reg | Total |
|-------|-----------|------------|-------|
| properties | 500K | 5 KB | 2.5 GB |
| raw_listings | 10M | 10 KB | 100 GB |
| property_history | 50M | 3 KB | 150 GB |
| price_history | 100M | 200 B | 20 GB |
| property_images | 5M | 500 B | 2.5 GB |
| **TOTAL** | | | **~275 GB** |

**Supabase Pricing:**
- Free Tier: 500 MB (insuficiente)
- Pro: $25/mes (8GB incluido) + $0.125/GB adicional
- **Estimado:** ~$60/mes para dataset completo

---

## 🖼️ Almacenamiento de Imágenes

### Recomendación: Supabase Storage

#### Por Qué Supabase Storage

**Ventajas:**
- ✅ Integrado con tu stack actual (Supabase)
- ✅ CDN global incluido sin costo adicional
- ✅ API simple (REST + cliente JavaScript)
- ✅ RLS (Row-Level Security) integrado
- ✅ Políticas de acceso granulares
- ✅ Pricing competitivo
- ✅ Setup en horas, no días

**Pricing:**
```
Supabase Pro: $25/mes incluye:
- 100 GB storage
- 200 GB bandwidth/mes

Adicional:
- $0.021/GB storage
- $0.09/GB bandwidth

Ejemplo cálculo:
- 50,000 imágenes × 200 KB promedio = 10 GB
- Tráfico: 100,000 vistas/mes × 200 KB = 20 GB
Total: $25/mes (dentro del plan)
```

#### Alternativas Evaluadas

| Solución | Mejor Para | Costo (50k imágenes) |
|----------|-----------|---------------------|
| **Supabase** | Tu caso de uso | $25/mes |
| AWS S3 + CloudFront | Control total | $15-30/mes |
| Cloudinary | Transformaciones avanzadas | $89+/mes |
| Vercel Blob | Apps Next.js | $20-40/mes |
| MinIO Self-hosted | Control absoluto | Variable |

---

### Estrategia de Descarga

**❌ NO HACER HOTLINKING**

Razones:
- Ilegal/antiético (robas bandwidth)
- No confiable (pueden eliminar)
- Mal performance
- Problemas de copyright

**✅ DESCARGAR Y ALMACENAR LOCALMENTE**

Razones:
- Control total
- Optimización propia (WebP, AVIF, resize)
- CDN propio
- Performance predecible
- Disponibilidad garantizada

---

### Procesamiento de Imágenes

#### Pre-generar Múltiples Tamaños

```javascript
const imageSizes = [
  { name: 'thumbnail', width: 150, quality: 80 },
  { name: 'card', width: 400, quality: 85 },
  { name: 'gallery', width: 800, quality: 90 },
  { name: 'full', width: 1200, quality: 90 }
]

// Generar con Sharp
const sharp = require('sharp')

for (const size of imageSizes) {
  await sharp(originalBuffer)
    .resize(size.width, null, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: size.quality })
    .toFile(`${size.name}.webp`)
}
```

#### Formatos Modernos

**WebP** (recomendado primario):
- 25-35% más pequeño que JPEG
- Soporte: 97% navegadores
- Fallback a JPEG automático

**AVIF** (para 2025+):
- 50% más pequeño que JPEG
- Soporte: 85% navegadores (creciendo)
- Mejor compresión que WebP

#### BlurHash para Progressive Loading

```javascript
import { encode } from 'blurhash'

// Generar al procesar imagen
const blurHash = encode(pixels, width, height, 4, 3)
// Ejemplo: "LGF5]+Yk^6#M@-5c,1J5@[or[Q6."

// Guardar en DB
await supabase
  .from('property_images')
  .insert({
    url: imageUrl,
    blur_hash: blurHash
  })

// En frontend (React)
import { Blurhash } from 'react-blurhash'

<Blurhash
  hash={blurHash}
  width={400}
  height={300}
  resolutionX={32}
  resolutionY={32}
  punch={1}
/>
```

---

### Rate Limiting para Descarga

```javascript
const downloadConfig = {
  maxConcurrent: 5,                  // 5 descargas simultáneas globales
  requestsPerSecond: 1,              // Max 1 req/seg por dominio
  randomDelay: [1000, 3000],         // Delays aleatorios 1-3 seg
  retryAttempts: 3,
  retryDelay: 5000,
  timeout: 30000,

  // Exponential backoff
  backoffMultiplier: 2,
  maxBackoffDelay: 60000
}

// Implementación con p-queue
const PQueue = require('p-queue')
const queue = new PQueue({
  concurrency: downloadConfig.maxConcurrent,
  interval: 1000,
  intervalCap: 1
})

async function downloadImage(url, propertyId) {
  return queue.add(async () => {
    const delay = Math.random() *
      (downloadConfig.randomDelay[1] - downloadConfig.randomDelay[0]) +
      downloadConfig.randomDelay[0]

    await new Promise(resolve => setTimeout(resolve, delay))

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RealEstateAggregator/1.0 (+https://mysite.com; contact@email.com)'
      },
      timeout: downloadConfig.timeout
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    return response.buffer()
  })
}
```

---

### Organización en Storage

```
supabase-storage/
├── properties/
│   ├── {property_id}/
│   │   ├── original/
│   │   │   ├── 001.jpg
│   │   │   ├── 002.jpg
│   │   │   └── 003.jpg
│   │   ├── thumbnail/
│   │   │   ├── 001.webp
│   │   │   ├── 002.webp
│   │   │   └── 003.webp
│   │   ├── card/
│   │   │   └── ...
│   │   ├── gallery/
│   │   │   └── ...
│   │   └── full/
│   │       └── ...
```

#### Políticas de Acceso (RLS)

```sql
-- Lectura pública de imágenes optimizadas
CREATE POLICY "Public read access for optimized images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'properties' AND
  (storage.foldername(name))[2] IN ('thumbnail', 'card', 'gallery', 'full')
);

-- Solo admin puede subir originales
CREATE POLICY "Admin upload access"
ON storage.objects FOR INSERT
USING (
  bucket_id = 'properties' AND
  auth.jwt() ->> 'role' = 'admin'
);
```

---

### Aspectos Legales - Imágenes

**⚠️ Copyright Critical:**

1. **Todas las imágenes scrapeadas tienen copyright** del portal o inmobiliaria original

2. **Obligatorio documentar source:**
```sql
ALTER TABLE property_images ADD COLUMN source_url TEXT;
ALTER TABLE property_images ADD COLUMN source_attribution TEXT;
ALTER TABLE property_images ADD COLUMN license_type VARCHAR(50);
```

3. **Implementar attribution:**
```html
<!-- En frontend -->
<img src="image.webp" alt="..." />
<small>Fuente: ZonaProp - Inmobiliaria XYZ</small>
```

4. **DMCA Takedown Process:**
   - Email de contacto visible
   - Formulario de reporte
   - Proceso de remoción en 24-48h
   - Log de takedowns

5. **Mejor approach: Partnerships**
   - Acuerdos con inmobiliarias para uso legítimo
   - Feed oficial de datos e imágenes
   - Win-win: ellos obtienen exposición

---

## ⚙️ Motor de Procesamiento Automatizado

### Stack Tecnológico Recomendado

#### Scraping
- **Crawlee** - Framework moderno (successor de Apify SDK)
- **Playwright** - Para sites con JavaScript pesado
- **Puppeteer + puppeteer-extra-stealth** - Anti-detección avanzada
- **Cheerio** - Para sites estáticos (10x más rápido)

#### Queue System
- **BullMQ** - Queue robusto con Redis
- **Upstash Redis** - Redis serverless (perfecto para Vercel)
- Alternativa: **pg-boss** (queue en PostgreSQL)

#### Scheduling
- **Supabase pg_cron** + **Edge Functions** (recomendado)
- Alternativa: **Vercel Cron Jobs**

#### Proxies & Anti-Bot
- **ScraperAPI** - Pay-per-successful-request, maneja CAPTCHA
- Alternativas: Bright Data, Oxylabs (premium)

#### Data Processing
- **Zod** - Validation de datos
- **Geocodio** - Geocoding especializado en real estate
- **ML-based deduplication** con fuzzy matching

---

### Arquitectura Propuesta

```
┌─────────────────────────────────────────────┐
│         Supabase pg_cron (Scheduler)        │
│         - Hourly: MercadoLibre API          │
│         - Daily: ZonaProp scraping          │
│         - Weekly: Properati BigQuery sync   │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│       Supabase Edge Functions (Triggers)    │
│       - Iniciar jobs de scraping            │
│       - Enqueue tasks                       │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│      BullMQ + Upstash Redis (Queue)         │
│      Jobs:                                  │
│      - scrape_mercadolibre                  │
│      - scrape_zonaprop                      │
│      - process_raw_listing                  │
│      - download_images                      │
│      - geocode_address                      │
│      - deduplicate                          │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│     Workers (Vercel Functions o VPS)        │
│     - Playwright/Puppeteer instances        │
│     - Image processing (Sharp)              │
│     - Data normalization                    │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│         ScraperAPI (Proxies)                │
│         - Rotate IPs                        │
│         - Solve CAPTCHA                     │
│         - Geolocation                       │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│          Data Pipeline                      │
│   RAW → Parse → Validate → Normalize →     │
│   Enrich → Dedupe → Store                  │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│      Supabase PostgreSQL (Storage)          │
│      - properties (master)                  │
│      - raw_listings                         │
│      - price_history                        │
└─────────────────────────────────────────────┘
```

---

### Configuración de Scraping

#### ZonaProp Scraper (Crawlee + Playwright)

```javascript
// zonaprop-scraper.js
import { PlaywrightCrawler, Dataset } from 'crawlee'
import { createClient } from '@supabase/supabase-js'

const crawler = new PlaywrightCrawler({
  // Rate limiting CRÍTICO
  maxConcurrency: 1,
  maxRequestsPerMinute: 20,          // Max 20 req/min = 1 cada 3 seg

  // Stealth
  launchContext: {
    launchOptions: {
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox'
      ]
    }
  },

  // Request handler
  async requestHandler({ request, page, enqueueLinks, log }) {
    log.info(`Processing: ${request.url}`)

    // Esperar renderizado
    await page.waitForSelector('.listing-card', { timeout: 10000 })

    // Random delay humano
    await page.waitForTimeout(Math.random() * 2000 + 1000)

    // Extraer datos
    const listings = await page.$$eval('.listing-card', cards => {
      return cards.map(card => ({
        url: card.querySelector('a')?.href,
        title: card.querySelector('.title')?.textContent?.trim(),
        price: card.querySelector('.price')?.textContent?.trim(),
        location: card.querySelector('.location')?.textContent?.trim(),
        features: {
          rooms: card.querySelector('.rooms')?.textContent?.trim(),
          surface: card.querySelector('.surface')?.textContent?.trim()
        }
      }))
    })

    // Guardar en dataset
    await Dataset.pushData(listings)

    // Encolar siguiente página (respetando robots.txt)
    await enqueueLinks({
      selector: '.pagination a.next',
      label: 'NEXT_PAGE'
    })
  },

  // Error handling
  failedRequestHandler({ request, log }) {
    log.error(`Request ${request.url} failed`)
  }
})

// Run
await crawler.run([
  'https://www.zonaprop.com.ar/departamentos-venta-cordoba.html'
])
```

#### MercadoLibre API Client

```javascript
// mercadolibre-client.js
import axios from 'axios'

class MercadoLibreClient {
  constructor(accessToken) {
    this.accessToken = accessToken
    this.baseURL = 'https://api.mercadolibre.com'
  }

  async searchProperties(location, options = {}) {
    const params = {
      category: 'MLA1459',              // Inmuebles
      item_location: location,          // 'lat:-31_-31.5,lon:-64_-64.5'
      operation: options.operation,     // 'sale' | 'rent'
      property_type: options.type,      // 'apartment' | 'house'
      price: options.priceRange,        // '50000-150000'
      limit: options.limit || 50,
      offset: options.offset || 0
    }

    const response = await axios.get(`${this.baseURL}/sites/MLA/search`, {
      params,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    return response.data.results
  }

  async getPropertyDetails(itemId) {
    const response = await axios.get(`${this.baseURL}/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    return response.data
  }
}

// Uso
const client = new MercadoLibreClient(process.env.ML_ACCESS_TOKEN)

const cordobaProperties = await client.searchProperties(
  'lat:-31.4_-31.5,lon:-64.1_-64.3',
  {
    operation: 'sale',
    type: 'apartment',
    priceRange: '50000-150000',
    limit: 100
  }
)

for (const property of cordobaProperties) {
  const details = await client.getPropertyDetails(property.id)

  // Guardar en raw_listings
  await supabase.from('raw_listings').insert({
    source_id: mercadolibreSourceId,
    external_id: property.id,
    url: property.permalink,
    raw_data: details,
    title: details.title,
    price_raw: details.price.toString()
  })
}
```

---

### Data Pipeline

```javascript
// data-pipeline.js

class PropertyPipeline {
  constructor(supabase) {
    this.supabase = supabase
  }

  async processRawListing(rawListingId) {
    // 1. Fetch raw listing
    const { data: rawListing } = await this.supabase
      .from('raw_listings')
      .select('*')
      .eq('id', rawListingId)
      .single()

    try {
      // 2. Parse (source-specific)
      const parsed = this.parse(rawListing)

      // 3. Validate
      const validated = this.validate(parsed)

      // 4. Normalize
      const normalized = this.normalize(validated)

      // 5. Enrich
      const enriched = await this.enrich(normalized)

      // 6. Deduplicate
      const duplicates = await this.findDuplicates(enriched)

      if (duplicates.length > 0) {
        // Update existing property
        await this.updateProperty(duplicates[0].id, enriched)
        propertyId = duplicates[0].id
      } else {
        // Create new property
        propertyId = await this.createProperty(enriched)
      }

      // 7. Mark as processed
      await this.supabase
        .from('raw_listings')
        .update({
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
          property_id: propertyId
        })
        .eq('id', rawListingId)

      return propertyId

    } catch (error) {
      // Mark as error
      await this.supabase
        .from('raw_listings')
        .update({
          processing_status: 'error',
          error_message: error.message
        })
        .eq('id', rawListingId)

      throw error
    }
  }

  parse(rawListing) {
    const source = rawListing.source.name
    const rawData = rawListing.raw_data

    switch (source) {
      case 'mercadolibre':
        return this.parseMercadoLibre(rawData)
      case 'zonaprop':
        return this.parseZonaProp(rawData)
      case 'properati':
        return this.parseProperati(rawData)
      default:
        throw new Error(`Unknown source: ${source}`)
    }
  }

  validate(data) {
    // Zod schema validation
    const PropertySchema = z.object({
      property_type: z.enum(['apartment', 'house', 'ph', 'land', 'commercial']),
      operation_type: z.enum(['sale', 'rent', 'temp_rent']),
      price: z.number().positive().optional(),
      currency: z.enum(['ARS', 'USD', 'EUR']).optional(),
      location: z.object({
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional()
      }).optional(),
      // ... more fields
    })

    return PropertySchema.parse(data)
  }

  normalize(data) {
    return {
      ...data,
      // Normalize property type
      property_type: this.normalizePropertyType(data.property_type),

      // Normalize price to USD
      price_usd: data.currency === 'USD'
        ? data.price
        : this.convertToUSD(data.price, data.currency),

      // Normalize address
      address: this.normalizeAddress(data.address),

      // Extract street components
      ...this.parseAddress(data.address)
    }
  }

  async enrich(data) {
    // Geocoding if no coordinates
    if (!data.location?.lat && data.address) {
      const coordinates = await this.geocode(data.address)
      data.location = coordinates
      data.location_confidence = coordinates.confidence
    }

    // Calculate data quality score
    data.data_quality_score = this.calculateQualityScore(data)

    return data
  }

  async findDuplicates(data) {
    if (data.location?.lat) {
      // Search by coordinates (50m radius)
      const { data: matches } = await this.supabase.rpc('find_properties_nearby', {
        p_lat: data.location.lat,
        p_lng: data.location.lng,
        p_radius_m: 50
      })

      return matches.filter(m => m.similarity_score > 0.85)
    }

    // Fallback: fuzzy match by address
    const { data: matches } = await this.supabase.rpc('find_properties_by_address', {
      p_address: data.address,
      p_threshold: 0.8
    })

    return matches
  }

  async createProperty(data) {
    const { data: property } = await this.supabase
      .from('properties')
      .insert({
        ...data,
        location: data.location?.lat
          ? `SRID=4326;POINT(${data.location.lng} ${data.location.lat})`
          : null,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        times_seen: 1
      })
      .select()
      .single()

    return property.id
  }

  async updateProperty(propertyId, data) {
    await this.supabase
      .from('properties')
      .update({
        last_seen_at: new Date().toISOString(),
        times_seen: this.supabase.sql`times_seen + 1`,
        // Update fields that changed
        ...(data.price !== undefined && { price: data.price }),
        ...(data.description !== undefined && { description: data.description })
      })
      .eq('id', propertyId)
  }
}
```

---

### Scheduling con Supabase pg_cron

```sql
-- Setup pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job 1: Scrape MercadoLibre every 6 hours
SELECT cron.schedule(
  'scrape-mercadolibre',
  '0 */6 * * *',                    -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://your-edge-function.supabase.co/scrape-mercadolibre',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
  );
  $$
);

-- Job 2: Scrape ZonaProp daily at 3 AM
SELECT cron.schedule(
  'scrape-zonaprop',
  '0 3 * * *',                      -- Daily at 3 AM
  $$
  SELECT net.http_post(
    url := 'https://your-edge-function.supabase.co/scrape-zonaprop',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
  );
  $$
);

-- Job 3: Sync Properati BigQuery weekly
SELECT cron.schedule(
  'sync-properati',
  '0 4 * * 0',                      -- Sundays at 4 AM
  $$
  SELECT net.http_post(
    url := 'https://your-edge-function.supabase.co/sync-properati',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
  );
  $$
);

-- Job 4: Detect inactive properties daily
SELECT cron.schedule(
  'detect-inactive',
  '0 5 * * *',                      -- Daily at 5 AM
  $$SELECT detect_inactive_properties()$$
);

-- Job 5: Deduplication weekly
SELECT cron.schedule(
  'deduplicate',
  '0 6 * * 0',                      -- Sundays at 6 AM
  $$SELECT create_duplicate_clusters()$$
);
```

---

### Queue System con BullMQ

```javascript
// queue-setup.js
import { Queue, Worker } from 'bullmq'
import { Redis } from '@upstash/redis'

// Upstash Redis connection
const connection = {
  host: process.env.UPSTASH_REDIS_HOST,
  port: 6379,
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {}
}

// Define queues
const scrapingQueue = new Queue('scraping', { connection })
const processingQueue = new Queue('processing', { connection })
const imageQueue = new Queue('images', { connection })

// Worker: Scraping
const scrapingWorker = new Worker(
  'scraping',
  async job => {
    const { source, url, options } = job.data

    console.log(`Scraping ${source}: ${url}`)

    // Execute scraping
    const listings = await scrapeSource(source, url, options)

    // Enqueue for processing
    for (const listing of listings) {
      await processingQueue.add('process-listing', {
        source,
        listing
      })
    }

    return { scraped: listings.length }
  },
  {
    connection,
    concurrency: 2,                  // Max 2 concurrent scraping jobs
    limiter: {
      max: 10,                       // Max 10 jobs
      duration: 60000                // Per minute
    }
  }
)

// Worker: Processing
const processingWorker = new Worker(
  'processing',
  async job => {
    const { source, listing } = job.data

    console.log(`Processing listing: ${listing.id}`)

    // Insert raw listing
    const { data: rawListing } = await supabase
      .from('raw_listings')
      .insert({
        source_id: getSourceId(source),
        external_id: listing.id,
        url: listing.url,
        raw_data: listing,
        title: listing.title
      })
      .select()
      .single()

    // Process through pipeline
    const pipeline = new PropertyPipeline(supabase)
    const propertyId = await pipeline.processRawListing(rawListing.id)

    // Enqueue image downloads
    if (listing.images && listing.images.length > 0) {
      await imageQueue.add('download-images', {
        propertyId,
        images: listing.images
      })
    }

    return { propertyId }
  },
  {
    connection,
    concurrency: 10
  }
)

// Worker: Images
const imageWorker = new Worker(
  'images',
  async job => {
    const { propertyId, images } = job.data

    console.log(`Downloading ${images.length} images for property ${propertyId}`)

    for (const [index, imageUrl] of images.entries()) {
      try {
        // Download
        const buffer = await downloadImage(imageUrl)

        // Process (resize, WebP conversion)
        const processed = await processImage(buffer)

        // Upload to Supabase Storage
        const storagePath = `properties/${propertyId}/gallery/${index}.webp`
        await supabase.storage
          .from('properties')
          .upload(storagePath, processed.gallery)

        // Save record
        await supabase.from('property_images').insert({
          property_id: propertyId,
          url: `${storageURL}/${storagePath}`,
          display_order: index
        })

      } catch (error) {
        console.error(`Failed to process image ${imageUrl}:`, error)
      }
    }

    return { processed: images.length }
  },
  {
    connection,
    concurrency: 5
  }
)

// Error handling
scrapingWorker.on('failed', (job, err) => {
  console.error(`Scraping job ${job.id} failed:`, err)
})

processingWorker.on('failed', (job, err) => {
  console.error(`Processing job ${job.id} failed:`, err)
})

// Export queues
export { scrapingQueue, processingQueue, imageQueue }
```

---

### Cumplimiento Legal y Ético

#### Robots.txt Compliance

```javascript
import { RobotsTxtParser } from 'robots-txt-parser'

class RobotsTxtChecker {
  constructor() {
    this.cache = new Map()
  }

  async isAllowed(url) {
    const domain = new URL(url).hostname

    // Check cache
    if (!this.cache.has(domain)) {
      const robotsTxtUrl = `https://${domain}/robots.txt`
      const parser = new RobotsTxtParser()
      await parser.fetch(robotsTxtUrl)
      this.cache.set(domain, parser)
    }

    const parser = this.cache.get(domain)
    return parser.isAllowed(url, 'RealEstateAggregator')
  }
}

const robotsChecker = new RobotsTxtChecker()

// Antes de cada request
if (!await robotsChecker.isAllowed(targetUrl)) {
  console.log(`Blocked by robots.txt: ${targetUrl}`)
  return
}
```

#### Rate Limiting Respetuoso

```javascript
const rateLimits = {
  'zonaprop.com.ar': {
    requestsPerSecond: 0.33,         // 1 request cada 3 segundos
    requestsPerHour: 1200,           // Max 1200 req/hora
    requestsPerDay: 10000,           // Max 10k req/día
    activeHours: [2, 3, 4, 5, 6]     // Scraping solo 2-6 AM
  },
  'mercadolibre.com.ar': {
    requestsPerSecond: 2,            // API oficial, más tolerante
    requestsPerHour: 7200
  }
}

class RateLimiter {
  constructor(domain, limits) {
    this.domain = domain
    this.limits = limits
    this.requestLog = []
  }

  async waitIfNeeded() {
    const now = Date.now()
    const currentHour = new Date().getHours()

    // Check active hours
    if (this.limits.activeHours &&
        !this.limits.activeHours.includes(currentHour)) {
      throw new Error(`Scraping not allowed at hour ${currentHour}`)
    }

    // Clean old requests from log
    this.requestLog = this.requestLog.filter(t => now - t < 86400000) // 24h

    // Check daily limit
    if (this.requestLog.length >= this.limits.requestsPerDay) {
      throw new Error('Daily limit reached')
    }

    // Calculate wait time
    const recentRequests = this.requestLog.filter(t => now - t < 1000)
    if (recentRequests.length >= this.limits.requestsPerSecond) {
      const oldestRecent = Math.min(...recentRequests)
      const waitMs = 1000 - (now - oldestRecent)

      if (waitMs > 0) {
        console.log(`Rate limit: waiting ${waitMs}ms`)
        await new Promise(resolve => setTimeout(resolve, waitMs))
      }
    }

    // Log request
    this.requestLog.push(Date.now())
  }
}
```

#### User-Agent Honesto

```javascript
const userAgent = [
  'RealEstateAggregator/1.0',
  '(+https://your-website.com/about-scraping)',
  'contact@your-email.com'
].join(' ')

// En todas las requests
const response = await fetch(url, {
  headers: {
    'User-Agent': userAgent
  }
})
```

---

### Infraestructura y Deployment

#### Opción A: Serverless (Recomendado para MVP)

**Stack:**
- Vercel Functions (workers)
- Supabase (database + storage + cron)
- Upstash Redis (queue)
- ScraperAPI (proxies)

**Ventajas:**
- Cero mantenimiento
- Auto-scaling
- Pay-per-use
- Setup rápido

**Costos MVP:**
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes
- Upstash: $10/mes (25k commands)
- ScraperAPI: $49/mes (50k requests)
- **Total: ~$104/mes + $0.001/scrape**

#### Opción B: Hybrid (Para escalar)

**Stack:**
- VPS con Docker (workers)
- Supabase (database + storage)
- Redis on VPS (queue)
- ScraperAPI (proxies)

**Ventajas:**
- Más control
- Mejor costo a escala
- Performance consistente

**Costos:**
- VPS (8GB RAM): $40/mes
- Supabase Pro: $60/mes
- ScraperAPI: $199/mes (500k requests)
- **Total: ~$299/mes**

#### Docker Compose para Workers

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  scraping-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - REDIS_URL=redis://redis:6379
      - WORKER_TYPE=scraping
    depends_on:
      - redis
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G

  processing-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - REDIS_URL=redis://redis:6379
      - WORKER_TYPE=processing
    depends_on:
      - redis
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '1'
          memory: 1G

  image-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - REDIS_URL=redis://redis:6379
      - WORKER_TYPE=images
    depends_on:
      - redis
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M

volumes:
  redis-data:
```

---

## 📋 Estrategia de Implementación

### Fase 1: Fundación Legal (Semanas 1-4)

**Objetivo:** MVP con fuentes 100% legales

#### Tareas
- [ ] Setup Supabase proyecto
- [ ] Implementar schema completo de BD
- [ ] Configurar extensiones (PostGIS, pg_trgm, TimescaleDB)
- [ ] Implementar MercadoLibre OAuth 2.0
  - [ ] Registrar app en Developer Portal
  - [ ] Flujo de autenticación
  - [ ] Client para API
- [ ] Configurar acceso a Properati BigQuery
  - [ ] Proyecto Google Cloud
  - [ ] Queries de sincronización
- [ ] Pipeline básico de normalización
- [ ] Setup Supabase Storage para imágenes
- [ ] Procesamiento básico de imágenes (Sharp)

#### Entregables
- Base de datos funcional con schema completo
- Ingesta automática de MercadoLibre
- Sync semanal de Properati
- ~10-15k propiedades en Córdoba

#### Métricas de Éxito
- 100% de listings de ML ingestados correctamente
- <5% de errores en normalización
- Deduplicación básica funcionando (>80% accuracy)

---

### Fase 2: Expansión Controlada (Semanas 5-8)

**Objetivo:** Agregar scraping ético de ZonaProp

#### Tareas
- [ ] Implementar scraper de ZonaProp
  - [ ] Crawlee + Playwright setup
  - [ ] Rate limiting estricto
  - [ ] Robots.txt compliance
  - [ ] User-agent honesto
- [ ] Sistema de colas con BullMQ + Upstash
- [ ] Deduplicación avanzada
  - [ ] Match por coordenadas (PostGIS)
  - [ ] Fuzzy matching de direcciones
  - [ ] Clustering automático
- [ ] Descarga y procesamiento de imágenes
  - [ ] Rate limiting por dominio
  - [ ] Multi-tamaño (thumbnail, card, gallery, full)
  - [ ] Conversión WebP
  - [ ] BlurHash generation
- [ ] Supabase pg_cron jobs
  - [ ] Scraping nocturno ZonaProp
  - [ ] Detección de inactivos
  - [ ] Actualización de precios

#### Entregables
- Scraping automatizado de ZonaProp funcionando
- ~65,000 propiedades totales en Córdoba
- Imágenes optimizadas y servidas por CDN
- Historial de precios tracking

#### Métricas de Éxito
- 0 bloqueos de IP en primera semana
- >90% de imágenes descargadas exitosamente
- Deduplicación >85% accuracy
- <10% de duplicados en sistema

---

### Fase 3: Optimización y Escala (Semanas 9-12)

**Objetivo:** Producción robusta y escalable

#### Tareas
- [ ] Agregar más fuentes
  - [ ] CordobaProp (si factible)
  - [ ] Inmuebles24
- [ ] Implementar ScraperAPI para anti-bot
- [ ] Geocoding automático de direcciones sin coordenadas
- [ ] ML-based deduplication
  - [ ] Training dataset de duplicados confirmados
  - [ ] Modelo de similitud
- [ ] API pública
  - [ ] GraphQL con Hasura o PostgREST
  - [ ] Rate limiting
  - [ ] API keys
- [ ] Monitoreo y observability
  - [ ] Logs estructurados
  - [ ] Métricas de scraping
  - [ ] Alertas de errores
- [ ] Frontend básico
  - [ ] Búsqueda de propiedades
  - [ ] Filtros avanzados
  - [ ] Mapas interactivos
  - [ ] Comparación de precios

#### Entregables
- 100,000+ propiedades en sistema
- API pública documentada
- Frontend funcional
- Monitoreo completo

#### Métricas de Éxito
- Uptime >99.5%
- Latencia API <500ms p95
- Cobertura de Córdoba >80% del mercado

---

### Fase 4: Partnerships y Legitimación (Semanas 13-16)

**Objetivo:** Modelo de negocio sostenible

#### Tareas
- [ ] Establecer partnerships con inmobiliarias
  - [ ] Feed oficial de datos
  - [ ] Acuerdos de uso de imágenes
  - [ ] Revenue share o leads
- [ ] Compliance legal completo
  - [ ] Asesoría legal en Argentina
  - [ ] Términos y condiciones
  - [ ] Política de privacidad GDPR/PDPA
  - [ ] DMCA takedown process
- [ ] Features premium
  - [ ] Alertas de precio
  - [ ] Análisis de mercado
  - [ ] Valuación automática (AVM)
  - [ ] Recomendaciones personalizadas
- [ ] Monetización
  - [ ] Modelo freemium API
  - [ ] Leads para inmobiliarias
  - [ ] Publicidad contextual

#### Entregables
- Acuerdos con 10+ inmobiliarias
- Compliance legal certificado
- Modelo de monetización activo

---

## ⚖️ Consideraciones Legales

### Marco Legal en Argentina

#### Leyes Aplicables

1. **Protección de Datos Personales**
   - Ley 25.326 (Argentina Personal Data Protection Act)
   - Vigente desde 2000
   - Regulada por AAIP (Agencia de Acceso a la Información Pública)

2. **Propiedad Intelectual**
   - Ley 11.723 (Derechos de Autor)
   - Copyright de imágenes y contenido textual
   - Fair use limitado en Argentina

3. **Código Civil y Comercial**
   - Términos y condiciones contractuales
   - Responsabilidad civil por daños

#### Análisis por Fuente

| Fuente | Status Legal | Riesgo | Recomendación |
|--------|--------------|--------|---------------|
| **MercadoLibre API** | ✅ Legal | Bajo | Usar libremente bajo términos OAuth |
| **Properati BigQuery** | ✅ Legal | Bajo | Uso permitido para investigación |
| **ZonaProp** | ⚠️ Zona Gris | Medio | Scraping ético con precauciones |
| **Argenprop** | ❌ Prohibido | Alto | Evitar completamente |
| **Inmuebles24** | ⚠️ Zona Gris | Medio | Similar a ZonaProp |
| **La Voz** | ❓ Desconocido | Alto | Investigar más antes de implementar |

---

### Estrategia Legal Recomendada

#### 1. Priorizar Fuentes Legales

**Comenzar con:**
- MercadoLibre API (OAuth 2.0)
- Properati BigQuery (dataset público)

**Beneficios:**
- 100% legal y documentado
- Sin riesgo de bloqueos
- Soporte oficial
- ~15-20k propiedades Córdoba

#### 2. Scraping Ético (Si Necesario)

**Solo implementar si:**
- Necesitas mayor cobertura
- Has consultado con abogado
- Puedes asumir riesgo de bloqueo

**Protocolos obligatorios:**
- ✅ Respetar robots.txt al 100%
- ✅ Rate limiting agresivo (1 req/3 seg)
- ✅ User-agent identificable con contacto
- ✅ Horarios nocturnos (2-6 AM)
- ✅ No scraping de datos personales (emails, teléfonos)
- ✅ Attribution de fuente en todos los datos

#### 3. Manejo de Imágenes

**Obligatorio:**
- Documentar source de cada imagen
- Implementar sistema de attribution
- Política de DMCA takedown
- Email de contacto visible

**Mejor práctica:**
```javascript
// Metadata de imagen
{
  url: "https://cdn.mysite.com/image.webp",
  source_url: "https://zonaprop.com.ar/...",
  source_attribution: "ZonaProp - Inmobiliaria ABC",
  license_type: "source_copyright",
  uploaded_at: "2025-11-10",
  takedown_email: "copyright@mysite.com"
}
```

#### 4. Política de Privacidad GDPR/PDPA

**Aunque Argentina no está en GDPR, implementar best practices:**

```markdown
## Política de Privacidad

### Datos que Recopilamos
- Listings de propiedades de fuentes públicas
- NO recopilamos datos personales directamente de usuarios finales

### Fuentes de Datos
- MercadoLibre (API oficial)
- Properati (dataset público)
- [Otras fuentes con attribution]

### Uso de Datos
- Agregación y comparación de propiedades
- Análisis de mercado inmobiliario
- Proveer información a usuarios finales

### Derechos de Propietarios
- Solicitar remoción de listing
- Actualizar información incorrecta
- Contacto: privacy@mysite.com

### Copyright
- Las imágenes son propiedad de los portales originales
- Attribution provista en cada listing
- DMCA takedown: copyright@mysite.com
```

#### 5. Términos y Condiciones

**Cláusulas críticas:**

```markdown
## Términos y Condiciones

### 1. Naturaleza del Servicio
Este servicio agrega información públicamente disponible de múltiples
fuentes para facilitar la búsqueda de propiedades. NO somos agentes
inmobiliarios ni representantes de las propiedades listadas.

### 2. Fuentes de Datos
Los datos provienen de:
- APIs oficiales (MercadoLibre)
- Datasets públicos (Properati)
- Web scraping ético de fuentes públicas

Todas las fuentes son debidamente atribuidas.

### 3. Accuracy de Datos
Si bien hacemos nuestro mejor esfuerzo para mantener información
actualizada, NO garantizamos la exactitud, completitud o vigencia
de los datos. Los usuarios deben verificar toda la información
directamente con el vendedor/inmobiliaria.

### 4. Copyright
Las imágenes y descripciones son propiedad de sus respectivos
dueños. Si cree que su copyright ha sido violado, contacte
copyright@mysite.com.

### 5. Limitación de Responsabilidad
NO somos responsables por decisiones tomadas basadas en nuestra
información. Este servicio es informativo únicamente.

### 6. Ley Aplicable
Estos términos se rigen por las leyes de la República Argentina.
Jurisdicción: [Ciudad/Provincia].
```

---

### Proceso DMCA Takedown

```javascript
// Endpoint para takedown requests
app.post('/api/takedown', async (req, res) => {
  const {
    propertyId,
    imageUrl,
    requestorName,
    requestorEmail,
    reason,
    copyrightProof
  } = req.body

  // Log request
  await supabase.from('takedown_requests').insert({
    property_id: propertyId,
    image_url: imageUrl,
    requestor_name: requestorName,
    requestor_email: requestorEmail,
    reason: reason,
    status: 'pending',
    received_at: new Date().toISOString()
  })

  // Immediately remove image (compliance)
  await supabase
    .from('property_images')
    .update({ status: 'removed', removed_reason: 'dmca_takedown' })
    .eq('url', imageUrl)

  // Send confirmation email
  await sendEmail({
    to: requestorEmail,
    subject: 'DMCA Takedown Request Received',
    body: `Your takedown request for ${imageUrl} has been received
           and processed. The content has been removed.`
  })

  // Notify admin
  await sendEmail({
    to: 'admin@mysite.com',
    subject: 'New DMCA Takedown Request',
    body: `Property: ${propertyId}\nImage: ${imageUrl}\nRequestor: ${requestorName}`
  })

  res.json({
    success: true,
    message: 'Content removed within 24 hours'
  })
})
```

---

### Consulta Legal Recomendada

**Antes de lanzar a producción:**

1. **Contratar abogado especializado en:**
   - Derecho informático
   - Propiedad intelectual
   - Derecho comercial

2. **Revisar:**
   - Términos y condiciones
   - Política de privacidad
   - Proceso de DMCA
   - Contratos con inmobiliarias (si aplica)

3. **Jurisdicción:**
   - Determinar jurisdicción aplicable
   - Registrar empresa en Argentina si es comercial

**Costos estimados:**
- Consulta inicial: $200-500 USD
- Redacción de términos: $500-1,000 USD
- Review anual: $300-500 USD

---

## 💰 Costos y Presupuesto

### Estimación de Costos - MVP (50k propiedades)

#### Infrastructure

| Servicio | Plan | Costo Mensual | Notas |
|----------|------|---------------|-------|
| **Supabase Database** | Pro | $25 | 8GB incluido, luego $0.125/GB |
| **Supabase Storage** | Incluido | +$0 | Dentro de Pro plan |
| **Vercel Hosting** | Pro | $20 | Functions incluidas |
| **Upstash Redis** | Pay-as-you-go | $10 | 25k commands/día |
| **ScraperAPI** | Hobby | $49 | 50k requests/mes |
| **Google Cloud** (BigQuery) | Pay-as-you-go | $5 | Queries Properati |
| | | **$109/mes** | |

#### Additional Costs (Variable)

| Item | Costo | Notas |
|------|-------|-------|
| **Geocoding** (Geocodio) | $0.50/1k addresses | ~$25/mes para 50k |
| **Domain** | $12/año | .com o .com.ar |
| **SSL Certificate** | $0 | Let's Encrypt (gratis) |
| **Monitoring** (opcional) | $0-29 | Sentry free tier o Basic |
| | **~$27/mes** | |

**Total MVP: ~$136/mes**

---

### Estimación de Costos - Growth (500k propiedades)

#### Infrastructure

| Servicio | Plan | Costo Mensual | Notas |
|----------|------|---------------|-------|
| **Supabase Database** | Pro + storage | $60 | 50GB almacenamiento |
| **Supabase Storage** | Pro | +$20 | 100GB imágenes |
| **Vercel Hosting** | Pro | $20 | Suficiente para tráfico |
| **Upstash Redis** | Pay-as-you-go | $50 | 250k commands/día |
| **ScraperAPI** | Freelancer | $149 | 300k requests/mes |
| **Google Cloud** (BigQuery) | Pay-as-you-go | $10 | |
| | | **$309/mes** | |

#### Additional Costs

| Item | Costo | Notas |
|------|-------|-------|
| **Geocoding** | $250 | 500k addresses |
| **Monitoring** | $29 | Sentry Basic |
| **Backup externo** | $20 | S3 snapshot semanal |
| | **$299/mes** | |

**Total Growth: ~$608/mes**

---

### Estimación de Costos - Scale (5M propiedades)

#### Infrastructure (Hybrid VPS)

| Servicio | Plan | Costo Mensual | Notas |
|----------|------|---------------|-------|
| **VPS (Workers)** | 16GB RAM, 4 vCPU | $80 | Hetzner o DigitalOcean |
| **Supabase Database** | Pro + extra | $150 | 500GB almacenamiento |
| **Supabase Storage** | Pro + extra | $100 | 1TB imágenes |
| **Redis** | VPS self-hosted | $0 | Incluido en VPS |
| **ScraperAPI** | Business | $399 | 2M requests/mes |
| **Google Cloud** (BigQuery) | Pay-as-you-go | $20 | |
| **CDN** (Cloudflare Pro) | Pro | $20 | Mejor performance |
| | | **$769/mes** | |

#### Additional Costs

| Item | Costo | Notas |
|------|-------|-------|
| **Geocoding** | $250 | Batch processing |
| **Monitoring** | $79 | Sentry Team |
| **DevOps/Maintenance** | $500 | Part-time |
| | **$829/mes** | |

**Total Scale: ~$1,598/mes**

---

### Cost Breakdown por Componente

#### 1. Database Storage

**Cálculo:**
```
Properties: 500k × 5 KB = 2.5 GB
Raw Listings: 10M × 10 KB = 100 GB
Property History: 50M × 3 KB = 150 GB
Price History: 100M × 200 B = 20 GB
Images Metadata: 5M × 500 B = 2.5 GB

Total: ~275 GB

Supabase Pro: $25 base (8GB) + (275-8) × $0.125 = $58/mes
```

#### 2. Image Storage & CDN

**Cálculo:**
```
50k propiedades × 10 imágenes/propiedad = 500k imágenes

Sizes:
- Thumbnail (150px): 15 KB
- Card (400px): 50 KB
- Gallery (800px): 150 KB
- Full (1200px): 300 KB
Total por imagen: ~515 KB

Storage: 500k × 515 KB = 257 GB

Supabase: $25 base (100GB) + 157GB × $0.021 = $28/mes

Bandwidth:
100k views/mes × 50 KB (card) = 5 GB
Supabase: $25 incluye 200 GB/mes = $0 adicional
```

#### 3. Scraping & Proxies

**Cálculo:**
```
ZonaProp: 54k propiedades × 2 updates/mes = 108k requests
MercadoLibre: API no cuenta (OAuth gratis)
Properati: BigQuery gratis
Imágenes: 500k imágenes × 1 download = 500k requests

Total: ~608k requests/mes

ScraperAPI Freelancer: $149 (300k requests)
Necesitas: $149 × 2 = $298/mes
```

#### 4. Queue System

**Cálculo:**
```
Jobs por día:
- Scraping: 5k propiedades × 2 sources = 10k jobs
- Processing: 10k jobs
- Image downloads: 50k jobs

Total: 70k jobs/día = 2.1M jobs/mes

Upstash Redis:
$10 base (25k commands/día) + overages
2.1M / 30 / 25k = 2.8x over limit
Estimado: $10 × 3 = $30/mes

Alternativa: Redis en VPS = $0
```

---

### ROI y Monetización

#### Modelos de Ingreso Potenciales

**1. API Freemium**
```
Free tier: 100 requests/día
Basic: $29/mes - 1,000 requests/día
Pro: $99/mes - 10,000 requests/día
Enterprise: Custom pricing

Estimado: 50 clientes Basic + 10 Pro = $2,440/mes
```

**2. Leads para Inmobiliarias**
```
Lead price: $5-15 USD por lead calificado
100 leads/mes × $10 = $1,000/mes
```

**3. Premium Features**
```
Alertas de precio: $9/mes
Análisis de mercado: $19/mes
Valuación automática: $29/mes

Estimado: 100 usuarios premium = $1,500/mes
```

**4. Publicidad Contextual**
```
Google AdSense: $1-3 CPM
10,000 views/día × 30 días × $2 CPM / 1000 = $600/mes
```

**Total Revenue Potential: ~$5,540/mes**

**Break-even:** Con MVP costs de $136/mes, solo necesitas ~25 clientes Basic de API.

---

## 🗓️ Roadmap de Desarrollo

### Timeline Completo (16 semanas)

```
Semanas 1-4: Fundación Legal
├─ Semana 1
│  ├─ Setup Supabase proyecto
│  ├─ Implementar schema de BD
│  └─ Extensiones PostgreSQL
├─ Semana 2
│  ├─ MercadoLibre OAuth flow
│  ├─ ML API client
│  └─ Normalizers por fuente
├─ Semana 3
│  ├─ Properati BigQuery setup
│  ├─ Sync scripts
│  └─ Supabase Storage config
└─ Semana 4
   ├─ Pipeline de procesamiento
   ├─ Deduplicación básica
   └─ Testing end-to-end

Semanas 5-8: Expansión Controlada
├─ Semana 5
│  ├─ ZonaProp scraper (Crawlee)
│  ├─ Rate limiting
│  └─ Robots.txt compliance
├─ Semana 6
│  ├─ BullMQ + Upstash setup
│  ├─ Queue workers
│  └─ Supabase pg_cron jobs
├─ Semana 7
│  ├─ Image downloader
│  ├─ Sharp processing
│  └─ Multi-size generation
└─ Semana 8
   ├─ Deduplicación avanzada
   ├─ PostGIS matching
   └─ Performance testing

Semanas 9-12: Optimización y Escala
├─ Semana 9
│  ├─ Más fuentes (Inmuebles24)
│  ├─ ScraperAPI integration
│  └─ Geocoding automático
├─ Semana 10
│  ├─ API pública (GraphQL)
│  ├─ Rate limiting
│  └─ Documentación
├─ Semana 11
│  ├─ Monitoreo (Sentry)
│  ├─ Logs estructurados
│  └─ Alertas
└─ Semana 12
   ├─ Frontend básico
   ├─ Búsqueda + filtros
   └─ Mapas interactivos

Semanas 13-16: Partnerships y Legitimación
├─ Semana 13-14
│  ├─ Outreach a inmobiliarias
│  ├─ Partnerships
│  └─ Acuerdos de datos
├─ Semana 15
│  ├─ Asesoría legal
│  ├─ Términos y condiciones
│  └─ Compliance
└─ Semana 16
   ├─ Monetización
   ├─ Features premium
   └─ Launch público
```

---

### Milestones y KPIs

#### Milestone 1: MVP Legal (Semana 4)
- ✅ 10,000+ propiedades ingestadas
- ✅ MercadoLibre API funcionando
- ✅ Properati sync automático
- ✅ Deduplicación >80% accuracy
- ✅ 0 errores críticos de BD

#### Milestone 2: Full Coverage (Semana 8)
- ✅ 65,000+ propiedades (Córdoba)
- ✅ 5+ fuentes integradas
- ✅ 100,000+ imágenes procesadas
- ✅ Deduplicación >85% accuracy
- ✅ 0 bloqueos de IP

#### Milestone 3: API Pública (Semana 12)
- ✅ API GraphQL documentada
- ✅ 100ms latency p95
- ✅ 10,000 requests/día capacity
- ✅ 99% uptime
- ✅ Frontend funcional

#### Milestone 4: Revenue (Semana 16)
- ✅ 10+ partnerships activos
- ✅ 25+ API customers
- ✅ $1,000+ MRR
- ✅ Compliance legal completo

---

## 📚 Referencias y Recursos

### Documentación Oficial

**APIs:**
- MercadoLibre API: https://developers.mercadolibre.com.ar/
- Properati BigQuery: https://www.properati.com.ar/data
- Supabase Docs: https://supabase.com/docs

**Frameworks:**
- Crawlee: https://crawlee.dev/
- Playwright: https://playwright.dev/
- BullMQ: https://docs.bullmq.io/

**PostgreSQL Extensions:**
- PostGIS: https://postgis.net/documentation/
- pg_trgm: https://www.postgresql.org/docs/current/pgtrgm.html
- TimescaleDB: https://docs.timescale.com/

---

### Repositorios GitHub de Referencia

**Scrapers Multi-Portal:**
- https://github.com/mauroeparis/scrappdept (Python)
- https://github.com/rodrigouroz/housing_scrapper (Python)
- https://github.com/Sotrosca/zona-prop-scraper (Python)
- https://github.com/pablol314/scraper-zonaprop (Fork mejorado)

**Crawling Frameworks:**
- https://github.com/apify/crawlee (Node.js)
- https://github.com/scrapy/scrapy (Python)

---

### Herramientas y Servicios

**Scraping:**
- ScraperAPI: https://www.scraperapi.com/
- Bright Data: https://brightdata.com/
- Apify: https://apify.com/

**Geocoding:**
- Geocodio: https://www.geocod.io/
- Nominatim: https://nominatim.org/ (open source)

**Monitoring:**
- Sentry: https://sentry.io/
- Datadog: https://www.datadoghq.com/
- New Relic: https://newrelic.com/

---

### Legal y Compliance

**Leyes Argentina:**
- Ley 25.326 (Protección de Datos): http://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/norma.htm
- AAIP: https://www.argentina.gob.ar/aaip

**DMCA:**
- DMCA.com: https://www.dmca.com/
- Copyright Alliance: https://copyrightalliance.org/

---

### Comunidades y Foros

**Stack Overflow:**
- [web-scraping] tag: https://stackoverflow.com/questions/tagged/web-scraping
- [supabase] tag: https://stackoverflow.com/questions/tagged/supabase

**Discord:**
- Supabase Discord: https://discord.supabase.com/
- Crawlee Discord: https://discord.com/invite/jyEM2PRvMU

**Reddit:**
- r/webscraping: https://reddit.com/r/webscraping
- r/Supabase: https://reddit.com/r/Supabase

---

## 🎯 Conclusiones y Próximos Pasos

### Resumen de Recomendaciones

**1. Stack Tecnológico:**
- PostgreSQL + Supabase (database)
- Crawlee + Playwright (scraping)
- BullMQ + Upstash (queue)
- Sharp (image processing)
- Supabase Storage + CDN (images)

**2. Estrategia de Datos:**
- Comenzar con fuentes legales (MercadoLibre API + Properati BigQuery)
- Expandir progresivamente a scraping ético
- Rate limiting estricto y respetuoso
- Deduplicación multi-etapa con PostGIS

**3. Aspectos Legales:**
- Priorizar compliance desde día 1
- Consultar abogado especializado
- Implementar DMCA takedown
- Buscar partnerships para legitimación

**4. Costos:**
- MVP: ~$136/mes
- Growth: ~$608/mes
- Scale: ~$1,598/mes
- ROI positivo desde 25 clientes API

---

### Próximos Pasos Inmediatos

**Semana 1:**
1. [ ] Crear cuenta Supabase y proyecto
2. [ ] Registrar app en MercadoLibre Developer Portal
3. [ ] Setup Google Cloud para Properati BigQuery
4. [ ] Inicializar repositorio Git con estructura
5. [ ] Implementar schema de BD (ejecutar DDL completo)

**Semana 2:**
1. [ ] Implementar MercadoLibre OAuth flow
2. [ ] Crear normalizer para datos de ML
3. [ ] Script de sync de Properati
4. [ ] Pipeline básico de procesamiento
5. [ ] Testing de deduplicación

**Semana 3:**
1. [ ] Setup Supabase Storage
2. [ ] Implementar procesamiento de imágenes (Sharp)
3. [ ] Generación de multi-tamaño + BlurHash
4. [ ] Upload a Storage con políticas RLS

**Semana 4:**
1. [ ] Testing end-to-end completo
2. [ ] Optimización de queries
3. [ ] Documentación técnica
4. [ ] Demo funcional
5. [ ] Planificación Fase 2

---

### Checklist de Pre-Lanzamiento

**Técnico:**
- [ ] Schema de BD completo e indexado
- [ ] APIs oficiales integradas (ML, Properati)
- [ ] Pipeline de normalización funcionando
- [ ] Deduplicación >85% accuracy
- [ ] Imágenes optimizadas y servidas por CDN
- [ ] Backups automáticos configurados
- [ ] Monitoring y alertas activas

**Legal:**
- [ ] Términos y condiciones redactados
- [ ] Política de privacidad publicada
- [ ] DMCA takedown process implementado
- [ ] Consulta legal completada
- [ ] Attribution de fuentes en UI

**Operacional:**
- [ ] Costos proyectados y aprobados
- [ ] Servidor/infrastructure provisionado
- [ ] Documentación técnica completa
- [ ] Runbooks para operaciones comunes
- [ ] On-call rotation definida

---

### Contacto y Soporte

Para implementación de este proyecto, recursos adicionales, o consultas:

**Documentos Relacionados:**
- Arquitectura de Base de Datos: Ver sección completa arriba
- Almacenamiento de Imágenes: `/Users/agustinmontoya/RECOMENDACION_ALMACENAMIENTO_IMAGENES.md`
- Motor de Scraping: `/Users/agustinmontoya/MOTOR_SCRAPING_INMUEBLES_DISEÑO_TECNICO.md`

---

**Última actualización:** 2025-11-10
**Versión:** 1.0
**Status:** Ready for Implementation

---

**¡Éxito con tu proyecto de agregación inmobiliaria! 🏠🚀**
