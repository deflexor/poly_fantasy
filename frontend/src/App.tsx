import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import EventDetail from './pages/EventDetail'
import Settings from './pages/Settings'
import Leaderboard from './pages/Leaderboard'
import * as api from './lib/api'
import { generateNickname } from './lib/names'

function AppInner() {
  const [user, setUser] = useState(api.getStoredUser())

  useEffect(() => {
    if (!user) {
      autoCreateUser()
    }
  }, [])

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

  function handleSignOut() {
    api.clearUser()
    setUser(null)
    // Will auto-create new user via useEffect
    autoCreateUser()
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-white font-bold text-lg">
              🏅 PolyFantasy
            </Link>
            <Link to="/" className="text-gray-400 hover:text-white text-sm transition">Events</Link>
            <Link to="/leaderboard" className="text-gray-400 hover:text-white text-sm transition">Leaderboard</Link>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/settings" className="text-sm text-gray-400 hover:text-white transition">
                  {user.username}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-white transition"
                >
                  Reset
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
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
