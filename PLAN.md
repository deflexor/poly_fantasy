# Polymarket Fantasy — Development Plan

**Legend:** ✅ Done · ⏳ Planned

---

## Foundation

- [x] ✅ **Supabase schema**: `events`, `profiles`, `bets` tables with no RLS
- [x] ✅ **Data sync**: ~8000 active markets synced from Polymarket Gamma API
- [x] ✅ **Vercel deploy**: `poly-fantasy.vercel.app` live + SPA rewrites
- [x] ✅ **GitHub repo**: `github.com/deflexor/poly_fantasy` (auto-deploy to Vercel)

---

## Features

### Auth & Users

- [x] ✅ **Auto-nickname**: On first visit, generate random name
- [x] ✅ **Remove Sign In**: No auth page, auto-login
- [x] ✅ **Settings / Profile page**: `/settings` — change nickname, see stats (balance, bets, win rate)
- [x] ✅ **Email login**: Link email to profile, send/verify code (dev-mode shows code directly)

### Dashboard (Events List)

- [x] ✅ **Text search**: Filter by question text
- [x] ✅ **Category filter**: Sports, Politics, Crypto, etc.
- [x] ✅ **Sort options**: By volume, end date, price, spread
- [x] ✅ **Pagination**: 25 events per page with page nav
- [ ] ⏳ **Live updates**: Auto-refresh or polling for prices

### Event Detail & Betting

- [x] ✅ **Event page**: question, prices, stats, bet form
- [x] ✅ **Place bet**: YES/NO with stake amount
- [x] ✅ **Your bets**: show user bets per event
- [x] ✅ **Bet resolution**: sync bot checks resolved events → updates bets → awards winnings via RPC

### Leaderboard

- [x] ✅ **SQL view**: `leaderboard` view with balance, total_bets, wins, profit, win_rate, roi
- [x] ✅ **Frontend page**: table with rankings, profit, balance, bets, win rate, ROI

### i18n

- [ ] ⏳ **Multi-language**: Russian, English support
- [ ] ⏳ **Language toggle**

---

## Infrastructure

- [x] ✅ **Cron sync**: `*/15 * * * *` — Rust binary syncs events + resolves bets
- [x] ✅ **Rust sync bot**: Fetches Gamma API, upserts to Supabase REST
- [ ] ⏳ **Email sending**: Integrate email provider (Resend / SendGrid free tier)
- [ ] ⏳ **Custom domain**

---

## Testing

- [x] ✅ **Rust integration tests**: CRUD events/profiles/bets, resolve YES/NO wins
- [x] ✅ **Frontend E2E tests**: Playwright — auth, dashboard, search, sort, pagination, betting, leaderboard, settings
- [x] ✅ **CI pipeline**: GitHub Actions — Rust tests + frontend build + Playwright (needs Supabase secrets)

---

## Backlog

- [ ] ⏳ **Live updates / polling**
- [ ] ⏳ **i18n (multi-language)**
- [ ] ⏳ **Email sending (production)**
- [ ] ⏳ **Error toasts / snackbars**
- [ ] ⏳ **Mobile responsive**
- [ ] ⏳ **PWA / install prompt**
- [ ] ⏳ **Custom domain**
- [ ] ⏳ **Notifications (Telegram bot)**
- [ ] ⏳ **Betting pools (show counts)**
- [ ] ⏳ **Referral links**
- [ ] ⏳ **Prizes / weekly winner**
