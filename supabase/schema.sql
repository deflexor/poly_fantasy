-- Schema for Polymarket Fantasy — simple username auth
-- Run once via Supabase SQL Editor or Management API

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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  balance BIGINT NOT NULL DEFAULT 100000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  odds_at_bet DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- No RLS — auth is handled by the app layer (username-based)
-- Tables are public read/write via anon key
