-- Migration to update site name to the correct value
-- This will update the existing settings record to use "Health Consultant AI"

UPDATE settings 
SET site_name = 'Health Consultant AI' 
WHERE id = 1 AND (site_name = 'AI Doctor' OR site_name IS NULL);

-- If no record exists, create one with the correct site name
INSERT INTO settings (id, site_name, site_description)
SELECT 1, 'Health Consultant AI', 'Your Personal AI Health Assistant'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
