-- Update profiles RLS policy to require authentication for SELECT
DROP POLICY "Профили видны всем" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Add policy to restrict role updates to admins only
CREATE POLICY "Only admins can update user roles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  CASE 
    WHEN OLD.role = NEW.role THEN auth.uid() = user_id  -- Users can update their own profile except role
    ELSE EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )  -- Only admins can change roles
  END
);

-- Add DELETE policies for user data
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

-- Add admin DELETE policy for reports
CREATE POLICY "Admins can delete reports" 
ON public.reports 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'editor')
));

-- Update reports UPDATE policy for admins
CREATE POLICY "Admins can update reports" 
ON public.reports 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'editor')
));