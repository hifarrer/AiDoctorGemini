-- Fix incorrect FK on user_interactions.user_id pointing to users_test
-- Run this in Supabase SQL editor (or via your DB migration process)

DO $$
BEGIN
  -- Drop existing FK if it references the wrong table
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'user_interactions'
      AND kcu.column_name = 'user_id'
  ) THEN
    ALTER TABLE public.user_interactions
      DROP CONSTRAINT IF EXISTS user_interactions_user_id_fkey;
  END IF;

  -- Recreate correct FK to public.users(id)
  ALTER TABLE public.user_interactions
    ADD CONSTRAINT user_interactions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;
END $$;

-- Optional: ensure plan_id FK is correct too (safe to re-apply)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'user_interactions'
      AND kcu.column_name = 'plan_id'
  ) THEN
    ALTER TABLE public.user_interactions
      DROP CONSTRAINT IF EXISTS user_interactions_plan_id_fkey;
  END IF;

  ALTER TABLE public.user_interactions
    ADD CONSTRAINT user_interactions_plan_id_fkey
    FOREIGN KEY (plan_id)
    REFERENCES public.plans(id)
    ON DELETE CASCADE;
END $$;

-- Verification: list FKs on user_interactions
-- SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS references_table
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu
--   ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage ccu
--   ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'user_interactions';


