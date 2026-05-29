import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Create a .env file:\n' +
    'VITE_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

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
  outcomes: string[] | null
  quality: string | null
  edge_score: number | null
}

export interface Bet {
  id: string
  user_id: string
  event_id: string
  side: 'YES' | 'NO'
  amount_cents: number
  odds_at_bet: number
  status: 'pending' | 'won' | 'lost' | 'cancelled'
  created_at: string
  resolved_at: string | null
}

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  balance: number
}

export interface LeaderboardEntry {
  user_id: string
  total_bets: number
  won_bets: number
  win_rate: number
  profit_cents: number
  roi: number
  balance: number
  // joined from profiles
  username?: string
  display_name?: string
  avatar_url?: string
}
