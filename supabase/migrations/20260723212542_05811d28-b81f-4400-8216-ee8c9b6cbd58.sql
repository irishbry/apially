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
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

  IF v_query ~ '^[0-9]{7,}$' THEN
    RETURN QUERY
    SELECT de.*
    FROM public.data_entries de
    WHERE (public.is_admin(auth.uid()) OR de.user_id = auth.uid())
      AND (p_source_id IS NULL OR de.source_id = p_source_id)
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
  WHERE (public.is_admin(auth.uid()) OR de.user_id = auth.uid())
    AND (p_source_id IS NULL OR de.source_id = p_source_id)
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
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN 0;
  END IF;

  IF v_query ~ '^[0-9]{7,}$' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.data_entries de
    WHERE (public.is_admin(auth.uid()) OR de.user_id = auth.uid())
      AND (p_source_id IS NULL OR de.source_id = p_source_id)
      AND (p_from IS NULL OR de.created_at >= p_from)
      AND (p_to IS NULL OR de.created_at <= p_to)
      AND de.metadata->>'phone' = v_query;

    RETURN v_count;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.data_entries de
  WHERE (public.is_admin(auth.uid()) OR de.user_id = auth.uid())
    AND (p_source_id IS NULL OR de.source_id = p_source_id)
    AND (p_from IS NULL OR de.created_at >= p_from)
    AND (p_to IS NULL OR de.created_at <= p_to)
    AND (
      v_query = ''
      OR lower(de.metadata::text) LIKE '%' || v_query || '%'
    );

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamp with time zone, timestamp with time zone) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamp with time zone, timestamp with time zone) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamp with time zone, timestamp with time zone) TO service_role;

NOTIFY pgrst, 'reload schema';