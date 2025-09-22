-- Fix search path for existing functions to resolve security warning
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.check_username_available(text) SET search_path = public;
ALTER FUNCTION public.get_available_tags() SET search_path = public;