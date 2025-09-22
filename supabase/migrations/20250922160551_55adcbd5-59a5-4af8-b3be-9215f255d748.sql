-- Update profiles RLS policy to require authentication for SELECT
DROP POLICY "Профили видны всем" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Drop existing update policy and create separate policies
DROP POLICY "Пользователи могут обновлять свой" ON public.profiles;

-- Users can update their own profile but not their role
CREATE POLICY "Users can update own profile data" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- Only admins can update user roles
CREATE POLICY "Admins can update any profile and roles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'editor')
));

-- Add DELETE policies
CREATE POLICY "Users can delete their own profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authors and admins can delete posts" 
ON public.posts 
FOR DELETE 
TO authenticated
USING (
  author_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- Add DELETE policies for uploads and signals  
CREATE POLICY "Users can delete their own uploads" 
ON public.uploads 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own signals" 
ON public.signals 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Add admin policies for reports
CREATE POLICY "Admins can update reports" 
ON public.reports 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'editor')
));

CREATE POLICY "Admins can delete reports" 
ON public.reports 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'editor')
));