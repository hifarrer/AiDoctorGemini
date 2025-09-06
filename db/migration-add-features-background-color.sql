-- Add background_color column to landing_features_section
ALTER TABLE public.landing_features_section
ADD COLUMN IF NOT EXISTS background_color VARCHAR(50) DEFAULT 'solid-blue';

-- Ensure primary row has a default if null
UPDATE public.landing_features_section
SET background_color = COALESCE(background_color, 'solid-blue')
WHERE id = 1;


