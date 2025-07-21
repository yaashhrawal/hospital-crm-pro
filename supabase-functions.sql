-- Hospital CRM Supabase Database Functions
-- Run these in your Supabase SQL Editor after creating the main schema

-- 1. Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_patients', (
            SELECT COUNT(*) FROM patients 
            WHERE DATE(created_at) = target_date AND is_active = true
        ),
        'total_income', (
            SELECT COALESCE(SUM(amount), 0) FROM patient_transactions 
            WHERE DATE(created_at) = target_date AND amount > 0
        ),
        'total_expenses', (
            SELECT COALESCE(SUM(amount), 0) FROM daily_expenses 
            WHERE date = target_date
        ),
        'net_revenue', (
            SELECT COALESCE(SUM(
                CASE WHEN pt.amount > 0 THEN pt.amount ELSE 0 END
            ), 0) - COALESCE((SELECT SUM(amount) FROM daily_expenses WHERE date = target_date), 0)
            FROM patient_transactions pt 
            WHERE DATE(pt.created_at) = target_date
        ),
        'active_admissions', (
            SELECT COUNT(*) FROM patient_admissions 
            WHERE status = 'active'
        ),
        'cash_payments', (
            SELECT COALESCE(SUM(amount), 0) FROM patient_transactions 
            WHERE DATE(created_at) = target_date AND payment_mode = 'cash' AND amount > 0
        ),
        'digital_payments', (
            SELECT COALESCE(SUM(amount), 0) FROM patient_transactions 
            WHERE DATE(created_at) = target_date AND payment_mode IN ('online', 'card', 'upi') AND amount > 0
        ),
        'discounts_given', (
            SELECT COALESCE(ABS(SUM(amount)), 0) FROM patient_transactions 
            WHERE DATE(created_at) = target_date AND transaction_type = 'discount'
        ),
        'refunds_processed', (
            SELECT COALESCE(ABS(SUM(amount)), 0) FROM patient_transactions 
            WHERE DATE(created_at) = target_date AND transaction_type = 'refund'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to get complete patient journey
CREATE OR REPLACE FUNCTION get_patient_journey(patient_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'patient', (
            SELECT json_build_object(
                'id', p.id,
                'patient_id', p.patient_id,
                'first_name', p.first_name,
                'last_name', p.last_name,
                'phone', p.phone,
                'created_at', p.created_at
            )
            FROM patients p WHERE p.id = patient_uuid
        ),
        'transactions', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', pt.id,
                    'transaction_type', pt.transaction_type,
                    'amount', pt.amount,
                    'payment_mode', pt.payment_mode,
                    'description', pt.description,
                    'created_at', pt.created_at
                ) ORDER BY pt.created_at
            ), '[]'::json)
            FROM patient_transactions pt WHERE pt.patient_id = patient_uuid
        ),
        'admission', (
            SELECT json_build_object(
                'id', pa.id,
                'bed_number', pa.bed_number,
                'room_type', pa.room_type,
                'daily_rate', pa.daily_rate,
                'admission_date', pa.admission_date,
                'status', pa.status
            )
            FROM patient_admissions pa WHERE pa.patient_id = patient_uuid AND pa.status = 'active'
            LIMIT 1
        ),
        'total_paid', (
            SELECT COALESCE(SUM(amount), 0) FROM patient_transactions 
            WHERE patient_id = patient_uuid
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to get daily revenue summary
CREATE OR REPLACE FUNCTION get_daily_revenue_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'date', target_date,
        'summary', json_build_object(
            'total_income', COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
            'total_discounts', COALESCE(ABS(SUM(CASE WHEN transaction_type = 'discount' THEN amount ELSE 0 END)), 0),
            'total_refunds', COALESCE(ABS(SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END)), 0),
            'net_patient_revenue', COALESCE(SUM(amount), 0)
        ),
        'by_transaction_type', (
            SELECT json_object_agg(
                transaction_type,
                json_build_object(
                    'count', COUNT(*),
                    'total_amount', COALESCE(SUM(amount), 0)
                )
            )
            FROM patient_transactions 
            WHERE DATE(created_at) = target_date
            GROUP BY transaction_type
        ),
        'by_payment_mode', (
            SELECT json_object_agg(
                payment_mode,
                json_build_object(
                    'count', COUNT(*),
                    'total_amount', COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)
                )
            )
            FROM patient_transactions 
            WHERE DATE(created_at) = target_date AND amount > 0
            GROUP BY payment_mode
        ),
        'by_department', (
            SELECT json_object_agg(
                department,
                json_build_object(
                    'count', COUNT(*),
                    'total_amount', COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)
                )
            )
            FROM patient_transactions 
            WHERE DATE(created_at) = target_date AND amount > 0
            GROUP BY department
        )
    ) INTO result
    FROM patient_transactions 
    WHERE DATE(created_at) = target_date;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to get patient list with search
CREATE OR REPLACE FUNCTION search_patients(search_term TEXT DEFAULT '')
RETURNS TABLE (
    id UUID,
    patient_id TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.patient_id, p.first_name, p.last_name, p.phone, p.created_at
    FROM patients p
    WHERE p.is_active = true
    AND (
        search_term = '' OR
        LOWER(p.first_name || ' ' || p.last_name) LIKE LOWER('%' || search_term || '%') OR
        LOWER(p.patient_id) LIKE LOWER('%' || search_term || '%') OR
        p.phone LIKE '%' || search_term || '%'
    )
    ORDER BY p.created_at DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to generate unique patient ID
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_id := 'PAT' || TO_CHAR(EXTRACT(EPOCH FROM NOW()), 'FM999999999') || LPAD(counter::TEXT, 3, '0');
        
        IF NOT EXISTS (SELECT 1 FROM patients WHERE patient_id = new_id) THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get monthly revenue trends
CREATE OR REPLACE FUNCTION get_monthly_revenue_trends(months_back INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'month', TO_CHAR(month_date, 'YYYY-MM'),
            'month_name', TO_CHAR(month_date, 'Month YYYY'),
            'total_revenue', COALESCE(total_revenue, 0),
            'total_patients', COALESCE(total_patients, 0),
            'avg_per_patient', CASE 
                WHEN COALESCE(total_patients, 0) > 0 
                THEN ROUND(COALESCE(total_revenue, 0) / total_patients, 2)
                ELSE 0
            END
        ) ORDER BY month_date
    ) INTO result
    FROM (
        WITH month_series AS (
            SELECT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * generate_series(0, months_back - 1)) AS month_date
        )
        SELECT 
            ms.month_date,
            SUM(CASE WHEN pt.amount > 0 THEN pt.amount ELSE 0 END) AS total_revenue,
            COUNT(DISTINCT pt.patient_id) AS total_patients
        FROM month_series ms
        LEFT JOIN patient_transactions pt ON DATE_TRUNC('month', pt.created_at) = ms.month_date
        GROUP BY ms.month_date
        ORDER BY ms.month_date
    ) AS monthly_data;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger function to auto-generate patient_id
CREATE OR REPLACE FUNCTION set_patient_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
        NEW.patient_id := generate_patient_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto patient ID generation
DROP TRIGGER IF EXISTS patient_id_trigger ON patients;
CREATE TRIGGER patient_id_trigger
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_patient_id();

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_patient_journey(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_revenue_summary(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION search_patients(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_patient_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_revenue_trends(INTEGER) TO authenticated;

-- Test the functions
SELECT 'Functions created successfully!' as status;

-- Test dashboard stats
SELECT 'Dashboard Stats Test:' as test, get_dashboard_stats(CURRENT_DATE);

-- Test revenue summary
SELECT 'Revenue Summary Test:' as test, get_daily_revenue_summary(CURRENT_DATE);