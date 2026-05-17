-- Admin: daily entry counts across ALL users for growth trends
CREATE OR REPLACE FUNCTION public.get_admin_daily_counts(p_days integer DEFAULT 90)
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
  WHERE created_at >= (CURRENT_DATE - p_days * INTERVAL '1 day')
  GROUP BY day
  ORDER BY day;
$$;

-- Admin: per-user storage/record counts
CREATE OR REPLACE FUNCTION public.get_admin_user_usage()
RETURNS TABLE(user_id uuid, record_count bigint, earliest_entry timestamptz, latest_entry timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    de.user_id,
    COUNT(*) AS record_count,
    MIN(de.created_at) AS earliest_entry,
    MAX(de.created_at) AS latest_entry
  FROM public.data_entries de
  WHERE de.user_id IS NOT NULL
  GROUP BY de.user_id;
$$;