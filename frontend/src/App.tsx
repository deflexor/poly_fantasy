import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import EventDetail from './pages/EventDetail'
import Auth from './pages/Auth'
import Leaderboard from './pages/Leaderboard'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener?.subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        {/* Nav */}
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-white font-bold text-lg">
                Polymarket Fantasy
              </Link>
              <Link to="/" className="text-gray-400 hover:text-white text-sm transition">Events</Link>
              <Link to="/leaderboard" className="text-gray-400 hover:text-white text-sm transition">Leaderboard</Link>
            </div>
            <div>
              {session ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    {session.user.email?.split('@')[0] || 'Player'}
                  </span>
                  <button
                    onClick={() => supabase.auth.signOut()}
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
