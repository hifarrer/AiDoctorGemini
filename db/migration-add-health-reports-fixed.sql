-- Create health_reports table
CREATE TABLE IF NOT EXISTS health_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'lab_results', 'exam_results', 'imaging', 'general_report', etc.
    original_filename VARCHAR(255),
    file_content TEXT, -- Store the extracted text content
    file_size INTEGER,
    mime_type VARCHAR(100),
    ai_analysis TEXT, -- Store the AI analysis/summary
    ai_summary TEXT, -- Store the concise summary
    key_findings TEXT[], -- Array of key findings
    recommendations TEXT[], -- Array of recommendations
    risk_level VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'moderate', 'high', 'critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_created_at ON health_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_reports_report_type ON health_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_health_reports_risk_level ON health_reports(risk_level);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_reports_updated_at 
    BEFORE UPDATE ON health_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
