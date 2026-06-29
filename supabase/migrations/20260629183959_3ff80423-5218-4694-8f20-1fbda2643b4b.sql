CREATE OR REPLACE FUNCTION public.get_source_record_counts(p_user_id uuid)
RETURNS TABLE(source_id uuid, record_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT de.source_id, COUNT(*) AS record_count
  FROM public.data_entries de
  WHERE de.user_id = p_user_id
    AND de.source_id IS NOT NULL
  GROUP BY de.source_id;
$function$;