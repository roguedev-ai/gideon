-- Gideon Database Initialization Script
-- Run this when setting up the database for the first time

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify database is ready
DO $$
BEGIN
    RAISE NOTICE 'Gideon database initialized successfully!';
    RAISE NOTICE 'PostgreSQL version: %', version();
END
$$;
