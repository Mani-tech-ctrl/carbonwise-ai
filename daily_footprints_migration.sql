-- Create daily footprints table
CREATE TABLE IF NOT EXISTS public.daily_footprints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  transport_emissions NUMERIC DEFAULT 0,
  electricity_emissions NUMERIC DEFAULT 0,
  food_emissions NUMERIC DEFAULT 0,
  waste_emissions NUMERIC DEFAULT 0,
  total_emissions NUMERIC DEFAULT 0,
  raw_inputs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, log_date)
);

-- Enable RLS
ALTER TABLE public.daily_footprints ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own daily footprints" ON public.daily_footprints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily footprints" ON public.daily_footprints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily footprints" ON public.daily_footprints
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily footprints" ON public.daily_footprints
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_daily_footprints_updated_at ON public.daily_footprints;
CREATE TRIGGER update_daily_footprints_updated_at
  BEFORE UPDATE ON public.daily_footprints
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
