-- Fix search path for new functions created in the previous migration
ALTER FUNCTION public.update_stats_cache() SET search_path = public;
ALTER FUNCTION public.get_homepage_stats() SET search_path = public;