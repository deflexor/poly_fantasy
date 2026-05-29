import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../lib/api'

export default function Settings() {
  const stored = api.getStoredUser()
  const navigate = useNavigate()
  const [newName, setNewName] = useState(stored ? stored.username : '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  if (!stored) return null
  const user = stored

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
      if (e.message?.includes('duplicate') || e.message?.includes('already')) {
        setMsg('This nickname is already taken.')
      } else {
        setMsg('Error: ' + (e.message || 'unknown'))
      }
    }
    setSaving(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
      <p className="text-gray-400 text-sm mb-8">Change your nickname</p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <label className="text-sm text-gray-400 mb-2 block">Nickname</label>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg outline-none focus:border-purple-500 transition mb-4"
          autoFocus
        />

        {msg && (
          <p className={`text-sm mb-4 ${msg.includes('taken') ? 'text-red-400' : 'text-green-400'}`}>
            {msg}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={!newName.trim() || newName === user.username || saving}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
