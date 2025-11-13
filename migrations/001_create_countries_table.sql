-- Migration 001: Create countries table
-- ISO 3166 country codes with i18n support

CREATE TABLE IF NOT EXISTS countries (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active) WHERE deleted_at IS NULL;

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

-- Datos iniciales - Países de América Latina
INSERT INTO countries (code, code_alpha3, numeric_code, name, phone_code, currency_code, timezone)
VALUES
  ('AR', 'ARG', '032', '{"es": "Argentina", "en": "Argentina", "pt": "Argentina"}'::jsonb, '+54', 'ARS', 'America/Argentina/Buenos_Aires'),
  ('BR', 'BRA', '076', '{"es": "Brasil", "en": "Brazil", "pt": "Brasil"}'::jsonb, '+55', 'BRL', 'America/Sao_Paulo'),
  ('UY', 'URY', '858', '{"es": "Uruguay", "en": "Uruguay", "pt": "Uruguai"}'::jsonb, '+598', 'UYU', 'America/Montevideo'),
  ('CL', 'CHL', '152', '{"es": "Chile", "en": "Chile", "pt": "Chile"}'::jsonb, '+56', 'CLP', 'America/Santiago'),
  ('PY', 'PRY', '600', '{"es": "Paraguay", "en": "Paraguay", "pt": "Paraguai"}'::jsonb, '+595', 'PYG', 'America/Asuncion')
ON CONFLICT (code) DO NOTHING;

-- Comments
COMMENT ON TABLE countries IS 'ISO 3166 country codes with i18n support';
COMMENT ON COLUMN countries.name IS 'JSONB with translations: {"es": "", "en": "", "pt": ""}';
COMMENT ON COLUMN countries.deleted_at IS 'Soft delete timestamp';
