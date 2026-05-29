import { useEffect, useState } from 'react'
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
    case 'speculative': return '⚠️ Spec'
    default: return ''
  }
}

export default function Dashboard() {
  const [events, setEvents] = useState<api.Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    try {
      const data = await api.listEvents()
      setEvents(data)
    } catch (e) {
      console.error('Failed to load events:', e)
    }
    setLoading(false)
  }

  const filtered = filter === 'all'
    ? events
    : events.filter(e => e.category === filter)

  const categories = [...new Set(events.map(e => e.category).filter((c): c is string => c !== null))]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Polymarket Fantasy</h1>
          <p className="text-gray-400 mt-1">Predict events with play money. Compete with friends.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">{events.length} active events</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
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

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading events…</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(event => (
            <a
              key={event.id}
              href={`/events/${event.id}`}
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
            </a>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-12">No events in this category.</p>
          )}
        </div>
      )}
    </div>
  )
}
