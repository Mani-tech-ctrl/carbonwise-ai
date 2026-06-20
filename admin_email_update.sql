-- ============================================================
-- ADMIN EMAIL UPDATE MIGRATION
-- Run this in the Supabase SQL Editor to:
-- 1. Update the handle_new_user trigger so localspace13@gmail.com
--    is auto-promoted to admin on registration/re-registration.
-- 2. Backfill the existing localspace13@gmail.com profile to admin.
-- 3. Revoke admin role from the old email (if it exists).
-- ============================================================

-- Step 1: Update the trigger function (latest version with security questions)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role TEXT := 'user';
BEGIN
  -- Automatically promote the designated admin email
  IF new.email = 'localspace13@gmail.com' THEN
    user_role := 'admin';
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    onboarding_completed, 
    sustainability_score, 
    role, 
    is_disabled,
    security_question,
    security_answer_hash
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'CarbonWise User'),
    false,
    0,
    user_role,
    false,
    new.raw_user_meta_data->>'security_question',
    new.raw_user_meta_data->>'security_answer_hash'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      role = CASE WHEN EXCLUDED.email = 'localspace13@gmail.com' THEN 'admin' ELSE public.profiles.role END,
      security_question = COALESCE(EXCLUDED.security_question, public.profiles.security_question),
      security_answer_hash = COALESCE(EXCLUDED.security_answer_hash, public.profiles.security_answer_hash);
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant admin role to the new admin email (backfill)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'localspace13@gmail.com';

-- Step 3: Revoke admin from old email if it still exists in the database
UPDATE public.profiles
SET role = 'user'
WHERE email = 'connectwithkrmanish@gmail.com';

-- Verify the result
SELECT id, email, role, is_disabled
FROM public.profiles
WHERE email IN ('localspace13@gmail.com', 'connectwithkrmanish@gmail.com')
ORDER BY email;
