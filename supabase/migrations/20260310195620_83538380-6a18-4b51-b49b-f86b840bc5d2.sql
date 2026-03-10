-- Efficient single-query source record counts
CREATE OR REPLACE FUNCTION public.get_source_record_counts(p_user_id uuid)
RETURNS TABLE(source_id uuid, record_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT de.source_id, COUNT(*) AS record_count
  FROM public.data_entries de
  WHERE de.source_id IN (SELECT id FROM public.sources WHERE user_id = p_user_id)
  GROUP BY de.source_id;
$$;