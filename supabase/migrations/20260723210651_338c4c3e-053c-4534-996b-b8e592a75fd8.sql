
CREATE OR REPLACE FUNCTION public.search_data_entries(
  p_user_id uuid,
  p_query text DEFAULT NULL,
  p_source_id uuid DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0
)
RETURNS SETOF public.data_entries
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT de.*
  FROM public.data_entries de
  WHERE de.user_id = p_user_id
    AND (p_source_id IS NULL OR de.source_id = p_source_id)
    AND (p_from IS NULL OR de.created_at >= p_from)
    AND (p_to IS NULL OR de.created_at <= p_to)
    AND (
      p_query IS NULL
      OR length(trim(p_query)) = 0
      OR lower(de.metadata::text) LIKE '%' || lower(p_query) || '%'
    )
  ORDER BY de.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
$$;

CREATE OR REPLACE FUNCTION public.search_data_entries_count(
  p_user_id uuid,
  p_query text DEFAULT NULL,
  p_source_id uuid DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.data_entries de
  WHERE de.user_id = p_user_id
    AND (p_source_id IS NULL OR de.source_id = p_source_id)
    AND (p_from IS NULL OR de.created_at >= p_from)
    AND (p_to IS NULL OR de.created_at <= p_to)
    AND (
      p_query IS NULL
      OR length(trim(p_query)) = 0
      OR lower(de.metadata::text) LIKE '%' || lower(p_query) || '%'
    );
$$;

REVOKE ALL ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamptz, timestamptz, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamptz, timestamptz) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.search_data_entries(uuid, text, uuid, timestamptz, timestamptz, int, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_data_entries_count(uuid, text, uuid, timestamptz, timestamptz) TO authenticated, service_role;
