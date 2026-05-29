# Polymarket Fantasy Sync Bot

Fetches events from Polymarket and writes them to Supabase REST API.

## Setup (1 minute)

### 1. Supabase — создать таблицы

1. Зайди в [Supabase Dashboard](https://supabase.com/dashboard/project/vunkecnlysfuqlxnbqjq)
2. **SQL Editor** → вставь содержимое `supabase/schema.sql` → **▶️ Run**
3. **Authentication → Providers → Google** → Enable → Save

### 2. Запустить синхронизацию

```bash
cp .env.example .env
# Отредактируй SUPABASE_SERVICE_KEY — вставь полный service_role ключ
# (Supabase Dashboard → Settings → API → service_role key)
cargo run --release
```

Первая синхронизация загрузит ~10,000 активных маркетов.

### 3. Поставить на cron (каждые 15 мин)

```
*/15 * * * * cd /home/dfr/polyodds && ./target/release/polymarket-fantasy-sync 2>&1 | logger
```

### 4. Фронтенд

```bash
cd frontend
cp .env.example .env
# Вставь Supabase URL и anon key
npx vercel --prod
```
