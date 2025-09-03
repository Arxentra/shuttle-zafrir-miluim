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

-- Insert csv processing logs data
INSERT INTO csv_processing_logs (id, shuttle_id, csv_file_name, status, error_message, created_at, processed_rows, updated_at) VALUES 
('bbbb50b9-ad5f-4ad4-9fee-3c7f79118219', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'shuttle-schedule.csv', 'processing', NULL, '2025-08-29 13:34:12.464519+00', 0, '2025-08-29 13:34:12.464519+00')
ON CONFLICT (id) DO NOTHING;

-- Insert shuttle schedules data (all your current schedules)
INSERT INTO shuttle_schedules (id, shuttle_id, route_type, direction, departure_time, arrival_time, days_of_week, is_active, created_at, updated_at, capacity_limit, notes, is_special_schedule, priority_order) VALUES 
('cff10795-be1d-43fb-baa3-c5f5b8783a7f', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'kiryat_aryeh_to_tzafrir', 'outbound', '06:30:00', '07:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:33:38.348817+00', '2025-08-29 15:33:38.348817+00', NULL, NULL, false, 0),
('e1ed4462-8e6e-44d0-b1eb-46d5a399d0d5', 'a93c7b08-22ba-472f-9037-05d0f93945f8', 'kiryat_aryeh_to_tzafrir', 'outbound', '07:00:00', '07:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:33:38.402688+00', '2025-08-29 15:33:38.402688+00', NULL, NULL, false, 0),
('3f0424a2-77a3-418d-a398-99016de0ba2b', '23e8becd-857a-4f13-b35e-2e2e8e157168', 'kiryat_aryeh_to_tzafrir', 'outbound', '07:30:00', '08:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:14.898097+00', '2025-08-29 15:36:14.898097+00', NULL, NULL, false, 0),
('80241f34-77b9-4584-a622-810a5a04d016', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'kiryat_aryeh_to_tzafrir', 'return', '07:00:00', '07:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:21.722463+00', '2025-08-29 15:37:21.722463+00', NULL, NULL, false, 0),
('32599b75-4cab-4230-b5ef-6566c47e955f', 'a93c7b08-22ba-472f-9037-05d0f93945f8', 'kiryat_aryeh_to_tzafrir', 'return', '07:30:00', '08:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:21.763621+00', '2025-08-29 15:37:21.763621+00', NULL, NULL, false, 0),
('12be791b-6e52-49c0-bffe-fd7809afcca5', '23e8becd-857a-4f13-b35e-2e2e8e157168', 'kiryat_aryeh_to_tzafrir', 'return', '08:00:00', '08:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:21.803789+00', '2025-08-29 15:37:21.803789+00', NULL, NULL, false, 0),
('338c5d3f-e6d7-46d7-9c0a-caf7bdc74c78', 'a89ed6f5-ba9b-47cd-8be2-692e7d7366b3', 'kiryat_aryeh_to_tzafrir', 'return', '08:30:00', '09:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:28.673154+00', '2025-08-29 15:37:28.673154+00', NULL, NULL, false, 0),
('e25a39e8-fb03-497c-a243-372888eb7eaf', '6176f212-ab4c-4124-991e-752f132a9ce4', 'kiryat_aryeh_to_tzafrir', 'return', '09:00:00', '09:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:28.723144+00', '2025-08-29 15:37:28.723144+00', NULL, NULL, false, 0),
('cdd29f4d-3a7b-465c-871a-f52c099833ca', 'f28733d1-24ca-490a-a43a-285d1df9926d', 'kiryat_aryeh_to_tzafrir', 'return', '09:30:00', '10:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:28.763486+00', '2025-08-29 15:37:28.763486+00', NULL, NULL, false, 0),
('d7a2f3c5-ba87-4738-aacf-31b0785bbe57', '6176f212-ab4c-4124-991e-752f132a9ce4', 'kiryat_aryeh_to_tzafrir', 'return', '20:30:00', '21:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:38:07.226029+00', '2025-08-29 15:38:07.226029+00', NULL, NULL, false, 0),
('30964019-e2cf-4e5b-b26b-2d99db79b4d6', 'f28733d1-24ca-490a-a43a-285d1df9926d', 'kiryat_aryeh_to_tzafrir', 'return', '21:00:00', '21:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:38:07.275515+00', '2025-08-29 15:38:07.275515+00', NULL, NULL, false, 0),
('692e9615-5569-4216-95ec-f77cc8aa7aee', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'kiryat_aryeh_to_tzafrir', 'return', '22:00:00', '22:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:38:07.314727+00', '2025-08-29 15:38:07.314727+00', NULL, NULL, false, 0),
('bc7e785e-df1a-46cd-a8fc-00cbeef59ec0', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'kiryat_aryeh_to_tzafrir', 'return', '23:00:00', '23:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:38:12.599346+00', '2025-08-29 15:38:12.599346+00', NULL, NULL, false, 0),
('b31d9f68-38d6-4a3e-bc90-eb6d273bcf3f', '6176f212-ab4c-4124-991e-752f132a9ce4', 'savidor_to_tzafrir', 'outbound', '19:15:00', '20:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:34:53.905933+00', '2025-08-29 15:34:53.905933+00', NULL, NULL, false, 0),
('9fd44367-f95b-4e37-b26b-a237929829de', 'f28733d1-24ca-490a-a43a-285d1df9926d', 'savidor_to_tzafrir', 'outbound', '20:40:00', '21:20:00', '{1,2,3,4,5}', true, '2025-08-29 15:34:54.556039+00', '2025-08-29 15:34:54.556039+00', NULL, NULL, false, 0),
('101cea5f-8865-4c5f-86d2-918dab761814', 'a89ed6f5-ba9b-47cd-8be2-692e7d7366b3', 'kiryat_aryeh_to_tzafrir', 'outbound', '08:00:00', '08:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:20.101104+00', '2025-08-29 15:36:20.101104+00', NULL, NULL, false, 0),
('67133804-ae26-4cfb-b2b6-4586093fe399', '6176f212-ab4c-4124-991e-752f132a9ce4', 'kiryat_aryeh_to_tzafrir', 'outbound', '08:30:00', '09:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:26.660895+00', '2025-08-29 15:36:26.660895+00', NULL, NULL, false, 0),
('54ef7e96-2909-4aa0-baf6-42cae7f03d79', 'f28733d1-24ca-490a-a43a-285d1df9926d', 'kiryat_aryeh_to_tzafrir', 'outbound', '09:00:00', '09:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:36.798067+00', '2025-08-29 15:36:36.798067+00', NULL, NULL, false, 0),
('6fa267ea-cc3b-46b1-8bdc-9c997d533abb', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'kiryat_aryeh_to_tzafrir', 'outbound', '09:30:00', '10:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:36.839606+00', '2025-08-29 15:36:36.839606+00', NULL, NULL, false, 0),
('26f9ce62-a9e5-4b4c-9028-dcdfe36dd03b', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'kiryat_aryeh_to_tzafrir', 'outbound', '10:00:00', '10:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:36.880759+00', '2025-08-29 15:36:36.880759+00', NULL, NULL, false, 0),
('a774da78-5722-4023-836c-6fb78e5e1d16', 'a93c7b08-22ba-472f-9037-05d0f93945f8', 'kiryat_aryeh_to_tzafrir', 'outbound', '10:30:00', '11:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:43.711425+00', '2025-08-29 15:36:43.711425+00', NULL, NULL, false, 0),
('bfb36eb4-b549-4b5c-83bc-cfbe95d59f67', '23e8becd-857a-4f13-b35e-2e2e8e157168', 'kiryat_aryeh_to_tzafrir', 'outbound', '13:30:00', '14:15:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:43.753351+00', '2025-08-29 15:36:43.753351+00', NULL, NULL, false, 0),
('ba157938-fad2-42c5-8c82-7a71c488acc9', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'kiryat_aryeh_to_tzafrir', 'return', '10:00:00', '10:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:36.020064+00', '2025-08-29 15:37:36.020064+00', NULL, NULL, false, 0),
('bcdf58fc-2954-4079-8658-5c836e017935', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'kiryat_aryeh_to_tzafrir', 'return', '10:30:00', '11:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:36.070356+00', '2025-08-29 15:37:36.070356+00', NULL, NULL, false, 0),
('be58e381-b671-41ba-a51a-0825bdc02be6', 'a93c7b08-22ba-472f-9037-05d0f93945f8', 'kiryat_aryeh_to_tzafrir', 'return', '11:00:00', '11:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:36.112245+00', '2025-08-29 15:37:36.112245+00', NULL, NULL, false, 0),
('98bd41c1-0371-4756-a7a4-2986aa79b8a0', '23e8becd-857a-4f13-b35e-2e2e8e157168', 'kiryat_aryeh_to_tzafrir', 'return', '14:15:00', '14:45:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:44.409707+00', '2025-08-29 15:37:44.409707+00', NULL, NULL, false, 0),
('5533dff2-8eea-4fc3-9e39-5aafaf984b54', 'a89ed6f5-ba9b-47cd-8be2-692e7d7366b3', 'kiryat_aryeh_to_tzafrir', 'return', '15:20:00', '15:50:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:44.448463+00', '2025-08-29 15:37:44.448463+00', NULL, NULL, false, 0),
('f0a715ea-5490-4880-91e2-c2382fe79eab', '6176f212-ab4c-4124-991e-752f132a9ce4', 'kiryat_aryeh_to_tzafrir', 'return', '16:30:00', '17:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:44.488495+00', '2025-08-29 15:37:44.488495+00', NULL, NULL, false, 0),
('87ef41c6-0e84-44df-8cf7-e87db06d887c', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'savidor_to_tzafrir', 'outbound', '22:00:00', '22:45:00', '{1,2,3,4,5}', true, '2025-08-29 15:34:55.244363+00', '2025-08-29 15:34:55.244363+00', NULL, NULL, false, 0),
('0dffd2a1-ef53-462e-9429-553528e80c0f', 'a89ed6f5-ba9b-47cd-8be2-692e7d7366b3', 'kiryat_aryeh_to_tzafrir', 'outbound', '14:45:00', '15:20:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:52.180074+00', '2025-08-29 15:36:52.180074+00', NULL, NULL, false, 0),
('bc213f09-85b6-492f-aee6-17c0d3ad879d', '6176f212-ab4c-4124-991e-752f132a9ce4', 'kiryat_aryeh_to_tzafrir', 'outbound', '16:00:00', '16:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:52.223177+00', '2025-08-29 15:36:52.223177+00', NULL, NULL, false, 0),
('09662fcb-18ed-4f52-97b4-c61bb571f71a', 'f28733d1-24ca-490a-a43a-285d1df9926d', 'kiryat_aryeh_to_tzafrir', 'outbound', '16:30:00', '17:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:36:52.264379+00', '2025-08-29 15:36:52.264379+00', NULL, NULL, false, 0),
('595f6516-ea15-4d2f-8487-7d9f1b38532a', 'f28733d1-24ca-490a-a43a-285d1df9926d', 'kiryat_aryeh_to_tzafrir', 'return', '17:00:00', '17:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:51.410998+00', '2025-08-29 15:37:51.410998+00', NULL, NULL, false, 0),
('f841294c-3aba-4e67-a386-c77402b16763', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'kiryat_aryeh_to_tzafrir', 'return', '17:30:00', '18:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:51.486254+00', '2025-08-29 15:37:51.486254+00', NULL, NULL, false, 0),
('a50a09df-45c7-49fd-85a9-3de7de4cbd60', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'kiryat_aryeh_to_tzafrir', 'return', '18:00:00', '18:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:51.531578+00', '2025-08-29 15:37:51.531578+00', NULL, NULL, false, 0),
('be49be45-d219-44b8-8d5e-88e9d1ae4bfa', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'savidor_to_tzafrir', 'outbound', '07:00:00', '08:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:33:03.570354+00', '2025-08-29 15:33:03.570354+00', NULL, NULL, false, 0),
('dc4bc58d-5f9a-4f55-8d6d-dadb90993683', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'savidor_to_tzafrir', 'outbound', '08:00:00', '09:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:33:04.190113+00', '2025-08-29 15:33:04.190113+00', NULL, NULL, false, 0),
('4f1f90e4-9ce2-40a1-8d6f-718590d14594', 'a93c7b08-22ba-472f-9037-05d0f93945f8', 'savidor_to_tzafrir', 'outbound', '09:30:00', '10:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:33:04.793207+00', '2025-08-29 15:33:04.793207+00', NULL, NULL, false, 0),
('10d54aa3-9612-43a1-8888-23fb643eca0e', '23e8becd-857a-4f13-b35e-2e2e8e157168', 'savidor_to_tzafrir', 'outbound', '14:00:00', '15:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:33:05.411654+00', '2025-08-29 15:33:05.411654+00', NULL, NULL, false, 0),
('997c5450-7794-48fb-9d5b-03441d3677ca', 'a89ed6f5-ba9b-47cd-8be2-692e7d7366b3', 'savidor_to_tzafrir', 'outbound', '16:40:00', '17:45:00', '{1,2,3,4,5}', true, '2025-08-29 15:33:06.02615+00', '2025-08-29 15:33:06.02615+00', NULL, NULL, false, 0),
('f2d96583-43ee-4055-a0f6-741377075d66', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'savidor_to_tzafrir', 'return', '08:15:00', '09:15:00', '{1,2,3,4,5}', true, '2025-08-29 15:35:13.608403+00', '2025-08-29 15:35:13.608403+00', NULL, NULL, false, 0),
('5c514c66-e27a-4e95-9a33-a248de1ea731', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'savidor_to_tzafrir', 'return', '09:15:00', '10:15:00', '{1,2,3,4,5}', true, '2025-08-29 15:35:13.661983+00', '2025-08-29 15:35:13.661983+00', NULL, NULL, false, 0),
('8b8469bc-def8-47d9-920f-35dce2131eea', 'a93c7b08-22ba-472f-9037-05d0f93945f8', 'savidor_to_tzafrir', 'return', '10:45:00', '11:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:35:13.702095+00', '2025-08-29 15:35:13.702095+00', NULL, NULL, false, 0),
('58d58f4a-fb9f-45ee-823e-62ccfb4618c8', '23e8becd-857a-4f13-b35e-2e2e8e157168', 'savidor_to_tzafrir', 'return', '15:30:00', '16:15:00', '{1,2,3,4,5}', true, '2025-08-29 15:35:13.742424+00', '2025-08-29 15:35:13.742424+00', NULL, NULL, false, 0),
('b473ad42-a16a-4364-b9dd-f799a977f2a1', 'a89ed6f5-ba9b-47cd-8be2-692e7d7366b3', 'savidor_to_tzafrir', 'return', '18:30:00', '19:10:00', '{1,2,3,4,5}', true, '2025-08-29 15:35:14.41754+00', '2025-08-29 15:35:14.41754+00', NULL, NULL, false, 0),
('d2047c7b-10de-46aa-9706-2b681393b665', '6176f212-ab4c-4124-991e-752f132a9ce4', 'savidor_to_tzafrir', 'return', '20:00:00', '20:40:00', '{1,2,3,4,5}', true, '2025-08-29 15:35:14.46469+00', '2025-08-29 15:35:14.46469+00', NULL, NULL, false, 0),
('9c590610-fbd3-48ce-a3c8-3058664212b7', 'f28733d1-24ca-490a-a43a-285d1df9926d', 'savidor_to_tzafrir', 'return', '22:15:00', '23:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:35:14.507145+00', '2025-08-29 15:35:14.507145+00', NULL, NULL, false, 0),
('77164cda-15d5-427f-ba74-9329d091ca3f', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'savidor_to_tzafrir', 'return', '23:15:00', '23:59:00', '{1,2,3,4,5}', true, '2025-08-29 15:35:14.550275+00', '2025-08-29 15:35:14.550275+00', NULL, NULL, false, 0),
('2926dc15-124e-481e-8447-154fb4a8f840', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'kiryat_aryeh_to_tzafrir', 'outbound', '17:00:00', '17:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:00.20307+00', '2025-08-29 15:37:00.20307+00', NULL, NULL, false, 0),
('5f1a5294-b0ab-4056-83ab-c7a443199743', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'kiryat_aryeh_to_tzafrir', 'outbound', '17:30:00', '18:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:00.254095+00', '2025-08-29 15:37:00.254095+00', NULL, NULL, false, 0),
('324f9e8c-163a-4b57-aa1a-fca31533020a', 'a93c7b08-22ba-472f-9037-05d0f93945f8', 'kiryat_aryeh_to_tzafrir', 'outbound', '18:00:00', '18:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:00.296348+00', '2025-08-29 15:37:00.296348+00', NULL, NULL, false, 0),
('6569cacc-dd11-4a4b-ae36-1be2dcc07146', '23e8becd-857a-4f13-b35e-2e2e8e157168', 'kiryat_aryeh_to_tzafrir', 'outbound', '18:30:00', '19:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:07.111528+00', '2025-08-29 15:37:07.111528+00', NULL, NULL, false, 0),
('2680b6cf-e45f-43cc-b4eb-587abf310a8d', 'a89ed6f5-ba9b-47cd-8be2-692e7d7366b3', 'kiryat_aryeh_to_tzafrir', 'outbound', '19:00:00', '19:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:07.151431+00', '2025-08-29 15:37:07.151431+00', NULL, NULL, false, 0),
('78d6931e-42ee-439f-8c00-3444c46e54af', '6176f212-ab4c-4124-991e-752f132a9ce4', 'kiryat_aryeh_to_tzafrir', 'outbound', '20:00:00', '20:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:07.190628+00', '2025-08-29 15:37:07.190628+00', NULL, NULL, false, 0),
('4cf133e5-81be-4cd3-bbe8-e4399bcf82cd', 'f28733d1-24ca-490a-a43a-285d1df9926d', 'kiryat_aryeh_to_tzafrir', 'outbound', '20:30:00', '21:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:14.138255+00', '2025-08-29 15:37:14.138255+00', NULL, NULL, false, 0),
('c136217f-1964-4f2f-9e64-c5e5333b3de8', '9be1d475-2413-4ba3-9f40-3230d65b9d69', 'kiryat_aryeh_to_tzafrir', 'outbound', '21:30:00', '22:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:14.206468+00', '2025-08-29 15:37:14.206468+00', NULL, NULL, false, 0),
('ffc97f39-11c8-47a1-a2e1-ea05c88516f0', '99d5ec3a-fda6-4fb3-8899-6912838fcfad', 'kiryat_aryeh_to_tzafrir', 'outbound', '22:30:00', '23:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:14.246207+00', '2025-08-29 15:37:14.246207+00', NULL, NULL, false, 0),
('f685583d-14c5-4a99-b235-43e3266c511e', 'a93c7b08-22ba-472f-9037-05d0f93945f8', 'kiryat_aryeh_to_tzafrir', 'return', '18:30:00', '19:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:59.36834+00', '2025-08-29 15:37:59.36834+00', NULL, NULL, false, 0),
('d37962e9-f4de-4cb2-ada4-8a0015c6acf3', '23e8becd-857a-4f13-b35e-2e2e8e157168', 'kiryat_aryeh_to_tzafrir', 'return', '19:00:00', '19:30:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:59.408964+00', '2025-08-29 15:37:59.408964+00', NULL, NULL, false, 0),
('b9e8a53c-78d4-4f74-9782-7b8b502c57b5', 'a89ed6f5-ba9b-47cd-8be2-692e7d7366b3', 'kiryat_aryeh_to_tzafrir', 'return', '19:30:00', '20:00:00', '{1,2,3,4,5}', true, '2025-08-29 15:37:59.448675+00', '2025-08-29 15:37:59.448675+00', NULL, NULL, false, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert shuttle registrations data
INSERT INTO shuttle_registrations (id, schedule_id, passenger_name, passenger_phone, passenger_email, registration_date, registration_time, status, created_at, updated_at) VALUES 
('fdf9a95b-ee2a-4185-852f-5b937686c17d', 'dc4bc58d-5f9a-4f55-8d6d-dadb90993683', 'Frontend Test User 2', '0509876543', NULL, '2025-08-29', '2025-08-29 15:58:43.721859+00', 'confirmed', '2025-08-29 15:58:43.721859+00', '2025-08-29 15:58:43.721859+00'),
('a93058b0-3abe-4223-99c2-ac09c95c7420', '87ef41c6-0e84-44df-8cf7-e87db06d887c', 'jkhkjjk', '0000000000', NULL, '2025-09-03', '2025-09-03 17:31:42.133884+00', 'confirmed', '2025-09-03 17:31:42.133884+00', '2025-09-03 17:31:42.133884+00')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Success message
SELECT 'Database initialized successfully for production with complete shuttle data!' as status;