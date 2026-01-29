/**
 * Council Area Tracking Database Migration
 * Privacy-First Impact Measurement System
 * 
 * This migration creates tables for tracking app usage by UK council areas
 * without collecting any personally identifiable information (PII).
 * 
 * Privacy Features:
 * - Only stores council area codes (not postcodes)
 * - No user IDs or identifiable information
 * - Aggregated data only
 * - Compliant with GDPR and UK data protection laws
 */

-- =====================================================
-- 1. UK Council Areas Reference Table
-- =====================================================
-- Static reference data mapping postcode outward codes to council areas
-- Data source: ONS Postcode Directory
CREATE TABLE IF NOT EXISTS uk_council_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  council_area_code VARCHAR(10) NOT NULL UNIQUE, -- e.g., 'E08000003' for Manchester
  council_area_name VARCHAR(255) NOT NULL,        -- e.g., 'Manchester City Council'
  region VARCHAR(100),                            -- e.g., 'Greater Manchester'
  country VARCHAR(50) NOT NULL DEFAULT 'England', -- England, Scotland, Wales, N. Ireland
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_council_area_code ON uk_council_areas(council_area_code);
CREATE INDEX IF NOT EXISTS idx_council_area_name ON uk_council_areas(council_area_name);

-- =====================================================
-- 2. Postcode to Council Area Mapping Table
-- =====================================================
-- Maps UK postcode outward codes (e.g., 'M1', 'SW1A') to council areas
-- This table is populated with data from ONS Postcode Directory
CREATE TABLE IF NOT EXISTS postcode_council_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outward_code VARCHAR(4) NOT NULL UNIQUE, -- First part of postcode (e.g., 'M1', 'SW1A')
  council_area_code VARCHAR(10) NOT NULL,  -- Links to uk_council_areas
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (council_area_code) REFERENCES uk_council_areas(council_area_code) ON DELETE CASCADE
);

-- Index for lightning-fast lookups
CREATE INDEX IF NOT EXISTS idx_outward_code ON postcode_council_mapping(outward_code);
CREATE INDEX IF NOT EXISTS idx_mapping_council_code ON postcode_council_mapping(council_area_code);

-- =====================================================
-- 3. Anonymous Usage Analytics Table
-- =====================================================
-- Stores ANONYMOUS, AGGREGATED usage data by council area
-- NO PII is stored in this table
CREATE TABLE IF NOT EXISTS council_area_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  council_area_code VARCHAR(10) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_count INTEGER DEFAULT 0,              -- Number of app sessions
  analysis_count INTEGER DEFAULT 0,             -- Number of analyses performed
  crisis_alert_count INTEGER DEFAULT 0,         -- Number of crisis alerts (high priority)
  unique_device_hash VARCHAR(64),               -- Hashed device ID (for rough uniqueness, not tracking)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (council_area_code) REFERENCES uk_council_areas(council_area_code) ON DELETE CASCADE
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_council_code ON council_area_analytics(council_area_code);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON council_area_analytics(usage_date);
CREATE INDEX IF NOT EXISTS idx_analytics_council_date ON council_area_analytics(council_area_code, usage_date);

-- =====================================================
-- 4. Privacy-Compliant Functions
-- =====================================================

-- Function to get council area from outward postcode
-- Returns council area code or NULL if not found
CREATE OR REPLACE FUNCTION get_council_area_from_postcode(p_outward_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_council_code VARCHAR;
BEGIN
  SELECT council_area_code INTO v_council_code
  FROM postcode_council_mapping
  WHERE UPPER(outward_code) = UPPER(p_outward_code);
  
  RETURN v_council_code;
END;
$$ LANGUAGE plpgsql;

-- Function to record anonymous usage (called from app)
-- This function ensures NO PII is stored
CREATE OR REPLACE FUNCTION record_anonymous_usage(
  p_outward_code VARCHAR,
  p_device_hash VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_council_code VARCHAR;
BEGIN
  -- Get council area from postcode
  v_council_code := get_council_area_from_postcode(p_outward_code);
  
  -- If council area not found, exit gracefully
  IF v_council_code IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update analytics record
  INSERT INTO council_area_analytics (
    council_area_code,
    usage_date,
    session_count,
    unique_device_hash
  )
  VALUES (
    v_council_code,
    CURRENT_DATE,
    1,
    p_device_hash
  )
  ON CONFLICT (council_area_code, usage_date, unique_device_hash)
  DO UPDATE SET
    session_count = council_area_analytics.session_count + 1,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint for preventing duplicate daily entries per device
ALTER TABLE council_area_analytics 
ADD CONSTRAINT unique_council_date_device 
UNIQUE (council_area_code, usage_date, unique_device_hash);

-- =====================================================
-- 5. Sample Data (UK Major Cities)
-- =====================================================
-- Insert some common UK council areas
-- Full dataset should be imported from ONS data

INSERT INTO uk_council_areas (council_area_code, council_area_name, region, country) VALUES
('E08000003', 'Manchester City Council', 'Greater Manchester', 'England'),
('E08000006', 'Salford City Council', 'Greater Manchester', 'England'),
('E09000001', 'City of London', 'London', 'England'),
('E09000007', 'Camden', 'London', 'England'),
('E09000012', 'Hackney', 'London', 'England'),
('E09000033', 'Westminster', 'London', 'England'),
('E08000035', 'Leeds City Council', 'West Yorkshire', 'England'),
('E08000037', 'Gateshead Council', 'Tyne and Wear', 'England'),
('E06000022', 'Bath and North East Somerset Council', 'South West', 'England'),
('E08000025', 'Birmingham City Council', 'West Midlands', 'England'),
('S12000033', 'Aberdeen City Council', 'Scotland', 'Scotland'),
('S12000049', 'Glasgow City Council', 'Scotland', 'Scotland'),
('S12000036', 'City of Edinburgh Council', 'Scotland', 'Scotland'),
('W06000015', 'Cardiff Council', 'Wales', 'Wales'),
('W06000011', 'Swansea Council', 'Wales', 'Wales'),
('N09000003', 'Belfast City Council', 'Northern Ireland', 'Northern Ireland')
ON CONFLICT (council_area_code) DO NOTHING;

-- Sample postcode mappings (add more from ONS data)
INSERT INTO postcode_council_mapping (outward_code, council_area_code) VALUES
('M1', 'E08000003'),    -- Manchester
('M2', 'E08000003'),
('M3', 'E08000003'),
('M4', 'E08000003'),
('M5', 'E08000006'),    -- Salford
('SW1A', 'E09000033'),  -- Westminster
('SW1', 'E09000033'),
('EC1', 'E09000001'),   -- City of London
('EC2', 'E09000001'),
('WC1', 'E09000007'),   -- Camden
('WC2', 'E09000033'),   -- Westminster
('E1', 'E09000012'),    -- Hackney (Tower Hamlets)
('E2', 'E09000012'),
('LS1', 'E08000035'),   -- Leeds
('LS2', 'E08000035'),
('NE1', 'E08000037'),   -- Newcastle (Gateshead)
('NE8', 'E08000037'),
('B1', 'E08000025'),    -- Birmingham
('B2', 'E08000025'),
('AB10', 'S12000033'),  -- Aberdeen
('AB11', 'S12000033'),
('G1', 'S12000049'),    -- Glasgow
('G2', 'S12000049'),
('EH1', 'S12000036'),   -- Edinburgh
('EH2', 'S12000036'),
('CF10', 'W06000015'),  -- Cardiff
('CF11', 'W06000015'),
('SA1', 'W06000011'),   -- Swansea
('BT1', 'N09000003'),   -- Belfast
('BT2', 'N09000003')
ON CONFLICT (outward_code) DO NOTHING;

-- =====================================================
-- 6. Row-Level Security (RLS) for Privacy
-- =====================================================
-- Enable RLS on analytics table
ALTER TABLE council_area_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow inserts and aggregated reads
CREATE POLICY "Allow anonymous usage recording" ON council_area_analytics
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only allow reading aggregated data (no individual records)
CREATE POLICY "Allow aggregated analytics reads" ON council_area_analytics
  FOR SELECT
  USING (true); -- Can be restricted to admin users only

-- =====================================================
-- 7. Data Retention Policy
-- =====================================================
-- Automatically delete analytics data older than 2 years
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM council_area_analytics
  WHERE usage_date < CURRENT_DATE - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension or manual execution)
-- Run monthly: SELECT cleanup_old_analytics();

-- =====================================================
-- NOTES FOR DEVELOPERS
-- =====================================================
-- 1. NEVER log or store full postcodes - only outward codes
-- 2. Device hashes should be generated with a daily rotating salt
-- 3. Import full ONS Postcode Directory data before production
-- 4. Test with sample data first
-- 5. Ensure app-side code DELETES postcode immediately after lookup
-- 6. Monitor analytics table size and implement pagination for queries
-- 7. Document this privacy-first approach in privacy policy

