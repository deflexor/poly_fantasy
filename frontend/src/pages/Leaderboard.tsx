import { useEffect, useState } from 'react'
import { supabase, type LeaderboardEntry } from '../lib/supabase'

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('leaderboard')
      .select('*, profiles:user_id(username, display_name, avatar_url)')
      .order('profit_cents', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          const mapped: LeaderboardEntry[] = data.map((row: any) => ({
            user_id: row.user_id,
            total_bets: row.total_bets,
            won_bets: row.won_bets,
            win_rate: row.win_rate,
            profit_cents: row.profit_cents,
            roi: row.roi,
            balance: row.balance,
            username: row.profiles?.username,
            display_name: row.profiles?.display_name,
            avatar_url: row.profiles?.avatar_url,
          }))
          setEntries(mapped)
        }
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
      <p className="text-gray-400 mb-8">Top predictors by profit</p>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left text-sm text-gray-500">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Player</th>
                <th className="px-5 py-3 font-medium text-right">Profit</th>
                <th className="px-5 py-3 font-medium text-right">Balance</th>
                <th className="px-5 py-3 font-medium text-right">Bets</th>
                <th className="px-5 py-3 font-medium text-right">Win Rate</th>
                <th className="px-5 py-3 font-medium text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.user_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-5 py-3 text-gray-500 text-sm">#{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold">
                          {(entry.display_name || entry.username || '?')[0].toUpperCase()}
                        </div>
                      )}
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
                    {entry.roi >= 0 ? '+' : ''}{(entry.roi * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
