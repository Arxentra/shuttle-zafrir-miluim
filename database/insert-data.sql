-- Insert migrated data from Supabase
-- Companies data
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
INSERT INTO shuttle_schedules (
    shuttle_id, 
    time_slot, 
    route_description, 
    is_break, 
    sort_order, 
    route_type, 
    direction, 
    departure_time, 
    is_active
)
SELECT 
    s.id,
    time_slot,
    route_description, 
    is_break,
    sort_order,
    CASE 
        WHEN route_description LIKE '%סבידור%' THEN 'savidor_to_tzafrir'
        WHEN route_description LIKE '%קרית אריה%' THEN 'kiryat_aryeh_to_tzafrir'
        ELSE 'savidor_to_tzafrir'
    END as route_type,
    CASE 
        WHEN route_description LIKE '%לסבידור%' OR route_description LIKE '%לקרית%' THEN 'return'
        ELSE 'outbound'
    END as direction,
    (SUBSTRING(time_slot FROM 1 FOR POSITION('-' IN time_slot) - 1) || ':00')::TIME as departure_time,
    NOT is_break as is_active
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
INSERT INTO shuttle_schedules (
    shuttle_id,
    time_slot,
    route_description,
    is_break,
    sort_order,
    route_type,
    direction,
    departure_time,
    is_active
)
SELECT 
    s.id,
    time_slot,
    route_description,
    is_break,
    sort_order,
    'kiryat_aryeh_to_tzafrir' as route_type,
    CASE 
        WHEN route_description LIKE '%לקרית%' THEN 'return'
        ELSE 'outbound'
    END as direction,
    (SUBSTRING(time_slot FROM 1 FOR POSITION('-' IN time_slot) - 1) || ':00')::TIME as departure_time,
    NOT is_break as is_active
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

-- Basic schedules for remaining shuttles
INSERT INTO shuttle_schedules (
    shuttle_id,
    time_slot,
    route_description,
    is_break,
    sort_order,
    route_type,
    direction,
    departure_time,
    is_active
)
SELECT 
    s.id,
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