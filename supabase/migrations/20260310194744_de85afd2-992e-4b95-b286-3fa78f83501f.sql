-- Aggregate daily counts server-side to avoid 1000-row client limit
CREATE OR REPLACE FUNCTION public.get_daily_entry_counts(p_user_id uuid, p_days integer DEFAULT 30)
RETURNS TABLE(day date, entry_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    DATE(created_at AT TIME ZONE 'UTC') AS day,
    COUNT(*) AS entry_count
  FROM public.data_entries
  WHERE user_id = p_user_id
    AND created_at >= (CURRENT_DATE - p_days * INTERVAL '1 day')
  GROUP BY day
  ORDER BY day;
$$;

-- Aggregate counts by source server-side
CREATE OR REPLACE FUNCTION public.get_source_entry_counts(p_user_id uuid)
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
  WHERE de.user_id = p_user_id
    AND de.source_id IS NOT NULL
  GROUP BY de.source_id, s.name
  ORDER BY entry_count DESC;
$$;