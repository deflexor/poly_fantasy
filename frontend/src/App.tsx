import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Dashboard from './pages/Dashboard'
import EventDetail from './pages/EventDetail'
import Settings from './pages/Settings'
import Leaderboard from './pages/Leaderboard'
import * as api from './lib/api'
import { generateNickname } from './lib/names'
import { ToastProvider, useToast, registerGlobalToast } from './lib/toast'
import ToastList from './components/ToastList'
import { LocaleProvider, useLocale } from './lib/locale'

function AppInner() {
  const toastCtx = useToast()
  const { t, locale, setLocale, locales } = useLocale()
  const [user, setUser] = useState(api.getStoredUser())
  const [balance, setBalance] = useState<number | null>(null)
  const [pnl, setPnl] = useState<api.PnlSummary | null>(null)
  const location = useLocation()

  // Auto-create user on mount
  useEffect(() => {
    if (!user) {
      autoCreateUser()
    }
  }, [])

  // Refresh balance/PnL when user changes or navigating
  useEffect(() => {
    if (user) {
      refreshUserData()
    }
  }, [user?.id, location.pathname])

  // Refresh balance also when coming back from EventDetail (bet placed)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) refreshUserData()
    }, 30000) // every 30s
    return () => clearInterval(interval)
  }, [user?.id])

  async function autoCreateUser() {
    let nick = generateNickname()
    try {
      const result = await api.login(nick)
      api.storeUser(result.user.id, result.user.username)
      setUser(result.user)
    } catch (e) {
      console.error('Failed to create user:', e)
    }
  }

  async function refreshUserData() {
    if (!user) return
    try {
      const [b, p] = await Promise.all([
        api.getUserBalance(user.id),
        api.getUserPnl(user.id),
      ])
      setBalance(b)
      setPnl(p)
    } catch {
      // Silently fail
    }
  }

  function handleSignOut() {
    api.clearUser()
    setUser(null)
    setBalance(null)
    setPnl(null)
    autoCreateUser()
  }

  // Register global toast helper
  useEffect(() => {
    registerGlobalToast(toastCtx.addToast)
  }, [])

  function formatMoney(cents: number): string {
    const abs = Math.abs(cents)
    const sign = cents < 0 ? '-' : ''
    return `${sign}$${(abs / 100).toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <ToastList />
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white font-bold text-lg whitespace-nowrap">
              🏅 PolyFantasy
            </Link>
            <Link to="/" className="text-gray-400 hover:text-white text-sm transition">Events</Link>
            <Link to="/leaderboard" className="text-gray-400 hover:text-white text-sm transition">Leaderboard</Link>
          </div>
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="hidden sm:flex gap-0.5 mr-1 border border-gray-800 rounded-lg overflow-hidden text-xs">
              {locales.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  className={`px-2 py-1 transition ${
                    locale === l.code ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                {/* Balance */}
                {balance !== null && (
                  <span className="text-sm text-green-400 font-semibold whitespace-nowrap">
                    {formatMoney(balance)}
                  </span>
                )}
                {/* P&L quick */}
                {pnl && pnl.total_bets > 0 && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    pnl.profit_cents >= 0
                      ? 'bg-green-900/40 text-green-400'
                      : 'bg-red-900/40 text-red-400'
                  }`}>
                    {pnl.profit_cents >= 0 ? '+' : ''}{formatMoney(pnl.profit_cents)}
                  </span>
                )}
                <Link to="/settings" className="text-sm text-gray-400 hover:text-white transition">
                  {user.username}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-white transition"
                >
                  {t('nav.reset')}
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Creating account…</span>
            )}
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <LocaleProvider>
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </LocaleProvider>
    </ToastProvider>
  )
}
