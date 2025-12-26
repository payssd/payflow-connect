-- Fix linter WARN: set immutable search_path for functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;