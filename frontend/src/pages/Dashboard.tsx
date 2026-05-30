import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../lib/api'

function categoryColor(cat: string | null): string {
  switch (cat) {
    case 'sports': return 'text-green-400'
    case 'politics': return 'text-blue-400'
    case 'crypto': return 'text-orange-400'
    default: return 'text-gray-400'
  }
}

function qualityBadge(q: string | null): string {
  switch (q) {
    case 'strong': return '🔥 Strong'
    case 'decent': return '👍 Decent'
    default: return ''
  }
}

type SortKey = 'volume' | 'end_date' | 'yes_price' | 'spread'

export default function Dashboard() {
  const [events, setEvents] = useState<api.Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('volume')
  const [page, setPage] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const PAGE_SIZE = 25

  useEffect(() => {
    loadEvents()
    // Poll every 30s for live updates
    const interval = setInterval(() => {
      api.listEvents().then(data => {
        setEvents(data)
        setLastUpdate(new Date())
      }).catch(() => {})
    }, 30000)
    // Pause polling when tab is hidden
    const onVisibility = () => { if (document.hidden) clearInterval(interval) }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  async function loadEvents() {
    setLoading(true)
    try {
      const data = await api.listEvents()
      setEvents(data)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('Failed to load events:', e)
    }
    setLoading(false)
  }

  // Filter + sort
  const processed = useMemo(() => {
    let list = events.filter(e => {
      if (filter !== 'all' && e.category !== filter) return false
      if (search && !e.question.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    list.sort((a, b) => {
      switch (sortKey) {
        case 'volume': return b.volume - a.volume
        case 'end_date': {
          const da = a.end_date ? new Date(a.end_date).getTime() : Infinity
          const db = b.end_date ? new Date(b.end_date).getTime() : Infinity
          return da - db
        }
        case 'yes_price': return b.yes_price - a.yes_price
        case 'spread': return (b.spread ?? 0) - (a.spread ?? 0)
        default: return 0
      }
    })

    return list
  }, [events, filter, search, sortKey])

  const pageCount = Math.ceil(processed.length / PAGE_SIZE)
  const pageEvents = processed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const categories = [...new Set(events.map(e => e.category).filter((c): c is string => c !== null))]

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [filter, search, sortKey])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Polymarket Fantasy</h1>
          <p className="text-gray-400 mt-1">Predict events with play money. Compete with friends.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">{events.length} active events</p>
          {lastUpdate && (
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              Live · {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search events…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-white text-sm outline-none focus:border-purple-500 transition"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === cat ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-4 text-sm">
        <span className="text-gray-500 self-center mr-1">Sort:</span>
        {([['volume', 'Volume'], ['end_date', 'End Date'], ['yes_price', 'Price'], ['spread', 'Spread']] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={`px-3 py-1 rounded-md transition ${
              sortKey === key ? 'bg-purple-600/30 text-purple-300 border border-purple-700' : 'text-gray-500 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading events…</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 mb-6">
            {pageEvents.map(event => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-purple-700 transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm leading-snug mb-2 group-hover:text-purple-300 transition">
                      {event.question}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className={categoryColor(event.category)}>{event.category || 'other'}</span>
                      {event.subcategory && <span>· {event.subcategory}</span>}
                      {event.end_date && <span>· ends {new Date(event.end_date).toLocaleDateString()}</span>}
                      {event.spread !== null && event.spread !== undefined && (
                        <span>· spread {(event.spread * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-lg font-bold text-green-400">
                          {(event.yes_price * 100).toFixed(1)}¢
                        </p>
                        <p className="text-xs text-gray-500">YES</p>
                      </div>
                      <div className="text-gray-600 font-light">/</div>
                      <div>
                        <p className="text-lg font-bold text-red-400">
                          {(event.no_price * 100).toFixed(1)}¢
                        </p>
                        <p className="text-xs text-gray-500">NO</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Vol: ${event.volume.toLocaleString()}</p>
                    {event.quality && (
                      <p className="text-xs mt-0.5">{qualityBadge(event.quality)}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {pageEvents.length === 0 && (
              <p className="text-center text-gray-500 py-12">No events found.</p>
            )}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-30 transition"
              >
                ← Prev
              </button>
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                    page === i ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-30 transition"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
