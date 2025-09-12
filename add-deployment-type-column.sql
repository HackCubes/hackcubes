-- Add Kubernetes deployment support to HackCubes questions table
-- Run this in your Supabase SQL Editor

-- Add deployment_type column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'questions' 
    AND column_name = 'deployment_type'
  ) THEN
    ALTER TABLE questions 
    ADD COLUMN deployment_type VARCHAR(20) DEFAULT 'aws';
    
    -- Add comment to explain the field
    COMMENT ON COLUMN questions.deployment_type IS 'Deployment backend: kubernetes, aws, or none';
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_questions_deployment_type ON questions(deployment_type);
    
    -- Set existing questions with docker_image to kubernetes
    UPDATE questions 
    SET deployment_type = 'kubernetes' 
    WHERE docker_image IS NOT NULL 
      AND docker_image != '';
      
    -- Set questions with template_id or instance_id to aws  
    UPDATE questions 
    SET deployment_type = 'aws' 
    WHERE template_id IS NOT NULL 
       OR instance_id IS NOT NULL;
       
    -- Set basic questions to none
    UPDATE questions 
    SET deployment_type = 'none' 
    WHERE (docker_image IS NULL OR docker_image = '') 
      AND template_id IS NULL 
      AND instance_id IS NULL;
      
    RAISE NOTICE 'deployment_type column added successfully';
  ELSE
    RAISE NOTICE 'deployment_type column already exists';
  END IF;
END $$;

-- Show current distribution
SELECT 
  deployment_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questions), 2) as percentage
FROM questions 
GROUP BY deployment_type
ORDER BY count DESC;
