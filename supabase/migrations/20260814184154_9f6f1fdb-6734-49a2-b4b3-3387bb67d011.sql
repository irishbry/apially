CREATE TABLE IF NOT EXISTS public.source_record_counts (
  source_id uuid PRIMARY KEY REFERENCES public.sources(id) ON DELETE CASCADE,
  record_count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.source_record_counts TO authenticated;
GRANT ALL ON public.source_record_counts TO service_role;

ALTER TABLE public.source_record_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view source record counts"
  ON public.source_record_counts FOR SELECT TO authenticated USING (true);

-- Backfill existing counts one source at a time (uses source_id index)
DO $$
DECLARE r record; c bigint;
BEGIN
  FOR r IN SELECT id FROM public.sources LOOP
    SELECT count(*) INTO c FROM public.data_entries WHERE source_id = r.id;
    INSERT INTO public.source_record_counts(source_id, record_count)
    VALUES (r.id, c)
    ON CONFLICT (source_id) DO UPDATE SET record_count = EXCLUDED.record_count, updated_at = now();
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_source_record_counts_admin()
RETURNS TABLE(source_id uuid, record_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id AS source_id, COALESCE(c.record_count, 0) AS record_count
  FROM public.sources s
  LEFT JOIN public.source_record_counts c ON c.source_id = s.id;
$$;

CREATE OR REPLACE FUNCTION public.get_source_record_counts(p_user_id uuid)
RETURNS TABLE(source_id uuid, record_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id AS source_id, COALESCE(c.record_count, 0) AS record_count
  FROM public.sources s
  LEFT JOIN public.source_record_counts c ON c.source_id = s.id
  WHERE s.user_id = p_user_id;
$$;