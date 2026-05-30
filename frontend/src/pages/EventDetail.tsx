import { useLocale } from '../lib/locale'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../lib/api'

export default function EventDetail() {
  const { t } = useLocale()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<api.Event | null>(null)
  const [userBets, setUserBets] = useState<api.Bet[]>([])
  const [yesAmount, setYesAmount] = useState(10)
  const [noAmount, setNoAmount] = useState(10)
  const [placingYes, setPlacingYes] = useState(false)
  const [placingNo, setPlacingNo] = useState(false)
  const [pool, setPool] = useState<{ yes: number; no: number } | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [pnl, setPnl] = useState<api.PnlSummary | null>(null)
  const [error, setError] = useState('')
  const user = api.getStoredUser()

  useEffect(() => {
    if (!id) return
    loadEvent()
    loadUserData()
  }, [id])

  async function loadUserData() {
    if (!user) return
    try {
      const [b, p] = await Promise.all([
        api.getUserBalance(user.id),
        api.getUserPnl(user.id),
      ])
      setBalance(b)
      setPnl(p)
    } catch {}
  }

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
    try {
      const p = await api.getBetPool(id)
      setPool(p)
    } catch {}
  }

  async function placeBet(side: 'YES' | 'NO') {
    if (!user || !id) return
    const amount = side === 'YES' ? yesAmount : noAmount
    if (amount <= 0) return
    setError('')
    const setPlacing = side === 'YES' ? setPlacingYes : setPlacingNo
    setPlacing(true)
    try {
      await api.placeBet(user.id, id, side, Math.floor(amount * 100))
      // Refresh everything
      await loadEvent()
      await loadUserData()
      // Reset amount
      if (side === 'YES') setYesAmount(10)
      else setNoAmount(10)
    } catch (e: any) {
      setError(e.message || 'Failed to place bet')
    }
    setPlacing(false)
  }

  function formatMoney(cents: number): string {
    const abs = Math.abs(cents)
    const sign = cents < 0 ? '-' : ''
    return `${sign}$${(abs / 100).toFixed(2)}`
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
        {t('event.detail.back')}
      </button>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 flex-wrap">
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

        {/* Price + Bet cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* YES card */}
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-400 mb-1">YES</p>
              <p className="text-3xl font-bold text-green-400">
                {(event.yes_price * 100).toFixed(1)}¢
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {event.yes_price > 0 ? `Pays ${(1 / event.yes_price).toFixed(1)}x` : '—'}
              </p>
            </div>
            {!isResolved && user && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    min={1}
                    value={yesAmount}
                    onChange={e => setYesAmount(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    placeholder={t('bet.amount')}
                  />
                </div>
                <button
                  onClick={() => placeBet('YES')}
                  disabled={yesAmount <= 0 || placingYes}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-semibold text-sm transition whitespace-nowrap"
                >
                  {placingYes ? '…' : `Bet YES ${formatMoney(yesAmount * 100)}`}
                </button>
              </div>
            )}
          </div>

          {/* NO card */}
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-400 mb-1">NO</p>
              <p className="text-3xl font-bold text-red-400">
                {(event.no_price * 100).toFixed(1)}¢
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {event.no_price > 0 ? `Pays ${(1 / event.no_price).toFixed(1)}x` : '—'}
              </p>
            </div>
            {!isResolved && user && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    min={1}
                    value={noAmount}
                    onChange={e => setNoAmount(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    placeholder={t('bet.amount')}
                  />
                </div>
                <button
                  onClick={() => placeBet('NO')}
                  disabled={noAmount <= 0 || placingNo}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-semibold text-sm transition whitespace-nowrap"
                >
                  {placingNo ? '…' : `Bet NO ${formatMoney(noAmount * 100)}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Balance + error */}
        {user && balance !== null && (
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-gray-400">
                {t('profile.balance')}: <span className="text-white font-semibold">{formatMoney(balance)}</span>
              </span>
              {pnl && pnl.total_bets > 0 && (
                <>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-400">
                    P&L: <span className={pnl.profit_cents >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {pnl.profit_cents >= 0 ? '+' : ''}{formatMoney(pnl.profit_cents)}
                    </span>
                  </span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-400">
                    {pnl.wins}W / {pnl.losses}L
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6 text-center text-sm">
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
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400">Pool</p>
            <p className="text-white font-semibold text-xs">
              {pool ? (
                <><span className="text-green-400">{pool.yes}</span> Y · <span className="text-red-400">{pool.no}</span> N</>
              ) : '—'}
            </p>
          </div>
        </div>

        {/* Resolved banner */}
        {isResolved && (
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 text-center mb-6">
            <p className="text-yellow-400 font-semibold">{t('event.detail.resolved')}</p>
            {event.winner && <p className="text-yellow-300 text-sm mt-1">{t('event.detail.winner')}: {event.winner}</p>}
          </div>
        )}

        {/* No user prompt */}
        {!user && !isResolved && (
          <div className="text-center py-6">
            <p className="text-gray-400">
              Create an account to place bets
            </p>
          </div>
        )}

        {/* User's bets */}
        {userBets.length > 0 && (
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-white font-semibold mb-3">{t('bet.your_bets')}</h3>
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
