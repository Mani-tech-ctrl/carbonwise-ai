-- ================================================================
-- FIX_ADMIN_DASHBOARD.SQL
-- Run this ONCE in Supabase → SQL Editor → New Query
-- Fixes: 404 errors, missing admin RLS policies, user count,
--        admin email, missing tables, and the is_admin() function.
-- ================================================================


-- ── STEP 1: Ensure role + is_disabled columns exist on profiles ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS security_question TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS security_answer_hash TEXT;


-- ── STEP 2: Create is_admin() helper (SECURITY DEFINER avoids RLS recursion) ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── STEP 3: Update handle_new_user trigger (email + security questions) ─────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role TEXT := 'user';
BEGIN
  -- Seed admin role for the designated admin email
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
      role = CASE
               WHEN EXCLUDED.email = 'localspace13@gmail.com' THEN 'admin'
               ELSE public.profiles.role
             END,
      security_question = COALESCE(EXCLUDED.security_question, public.profiles.security_question),
      security_answer_hash = COALESCE(EXCLUDED.security_answer_hash, public.profiles.security_answer_hash);

  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ── STEP 4: Backfill admin role for localspace13@gmail.com ──────────────────
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'localspace13@gmail.com';

-- Revoke admin from the old email if it still exists
UPDATE public.profiles
SET role = 'user'
WHERE email = 'connectwithkrmanish@gmail.com';


-- ── STEP 5: Create missing tables ───────────────────────────────────────────

-- Admin Activity Logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- AI Insight Requests
CREATE TABLE IF NOT EXISTS public.ai_insight_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
ALTER TABLE public.ai_insight_requests ENABLE ROW LEVEL SECURITY;


-- ── STEP 6: Admin RLS policies — PROFILES ───────────────────────────────────
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
CREATE POLICY "Admins can select all profiles"
  ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles FOR DELETE USING (public.is_admin());


-- ── STEP 7: Admin RLS policies — ASSESSMENTS ────────────────────────────────
DROP POLICY IF EXISTS "Admins can select all assessments" ON public.assessments;
CREATE POLICY "Admins can select all assessments"
  ON public.assessments FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all assessments" ON public.assessments;
CREATE POLICY "Admins can update all assessments"
  ON public.assessments FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all assessments" ON public.assessments;
CREATE POLICY "Admins can delete all assessments"
  ON public.assessments FOR DELETE USING (public.is_admin());


-- ── STEP 8: Admin RLS policies — DAILY FOOTPRINTS ───────────────────────────
DROP POLICY IF EXISTS "Admins can select all daily footprints" ON public.daily_footprints;
CREATE POLICY "Admins can select all daily footprints"
  ON public.daily_footprints FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all daily footprints" ON public.daily_footprints;
CREATE POLICY "Admins can update all daily footprints"
  ON public.daily_footprints FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all daily footprints" ON public.daily_footprints;
CREATE POLICY "Admins can delete all daily footprints"
  ON public.daily_footprints FOR DELETE USING (public.is_admin());


-- ── STEP 9: Admin RLS policies — REPORTS ────────────────────────────────────
DROP POLICY IF EXISTS "Admins can select all reports" ON public.reports;
CREATE POLICY "Admins can select all reports"
  ON public.reports FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all reports" ON public.reports;
CREATE POLICY "Admins can delete all reports"
  ON public.reports FOR DELETE USING (public.is_admin());


-- ── STEP 10: Admin RLS policies — CHALLENGES ────────────────────────────────
DROP POLICY IF EXISTS "Admins can select all challenges" ON public.challenges;
CREATE POLICY "Admins can select all challenges"
  ON public.challenges FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all challenges" ON public.challenges;
CREATE POLICY "Admins can update all challenges"
  ON public.challenges FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all challenges" ON public.challenges;
CREATE POLICY "Admins can delete all challenges"
  ON public.challenges FOR DELETE USING (public.is_admin());


-- ── STEP 11: Admin RLS policies — ADMIN ACTIVITY LOGS ───────────────────────
DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view all logs"
  ON public.admin_activity_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can insert logs"
  ON public.admin_activity_logs FOR INSERT WITH CHECK (public.is_admin());


-- ── STEP 12: RLS policies — AI INSIGHT REQUESTS ─────────────────────────────
DROP POLICY IF EXISTS "Users can view own AI requests" ON public.ai_insight_requests;
CREATE POLICY "Users can view own AI requests"
  ON public.ai_insight_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own AI requests" ON public.ai_insight_requests;
CREATE POLICY "Users can insert own AI requests"
  ON public.ai_insight_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all AI requests" ON public.ai_insight_requests;
CREATE POLICY "Admins can view all AI requests"
  ON public.ai_insight_requests FOR SELECT USING (public.is_admin());


-- ── STEP 13: Allow admins to insert into profiles INSERT policy ──────────────
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());


-- ── STEP 14: DIAGNOSTIC — verify setup ──────────────────────────────────────
-- Run this at the end to confirm everything is correct.

SELECT
  'profiles count'    AS check_name,
  COUNT(*)::TEXT      AS result
FROM public.profiles

UNION ALL

SELECT
  'admin users',
  COUNT(*)::TEXT
FROM public.profiles
WHERE role = 'admin'

UNION ALL

SELECT
  'assessments count',
  COUNT(*)::TEXT
FROM public.assessments

UNION ALL

SELECT
  'daily_footprints count',
  COUNT(*)::TEXT
FROM public.daily_footprints

UNION ALL

SELECT
  'reports count',
  COUNT(*)::TEXT
FROM public.reports

UNION ALL

SELECT
  'challenges count',
  COUNT(*)::TEXT
FROM public.challenges

UNION ALL

SELECT
  'admin_activity_logs table exists',
  'YES'
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'admin_activity_logs'

UNION ALL

SELECT
  'ai_insight_requests table exists',
  'YES'
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'ai_insight_requests';
