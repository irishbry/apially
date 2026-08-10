-- Shared access model: every authenticated user can read every source and every
-- data entry, not only the ones they own. This mirrors the model on
-- feature/read_api, where the app treats sources / data_entries as shared.
--
-- Notes:
--  * These policies are ADDITIVE. Postgres OR-combines permissive policies, so
--    any existing owner-scoped policies keep working; this simply widens SELECT.
--  * Row level security is intentionally NOT enabled here. If a table currently
--    has RLS disabled, enabling it while only SELECT policies exist would break
--    inserts and updates. Policies on a table without RLS are simply inert.
--  * Writes (INSERT / UPDATE / DELETE) are deliberately left alone: creating,
--    renaming, pausing and deleting sources stays governed by whatever policies
--    already exist.

DROP POLICY IF EXISTS "Authenticated users can view all sources" ON public.sources;
CREATE POLICY "Authenticated users can view all sources"
  ON public.sources
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view all data entries" ON public.data_entries;
CREATE POLICY "Authenticated users can view all data entries"
  ON public.data_entries
  FOR SELECT
  TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
