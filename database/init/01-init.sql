-- Initialize database schema for Tzafrir Shuttle System
-- This script combines the necessary tables from Supabase migrations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shuttles table
CREATE TABLE IF NOT EXISTS shuttles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    capacity INTEGER DEFAULT 50,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shuttle_schedules table
CREATE TABLE IF NOT EXISTS shuttle_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shuttle_id UUID REFERENCES shuttles(id) ON DELETE CASCADE,
    route_type VARCHAR(50) NOT NULL, -- 'savidor_to_tzafrir' or 'kiryat_aryeh_to_tzafrir'
    direction VARCHAR(50) NOT NULL, -- 'outbound' or 'return'
    departure_time TIME NOT NULL,
    arrival_time TIME,
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday, 7=Sunday
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shuttle_registrations table
CREATE TABLE IF NOT EXISTS shuttle_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES shuttle_schedules(id) ON DELETE CASCADE,
    passenger_name VARCHAR(255) NOT NULL,
    passenger_phone VARCHAR(50) NOT NULL,
    passenger_email VARCHAR(255),
    registration_date DATE NOT NULL,
    registration_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin', -- 'super_admin', 'admin', 'viewer'
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shuttles_company_id ON shuttles(company_id);
CREATE INDEX IF NOT EXISTS idx_schedules_shuttle_id ON shuttle_schedules(shuttle_id);
CREATE INDEX IF NOT EXISTS idx_schedules_route_direction ON shuttle_schedules(route_type, direction);
CREATE INDEX IF NOT EXISTS idx_registrations_schedule_id ON shuttle_registrations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_registrations_date ON shuttle_registrations(registration_date);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shuttles_updated_at BEFORE UPDATE ON shuttles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON shuttle_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON shuttle_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Note: In production, change this immediately!
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
    'admin@tzafrir.com',
    crypt('admin123', gen_salt('bf')),
    'System Administrator',
    'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample data for development
INSERT INTO companies (id, name, contact_email, contact_phone)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Shuttle Express Ltd', 'contact@shuttleexpress.com', '03-1234567'),
    ('22222222-2222-2222-2222-222222222222', 'Safe Transit Co', 'info@safetransit.com', '03-7654321')
ON CONFLICT DO NOTHING;

INSERT INTO shuttles (company_id, name, capacity)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Express Line 1', 50),
    ('11111111-1111-1111-1111-111111111111', 'Express Line 2', 45),
    ('22222222-2222-2222-2222-222222222222', 'Safe Line A', 55)
ON CONFLICT DO NOTHING;