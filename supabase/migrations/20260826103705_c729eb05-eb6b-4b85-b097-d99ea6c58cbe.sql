CREATE OR REPLACE FUNCTION public.trigger_daily_backups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  backup_target record;
  backup_date text := to_char((now() AT TIME ZONE 'America/Los_Angeles') - interval '1 day', 'YYYY-MM-DD');
BEGIN
  FOR backup_target IN
    SELECT s.user_id, s.id AS source_id
    FROM public.sources s
    JOIN public.dropbox_configs dc ON dc.user_id = s.user_id
    WHERE dc.is_active = true
      AND dc.daily_backup_enabled = true
      AND s.active = true
      AND COALESCE(s.is_partner, false) = false
  LOOP
    PERFORM net.http_post(
      url := 'https://ybionvegojopebtkdgyt.supabase.co/functions/v1/dropbox-backup',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'action', 'scheduled_source_backup',
        'userId', backup_target.user_id,
        'sourceId', backup_target.source_id,
        'pstDate', backup_date,
        'format', 'csv'
      ),
      timeout_milliseconds := 150000
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_daily_backups() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_daily_backups() TO postgres, service_role;