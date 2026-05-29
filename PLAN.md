# Polymarket Fantasy — Development Plan

## Legend
- ✅ Done
- 🔄 In Progress
- ⏳ Planned

---

## Foundation

- [x] ✅ **Supabase schema**: `events`, `profiles`, `bets` tables with no RLS
- [x] ✅ **Data sync**: ~8000 active markets synced from Polymarket Gamma API
- [x] ✅ **Vercel deploy**: `poly-fantasy.vercel.app` live
- [x] ✅ **GitHub repo**: `github.com/deflexor/poly_fantasy` (auto-deploy to Vercel)

---

## Features

### Auth & Users

- [x] ✅ **Auto-nickname**: On first visit, generate random name (e.g. `gray-brave-parrot-in-boots`)
- [x] ✅ **Remove Sign In**: No auth page, no sign-in button. Username shown in navbar
- [x] ✅ **Settings page**: `/settings` — change nickname
- [ ] ⏳ **Email login**: Persistent account via email + confirmation code
- [ ] ⏳ **Profile page**: Show stats (balance, bets placed, win rate)

### Dashboard

- [x] ✅ **Text search**: Filter events by question text
- [x] ✅ **Category filter**: Sports, Politics, Crypto, etc.
- [ ] ⏳ **Sort options**: By volume, liquidity, spread, end date
- [ ] ⏳ **Pagination**: For when events exceed viewport
- [ ] ⏳ **Live updates**: Auto-refresh or polling for prices

### Event Detail & Betting

- [x] ✅ **Event page**: Shows question, prices, stats, bet form
- [x] ✅ **Place bet**: Choose YES/NO, stake play money
- [x] ✅ **Your bets**: Show user's bets for this event
- [ ] ⏳ **Bet resolution**: Auto-resolve when Polymarket settles (🚧 code written, needs binary rebuild + cron)

### Leaderboard

- [ ] ⏳ **Top players**: Ranked by balance
- [ ] ⏳ **Stats per player**: Win rate, ROI, total volume bet
- [ ] ⏳ **Prizes**: Optional — weekly winner shoutout

### i18n

- [ ] ⏳ **Multi-language**: Russian, English, others (currently Russian only for MVP)
- [ ] ⏳ **Language toggle**: Switch displayed language

---

## Infrastructure

- [ ] 🔄 **Cron sync**: `*/15 * * * *` — Rust binary syncs events + resolves bets
- [x] ✅ **Rust sync bot**: Fetches Gamma API, upserts to Supabase REST, resolves bets
- [ ] ⏳ **Email sending**: For email login codes
- [ ] ⏳ **Custom domain**: Move from `poly-fantasy.vercel.app` to own domain

---

## Polish

- [ ] ⏳ **Loading states**: Better UX during data fetch
- [ ] ⏳ **Error handling**: Toast/snackbar for errors
- [ ] ⏳ **Mobile responsive**: Optimise for phones
- [ ] ⏳ **PWA / install prompt**: Optional mobile app feel

---

## Backlog (nice to have)

- [ ] ⏳ **Betting pools**: Show how many users bet each side
- [ ] ⏳ **Notifications**: Telegram bot for event resolution
- [ ] ⏳ **Referral links**: Share with friends, track who joined
- [ ] ⏳ **Dark/light mode toggle**
- [ ] ⏳ **Archive**: Show resolved events separately
- [ ] ⏳ **Comparison**: Polymarket real price vs fantasy price
