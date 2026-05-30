import { useLocale } from '../lib/locale'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../lib/api'

export default function Settings() {
  const { t } = useLocale()
  const stored = api.getStoredUser()
  const navigate = useNavigate()
  const [newName, setNewName] = useState(stored ? stored.username : '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [profile, setProfile] = useState<api.Profile | null>(null)
  const [bets, setBets] = useState<api.Bet[]>([])
  const [email, setEmail] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')

  if (!stored) return null
  const user = stored

  useEffect(() => {
    api.getProfile(user.id).then(p => {
      setProfile(p)
      setEmail(p.email || '')
    }).catch(() => {})
    api.getUserBets(user.id).then(setBets).catch(() => {})
  }, [user.id])

  const wins = bets.filter(b => b.status === 'won').length
  const losses = bets.filter(b => b.status === 'lost').length
  const pending = bets.filter(b => b.status === 'pending').length

  async function handleSave() {
    if (!newName.trim() || newName === user.username) return
    setSaving(true)
    setMsg('')
    try {
      await api.updateProfile(user.id, { username: newName.trim() })
      api.storeUser(user.id, newName.trim())
      setMsg('Nickname updated!')
      navigate('/')
    } catch (e: any) {
      if (e.message?.includes('duplicate')) {
        setMsg('This nickname is already taken.')
      } else {
        setMsg('Error: ' + (e.message || 'unknown'))
      }
    }
    setSaving(false)
  }

  async function handleSendCode() {
    if (!email.trim()) return
    setCodeSent(false)
    setGeneratedCode('')
    try {
      // Store email in profile
      await api.updateProfile(user.id, { email: email.trim() })
      // Send code (dev mode: show it)
      const code = await api.requestLoginCode(email.trim())
      setGeneratedCode(code)
      setCodeSent(true)
    } catch (e: any) {
      setMsg('Error: ' + (e.message || 'unknown'))
    }
  }

  async function handleVerifyCode() {
    if (!loginCode.trim()) return
    try {
      const result = await api.verifyLoginCode(email.trim(), loginCode.trim())
      if (result.ok) {
        api.storeUser(result.user.id, result.user.username)
        setMsg('Logged in!')
        navigate('/')
      } else {
        setMsg('Invalid code')
      }
    } catch (e: any) {
      setMsg('Error: ' + (e.message || 'unknown'))
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-white mb-1">{t('profile.title')}</h1>
      <p className="text-gray-400 text-sm mb-6">Your stats and settings</p>

      {/* Stats card */}
      {profile && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <h2 className="text-white font-semibold mb-3">{t('profile.stats')}</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-400">${(profile.balance / 100).toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">{t('profile.balance')}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-2xl font-bold text-white">{bets.length}</p>
              <p className="text-xs text-gray-400 mt-1">{t('profile.total_bets')}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-2xl font-bold text-purple-400">
                {bets.length > 0 ? ((wins / bets.length) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{t('profile.win_rate')}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-3 text-sm">
            <span className="text-green-400">{wins} {t('profile.won')}</span>
            <span className="text-red-400">{losses} {t('profile.lost')}</span>
            <span className="text-gray-500">{pending} {t('profile.pending')}</span>
          </div>
        </div>
      )}

      {/* Nickname */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Nickname</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg outline-none focus:border-purple-500 transition"
          />
          <button
            onClick={handleSave}
            disabled={!newName.trim() || newName === user.username || saving}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition"
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>
        {msg && (
          <p className={`text-sm mt-2 ${msg.includes('taken') ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>
        )}
      </div>

      {/* Email login */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-3">Email Login</h2>
        <p className="text-xs text-gray-500 mb-3">Link your email for persistent access</p>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition mb-3"
        />
        {!codeSent ? (
          <button
            onClick={handleSendCode}
            disabled={!email.trim()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition"
          >
            Send Code
          </button>
        ) : (
          <div>
            {generatedCode && (
              <div className="bg-gray-800 rounded-xl p-3 mb-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Your verification code (dev mode):</p>
                <p className="text-2xl font-bold text-green-400 tracking-widest">{generatedCode}</p>
              </div>
            )}
            <input
              type="text"
              placeholder="Enter code"
              value={loginCode}
              onChange={e => setLoginCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition mb-3"
            />
            <button
              onClick={handleVerifyCode}
              disabled={!loginCode.trim()}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition"
            >
              Verify
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
