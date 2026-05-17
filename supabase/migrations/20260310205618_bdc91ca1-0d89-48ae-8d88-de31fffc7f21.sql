
CREATE OR REPLACE FUNCTION public.get_admin_source_daily_counts(p_source_id uuid, p_days integer DEFAULT 30)
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
  WHERE source_id = p_source_id
    AND created_at >= (CURRENT_DATE - p_days * INTERVAL '1 day')
  GROUP BY day
  ORDER BY day;
$$;
