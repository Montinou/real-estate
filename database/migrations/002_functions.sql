-- 002_functions.sql
-- PostgreSQL functions for Real Estate Scraper
-- Geospatial, deduplication, and utility functions

-- Function to find nearby properties using PostGIS
CREATE OR REPLACE FUNCTION find_properties_nearby(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_m INTEGER DEFAULT 1000
)
RETURNS TABLE(
    id UUID,
    distance_m DOUBLE PRECISION,
    title TEXT,
    address TEXT,
    price_usd DECIMAL
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        ST_Distance(
            p.location::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) as distance_m,
        p.title,
        p.address,
        p.price_usd
    FROM properties p
    WHERE
        p.status = 'active'
        AND p.location IS NOT NULL
        AND ST_DWithin(
            p.location::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            p_radius_m
        )
    ORDER BY distance_m
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Function to detect duplicate properties
CREATE OR REPLACE FUNCTION detect_duplicate_properties(
    p_property_id UUID
)
RETURNS TABLE(
    duplicate_id UUID,
    similarity_score DECIMAL,
    match_method VARCHAR,
    match_details JSONB
)
AS $$
DECLARE
    prop RECORD;
    candidate RECORD;
    score DECIMAL;
    details JSONB;
BEGIN
    -- Get the property to check
    SELECT * INTO prop FROM properties WHERE id = p_property_id;

    IF prop IS NULL THEN
        RETURN;
    END IF;

    -- Method 1: Exact coordinate match (within 50 meters)
    IF prop.location IS NOT NULL THEN
        FOR candidate IN
            SELECT
                p2.id,
                p2.title,
                p2.total_surface,
                ST_Distance(prop.location::geography, p2.location::geography) as distance_m
            FROM properties p2
            WHERE
                p2.id != prop.id
                AND p2.location IS NOT NULL
                AND p2.property_type = prop.property_type
                AND ST_DWithin(prop.location::geography, p2.location::geography, 50)
        LOOP
            -- Calculate similarity score based on distance
            score := 1.0 - (candidate.distance_m / 50.0);

            -- Boost score if surface area matches
            IF prop.total_surface IS NOT NULL AND candidate.total_surface IS NOT NULL THEN
                IF ABS(prop.total_surface - candidate.total_surface) <= 5 THEN
                    score := LEAST(1.0, score + 0.2);
                END IF;
            END IF;

            details := jsonb_build_object(
                'distance_m', candidate.distance_m,
                'title', candidate.title,
                'surface_diff', ABS(COALESCE(prop.total_surface, 0) - COALESCE(candidate.total_surface, 0))
            );

            RETURN QUERY SELECT candidate.id, score, 'coordinates'::VARCHAR, details;
        END LOOP;
    END IF;

    -- Method 2: Address matching with fuzzy search
    IF prop.address IS NOT NULL AND prop.city IS NOT NULL THEN
        FOR candidate IN
            SELECT
                p2.id,
                p2.address,
                p2.title,
                similarity(
                    LOWER(CONCAT(prop.street_name, ' ', prop.street_number)),
                    LOWER(CONCAT(p2.street_name, ' ', p2.street_number))
                ) as address_sim,
                similarity(LOWER(prop.title), LOWER(p2.title)) as title_sim
            FROM properties p2
            WHERE
                p2.id != prop.id
                AND p2.city = prop.city
                AND p2.neighborhood = prop.neighborhood
                AND p2.property_type = prop.property_type
                AND (
                    similarity(LOWER(prop.address), LOWER(p2.address)) > 0.7
                    OR similarity(LOWER(prop.title), LOWER(p2.title)) > 0.8
                )
        LOOP
            -- Calculate combined score
            score := (candidate.address_sim * 0.6 + candidate.title_sim * 0.4);

            IF score >= 0.7 THEN
                details := jsonb_build_object(
                    'address_similarity', candidate.address_sim,
                    'title_similarity', candidate.title_sim,
                    'address', candidate.address
                );

                RETURN QUERY SELECT candidate.id, score, 'fuzzy_address'::VARCHAR, details;
            END IF;
        END LOOP;
    END IF;

    -- Method 3: Title fuzzy matching for same neighborhood
    FOR candidate IN
        SELECT
            p2.id,
            p2.title,
            similarity(LOWER(prop.title), LOWER(p2.title)) as title_sim
        FROM properties p2
        WHERE
            p2.id != prop.id
            AND p2.city = prop.city
            AND p2.property_type = prop.property_type
            AND similarity(LOWER(prop.title), LOWER(p2.title)) > 0.85
    LOOP
        details := jsonb_build_object(
            'title', candidate.title,
            'title_similarity', candidate.title_sim
        );

        RETURN QUERY SELECT candidate.id, candidate.title_sim, 'fuzzy_title'::VARCHAR, details;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create duplicate clusters
CREATE OR REPLACE FUNCTION create_duplicate_clusters()
RETURNS INTEGER
AS $$
DECLARE
    processed_count INTEGER := 0;
    prop RECORD;
    dup RECORD;
    cluster_uuid UUID;
BEGIN
    -- Process all properties without a cluster
    FOR prop IN
        SELECT id FROM properties
        WHERE duplicate_cluster_id IS NULL
        AND is_canonical = true
        ORDER BY created_at DESC
        LIMIT 1000
    LOOP
        cluster_uuid := uuid_generate_v4();

        -- Find all duplicates for this property
        FOR dup IN
            SELECT * FROM detect_duplicate_properties(prop.id)
            WHERE similarity_score >= 0.75
        LOOP
            -- Check if duplicate already has a cluster
            IF EXISTS (
                SELECT 1 FROM properties
                WHERE id = dup.duplicate_id
                AND duplicate_cluster_id IS NOT NULL
            ) THEN
                -- Use existing cluster
                SELECT duplicate_cluster_id INTO cluster_uuid
                FROM properties
                WHERE id = dup.duplicate_id;
                EXIT;
            END IF;
        END LOOP;

        -- Assign cluster to property and its duplicates
        UPDATE properties SET duplicate_cluster_id = cluster_uuid
        WHERE id = prop.id;

        FOR dup IN
            SELECT * FROM detect_duplicate_properties(prop.id)
            WHERE similarity_score >= 0.75
        LOOP
            UPDATE properties SET
                duplicate_cluster_id = cluster_uuid,
                is_canonical = false,
                merge_confidence = dup.similarity_score
            WHERE id = dup.duplicate_id;

            -- Record in duplicates table
            INSERT INTO property_duplicates (
                cluster_id,
                property_id,
                canonical_property_id,
                similarity_score,
                match_method,
                match_details
            ) VALUES (
                cluster_uuid,
                dup.duplicate_id,
                prop.id,
                dup.similarity_score,
                dup.match_method,
                dup.match_details
            ) ON CONFLICT (property_id) DO UPDATE SET
                similarity_score = EXCLUDED.similarity_score,
                match_details = EXCLUDED.match_details;
        END LOOP;

        processed_count := processed_count + 1;
    END LOOP;

    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate property quality score
CREATE OR REPLACE FUNCTION calculate_quality_score(
    p_property_id UUID
)
RETURNS DECIMAL
AS $$
DECLARE
    prop RECORD;
    score DECIMAL := 0;
    field_count INTEGER := 0;
    filled_count INTEGER := 0;
BEGIN
    SELECT * INTO prop FROM properties WHERE id = p_property_id;

    IF prop IS NULL THEN
        RETURN 0;
    END IF;

    -- Check required fields
    field_count := 15;

    IF prop.title IS NOT NULL AND LENGTH(prop.title) > 10 THEN filled_count := filled_count + 1; END IF;
    IF prop.description IS NOT NULL AND LENGTH(prop.description) > 50 THEN filled_count := filled_count + 1; END IF;
    IF prop.price IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    IF prop.price_usd IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    IF prop.location IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    IF prop.address IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    IF prop.city IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    IF prop.neighborhood IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    IF prop.total_surface IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    IF prop.rooms IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    IF prop.bedrooms IS NOT NULL THEN filled_count := filled_count + 1; END IF;
    IF prop.bathrooms IS NOT NULL THEN filled_count := filled_count + 1; END IF;

    -- Check for images
    IF EXISTS (SELECT 1 FROM property_images WHERE property_id = prop.id) THEN
        filled_count := filled_count + 3; -- Bonus for having images
    END IF;

    score := filled_count::DECIMAL / field_count::DECIMAL;

    -- Penalty for suspicious data
    IF prop.price_usd < 1000 OR prop.price_usd > 10000000 THEN
        score := score * 0.8;
    END IF;

    RETURN LEAST(1.0, GREATEST(0.0, score));
END;
$$ LANGUAGE plpgsql;

-- Function to detect inactive properties
CREATE OR REPLACE FUNCTION detect_inactive_properties()
RETURNS INTEGER
AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Mark properties as inactive if not seen in 30 days
    UPDATE properties SET
        status = 'inactive',
        status_changed_at = NOW()
    WHERE
        status = 'active'
        AND last_seen_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    -- Mark as sold/rented if price dropped to 0
    UPDATE properties SET
        status = CASE
            WHEN operation_type = 'sale' THEN 'sold'::property_status
            ELSE 'rented'::property_status
        END,
        status_changed_at = NOW()
    WHERE
        status = 'active'
        AND price = 0
        AND last_updated_at > NOW() - INTERVAL '7 days';

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to track price changes
CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER AS $$
DECLARE
    old_price DECIMAL;
    price_change DECIMAL;
    price_change_pct DECIMAL;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.price IS DISTINCT FROM NEW.price THEN
            -- Calculate change
            old_price := OLD.price;
            price_change := NEW.price - old_price;

            IF old_price > 0 THEN
                price_change_pct := (price_change / old_price) * 100;
            ELSE
                price_change_pct := NULL;
            END IF;

            -- Insert into price history
            INSERT INTO price_history (
                property_id,
                price,
                currency,
                price_usd,
                price_change_amount,
                price_change_percentage,
                recorded_at
            ) VALUES (
                NEW.id,
                NEW.price,
                NEW.currency,
                NEW.price_usd,
                price_change,
                price_change_pct,
                NOW()
            );

            -- Update last price change timestamp
            NEW.last_price_change_at := NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for price tracking
CREATE TRIGGER track_property_price_changes
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION track_price_change();

-- Function to normalize addresses
CREATE OR REPLACE FUNCTION normalize_address(
    p_address TEXT
)
RETURNS TEXT
AS $$
DECLARE
    normalized TEXT;
BEGIN
    normalized := p_address;

    -- Convert to lowercase
    normalized := LOWER(normalized);

    -- Remove extra spaces
    normalized := REGEXP_REPLACE(normalized, '\s+', ' ', 'g');

    -- Standardize common abbreviations
    normalized := REPLACE(normalized, 'av.', 'avenida');
    normalized := REPLACE(normalized, 'avda.', 'avenida');
    normalized := REPLACE(normalized, 'bv.', 'boulevard');
    normalized := REPLACE(normalized, 'blvd.', 'boulevard');
    normalized := REPLACE(normalized, 'pje.', 'pasaje');
    normalized := REPLACE(normalized, 'esq.', 'esquina');
    normalized := REPLACE(normalized, 'nro.', '');
    normalized := REPLACE(normalized, 'n°', '');
    normalized := REPLACE(normalized, 'nº', '');
    normalized := REPLACE(normalized, 'bis', '');

    -- Trim
    normalized := TRIM(normalized);

    RETURN normalized;
END;
$$ LANGUAGE plpgsql;

-- Function to get property statistics by area
CREATE OR REPLACE FUNCTION get_area_statistics(
    p_city VARCHAR,
    p_neighborhood VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    property_type property_type,
    operation_type operation_type,
    count BIGINT,
    avg_price_usd NUMERIC,
    min_price_usd NUMERIC,
    max_price_usd NUMERIC,
    avg_surface NUMERIC,
    avg_price_per_m2 NUMERIC
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.property_type,
        p.operation_type,
        COUNT(*) as count,
        ROUND(AVG(p.price_usd), 2) as avg_price_usd,
        ROUND(MIN(p.price_usd), 2) as min_price_usd,
        ROUND(MAX(p.price_usd), 2) as max_price_usd,
        ROUND(AVG(p.total_surface), 2) as avg_surface,
        ROUND(AVG(p.price_per_m2), 2) as avg_price_per_m2
    FROM properties p
    WHERE
        p.city = p_city
        AND (p_neighborhood IS NULL OR p.neighborhood = p_neighborhood)
        AND p.status = 'active'
        AND p.price_usd > 0
    GROUP BY p.property_type, p.operation_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data(
    p_days_to_keep INTEGER DEFAULT 90
)
RETURNS TABLE(
    table_name TEXT,
    deleted_count INTEGER
)
AS $$
DECLARE
    deleted INTEGER;
BEGIN
    -- Clean old raw listings
    DELETE FROM raw_listings
    WHERE
        processing_status IN ('processed', 'error')
        AND created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted = ROW_COUNT;
    RETURN QUERY SELECT 'raw_listings'::TEXT, deleted;

    -- Clean old property history (keep last 100 per property)
    DELETE FROM property_history
    WHERE id IN (
        SELECT id FROM (
            SELECT
                id,
                ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY recorded_at DESC) as rn
            FROM property_history
        ) ranked
        WHERE rn > 100
    );
    GET DIAGNOSTICS deleted = ROW_COUNT;
    RETURN QUERY SELECT 'property_history'::TEXT, deleted;

    -- Clean orphaned images
    DELETE FROM property_images
    WHERE
        property_id NOT IN (SELECT id FROM properties)
        OR (is_downloaded = false AND created_at < NOW() - INTERVAL '7 days');
    GET DIAGNOSTICS deleted = ROW_COUNT;
    RETURN QUERY SELECT 'property_images'::TEXT, deleted;
END;
$$ LANGUAGE plpgsql;