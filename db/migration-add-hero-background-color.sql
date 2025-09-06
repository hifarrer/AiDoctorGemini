-- Add background_color column to landing_hero table
-- This allows admins to select different background colors for the landing page

-- Add the background_color column with a default value
ALTER TABLE public.landing_hero 
ADD COLUMN IF NOT EXISTS background_color VARCHAR(50) DEFAULT 'gradient-blue';

-- Update existing record with default background color if it doesn't have one
UPDATE public.landing_hero 
SET background_color = 'gradient-blue' 
WHERE id = 1 AND background_color IS NULL;

-- Add a comment to document the available color options
COMMENT ON COLUMN public.landing_hero.background_color IS 'Background color theme for the landing page. Options: gradient-blue, gradient-purple, gradient-green, gradient-orange, gradient-pink, solid-white, solid-gray, solid-dark, solid-blue, solid-green';
