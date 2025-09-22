-- Fix security issues: Set proper search path for functions
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.check_username_available(text) SET search_path = public;