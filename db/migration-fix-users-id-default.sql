-- Ensure users.id has a proper UUID default
DO $$
BEGIN
  -- Add pgcrypto extension if not present (for gen_random_uuid)
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  -- Ensure column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='users' AND column_name='id'
  ) THEN
    -- Set default to gen_random_uuid if not already
    ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;


