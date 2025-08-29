--
-- PostgreSQL database dump
--

\restrict oPJR62jUn2Zz6dCo3OO3ZuPjG14wI7CxckagZ9NKMqk1ujEZ7haKiRPCKCAZbPu

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255),
    role character varying(50) DEFAULT 'admin'::character varying,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    contact_email character varying(255),
    contact_phone character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: shuttle_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shuttle_registrations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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


ALTER TABLE public.shuttle_registrations OWNER TO postgres;

--
-- Name: shuttle_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shuttle_schedules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shuttle_id uuid,
    route_type character varying(50) NOT NULL,
    direction character varying(50) NOT NULL,
    departure_time time without time zone NOT NULL,
    arrival_time time without time zone,
    days_of_week integer[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shuttle_schedules OWNER TO postgres;

--
-- Name: shuttles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shuttles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    company_id uuid,
    capacity integer DEFAULT 50,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shuttles OWNER TO postgres;

--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_users (id, email, password_hash, full_name, role, is_active, last_login, created_at, updated_at) FROM stdin;
70cf1b94-15cc-44e9-83a3-aed4a32aa8f0	admin@tzafrir.com	$2a$06$lKkJ7IcDxJEriAFCzLhh0OnrlC/HXbLLZMh71dA5aKUxiPgxhqy7O	System Administrator	super_admin	t	\N	2025-08-28 14:59:15.521408+00	2025-08-28 14:59:15.521408+00
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, contact_email, contact_phone, created_at, updated_at) FROM stdin;
11111111-1111-1111-1111-111111111111	Shuttle Express Ltd	contact@shuttleexpress.com	03-1234567	2025-08-28 14:59:15.535185+00	2025-08-28 14:59:15.535185+00
22222222-2222-2222-2222-222222222222	Safe Transit Co	info@safetransit.com	03-7654321	2025-08-28 14:59:15.535185+00	2025-08-28 14:59:15.535185+00
3c9cd99d-d5d3-4555-80b3-d09d7c4b1239	Test Transport	test@example.com	03-9876543	2025-08-28 15:19:22.381967+00	2025-08-28 15:19:22.381967+00
\.


--
-- Data for Name: shuttle_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shuttle_registrations (id, schedule_id, passenger_name, passenger_phone, passenger_email, registration_date, registration_time, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shuttle_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shuttle_schedules (id, shuttle_id, route_type, direction, departure_time, arrival_time, days_of_week, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shuttles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shuttles (id, name, company_id, capacity, status, created_at, updated_at) FROM stdin;
1953e123-1b26-4a5b-836f-8473b29ec206	Express Line 1	11111111-1111-1111-1111-111111111111	50	active	2025-08-28 14:59:15.539059+00	2025-08-28 14:59:15.539059+00
b6a976cc-9748-4bcd-971b-dbef75f6e60a	Express Line 2	11111111-1111-1111-1111-111111111111	45	active	2025-08-28 14:59:15.539059+00	2025-08-28 14:59:15.539059+00
012d7ea1-2455-47ac-b663-ba2e160d8f4b	Safe Line A	22222222-2222-2222-2222-222222222222	55	active	2025-08-28 14:59:15.539059+00	2025-08-28 14:59:15.539059+00
\.


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: shuttle_registrations shuttle_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shuttle_registrations
    ADD CONSTRAINT shuttle_registrations_pkey PRIMARY KEY (id);


--
-- Name: shuttle_schedules shuttle_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shuttle_schedules
    ADD CONSTRAINT shuttle_schedules_pkey PRIMARY KEY (id);


--
-- Name: shuttles shuttles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shuttles
    ADD CONSTRAINT shuttles_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_users_email ON public.admin_users USING btree (email);


--
-- Name: idx_registrations_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registrations_date ON public.shuttle_registrations USING btree (registration_date);


--
-- Name: idx_registrations_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registrations_schedule_id ON public.shuttle_registrations USING btree (schedule_id);


--
-- Name: idx_schedules_route_direction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_route_direction ON public.shuttle_schedules USING btree (route_type, direction);


--
-- Name: idx_schedules_shuttle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_shuttle_id ON public.shuttle_schedules USING btree (shuttle_id);


--
-- Name: idx_shuttles_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shuttles_company_id ON public.shuttles USING btree (company_id);


--
-- Name: admin_users update_admin_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shuttle_registrations update_registrations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.shuttle_registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shuttle_schedules update_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.shuttle_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shuttles update_shuttles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_shuttles_updated_at BEFORE UPDATE ON public.shuttles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shuttle_registrations shuttle_registrations_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shuttle_registrations
    ADD CONSTRAINT shuttle_registrations_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.shuttle_schedules(id) ON DELETE CASCADE;


--
-- Name: shuttle_schedules shuttle_schedules_shuttle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shuttle_schedules
    ADD CONSTRAINT shuttle_schedules_shuttle_id_fkey FOREIGN KEY (shuttle_id) REFERENCES public.shuttles(id) ON DELETE CASCADE;


--
-- Name: shuttles shuttles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shuttles
    ADD CONSTRAINT shuttles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict oPJR62jUn2Zz6dCo3OO3ZuPjG14wI7CxckagZ9NKMqk1ujEZ7haKiRPCKCAZbPu

