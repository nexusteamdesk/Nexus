-- Nexus Database Optimization Script
-- Run these queries in Supabase SQL Editor
-- NOTE: This schema uses Supabase RLS (Row Level Security) with auth.uid()
-- instead of a user_id column. User filtering is handled by RLS policies.
/* this is indexes.sql file*/
-- 1. Index on created_at for faster sorting (if not already created by schema)
CREATE INDEX IF NOT EXISTS idx_retain_auth_memory_created_at_desc 
ON retain_auth_memory(created_at DESC);

-- 2. Index on favourite field for filtering saved memories
CREATE INDEX IF NOT EXISTS idx_retain_auth_memory_favourite 
ON retain_auth_memory(favourite) WHERE favourite = true;

-- 3. Index on metadata for JSONB queries (GIN index for flexible search)
CREATE INDEX IF NOT EXISTS idx_retain_auth_memory_metadata_gin 
ON retain_auth_memory USING gin(metadata jsonb_path_ops);

-- 4. Index on favorite field in metadata (for saved/favorites filtering)
CREATE INDEX IF NOT EXISTS idx_retain_auth_memory_metadata_favorite 
ON retain_auth_memory((metadata->>'favorite')) WHERE metadata->>'favorite' = 'true';

-- 5. Index on source field in metadata (for filtering by Mobile 'M' or Web 'W')
CREATE INDEX IF NOT EXISTS idx_retain_auth_memory_source 
ON retain_auth_memory((metadata->>'source'));

-- Check existing indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'retain_auth_memory';
/* above were 5 pts*/
-- IMPORTANT: After running these indexes, run ANALYZE to update statistics
ANALYZE retain_auth_memory;
