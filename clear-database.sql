-- ============================================================
-- Clear ALL data from the Research Management System database
-- Deletes every row from all tables (keeps the tables/schema).
-- To remove tables entirely instead, use the DROP block below.
-- ============================================================

-- Delete child/referencing rows first, then parents (or use TRUNCATE ... CASCADE).
TRUNCATE TABLE research, users, programs, categories RESTART IDENTITY CASCADE;

-- Reset identity sequences so new rows start from 1 again.
SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('programs', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('categories', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('research', 'id'), 1, false);

-- ============================================================
-- OPTIONAL: If you want to also remove uploaded documents from
-- Supabase Storage, delete the files / the bucket in the Storage UI.
-- ============================================================

-- ============================================================
-- OPTIONAL: DROP TABLES ENTIRELY
-- Use this instead if you want to remove the schema too.
-- ============================================================
-- DROP TABLE IF EXISTS research;
-- DROP TABLE IF EXISTS programs;
-- DROP TABLE IF EXISTS categories;
-- DROP TABLE IF EXISTS users;