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

- [x] ✅ **Auto-nickname**: random name on first visit
- [x] ✅ **Remove Sign In**: auto-login
- [x] ✅ **Settings / Profile**: change nickname, stats (balance, bets, win rate)
- [x] ✅ **Email login**: email field + code verification

### Dashboard

- [x] ✅ **Text search**
- [x] ✅ **Category filter**: Sports, Politics, Crypto
- [x] ✅ **Sort**: Volume, End Date, Price, Spread
- [x] ✅ **Pagination**: 25 per page
- [x] ✅ **Live updates**: polling every 30s + "Live" badge

### Event Detail & Betting

- [x] ✅ **Event page**: prices, stats, bet form
- [x] ✅ **Place bet**: YES/NO with stake
- [x] ✅ **Your bets**: per event
- [x] ✅ **Bet resolution**: sync bot resolves + awards winnings
- [x] ✅ **Bet pool**: shows YES/NO bet counts

### Leaderboard

- [x] ✅ **SQL view**: balance, bets, profit, win rate, ROI
- [x] ✅ **Frontend table**: ranked players

### i18n

- [x] ✅ **English + Russian**: 80+ translation keys
- [x] ✅ **Language switcher**: nav bar toggle

### Testing

- [x] ✅ **Rust integration tests**: CRUD + resolve logic
- [x] ✅ **Frontend E2E tests**: auth, dashboard, search, sort, pagination, betting, leaderboard, live, i18n, navigation
- [x] ✅ **CI pipeline**: GitHub Actions workflow

### Infrastructure

- [x] ✅ **Cron sync**: `*/15 * * * *` — events + resolve bets
- [x] ✅ **Rust sync bot**: Gamma API → Supabase REST
- [x] ✅ **Error toasts**: ToastProvider + global helper
- [x] ✅ **Mobile responsive**: scrollable tables, responsive grid
- [x] ✅ **PWA**: manifest + icons + install prompt

---

## Backlog (future)

- [ ] ⏳ **Email sending**: Integrate Resend/SendGrid for actual email dispatch
- [ ] ⏳ **Telegram notifications**: event resolution alerts
- [ ] ⏳ **Referral links**: share with friends
- [ ] ⏳ **Prizes**: weekly winner
- [ ] ⏳ **Custom domain**
- [ ] ⏳ **Dark/light mode toggle**
