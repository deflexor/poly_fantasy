/// Supabase REST API client (no SDK needed)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const headers = {
  'Content-Type': 'application/json',
  apikey: ANON_KEY,
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

// Types
export interface Event {
  id: string
  question: string
  slug: string | null
  category: string | null
  subcategory: string | null
  yes_price: number
  no_price: number
  volume: number
  liquidity: number
  spread: number | null
  end_date: string | null
  active: boolean
  resolved: boolean
  winner: string | null
  outcomes: string[]
  quality?: string
}

export interface Profile {
  id: string
  username: string
  display_name: string | null
  balance: number
  email?: string | null
}

export interface Bet {
  id: string
  user_id: string
  event_id: string
  side: string
  amount_cents: number
  odds_at_bet: number
  status: string
  created_at: string
}

// Events
export async function listEvents(category?: string): Promise<Event[]> {
  let query = 'events?select=*&active=eq.true&order=volume.desc&limit=100'
  if (category) query += `&category=eq.${category}`
  return get<Event[]>(query)
}

export async function getEvent(id: string): Promise<Event> {
  const data = await get<Event[]>(`events?id=eq.${id}&limit=1`)
  if (!data.length) throw new Error('Event not found')
  return data[0]
}

// Username auth (no passwords, no OAuth)
export async function login(username: string): Promise<{ user: { id: string; username: string } }> {
  // Check if username exists
  const existing = await get<Profile[]>(`profiles?username=eq.${encodeURIComponent(username)}&limit=1`)
  if (existing.length > 0) {
    return { user: { id: existing[0].id, username: existing[0].username } }
  }
  // Create new profile with starting balance
  const created = await post<Profile[]>('profiles', {
    username,
    display_name: username,
    balance: 1000000, // $10,000 play money
  })
  return { user: { id: created[0].id, username: created[0].username } }
}

export function storeUser(id: string, username: string) {
  localStorage.setItem('polyfantasy_user', JSON.stringify({ id, username }))
}

export function getStoredUser(): { id: string; username: string } | null {
  const raw = localStorage.getItem('polyfantasy_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearUser() {
  localStorage.removeItem('polyfantasy_user')
}


export function getProfile(userId: string): Promise<Profile> {
  return get<Profile[]>(`profiles?id=eq.${userId}&limit=1`).then(d => {
    if (!d.length) throw new Error('Profile not found')
    return d[0]
  })
}

export async function placeBet(
  userId: string,
  eventId: string,
  side: string,
  amount_cents: number,
): Promise<Bet> {
  const data = await post<Bet[]>('bets', {
    user_id: userId,
    event_id: eventId,
    side,
    amount_cents,
    odds_at_bet: 0, // will be calculated server-side
  })
  return data[0]
}

export async function getUserBets(userId: string): Promise<Bet[]> {
  return get<Bet[]>(`bets?user_id=eq.${userId}&order=created_at.desc`)
}

export type LeaderEntry = {
  display_name?: string
  roi: number
  user_id: string
  username: string
  profit_cents: number
  balance: number
  total_bets: number
  wins: number
  win_rate: number
}

export async function getLeaderboard(limit = 50): Promise<LeaderEntry[]> {
  return get<LeaderEntry[]>(`leaderboard?order=balance.desc&limit=${limit}`)
}

export async function updateProfile(id: string, data: { username?: string; email?: string }): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Update failed'))
}

/** Request a login code (dev mode: returns the code directly) */
export async function requestLoginCode(email: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  // Find profile with this email
  const existing = await get<Profile[]>(`profiles?email=eq.${encodeURIComponent(email)}&limit=1`)
  if (existing.length > 0) {
    // Update existing profile's login code
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${existing[0].id}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ login_code: code, login_code_expires: new Date(Date.now() + 10 * 60000).toISOString() }),
    })
    if (!res.ok) throw new Error('Failed to save code')
  }
  return code
}

export async function verifyLoginCode(email: string, code: string): Promise<{ ok: boolean; user: { id: string; username: string } }> {
  const profiles = await get<Profile[]>(`profiles?email=eq.${encodeURIComponent(email)}&select=id,username,login_code,login_code_expires&limit=1`)
  if (!profiles.length) return { ok: false, user: { id: '', username: '' } }
  const p = profiles[0] as any
  if (p.login_code !== code) return { ok: false, user: { id: '', username: '' } }
  // Check expiry
  if (p.login_code_expires && new Date(p.login_code_expires) < new Date()) return { ok: false, user: { id: '', username: '' } }
  return { ok: true, user: { id: p.id, username: p.username } }
}

/** Count bets per side for an event */
export async function getBetPool(eventId: string): Promise<{ yes: number; no: number }> {
  const bets = await get<Bet[]>(`bets?select=side&event_id=eq.${eventId}`)
  const yes = bets.filter(b => b.side === 'YES').length
  const no = bets.filter(b => b.side === 'NO').length
  return { yes, no }
}

/** Count bets per side for an event */
