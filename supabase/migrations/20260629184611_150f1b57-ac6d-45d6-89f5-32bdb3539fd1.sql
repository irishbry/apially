CREATE OR REPLACE FUNCTION public.get_latest_active_data_entries(
  p_user_id uuid,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_source_id uuid DEFAULT NULL
)
RETURNS SETOF public.data_entries
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH eligible_sources AS (
    SELECT s.id
    FROM public.sources s
    WHERE s.user_id = p_user_id
      AND s.active = true
      AND (p_source_id IS NULL OR s.id = p_source_id)
  ),
  per_source_latest AS (
    SELECT de.*
    FROM eligible_sources s
    CROSS JOIN LATERAL (
      SELECT de_inner.*
      FROM public.data_entries de_inner
      WHERE de_inner.user_id = p_user_id
        AND de_inner.source_id = s.id
      ORDER BY de_inner.created_at DESC
      LIMIT GREATEST(p_limit + p_offset, p_limit)
    ) de
  )
  SELECT *
  FROM per_source_latest
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$function$;

CREATE OR REPLACE FUNCTION public.get_active_data_entries_count(
  p_user_id uuid,
  p_source_id uuid DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)
  FROM public.data_entries de
  JOIN public.sources s ON s.id = de.source_id
  WHERE de.user_id = p_user_id
    AND s.user_id = p_user_id
    AND s.active = true
    AND (p_source_id IS NULL OR de.source_id = p_source_id);
$function$;