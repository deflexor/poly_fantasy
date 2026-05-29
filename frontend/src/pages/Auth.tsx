import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AuthSession } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'

export default function Auth() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) navigate('/')
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) navigate('/')
    })
    return () => listener?.subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  async function signInWithGitHub() {
    await supabase.auth.signInWithOAuth({ provider: 'github' })
  }

  async function signInMagicLink() {
    if (!email) return
    setSending(true)
    await supabase.auth.signInWithOtp({ email })
    alert('Magic link sent! Check your email.')
    setSending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Welcome</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to start predicting</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="w-full py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition"
          >
            Continue with Google
          </button>
          <button
            onClick={signInWithGitHub}
            className="w-full py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition"
          >
            Continue with GitHub
          </button>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <div className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
          />
          <button
            onClick={signInMagicLink}
            disabled={!email || sending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 transition"
          >
            {sending ? 'Sending…' : 'Magic Link'}
          </button>
        </div>
      </div>
    </div>
  )
}
