-- SQL Migration: Admin Panel and Role-Based Access Control Setup

-- 1. ADD ROLE AND DISABLED STATUS TO PROFILES TABLE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false;

-- 2. CREATE SECURITY DEFINER HELPER TO CHECK IF CURRENT USER IS ADMIN
-- This helper avoids RLS recursion on the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECREATE NEW USER REGISTRATION TRIGGER FUNCTION TO ASSIGN ROLES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role TEXT := 'user';
BEGIN
  -- Automatically promote specific admin email
  IF new.email = 'localspace13@gmail.com' THEN
    user_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, onboarding_completed, sustainability_score, role, is_disabled)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'CarbonWise User'),
    false,
    0,
    user_role,
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      role = CASE WHEN EXCLUDED.email = 'localspace13@gmail.com' THEN 'admin' ELSE public.profiles.role END;
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. BACKFILL CURRENT SYSTEM STATE FOR ADMIN ACCOUNT
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'localspace13@gmail.com';

-- 5. CREATE ADMIN LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. CREATE AI INSIGHT REQUESTS LOGS TABLE
CREATE TABLE IF NOT EXISTS public.ai_insight_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. ENABLE RLS FOR NEW TABLES
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insight_requests ENABLE ROW LEVEL SECURITY;

-- 8. CONFIGURE RLS POLICIES FOR ADMIN ACCESS ACROSS ALL TABLES

-- Profiles Admin Policies
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
CREATE POLICY "Admins can select all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles" ON public.profiles FOR DELETE USING (public.is_admin());

-- Assessments Admin Policies
DROP POLICY IF EXISTS "Admins can select all assessments" ON public.assessments;
CREATE POLICY "Admins can select all assessments" ON public.assessments FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all assessments" ON public.assessments;
CREATE POLICY "Admins can update all assessments" ON public.assessments FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can insert all assessments" ON public.assessments;
CREATE POLICY "Admins can insert all assessments" ON public.assessments FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete all assessments" ON public.assessments;
CREATE POLICY "Admins can delete all assessments" ON public.assessments FOR DELETE USING (public.is_admin());

-- Challenges Admin Policies
DROP POLICY IF EXISTS "Admins can select all challenges" ON public.challenges;
CREATE POLICY "Admins can select all challenges" ON public.challenges FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all challenges" ON public.challenges;
CREATE POLICY "Admins can update all challenges" ON public.challenges FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can insert all challenges" ON public.challenges;
CREATE POLICY "Admins can insert all challenges" ON public.challenges FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete all challenges" ON public.challenges;
CREATE POLICY "Admins can delete all challenges" ON public.challenges FOR DELETE USING (public.is_admin());

-- Reports Admin Policies
DROP POLICY IF EXISTS "Admins can select all reports" ON public.reports;
CREATE POLICY "Admins can select all reports" ON public.reports FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can insert all reports" ON public.reports;
CREATE POLICY "Admins can insert all reports" ON public.reports FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete all reports" ON public.reports;
CREATE POLICY "Admins can delete all reports" ON public.reports FOR DELETE USING (public.is_admin());

-- Daily Footprints Admin Policies
DROP POLICY IF EXISTS "Admins can select all daily footprints" ON public.daily_footprints;
CREATE POLICY "Admins can select all daily footprints" ON public.daily_footprints FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can insert all daily footprints" ON public.daily_footprints;
CREATE POLICY "Admins can insert all daily footprints" ON public.daily_footprints FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all daily footprints" ON public.daily_footprints;
CREATE POLICY "Admins can update all daily footprints" ON public.daily_footprints FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete all daily footprints" ON public.daily_footprints;
CREATE POLICY "Admins can delete all daily footprints" ON public.daily_footprints FOR DELETE USING (public.is_admin());

-- Admin Activity Logs Policies
DROP POLICY IF EXISTS "Admins can view all logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view all logs" ON public.admin_activity_logs FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can insert logs" ON public.admin_activity_logs FOR INSERT WITH CHECK (public.is_admin());

-- AI Insight Requests Policies
DROP POLICY IF EXISTS "Users can view own AI requests" ON public.ai_insight_requests;
CREATE POLICY "Users can view own AI requests" ON public.ai_insight_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own AI requests" ON public.ai_insight_requests;
CREATE POLICY "Users can insert own AI requests" ON public.ai_insight_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all AI requests" ON public.ai_insight_requests;
CREATE POLICY "Admins can view all AI requests" ON public.ai_insight_requests FOR SELECT USING (public.is_admin());
