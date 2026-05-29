import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../lib/api'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<api.Event | null>(null)
  const [userBets, setUserBets] = useState<api.Bet[]>([])
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO' | null>(null)
  const [amount, setAmount] = useState(10)
  const [placing, setPlacing] = useState(false)
  const user = api.getStoredUser()

  useEffect(() => {
    if (!id) return
    loadEvent()
  }, [id])

  async function loadEvent() {
    if (!id) return
    try {
      const data = await api.getEvent(id)
      setEvent(data)
    } catch (e) {
      console.error('Failed to load event:', e)
    }
    if (user) {
      try {
        const bets = await api.getUserBets(user.id)
        setUserBets(bets.filter(b => b.event_id === id))
      } catch {}
    }
  }

  async function placeBet() {
    if (!user || !id || !selectedSide || amount <= 0) return
    setPlacing(true)
    try {
      await api.placeBet(user.id, id, selectedSide, Math.floor(amount * 100))
      // Refresh
      const bets = await api.getUserBets(user.id)
      setUserBets(bets.filter(b => b.event_id === id))
      setSelectedSide(null)
      setAmount(10)
      // Refresh user balance
      const stored = api.getStoredUser()
      if (stored) {
        const loginResp = await api.login(stored.username)
        api.storeUser(loginResp.user.id, loginResp.user.username)
      }
    } catch (e: any) {
      alert(e.message)
    }
    setPlacing(false)
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  const isResolved = event.resolved || event.winner !== null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 hover:text-white text-sm mb-4 transition"
      >
        ← Back
      </button>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <span>{event.category || 'other'}</span>
          {event.subcategory && <><span>·</span><span>{event.subcategory}</span></>}
          {event.end_date && <><span>·</span><span>ends {new Date(event.end_date).toLocaleDateString()}</span></>}
          {event.quality && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              event.quality === 'strong' ? 'bg-orange-900/50 text-orange-400' :
              event.quality === 'decent' ? 'bg-green-900/50 text-green-400' :
              event.quality === 'speculative' ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-gray-800 text-gray-500'
            }`}>
              {event.quality}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-8">{event.question}</h1>

        {/* Price display */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400 mb-1">YES</p>
            <p className="text-4xl font-bold text-green-400">
              {(event.yes_price * 100).toFixed(1)}¢
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {event.yes_price > 0 ? `Pays ${(1 / event.yes_price).toFixed(1)}x` : '—'}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400 mb-1">NO</p>
            <p className="text-4xl font-bold text-red-400">
              {(event.no_price * 100).toFixed(1)}¢
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {event.no_price > 0 ? `Pays ${(1 / event.no_price).toFixed(1)}x` : '—'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-center text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400">Volume</p>
            <p className="text-white font-semibold">${event.volume.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400">Liquidity</p>
            <p className="text-white font-semibold">${event.liquidity.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400">Spread</p>
            <p className="text-white font-semibold">
              {event.spread !== null && event.spread !== undefined ? `${(event.spread * 100).toFixed(2)}%` : '—'}
            </p>
          </div>
        </div>

        {/* Betting */}
        {isResolved ? (
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 text-center">
            <p className="text-yellow-400 font-semibold">Event Resolved</p>
            {event.winner && <p className="text-yellow-300 text-sm mt-1">Winner: {event.winner}</p>}
          </div>
        ) : user ? (
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-white font-semibold mb-4">Place Your Bet</h3>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setSelectedSide('YES')}
                className={`flex-1 py-3 rounded-xl font-semibold text-lg transition ${
                  selectedSide === 'YES'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => setSelectedSide('NO')}
                className={`flex-1 py-3 rounded-xl font-semibold text-lg transition ${
                  selectedSide === 'NO'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                NO
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Amount ($ play money)</label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <button
                onClick={placeBet}
                disabled={!selectedSide || amount <= 0 || placing}
                className="mt-5 px-8 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-semibold transition"
              >
                {placing ? 'Placing…' : 'Bet'}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400">
              Create an account to place bets
            </p>
          </div>
        )}

        {/* User's bets */}
        {userBets.length > 0 && (
          <div className="border-t border-gray-800 pt-6 mt-6">
            <h3 className="text-white font-semibold mb-3">Your Bets</h3>
            <div className="space-y-2">
              {userBets.map(bet => (
                <div key={bet.id} className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className={`font-semibold ${bet.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                      {bet.side}
                    </span>
                    <span className="text-white ml-2">${(bet.amount_cents / 100).toFixed(2)}</span>
                    <span className="text-gray-500 ml-2">@ {(bet.odds_at_bet * 100).toFixed(1)}¢</span>
                  </div>
                  <span className={`text-sm px-2 py-0.5 rounded ${
                    bet.status === 'won' ? 'bg-green-900/50 text-green-400' :
                    bet.status === 'lost' ? 'bg-red-900/50 text-red-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {bet.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
