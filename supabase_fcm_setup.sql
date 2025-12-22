-- Add fcm_token column to profiles table for Web Push Notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Index for faster token lookups (if needed for targeted sending)
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON public.profiles(fcm_token);
