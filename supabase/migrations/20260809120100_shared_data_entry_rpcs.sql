-- Shared access model, part 2: the data-entry RPCs now return rows for every
-- source, for any signed-in user, instead of only the caller's own rows.
--
-- Previously these functions filtered on de.user_id = auth.uid() with an
-- is_admin(auth.uid()) exception for a single hard-coded admin account. With
-- sources shared across the whole team, that exception is no longer meaningful.
--
-- The p_user_id argument is kept in every signature so existing callers and the
-- generated Supabase types keep working; it is no longer used to filter rows.
-- Access is instead gated on there being an authenticated session at all, and
-- EXECUTE stays granted to authenticated / service_role only.

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
    WHERE auth.uid() IS NOT NULL
      AND s.active = true
      AND (p_source_id IS NULL OR s.id = p_source_id)
  ),
  per_source_latest AS (
    SELECT de.*
    FROM eligible_sources s
    CROSS JOIN LATERAL (
      SELECT de_inner.*
      FROM public.data_entries de_inner
      WHERE de_inner.source_id = s.id
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
  WHERE auth.uid() IS NOT NULL
    AND s.active = true
    AND (p_source_id IS NULL OR de.source_id = p_source_id);
$function$;

CREATE OR REPLACE FUNCTION public.search_data_entries(
  p_user_id uuid,
  p_query text DEFAULT NULL::text,
  p_source_id uuid DEFAULT NULL::uuid,
  p_from timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_to timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.data_entries
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_query text := lower(trim(coalesce(p_query, '')));
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Fast path: an all-digits query is an exact phone number lookup
  IF v_query ~ '^[0-9]{7,}$' THEN
    RETURN QUERY
    SELECT de.*
    FROM public.data_entries de
    WHERE (p_source_id IS NULL OR de.source_id = p_source_id)
      AND (p_from IS NULL OR de.created_at >= p_from)
      AND (p_to IS NULL OR de.created_at <= p_to)
      AND de.metadata->>'phone' = v_query
    ORDER BY de.created_at DESC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0);

    RETURN;
  END IF;

  RETURN QUERY
  SELECT de.*
  FROM public.data_entries de
  WHERE (p_source_id IS NULL OR de.source_id = p_source_id)
    AND (p_from IS NULL OR de.created_at >= p_from)
    AND (p_to IS NULL OR de.created_at <= p_to)
    AND (
      v_query = ''
      OR lower(de.metadata::text) LIKE '%' || v_query || '%'
    )
  ORDER BY de.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_data_entries_count(
  p_user_id uuid,
  p_query text DEFAULT NULL::text,
  p_source_id uuid DEFAULT NULL::uuid,
  p_from timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_to timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_query text := lower(trim(coalesce(p_query, '')));
  v_count bigint := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  IF v_query ~ '^[0-9]{7,}$' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.data_entries de
    WHERE (p_source_id IS NULL OR de.source_id = p_source_id)
      AND (p_from IS NULL OR de.created_at >= p_from)
      AND (p_to IS NULL OR de.created_at <= p_to)
      AND de.metadata->>'phone' = v_query;

    RETURN v_count;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.data_entries de
  WHERE (p_source_id IS NULL OR de.source_id = p_source_id)
    AND (p_from IS NULL OR de.created_at >= p_from)
    AND (p_to IS NULL OR de.created_at <= p_to)
    AND (
      v_query = ''
      OR lower(de.metadata::text) LIKE '%' || v_query || '%'
    );

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_latest_active_data_entries(uuid, integer, integer, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_active_data_entries_count(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamp with time zone, timestamp with time zone) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_latest_active_data_entries(uuid, integer, integer, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_active_data_entries_count(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamp with time zone, timestamp with time zone) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
