-- Create landing_showcase table for storing showcase images
CREATE TABLE IF NOT EXISTS "landing_showcase" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "image1" TEXT,
  "image2" TEXT,
  "image3" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on id for faster lookups
CREATE INDEX IF NOT EXISTS "landing_showcase_id_idx" ON "landing_showcase" ("id");

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_showcase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landing_showcase_updated_at
  BEFORE UPDATE ON "landing_showcase"
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_showcase_updated_at();

-- Insert default record if table is empty
INSERT INTO "landing_showcase" ("image1", "image2", "image3")
SELECT '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM "landing_showcase" LIMIT 1);
