import { useLocale } from '../lib/locale'
import { useEffect, useState } from 'react'
import * as api from '../lib/api'

export default function Leaderboard() {
  const { t } = useLocale()
  const [entries, setEntries] = useState<api.LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getLeaderboard().then(data => {
      setEntries(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">{t('lb.title')}</h1>
      <p className="text-gray-400 mb-8">{t('lb.subtitle')}</p>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left text-sm text-gray-500">
                <th className="px-5 py-3 font-medium">{t('lb.rank')}</th>
                <th className="px-5 py-3 font-medium">{t('lb.player')}</th>
                <th className="px-5 py-3 font-medium text-right">{t('lb.profit')}</th>
                <th className="px-5 py-3 font-medium text-right">{t('lb.balance')}</th>
                <th className="px-5 py-3 font-medium text-right">{t('lb.bets')}</th>
                <th className="px-5 py-3 font-medium text-right">{t('lb.win_rate')}</th>
                <th className="px-5 py-3 font-medium text-right">{t('lb.roi')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.user_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-5 py-3 text-gray-500 text-sm">#{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold">
                        {(entry.display_name || entry.username || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-white font-medium text-sm">
                        {entry.display_name || entry.username || 'Anonymous'}
                      </span>
                    </div>
                  </td>
                  <td className={`px-5 py-3 text-right font-semibold text-sm ${
                    entry.profit_cents >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {entry.profit_cents >= 0 ? '+' : ''}${(entry.profit_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right text-white text-sm font-semibold">
                    ${(entry.balance / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400 text-sm">{entry.total_bets}</td>
                  <td className="px-5 py-3 text-right text-gray-400 text-sm">
                    {(entry.win_rate * 100).toFixed(0)}%
                  </td>
                  <td className={`px-5 py-3 text-right text-sm font-medium ${
                    entry.roi >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {entry.roi >= 0 ? '+' : ''}{entry.roi.toFixed(1)}%
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-12">
                    {t('lb.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
