CREATE OR REPLACE FUNCTION public.get_recent_backup_eligibility(p_days integer DEFAULT 14)
RETURNS TABLE(source_id uuid, backup_date date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id AS source_id, d.backup_date
  FROM public.sources s
  CROSS JOIN LATERAL (
    SELECT ((now() AT TIME ZONE 'America/Los_Angeles')::date - n) AS backup_date
    FROM generate_series(1, LEAST(GREATEST(p_days, 1), 14)) AS n
  ) d
  WHERE auth.uid() IS NOT NULL
    AND s.user_id = auth.uid()
    AND s.active = true
    AND s.is_partner = false
    AND EXISTS (
      SELECT 1
      FROM public.data_entries de
      WHERE de.user_id = s.user_id
        AND de.source_id = s.id
        AND de.created_at >= (d.backup_date::timestamp AT TIME ZONE 'America/Los_Angeles')
        AND de.created_at < ((d.backup_date + 1)::timestamp AT TIME ZONE 'America/Los_Angeles')
        AND (de.metadata->>'paused' IS NULL OR de.metadata->>'paused' <> 'true')
    );
$$;
REVOKE ALL ON FUNCTION public.get_recent_backup_eligibility(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_recent_backup_eligibility(integer) TO authenticated, service_role;