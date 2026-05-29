import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import EventDetail from './pages/EventDetail'
import Auth from './pages/Auth'
import Leaderboard from './pages/Leaderboard'
import * as api from './lib/api'

function App() {
  const [user, setUser] = useState(api.getStoredUser())

  function handleSignOut() {
    api.clearUser()
    setUser(null)
  }

  return (
    <BrowserRouter>
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
                  <span className="text-sm text-gray-400">{user.username}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-white transition"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg font-medium transition"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
