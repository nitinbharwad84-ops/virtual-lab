-- ============================================
-- Virtual Lab – Supabase Schema
-- ============================================

-- 1. Profiles table (auto-created on user signup)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Experiments table (seeded with 5 experiments)
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read experiments"
  ON public.experiments FOR SELECT
  TO authenticated, anon
  USING (true);

-- 3. Experiment Results table
CREATE TABLE IF NOT EXISTS public.experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  input_params JSONB NOT NULL DEFAULT '{}',
  output_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON public.experiment_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results"
  ON public.experiment_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own results"
  ON public.experiment_results FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Trigger: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Seed experiments
INSERT INTO public.experiments (slug, title, description, category, icon) VALUES
  ('rc-circuit', 'RC Circuit', 'Explore the charging and discharging of a capacitor through a resistor. Understand the concept of the time constant τ = RC.', 'Physics', '🔌'),

  ('projectile-motion', 'Projectile Motion', 'Launch a projectile at different angles and velocities to study parabolic trajectories. Observe how gravity affects the range and maximum height.', 'Physics', '🎯'),
  ('acid-base-titration', 'Acid-Base Titration', 'Perform a virtual titration by adding base to an acid solution. Watch how pH changes and identify the equivalence point on a real-time graph.', 'Chemistry', '🧪'),
  ('pendulum', 'Simple Pendulum', 'Investigate the factors affecting a pendulum''s time period. Adjust length and observe the oscillation in a realistic animation.', 'Physics', '🕐'),
  ('lens-optics', 'Convex Lens Optics', 'Study image formation by a convex lens. Move the object and observe how the image position, size, and nature change according to the lens formula.', 'Physics', '🔬')
ON CONFLICT (slug) DO NOTHING;

