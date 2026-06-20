-- SQL Migration: Add Security Questions for Password Recovery

-- 1. ADD SECURITY QUESTION COLUMNS TO PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS security_question TEXT,
ADD COLUMN IF NOT EXISTS security_answer_hash TEXT;

-- 2. UPDATE handle_new_user TRIGGER FUNCTION TO INCLUDE SECURITY QUESTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role TEXT := 'user';
BEGIN
  -- Automatically promote specific admin email
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
