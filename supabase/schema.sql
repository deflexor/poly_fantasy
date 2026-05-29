-- Supabase schema for Polymarket Fantasy
-- Run this in Supabase SQL Editor

-- 1. Events synced from Polymarket
CREATE TABLE events (
  id              TEXT PRIMARY KEY,          -- Polymarket market id
  question        TEXT NOT NULL,
  slug            TEXT,
  category        TEXT,                      -- sports, politics, etc.
  subcategory     TEXT,                      -- soccer, basketball, etc.
  yes_price       DOUBLE PRECISION NOT NULL DEFAULT 0,
  no_price        DOUBLE PRECISION NOT NULL DEFAULT 0,
  volume          DOUBLE PRECISION NOT NULL DEFAULT 0,
  liquidity       DOUBLE PRECISION NOT NULL DEFAULT 0,
  spread          DOUBLE PRECISION,
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  clob_token_ids  JSONB,                    -- array of token IDs
  neg_risk        BOOLEAN NOT NULL DEFAULT FALSE,
  outcomes        JSONB,                    -- array of outcome names
  edge_score      DOUBLE PRECISION,
  quality         TEXT CHECK (quality IN ('strong','decent','speculative','trash')),
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  resolved        BOOLEAN NOT NULL DEFAULT FALSE,
  winner          TEXT,                      -- outcome that won, if resolved
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_active ON events(active);
CREATE INDEX idx_events_end_date ON events(end_date);

-- 2. Users (managed by Supabase Auth, this extends it)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE,
  display_name    TEXT,
  avatar_url      TEXT,
  balance         BIGINT NOT NULL DEFAULT 10000,  -- play money in cents ($100)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Bets
CREATE TABLE bets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id        TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  side            TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  amount_cents    BIGINT NOT NULL CHECK (amount_cents > 0),
  odds_at_bet     DOUBLE PRECISION NOT NULL,  -- price at time of bet
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_event_id ON bets(event_id);
CREATE INDEX idx_bets_status ON bets(status);

-- 4. Leaderboard (materialized, refreshed on resolution)
CREATE TABLE leaderboard (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_bets      BIGINT NOT NULL DEFAULT 0,
  won_bets        BIGINT NOT NULL DEFAULT 0,
  win_rate        DOUBLE PRECISION NOT NULL DEFAULT 0,
  profit_cents    BIGINT NOT NULL DEFAULT 0,  -- net profit/loss
  roi             DOUBLE PRECISION NOT NULL DEFAULT 0,  -- return on investment %
  balance         BIGINT NOT NULL DEFAULT 10000,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Events: everyone can read
CREATE POLICY "Events public read" ON events
  FOR SELECT USING (true);

-- Profile: own profile only
CREATE POLICY "Profiles own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Bets: own bets + admins
CREATE POLICY "Bets own" ON bets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Bets insert own" ON bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaderboard: everyone can read
CREATE POLICY "Leaderboard public read" ON leaderboard
  FOR SELECT USING (true);
