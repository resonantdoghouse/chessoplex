-- ── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_games INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  total_playtime_ms BIGINT DEFAULT 0,
  preferred_difficulty TEXT DEFAULT 'Medium',
  preferred_theme TEXT DEFAULT 'Classic'
);

-- ── Games ────────────────────────────────────────────────────────────────────
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pgn TEXT NOT NULL,
  result TEXT,
  result_reason TEXT,
  difficulty TEXT,
  player_color TEXT,
  duration_ms BIGINT,
  move_count INT,
  opening_name TEXT,
  annotations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Study sessions ───────────────────────────────────────────────────────────
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  opening_id TEXT NOT NULL,
  opening_name TEXT,
  completed BOOLEAN DEFAULT FALSE,
  hints_used INT DEFAULT 0,
  moves_correct INT DEFAULT 0,
  total_moves INT DEFAULT 0,
  duration_ms BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Play sessions (analytics) ────────────────────────────────────────────────
CREATE TABLE play_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_ms BIGINT,
  device_type TEXT,
  platform TEXT
);

-- ── Global stats (single row) ────────────────────────────────────────────────
CREATE TABLE global_stats (
  id INT PRIMARY KEY DEFAULT 1,
  total_players INT DEFAULT 0,
  total_games INT DEFAULT 0,
  total_playtime_ms BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO global_stats DEFAULT VALUES;

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their profile"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own their games"
  ON games FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their study sessions"
  ON study_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role manages play sessions"
  ON play_sessions FOR ALL USING (true);

CREATE POLICY "Anyone can read global stats"
  ON global_stats FOR SELECT USING (true);

CREATE POLICY "Service role updates global stats"
  ON global_stats FOR UPDATE USING (true);

-- ── Auto-create profile on signup ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Profile stat increment ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_profile_stats(
  p_user_id UUID,
  p_win_col TEXT,
  p_duration_ms BIGINT
) RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET
    total_games = total_games + 1,
    total_playtime_ms = total_playtime_ms + p_duration_ms,
    wins   = wins   + CASE WHEN p_win_col = 'wins'   THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN p_win_col = 'losses' THEN 1 ELSE 0 END,
    draws  = draws  + CASE WHEN p_win_col = 'draws'  THEN 1 ELSE 0 END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Global games counter ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_global_games(p_duration_ms BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE global_stats SET
    total_games = total_games + 1,
    total_playtime_ms = total_playtime_ms + p_duration_ms,
    updated_at = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Global unique player counter ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_global_players_if_new(
  p_user_id UUID,
  p_anonymous_id TEXT
) RETURNS VOID AS $$
DECLARE
  is_new BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM play_sessions
      WHERE user_id = p_user_id
      AND started_at < NOW() - INTERVAL '1 minute'
    ) INTO is_new;
  ELSIF p_anonymous_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM play_sessions
      WHERE anonymous_id = p_anonymous_id
      AND started_at < NOW() - INTERVAL '1 minute'
    ) INTO is_new;
  END IF;

  IF is_new THEN
    UPDATE global_stats SET
      total_players = total_players + 1,
      updated_at = NOW()
    WHERE id = 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
