-- ============================================================
-- Fix missing program for research records
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1) Ensure BSBA program exists
INSERT INTO programs (name, code)
VALUES ('Business Administration', 'BSBA')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
RETURNING id, name, code;

-- 2) Update research records with NULL program_id to use BSBA
UPDATE research
SET program_id = (SELECT id FROM programs WHERE code = 'BSBA')
WHERE program_id IS NULL;

-- 3) Verify the fix
SELECT r.id, r.code, r.title, r.program_id, p.name AS program_name, p.code AS program_code
FROM research r
LEFT JOIN programs p ON p.id = r.program_id
WHERE r.id = 4;

-- 4) Check all research programs
SELECT r.id, r.code, r.title, r.program_id, p.name AS program_name, p.code AS program_code
FROM research r
LEFT JOIN programs p ON p.id = r.program_id
ORDER BY r.id;