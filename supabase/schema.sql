-- Запусти это в Supabase Dashboard → SQL Editor → вставь → ▶️ Run
-- Создаёт таблицы для Polymarket Fantasy

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  slug TEXT, category TEXT, subcategory TEXT,
  yes_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  no_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  volume DOUBLE PRECISION NOT NULL DEFAULT 0,
  liquidity DOUBLE PRECISION NOT NULL DEFAULT 0,
  spread DOUBLE PRECISION,
  start_date TIMESTAMPTZ, end_date TIMESTAMPTZ,
  clob_token_ids JSONB,
  neg_risk BOOLEAN NOT NULL DEFAULT FALSE,
  outcomes JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  winner TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  balance BIGINT NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  odds_at_bet DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events public read" ON events FOR SELECT USING (true);
CREATE POLICY "Profiles own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Bets own" ON bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Bets insert own" ON bets FOR INSERT WITH CHECK (auth.uid() = user_id);
