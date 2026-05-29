# Polymarket Fantasy

Play-money prediction market. Events synced from Polymarket, bets with virtual USDC.

## Architecture

```
Rust sync bot (local) → Supabase PostgreSQL ← React frontend (Vercel)
```

## Setup

### 1. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in SQL Editor
3. Enable Google/GitHub auth in Authentication → Providers
4. Copy Project URL and anon key

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm install
npm run dev
```

Deploy to Vercel: `npx vercel --prod`

### 3. Rust sync bot

```bash
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL
cargo run --release
```

Run periodically via crontab:
```
*/30 * * * * cd /path/polyodds && cargo run --release 2>&1 | logger
```
