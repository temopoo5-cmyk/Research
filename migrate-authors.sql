-- ============================================================
-- MIGRATION: Populate authors & research_authors from research data
-- Run this AFTER insert.sql (needs research data to exist)
-- ============================================================
DO $$
DECLARE
  r RECORD;
  author_name TEXT;
  auth_id BIGINT;
  order_num INTEGER;
BEGIN
  FOR r IN SELECT id, authors FROM research WHERE authors IS NOT NULL AND authors != '' LOOP
    order_num := 1;
    FOR author_name IN SELECT trim(unnest(string_to_array(r.authors, ','))) LOOP
      IF author_name != '' THEN
        INSERT INTO authors (name)
        VALUES (author_name)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO auth_id;
        
        INSERT INTO research_authors (research_id, author_id, author_order)
        VALUES (r.id, auth_id, order_num)
        ON CONFLICT (research_id, author_id) DO NOTHING;
        
        order_num := order_num + 1;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Verify:
-- SELECT COUNT(*) FROM authors;
-- SELECT COUNT(*) FROM research_authors;