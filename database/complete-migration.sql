-- Complete migration script to match Supabase schema exactly
-- This adds all missing tables, columns, and features

-- 1. Add missing columns to existing tables
-- ==========================================

-- Add missing columns to shuttles table
ALTER TABLE shuttles 
ADD COLUMN IF NOT EXISTS csv_file_path TEXT,
ADD COLUMN IF NOT EXISTS csv_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS csv_status TEXT DEFAULT 'none' CHECK (csv_status IN ('none', 'processing', 'success', 'error')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active to companies if missing
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update admin_users to match Supabase structure better
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;

-- 2. Create missing tables
-- ========================

-- Create csv_processing_logs table
CREATE TABLE IF NOT EXISTS csv_processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shuttle_id UUID NOT NULL REFERENCES shuttles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('processing', 'success', 'error')),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_records INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Add missing triggers
-- =======================

-- Add trigger for csv_processing_logs
CREATE TRIGGER update_csv_processing_logs_updated_at
BEFORE UPDATE ON csv_processing_logs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Create missing indexes
-- =========================

CREATE INDEX IF NOT EXISTS idx_shuttle_registrations_lookup 
ON shuttle_registrations (time_slot, route_type, direction, registration_date);

CREATE INDEX IF NOT EXISTS idx_shuttle_registrations_date 
ON shuttle_registrations (registration_date);

-- 5. Create missing functions
-- ===========================

-- Create bootstrap_first_admin function (simplified for local PostgreSQL)
CREATE OR REPLACE FUNCTION bootstrap_first_admin(user_email TEXT, bootstrap_key TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- In local environment, we skip bootstrap key check
    -- In production, you would validate the bootstrap_key
    
    -- Check if admin already exists
    IF EXISTS (SELECT 1 FROM admin_users WHERE email = user_email) THEN
        result := json_build_object('success', false, 'message', 'Admin user already exists');
    ELSE
        -- Create admin user
        INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
        VALUES (
            user_email,
            crypt('admin123', gen_salt('bf')),
            'Admin User',
            'super_admin',
            true
        );
        
        result := json_build_object('success', true, 'message', 'Admin user created successfully');
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create create_first_admin function
CREATE OR REPLACE FUNCTION create_first_admin(user_email TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if any admin exists
    IF EXISTS (SELECT 1 FROM admin_users) THEN
        result := json_build_object('success', false, 'message', 'Admin users already exist');
    ELSE
        -- Create admin user
        INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
        VALUES (
            user_email,
            crypt('admin123', gen_salt('bf')),
            'First Admin',
            'super_admin',
            true
        );
        
        result := json_build_object('success', true, 'message', 'First admin created successfully');
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Update existing data
-- =======================

-- Set default values for new columns
UPDATE shuttles SET is_active = true WHERE is_active IS NULL;
UPDATE shuttles SET csv_status = 'none' WHERE csv_status IS NULL;
UPDATE companies SET is_active = true WHERE is_active IS NULL;

-- Update company name for shuttle #7
UPDATE companies 
SET name = 'יונייטד טורס' 
WHERE shuttle_number = 7;

-- 7. Additional data integrity
-- ============================

-- Ensure all shuttles have proper shuttle_number
UPDATE shuttles s
SET shuttle_number = c.shuttle_number
FROM companies c
WHERE s.company_id = c.id 
AND s.shuttle_number IS NULL;

-- 8. Create view for easier querying (optional but useful)
-- =========================================================

CREATE OR REPLACE VIEW shuttle_schedule_view AS
SELECT 
    ss.id,
    s.name as shuttle_name,
    s.shuttle_number,
    c.name as company_name,
    ss.time_slot,
    ss.route_description,
    ss.route_type,
    ss.direction,
    ss.departure_time,
    ss.is_break,
    ss.is_active,
    ss.sort_order
FROM shuttle_schedules ss
JOIN shuttles s ON ss.shuttle_id = s.id
JOIN companies c ON s.company_id = c.id
ORDER BY s.shuttle_number, ss.sort_order;

-- 9. Verification queries
-- =======================

DO $$
DECLARE
    table_count INTEGER;
    column_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- Count columns in shuttles table
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'shuttles'
    AND table_schema = 'public';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Tables: %', table_count;
    RAISE NOTICE '  Columns in shuttles: %', column_count;
    RAISE NOTICE '  Indexes: %', index_count;
    RAISE NOTICE '  Functions: %', function_count;
    
    -- Check for critical tables
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'csv_processing_logs') THEN
        RAISE WARNING 'csv_processing_logs table creation may have failed';
    END IF;
END $$;