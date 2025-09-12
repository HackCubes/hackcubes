-- Add deployment_type column to questions table to support Kubernetes vs AWS Lambda hosting

-- Add deployment_type column
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS deployment_type VARCHAR(20) DEFAULT 'aws';

-- Add comment to explain the field
COMMENT ON COLUMN questions.deployment_type IS 'Deployment backend: kubernetes, aws, or none';

-- Update existing questions based on their configuration
-- Set to 'kubernetes' for questions that have docker_image but no AWS identifiers
UPDATE questions 
SET deployment_type = 'kubernetes' 
WHERE docker_image IS NOT NULL 
  AND docker_image != '' 
  AND template_id IS NULL 
  AND instance_id IS NULL;

-- Set to 'aws' for questions that have AWS identifiers
UPDATE questions 
SET deployment_type = 'aws' 
WHERE template_id IS NOT NULL 
   OR instance_id IS NOT NULL;

-- Set to 'none' for questions that don't need infrastructure
UPDATE questions 
SET deployment_type = 'none' 
WHERE (docker_image IS NULL OR docker_image = '') 
  AND template_id IS NULL 
  AND instance_id IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_questions_deployment_type ON questions(deployment_type);

-- Create a view to help with challenge management
CREATE OR REPLACE VIEW challenge_deployment_info AS
SELECT 
  q.id,
  q.name,
  q.deployment_type,
  q.docker_image,
  q.template_id,
  q.instance_id,
  CASE 
    WHEN q.deployment_type = 'kubernetes' THEN 'Kubernetes Cluster'
    WHEN q.deployment_type = 'aws' THEN 'AWS Lambda'
    ELSE 'No Infrastructure'
  END as deployment_backend,
  CASE 
    WHEN q.deployment_type = 'kubernetes' THEN q.docker_image
    WHEN q.deployment_type = 'aws' THEN q.template_id
    ELSE 'N/A'
  END as deployment_config
FROM questions q;

-- Insert sample Kubernetes-based challenges if they don't exist
INSERT INTO questions (
  section_id, 
  name, 
  description, 
  type, 
  category, 
  difficulty, 
  score, 
  deployment_type,
  docker_image,
  tags,
  hints
) VALUES 
(
  (SELECT id FROM sections WHERE name ILIKE '%web%' LIMIT 1),
  'K8s Web Challenge',
  'A sample web security challenge deployed via Kubernetes',
  'CTF',
  'Web Security',
  'EASY',
  100,
  'kubernetes',
  'hackcubes/web-challenge:latest',
  ARRAY['web', 'kubernetes', 'docker'],
  ARRAY['Check the source code', 'Look for hidden endpoints']
),
(
  (SELECT id FROM sections WHERE name ILIKE '%web%' LIMIT 1),
  'Container Escape',
  'Container security challenge with Docker deployment',
  'CTF', 
  'Container Security',
  'HARD',
  300,
  'kubernetes',
  'hackcubes/container-escape:latest',
  ARRAY['container', 'security', 'escape'],
  ARRAY['Understand container boundaries', 'Check for privilege escalation']
)
ON CONFLICT (name) DO NOTHING;

-- Show deployment type distribution
SELECT 
  deployment_type,
  COUNT(*) as challenge_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questions), 2) as percentage
FROM questions 
GROUP BY deployment_type
ORDER BY challenge_count DESC; 