CREATE OR REPLACE FUNCTION public.restrict_signup_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%@rvnu.com' THEN
    RAISE EXCEPTION 'Only @rvnu.com email addresses are allowed to sign up.';
  END IF;
  RETURN NEW;
END;
$$;

-- Note: We cannot attach triggers to auth.users (reserved schema).
-- The client-side validation is the primary enforcement.
-- If stricter server-side enforcement is needed, configure Supabase Auth email domain restrictions in the dashboard.