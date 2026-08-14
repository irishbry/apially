CREATE OR REPLACE FUNCTION public.sync_source_record_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.source_id IS NOT NULL THEN
      INSERT INTO public.source_record_counts(source_id, record_count)
      VALUES (NEW.source_id, 1)
      ON CONFLICT (source_id) DO UPDATE
        SET record_count = public.source_record_counts.record_count + 1, updated_at = now();
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.source_id IS NOT NULL THEN
      UPDATE public.source_record_counts
        SET record_count = GREATEST(record_count - 1, 0), updated_at = now()
      WHERE source_id = OLD.source_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

SET lock_timeout = '10s';

DROP TRIGGER IF EXISTS trg_sync_source_record_count ON public.data_entries;
CREATE TRIGGER trg_sync_source_record_count
AFTER INSERT OR DELETE ON public.data_entries
FOR EACH ROW EXECUTE FUNCTION public.sync_source_record_count();