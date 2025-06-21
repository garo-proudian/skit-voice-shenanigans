
-- Make user_id nullable and remove the foreign key constraint
ALTER TABLE public.videos ALTER COLUMN user_id DROP NOT NULL;

-- Drop the foreign key constraint if it exists
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_user_id_fkey;

-- Drop all existing RLS policies since we're removing authentication
DROP POLICY IF EXISTS "Users can view their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can upload their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON public.videos;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can view their own videos in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own videos to storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos from storage" ON storage.objects;

-- Create simple public policies for storage (since it's a single-user app)
CREATE POLICY "Public can manage videos in storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'videos');

-- Update the trigger function to work without user_id
CREATE OR REPLACE FUNCTION ensure_single_default_video()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Set all other videos to not default (no user filtering needed)
    UPDATE public.videos 
    SET is_default = false 
    WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
