-- Run this in your Supabase SQL Editor to fix the "missing column" error

ALTER TABLE public.source_metadata 
ADD COLUMN IF NOT EXISTS establishment_year int;

-- Optional: Add funding_type if it was also missing
ALTER TABLE public.source_metadata 
ADD COLUMN IF NOT EXISTS funding_type text;

-- Force a schema cache reload (Supabase sometimes caches schema structure)
NOTIFY pgrst, 'reload config';
