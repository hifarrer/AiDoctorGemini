-- Migration to add image analysis support to health_reports table
-- This extends the existing health_reports table to support image analysis

-- Add new columns to support image analysis
ALTER TABLE health_reports 
ADD COLUMN IF NOT EXISTS image_data TEXT, -- Base64 encoded image data
ADD COLUMN IF NOT EXISTS image_filename VARCHAR(255), -- Original image filename
ADD COLUMN IF NOT EXISTS image_mime_type VARCHAR(100), -- Image MIME type
ADD COLUMN IF NOT EXISTS analysis_type VARCHAR(50) DEFAULT 'document'; -- 'document' or 'image'

-- Update existing records to have analysis_type as 'document'
UPDATE health_reports SET analysis_type = 'document' WHERE analysis_type IS NULL;

-- Create index for analysis_type for better performance
CREATE INDEX IF NOT EXISTS idx_health_reports_analysis_type ON health_reports(analysis_type);

-- Add comment for documentation
COMMENT ON COLUMN health_reports.image_data IS 'Base64 encoded image data for image analysis reports';
COMMENT ON COLUMN health_reports.image_filename IS 'Original filename of the analyzed image';
COMMENT ON COLUMN health_reports.image_mime_type IS 'MIME type of the analyzed image';
COMMENT ON COLUMN health_reports.analysis_type IS 'Type of analysis: document or image';
