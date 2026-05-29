import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../lib/api'

export default function Auth() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    if (api.getStoredUser()) navigate('/')
  }, [])

  async function login() {
    if (!username.trim()) return
    setLogging(true)
    try {
      const { user } = await api.login(username.trim())
      api.storeUser(user.id, user.username)
      navigate('/')
    } catch (e: any) {
      alert(e.message)
    }
    setLogging(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Welcome</h1>
          <p className="text-gray-400 text-sm mt-2">Pick a username to start</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-white text-lg text-center outline-none focus:border-purple-500 transition"
            autoFocus
          />
          <button
            onClick={login}
            disabled={!username.trim() || logging}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold text-lg transition"
          >
            {logging ? 'Signing in…' : 'Start Playing'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          No password needed — play money only
        </p>
      </div>
    </div>
  )
}
