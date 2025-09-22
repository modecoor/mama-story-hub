-- Create tags restrictions and improve tag management
-- Update RLS policies for tags to restrict creation to admins only

-- Create policy for tag creation - only admins can create tags
DROP POLICY IF EXISTS "Админы могут управлять тегами" ON public.tags;

-- New comprehensive policy for tag management
CREATE POLICY "Admins can manage tags"
ON public.tags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

-- Keep the existing read policy for tags
-- CREATE POLICY "Tags are visible to everyone" (already exists)

-- Create function to get available tags for users (read-only access)
CREATE OR REPLACE FUNCTION public.get_available_tags()
RETURNS TABLE(
  id uuid,
  title text,
  slug text,
  created_at timestamptz
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, title, slug, created_at
  FROM tags
  ORDER BY title;
$$;