REVOKE ALL ON FUNCTION public.get_latest_active_data_entries(uuid, integer, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_active_data_entries_count(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_latest_active_data_entries(uuid, integer, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_data_entries_count(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_latest_active_data_entries(uuid, integer, integer, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_active_data_entries_count(uuid, uuid) TO service_role;