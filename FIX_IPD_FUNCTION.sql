-- Fix the ambiguous column reference in get_next_ipd_number function

-- Drop and recreate the function with proper column references
DROP FUNCTION IF EXISTS get_next_ipd_number();

CREATE OR REPLACE FUNCTION get_next_ipd_number()
RETURNS TEXT AS $$
DECLARE
    current_date_key TEXT;
    next_counter INTEGER;
    ipd_number TEXT;
BEGIN
    -- Generate date key (YYYYMMDD)
    current_date_key := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Increment counter atomically with proper column qualification
    INSERT INTO ipd_counters (date_key, counter)
    VALUES (current_date_key, 1)
    ON CONFLICT (date_key) 
    DO UPDATE SET 
        counter = ipd_counters.counter + 1,
        updated_at = NOW()
    RETURNING counter INTO next_counter;
    
    -- Generate IPD number: IPD-YYYYMMDD-XXX
    ipd_number := 'IPD-' || current_date_key || '-' || LPAD(next_counter::TEXT, 3, '0');
    
    RETURN ipd_number;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT get_next_ipd_number() as test_ipd_number;

-- Verify function works
SELECT 'SUCCESS: IPD function fixed!' as status;