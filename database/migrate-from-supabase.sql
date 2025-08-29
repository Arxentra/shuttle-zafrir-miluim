-- Migration script from Supabase to Local PostgreSQL
-- This script handles schema differences and data migration

-- 1. First, let's add missing columns to match Supabase schema
-- Add shuttle_number to companies table if not exists
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS shuttle_number INTEGER UNIQUE;

-- Add shuttle_number to shuttles table if not exists  
ALTER TABLE shuttles
ADD COLUMN IF NOT EXISTS shuttle_number INTEGER UNIQUE;

-- Modify shuttle_schedules to match Supabase schema
ALTER TABLE shuttle_schedules
ADD COLUMN IF NOT EXISTS time_slot TEXT,
ADD COLUMN IF NOT EXISTS route_description TEXT,
ADD COLUMN IF NOT EXISTS is_break BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Modify shuttle_registrations to match Supabase schema
ALTER TABLE shuttle_registrations
ADD COLUMN IF NOT EXISTS time_slot TEXT,
ADD COLUMN IF NOT EXISTS route_type TEXT,
ADD COLUMN IF NOT EXISTS direction TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2. Create function for checking admin users (simplified version without auth)
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- In local PostgreSQL, we'll return true for simplicity
    -- In production, implement proper authentication check
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 3. Update existing sample data with shuttle numbers
UPDATE companies SET shuttle_number = 1 WHERE name = 'Shuttle Express Ltd';
UPDATE companies SET shuttle_number = 2 WHERE name = 'Safe Transit Co';

UPDATE shuttles s
SET shuttle_number = c.shuttle_number
FROM companies c
WHERE s.company_id = c.id;

-- 4. Clear existing sample data and prepare for real data import
TRUNCATE TABLE shuttle_registrations CASCADE;
TRUNCATE TABLE shuttle_schedules CASCADE;
TRUNCATE TABLE shuttles CASCADE;
TRUNCATE TABLE companies CASCADE;

-- Keep admin user
-- The admin_users table already has the default admin

-- 5. Insert migrated data from Supabase
-- Companies data from Supabase
INSERT INTO companies (name, shuttle_number, created_at, updated_at) VALUES
('דברת בע"מ', 1, now(), now()),
('מסיעי אריה', 2, now(), now()),
('יודא בע"מ', 3, now(), now()),
('חנן מסיעים', 4, now(), now()),
('טיולי א. ראם', 5, now(), now()),
('מוני סיטון', 6, now(), now()),
('החברה המאוחדת', 7, now(), now());

-- Shuttles data
INSERT INTO shuttles (company_id, name, shuttle_number, capacity, status)
SELECT c.id, 'שאטל ' || c.shuttle_number, c.shuttle_number, 50, 'active'
FROM companies c;

-- Shuttle schedules for Shuttle 1 (דברת בע"מ)
INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT s.id, 
       schedule_data.time_slot,
       schedule_data.route_description,
       schedule_data.is_break,
       schedule_data.sort_order,
       CASE 
           WHEN schedule_data.route_description LIKE '%סבידור%' THEN 'savidor_to_tzafrir'
           WHEN schedule_data.route_description LIKE '%קרית אריה%' THEN 'kiryat_aryeh_to_tzafrir'
           ELSE 'savidor_to_tzafrir'
       END as route_type,
       CASE 
           WHEN schedule_data.route_description LIKE '%לסבידור%' OR schedule_data.route_description LIKE '%לקרית%' THEN 'return'
           ELSE 'outbound'
       END as direction,
       CAST(SUBSTRING(schedule_data.time_slot FROM 1 FOR POSITION('-' IN schedule_data.time_slot) - 1) || ':00' AS TIME) as departure_time,
       NOT schedule_data.is_break as is_active
FROM shuttles s
JOIN companies c ON s.company_id = c.id
CROSS JOIN (VALUES
    ('7:00-8:00', 'נסיעה מסבידור מרכז, מעבר בצומת סירקין, הגעה למחנה סירקין', false, 1),
    ('8:15-9:15', 'איסוף ממחנה סירקין לסבידור מרכז', false, 2),
    ('9:30-10:30', 'איסוף מסבידור מרכז למחנה סירקין', false, 3),
    ('10:45-11:30', 'איסוף ממחנה סירקין לסבידור מרכז', false, 4),
    ('11:30-14:00', 'הפסקה', true, 5),
    ('14:00-15:00', 'איסוף מסבידור למחנה סירקין', false, 6),
    ('15:30-16:30', 'איסוף מחנה סירקין לסבידור מרכז', false, 7)
) AS schedule_data(time_slot, route_description, is_break, sort_order)
WHERE c.shuttle_number = 1;

-- Shuttle schedules for Shuttle 2 (מסיעי אריה)
INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT s.id, 
       schedule_data.time_slot,
       schedule_data.route_description,
       schedule_data.is_break,
       schedule_data.sort_order,
       'kiryat_aryeh_to_tzafrir' as route_type,
       CASE 
           WHEN schedule_data.route_description LIKE '%לקרית%' THEN 'return'
           ELSE 'outbound'
       END as direction,
       CAST(SUBSTRING(schedule_data.time_slot FROM 1 FOR POSITION('-' IN schedule_data.time_slot) - 1) || ':00' AS TIME) as departure_time,
       NOT schedule_data.is_break as is_active
FROM shuttles s
JOIN companies c ON s.company_id = c.id
CROSS JOIN (VALUES
    ('7:30-8:30', 'איסוף מקרית אריה למחנה סירקין', false, 1),
    ('8:45-9:30', 'ממחנה סירקין לקרית אריה', false, 2),
    ('10:00-11:00', 'מקרית אריה למחנה סירקין', false, 3),
    ('11:15-12:00', 'ממחנה סירקין לקרית אריה', false, 4),
    ('12:00-14:30', 'הפסקה', true, 5),
    ('14:30-15:30', 'מקרית אריה למחנה סירקין', false, 6),
    ('16:00-17:00', 'ממחנה סירקין לקרית אריה', false, 7)
) AS schedule_data(time_slot, route_description, is_break, sort_order)
WHERE c.shuttle_number = 2;

-- More schedules for other shuttles (simplified)
INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT s.id, 
       '8:00-9:00',
       'נסיעה רגילה',
       false,
       1,
       'savidor_to_tzafrir',
       'outbound',
       '08:00:00'::TIME,
       true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number > 2;

-- 6. Add indices for performance
CREATE INDEX IF NOT EXISTS idx_schedules_time_slot ON shuttle_schedules(time_slot);
CREATE INDEX IF NOT EXISTS idx_schedules_sort_order ON shuttle_schedules(sort_order);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_date ON shuttle_registrations(registration_date);
CREATE INDEX IF NOT EXISTS idx_registrations_time_slot ON shuttle_registrations(time_slot);

-- 7. Note: UUID primary keys don't use sequences, so no sequence updates needed

-- 8. Verify migration
DO $$
DECLARE
    company_count INTEGER;
    shuttle_count INTEGER;
    schedule_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO shuttle_count FROM shuttles;
    SELECT COUNT(*) INTO schedule_count FROM shuttle_schedules;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Companies: %', company_count;
    RAISE NOTICE '  Shuttles: %', shuttle_count;
    RAISE NOTICE '  Schedules: %', schedule_count;
    
    IF company_count < 7 THEN
        RAISE WARNING 'Expected at least 7 companies, found %', company_count;
    END IF;
END $$;