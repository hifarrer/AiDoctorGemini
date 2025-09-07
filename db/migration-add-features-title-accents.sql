-- Add title accent color columns to landing_features_section
ALTER TABLE public.landing_features_section
ADD COLUMN IF NOT EXISTS title_accent1 VARCHAR(7) DEFAULT '#a855f7';

ALTER TABLE public.landing_features_section
ADD COLUMN IF NOT EXISTS title_accent2 VARCHAR(7) DEFAULT '#14b8a6';

-- Ensure primary row has default accent colors if null
UPDATE public.landing_features_section
SET title_accent1 = COALESCE(title_accent1, '#a855f7'),
    title_accent2 = COALESCE(title_accent2, '#14b8a6')
WHERE id = 1;
