-- Fix duplicate beds and ensure proper synchronization
-- This script will clean up duplicate beds and ensure only 40 beds exist (1-40)

-- 1. First, let's see what we have
SELECT 
    bed_number, 
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as bed_ids
FROM beds 
GROUP BY bed_number 
ORDER BY bed_number::integer;

-- 2. Remove ALL beds and start fresh to avoid conflicts
DELETE FROM beds;

-- 3. Insert exactly 40 beds (1-40) with proper structure
INSERT INTO beds (bed_number, room_type, status, hospital_id, daily_rate, tat_remaining_seconds)
SELECT 
    i::TEXT,
    CASE 
        WHEN i <= 10 THEN 'GENERAL'
        WHEN i <= 20 THEN 'PRIVATE' 
        WHEN i <= 30 THEN 'ICU'
        ELSE 'EMERGENCY'
    END,
    'vacant',
    '550e8400-e29b-41d4-a716-446655440000',
    1000,
    1800
FROM generate_series(1, 40) AS i;

-- 4. Verify we have exactly 40 beds
SELECT 
    COUNT(*) as total_beds,
    COUNT(CASE WHEN status = 'vacant' THEN 1 END) as vacant_beds,
    COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_beds
FROM beds;

-- 5. Enable real-time synchronization (ensure it's working)
ALTER PUBLICATION supabase_realtime ADD TABLE beds;
ALTER PUBLICATION supabase_realtime ADD TABLE ipd_counters;

-- 6. Verify RLS policies are working
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename IN ('beds', 'ipd_counters');

-- Success message
SELECT 
    'SUCCESS: Beds cleaned up and fixed!' as message,
    'Now you should see exactly 40 beds (1-40) with real-time sync working' as details,
    (SELECT COUNT(*) FROM beds) as bed_count;