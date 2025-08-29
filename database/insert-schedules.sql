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
    '7:00-8:00', 'נסיעה מסבידור מרכז, מעבר בצומת סירקין, הגעה למחנה סירקין', false, 1,
    'savidor_to_tzafrir', 'outbound', '07:00:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 1;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '8:15-9:15', 'איסוף ממחנה סירקין לסבידור מרכז', false, 2,
    'savidor_to_tzafrir', 'return', '08:15:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 1;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '9:30-10:30', 'איסוף מסבידור מרכז למחנה סירקין', false, 3,
    'savidor_to_tzafrir', 'outbound', '09:30:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 1;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '10:45-11:30', 'איסוף ממחנה סירקין לסבידור מרכז', false, 4,
    'savidor_to_tzafrir', 'return', '10:45:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 1;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '11:30-14:00', 'הפסקה', true, 5,
    'savidor_to_tzafrir', 'outbound', '11:30:00'::TIME, false
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 1;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '14:00-15:00', 'איסוף מסבידור למחנה סירקין', false, 6,
    'savidor_to_tzafrir', 'outbound', '14:00:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 1;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '15:30-16:30', 'איסוף מחנה סירקין לסבידור מרכז', false, 7,
    'savidor_to_tzafrir', 'return', '15:30:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 1;

-- Shuttle schedules for Shuttle 2 (מסיעי אריה)
INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '7:30-8:30', 'איסוף מקרית אריה למחנה סירקין', false, 1,
    'kiryat_aryeh_to_tzafrir', 'outbound', '07:30:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 2;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '8:45-9:30', 'ממחנה סירקין לקרית אריה', false, 2,
    'kiryat_aryeh_to_tzafrir', 'return', '08:45:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 2;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '10:00-11:00', 'מקרית אריה למחנה סירקין', false, 3,
    'kiryat_aryeh_to_tzafrir', 'outbound', '10:00:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 2;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '11:15-12:00', 'ממחנה סירקין לקרית אריה', false, 4,
    'kiryat_aryeh_to_tzafrir', 'return', '11:15:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 2;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '12:00-14:30', 'הפסקה', true, 5,
    'kiryat_aryeh_to_tzafrir', 'outbound', '12:00:00'::TIME, false
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 2;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '14:30-15:30', 'מקרית אריה למחנה סירקין', false, 6,
    'kiryat_aryeh_to_tzafrir', 'outbound', '14:30:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 2;

INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '16:00-17:00', 'ממחנה סירקין לקרית אריה', false, 7,
    'kiryat_aryeh_to_tzafrir', 'return', '16:00:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number = 2;

-- Basic schedules for remaining shuttles
INSERT INTO shuttle_schedules (shuttle_id, time_slot, route_description, is_break, sort_order, route_type, direction, departure_time, is_active)
SELECT 
    s.id,
    '8:00-9:00', 'נסיעה רגילה', false, 1,
    'savidor_to_tzafrir', 'outbound', '08:00:00'::TIME, true
FROM shuttles s
JOIN companies c ON s.company_id = c.id
WHERE c.shuttle_number > 2;