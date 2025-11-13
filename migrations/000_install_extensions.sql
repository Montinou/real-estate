-- Install Required PostgreSQL Extensions
-- Must run before other migrations

-- PostGIS: Geographic data types and functions
CREATE EXTENSION IF NOT EXISTS postgis;

-- Unaccent: Remove accents from text for better searching
-- Used in slug generation and search indexes
CREATE EXTENSION IF NOT EXISTS unaccent;

-- UUID generation (if needed in the future)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Comments
COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';
COMMENT ON EXTENSION unaccent IS 'Text search dictionary that removes accents';
COMMENT ON EXTENSION "uuid-ossp" IS 'Generate universally unique identifiers (UUIDs)';
