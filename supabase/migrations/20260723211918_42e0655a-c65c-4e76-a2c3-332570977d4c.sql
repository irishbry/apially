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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT de.*
  FROM public.data_entries de
  WHERE auth.uid() IS NOT NULL
    AND p_user_id = auth.uid()
    AND (public.is_admin(auth.uid()) OR de.user_id = auth.uid())
    AND (p_source_id IS NULL OR de.source_id = p_source_id)
    AND (p_from IS NULL OR de.created_at >= p_from)
    AND (p_to IS NULL OR de.created_at <= p_to)
    AND (
      p_query IS NULL
      OR length(trim(p_query)) = 0
      OR lower(de.metadata::text) LIKE '%' || lower(trim(p_query)) || '%'
    )
  ORDER BY de.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
$function$;

CREATE OR REPLACE FUNCTION public.search_data_entries_count(
  p_user_id uuid,
  p_query text DEFAULT NULL::text,
  p_source_id uuid DEFAULT NULL::uuid,
  p_from timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_to timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)
  FROM public.data_entries de
  WHERE auth.uid() IS NOT NULL
    AND p_user_id = auth.uid()
    AND (public.is_admin(auth.uid()) OR de.user_id = auth.uid())
    AND (p_source_id IS NULL OR de.source_id = p_source_id)
    AND (p_from IS NULL OR de.created_at >= p_from)
    AND (p_to IS NULL OR de.created_at <= p_to)
    AND (
      p_query IS NULL
      OR length(trim(p_query)) = 0
      OR lower(de.metadata::text) LIKE '%' || lower(trim(p_query)) || '%'
    );
$function$;

REVOKE ALL ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamp with time zone, timestamp with time zone) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamp with time zone, timestamp with time zone) TO service_role;