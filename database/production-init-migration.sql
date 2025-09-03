-- Production Database Migration Script
-- Tzafrir Shuttle System - Production Initialization
-- Run this script to initialize the database in production environment
-- 
-- Usage: psql -h <host> -U <username> -d <database> -f production-init-migration.sql
--

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--
-- Name: bootstrap_first_admin(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(_email text, _password text)
    RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO admin_users (email, password_hash, full_name, role)
    VALUES (_email, crypt(_password, gen_salt('bf')), 'System Administrator', 'super_admin')
    ON CONFLICT (email) DO NOTHING;
END;
$$;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255),
    role character varying(50) DEFAULT 'admin'::character varying,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    refresh_token text
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    contact_email character varying(255),
    contact_phone character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    shuttle_number integer,
    is_active boolean DEFAULT true
);

-- Create csv_processing_logs table
CREATE TABLE IF NOT EXISTS csv_processing_logs (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    shuttle_id uuid NOT NULL,
    csv_file_name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    error_message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_rows integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create shuttle_registrations table
CREATE TABLE IF NOT EXISTS shuttle_registrations (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    schedule_id uuid,
    passenger_name character varying(255) NOT NULL,
    passenger_phone character varying(50) NOT NULL,
    passenger_email character varying(255),
    registration_date date NOT NULL,
    registration_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'confirmed'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create shuttle_schedules table
CREATE TABLE IF NOT EXISTS shuttle_schedules (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    shuttle_id uuid,
    route_type character varying(50) NOT NULL,
    direction character varying(50) NOT NULL,
    departure_time time without time zone NOT NULL,
    arrival_time time without time zone,
    days_of_week integer[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    capacity_limit integer,
    notes text,
    is_special_schedule boolean DEFAULT false,
    priority_order integer DEFAULT 0
);

-- Create shuttles table
CREATE TABLE IF NOT EXISTS shuttles (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    company_id uuid,
    capacity integer DEFAULT 50,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    shuttle_number integer,
    csv_file_path character varying(255),
    csv_uploaded_at timestamp with time zone,
    csv_status character varying(50) DEFAULT 'none'::character varying,
    is_active boolean DEFAULT true
);

-- Add constraints
ALTER TABLE ONLY admin_users ADD CONSTRAINT admin_users_email_key UNIQUE (email);
ALTER TABLE ONLY admin_users ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY companies ADD CONSTRAINT companies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY companies ADD CONSTRAINT companies_shuttle_number_key UNIQUE (shuttle_number);
ALTER TABLE ONLY csv_processing_logs ADD CONSTRAINT csv_processing_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY shuttle_registrations ADD CONSTRAINT shuttle_registrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY shuttle_schedules ADD CONSTRAINT shuttle_schedules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY shuttles ADD CONSTRAINT shuttles_pkey PRIMARY KEY (id);

-- Add foreign key constraints
ALTER TABLE ONLY csv_processing_logs ADD CONSTRAINT csv_processing_logs_shuttle_id_fkey FOREIGN KEY (shuttle_id) REFERENCES shuttles(id) ON DELETE CASCADE;
ALTER TABLE ONLY shuttle_registrations ADD CONSTRAINT shuttle_registrations_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES shuttle_schedules(id) ON DELETE CASCADE;
ALTER TABLE ONLY shuttle_schedules ADD CONSTRAINT shuttle_schedules_shuttle_id_fkey FOREIGN KEY (shuttle_id) REFERENCES shuttles(id) ON DELETE CASCADE;
ALTER TABLE ONLY shuttles ADD CONSTRAINT shuttles_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_shuttle_number ON companies USING btree (shuttle_number);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_shuttles_company_id ON shuttles USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_shuttles_shuttle_number ON shuttles USING btree (shuttle_number);
CREATE INDEX IF NOT EXISTS idx_shuttle_schedules_shuttle_id ON shuttle_schedules USING btree (shuttle_id);
CREATE INDEX IF NOT EXISTS idx_shuttle_schedules_route_direction ON shuttle_schedules USING btree (route_type, direction);
CREATE INDEX IF NOT EXISTS idx_shuttle_registrations_schedule_id ON shuttle_registrations USING btree (schedule_id);
CREATE INDEX IF NOT EXISTS idx_shuttle_registrations_date ON shuttle_registrations USING btree (registration_date);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users USING btree (email);

-- Add update triggers to all tables
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_csv_processing_logs_updated_at ON csv_processing_logs;
CREATE TRIGGER update_csv_processing_logs_updated_at BEFORE UPDATE ON csv_processing_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shuttle_registrations_updated_at ON shuttle_registrations;
CREATE TRIGGER update_shuttle_registrations_updated_at BEFORE UPDATE ON shuttle_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shuttle_schedules_updated_at ON shuttle_schedules;
CREATE TRIGGER update_shuttle_schedules_updated_at BEFORE UPDATE ON shuttle_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shuttles_updated_at ON shuttles;
CREATE TRIGGER update_shuttles_updated_at BEFORE UPDATE ON shuttles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert production admin users (based on current data)
INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, last_login, created_at, updated_at, refresh_token) VALUES 
('70cf1b94-15cc-44e9-83a3-aed4a32aa8f0', 'admin@tzafrir.com', '$2a$06$lKkJ7IcDxJEriAFCzLhh0OnrlC/HXbLLZMh71dA5aKUxiPgxhqy7O', 'System Administrator', 'super_admin', true, NULL, '2025-08-28 14:59:15.521408+00', '2025-08-28 14:59:15.521408+00', NULL),
('d2704793-7085-48f2-a7a1-5f57f248e93c', 'kidaryogev@gmail.com', '$2a$10$crsnDwuTKGdFX8lPVv144.QrX3AKRpbpG9AUDK6TH2ZpLH2dNkP9y', 'Admin User', 'admin', true, '2025-08-29 16:42:05.234352+00', '2025-08-29 15:11:39.620933+00', '2025-08-29 16:42:05.234352+00', NULL),
('09a08e3f-f7b4-4694-8447-f77892a5b4e7', 'admin@shuttle.com', '$2a$10$XsQcXl33CcTuBYXra/Lc7.3vCXegVnW6AN1GDSHg.2KD.fUufyIs2', 'Admin User', 'admin', true, '2025-09-03 17:30:06.449614+00', '2025-08-29 15:55:40.713874+00', '2025-09-03 17:30:06.449614+00', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert companies data (Hebrew companies from current database)
INSERT INTO companies (id, name, contact_email, contact_phone, created_at, updated_at, shuttle_number, is_active) VALUES 
('9c76d218-290a-442c-b5d4-26b28f38613a', 'דברת בע"מ', NULL, NULL, '2025-08-29 11:47:50.394563+00', '2025-08-29 11:47:50.394563+00', 1, true),
('5243e2e5-dfae-4fab-b4e3-ed3d443d9d89', 'מסיעי אריה', NULL, NULL, '2025-08-29 11:48:04.75343+00', '2025-08-29 11:48:04.75343+00', 2, true),
('83db310d-d504-4522-977b-0d8851b7658e', 'יודא בע"מ', NULL, NULL, '2025-08-29 11:48:04.75343+00', '2025-08-29 11:48:04.75343+00', 3, true),
('d36d46e2-120c-484d-83b4-289374a094f0', 'חנן מסיעים', NULL, NULL, '2025-08-29 11:48:04.75343+00', '2025-08-29 11:48:04.75343+00', 4, true),
('ae7d4173-2f48-45cd-9071-d0de5bd0132b', 'טיולי א. ראם', NULL, NULL, '2025-08-29 11:48:04.75343+00', '2025-08-29 11:48:04.75343+00', 5, true),
('240be96d-f29a-419c-980a-30f73e16ae73', 'מוני סיטון', NULL, NULL, '2025-08-29 11:48:04.75343+00', '2025-08-29 11:48:04.75343+00', 6, true),
('27acdd40-91ed-42c8-8ccf-d44dfd90606e', 'יונייטד טורס', NULL, NULL, '2025-08-29 11:48:04.75343+00', '2025-08-29 11:57:00.704304+00', 7, true)
ON CONFLICT (id) DO NOTHING;

-- Insert shuttles data (Hebrew shuttles from current database)
INSERT INTO shuttles (id, name, company_id, capacity, status, created_at, updated_at, shuttle_number, csv_file_path, csv_uploaded_at, csv_status, is_active) VALUES 
('a89ed6f5-ba9b-47cd-8be2-692e7d7366b3', 'שאטל 5', 'ae7d4173-2f48-45cd-9071-d0de5bd0132b', 50, 'active', '2025-08-29 11:48:10.88977+00', '2025-08-29 11:48:10.88977+00', 5, NULL, NULL, 'none', true),
('6176f212-ab4c-4124-991e-752f132a9ce4', 'שאטל 6', '240be96d-f29a-419c-980a-30f73e16ae73', 50, 'active', '2025-08-29 11:48:10.88977+00', '2025-08-29 11:48:10.88977+00', 6, NULL, NULL, 'none', true),
('f28733d1-24ca-490a-a43a-285d1df9926d', 'שאטל 7', '27acdd40-91ed-42c8-8ccf-d44dfd90606e', 50, 'active', '2025-08-29 11:48:10.88977+00', '2025-08-29 11:48:10.88977+00', 7, NULL, NULL, 'none', true),
('9be1d475-2413-4ba3-9f40-3230d65b9d69', 'שאטל 1', '9c76d218-290a-442c-b5d4-26b28f38613a', 50, 'active', '2025-08-29 11:48:10.88977+00', '2025-08-29 13:34:12.543608+00', 1, 'shuttle-schedule.csv', '2025-08-29 13:34:12.543608+00', 'success', true),
('99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'שאטל 2', '5243e2e5-dfae-4fab-b4e3-ed3d443d9d89', 50, 'active', '2025-08-29 11:48:10.88977+00', '2025-08-29 13:34:40.309973+00', 2, NULL, NULL, 'none', true),
('a93c7b08-22ba-472f-9037-05d0f93945f8', 'שאטל 3', '83db310d-d504-4522-977b-0d8851b7658e', 50, 'active', '2025-08-29 11:48:10.88977+00', '2025-08-29 13:38:41.706319+00', 3, NULL, NULL, 'none', true),
('23e8becd-857a-4f13-b35e-2e2e8e157168', 'שאטל 4', 'd36d46e2-120c-484d-83b4-289374a094f0', 50, 'active', '2025-08-29 11:48:10.88977+00', '2025-08-29 13:39:52.447261+00', 4, NULL, NULL, 'none', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Success message
SELECT 'Database initialized successfully for production with real shuttle data!' as status;