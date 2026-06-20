-- Allow authenticated users to create their own profile row.
-- This supports existing auth users if the auth trigger/backfill did not create a profile.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
