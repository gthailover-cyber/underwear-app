-- Add is_available column to profiles table for model availability status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_available') THEN
        ALTER TABLE public.profiles ADD COLUMN is_available BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_available IS 'Indicates if the model is available for work (true = available, false = busy)';
