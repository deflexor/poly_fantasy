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
  email TEXT,
  login_code TEXT,
  login_code_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaderboard view (aggregates bets per user)
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.display_name,
  p.balance,
  COALESCE(b.total_bets, 0) AS total_bets,
  COALESCE(b.wins, 0) AS wins,
  CASE WHEN COALESCE(b.total_bets, 0) > 0
    THEN ROUND(COALESCE(b.wins, 0)::numeric / b.total_bets, 4) ELSE 0
  END AS win_rate,
  COALESCE(b.profit, 0) AS profit_cents,
  CASE WHEN p.balance > 0
    THEN ROUND((COALESCE(b.profit, 0)::numeric / (p.balance - COALESCE(b.profit, 0) + 1)) * 100, 2) ELSE 0
  END AS roi
FROM profiles p
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS total_bets,
    COUNT(*) FILTER (WHERE status = 'won') AS wins,
    SUM(CASE WHEN status = 'won' THEN amount_cents * 2 ELSE 0 END) - SUM(amount_cents) AS profit
  FROM bets
  GROUP BY user_id
) b ON p.id = b.user_id
ORDER BY balance DESC;

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

-- Place bet: atomically deduct balance + insert bet
CREATE OR REPLACE FUNCTION place_bet(
  p_user_id UUID,
  p_event_id TEXT,
  p_side TEXT,
  p_amount_cents BIGINT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_balance BIGINT;
  v_odds DOUBLE PRECISION;
  v_bet JSONB;
BEGIN
  -- Lock user row and check balance
  SELECT balance INTO v_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_balance < p_amount_cents THEN
    RAISE EXCEPTION 'Insufficient balance. You have $%', (v_balance / 100)::numeric(10,2);
  END IF;

  -- Get current odds for the side
  IF p_side = 'YES' THEN
    SELECT yes_price INTO v_odds FROM events WHERE id = p_event_id;
  ELSE
    SELECT no_price INTO v_odds FROM events WHERE id = p_event_id;
  END IF;

  -- Deduct balance
  UPDATE profiles SET balance = balance - p_amount_cents WHERE id = p_user_id;

  -- Insert bet with current odds
  INSERT INTO bets (user_id, event_id, side, amount_cents, odds_at_bet)
  VALUES (p_user_id, p_event_id, p_side, p_amount_cents, v_odds)
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'event_id', event_id,
    'side', side,
    'amount_cents', amount_cents,
    'odds_at_bet', odds_at_bet,
    'status', status,
    'created_at', created_at
  ) INTO v_bet;

  RETURN v_bet;
END;
$$;
