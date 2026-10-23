-- ============================================================
-- Fix programs table - handles existing data
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1) Reset sequence to avoid conflicts
SELECT setval(pg_get_serial_sequence('programs', 'id'), COALESCE((SELECT MAX(id) FROM programs), 0) + 1, false);

-- 2) Insert/update programs safely
INSERT INTO programs (name, code) VALUES
  ('Computer Science', 'CS'),
  ('Information Technology', 'IT'),
  ('Information Systems', 'IS'),
  ('Computer Engineering', 'CPE'),
  ('Business Administration', 'BSBA')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 3) Verify
SELECT * FROM programs ORDER BY id;