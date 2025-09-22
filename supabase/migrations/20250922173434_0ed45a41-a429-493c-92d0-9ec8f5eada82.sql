-- Add city field to profiles table
ALTER TABLE public.profiles ADD COLUMN city text;

-- Update profiles table to have better default role handling
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- Create function to check username uniqueness
CREATE OR REPLACE FUNCTION public.check_username_available(username_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_count integer;
BEGIN
  SELECT COUNT(*) INTO exists_count 
  FROM public.profiles 
  WHERE username = username_to_check;
  
  RETURN exists_count = 0;
END;
$$;