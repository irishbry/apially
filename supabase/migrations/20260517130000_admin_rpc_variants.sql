-- Admin (no user filter) variants of the per-user RPCs.
-- The app treats data_entries / sources / schema_configs as shared across all
-- authenticated users; these RPCs match that model.

CREATE OR REPLACE FUNCTION public.get_source_entry_counts_admin()
RETURNS TABLE(source_id uuid, source_name text, entry_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    de.source_id,
    COALESCE(s.name, 'Unknown') AS source_name,
    COUNT(*) AS entry_count
  FROM public.data_entries de
  LEFT JOIN public.sources s ON s.id = de.source_id
  WHERE de.source_id IS NOT NULL
  GROUP BY de.source_id, s.name
  ORDER BY entry_count DESC;
$$;

CREATE OR REPLACE FUNCTION public.count_distinct_sources_admin()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(DISTINCT source_id)::int
  FROM public.data_entries
  WHERE source_id IS NOT NULL;
$$;
