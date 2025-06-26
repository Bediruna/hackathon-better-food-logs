-- Database Migration to Fix ID Column Issues
-- Run this in Supabase SQL Editor if you're experiencing "null value in column id" errors

-- First, check current column types and constraints
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('foods', 'food_logs', 'users')
AND column_name = 'id'
ORDER BY table_name;

-- Check current sequences
SELECT 
    c.relname AS table_name,
    a.attname AS column_name,
    s.relname AS sequence_name,
    last_value,
    is_called
FROM pg_class c
JOIN pg_attribute a ON c.oid = a.attrelid
JOIN pg_depend d ON d.refobjid = c.oid AND d.refobjsubid = a.attnum
JOIN pg_class s ON d.objid = s.oid
WHERE c.relkind = 'r'
AND s.relkind = 'S'
AND c.relname IN ('foods', 'food_logs', 'users')
AND a.attname = 'id';

-- Alternative approach: Just fix the sequences without changing to identity columns
-- This is safer and should resolve the immediate issue

-- Reset the sequence for foods table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'foods_id_seq') THEN
        PERFORM setval('public.foods_id_seq', COALESCE((SELECT MAX(id) FROM public.foods), 1));
        RAISE NOTICE 'Reset foods_id_seq';
    END IF;
END $$;

-- Reset the sequence for food_logs table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'food_logs_id_seq') THEN
        PERFORM setval('public.food_logs_id_seq', COALESCE((SELECT MAX(id) FROM public.food_logs), 1));
        RAISE NOTICE 'Reset food_logs_id_seq';
    END IF;
END $$;

-- Ensure the default values are set correctly
ALTER TABLE public.foods ALTER COLUMN id SET DEFAULT nextval('public.foods_id_seq');
ALTER TABLE public.food_logs ALTER COLUMN id SET DEFAULT nextval('public.food_logs_id_seq');

-- Test the sequences work
SELECT 'foods_id_seq test: ' || nextval('public.foods_id_seq') AS test_result
UNION ALL
SELECT 'food_logs_id_seq test: ' || nextval('public.food_logs_id_seq') AS test_result;

-- Test the sequences work
SELECT 'foods_id_seq test: ' || nextval('public.foods_id_seq') AS test_result
UNION ALL
SELECT 'food_logs_id_seq test: ' || nextval('public.food_logs_id_seq') AS test_result;

-- Final verification
SELECT 
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('foods', 'food_logs')
AND column_name = 'id'
ORDER BY table_name;
