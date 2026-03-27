import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchAPI } from '../api'
import { Search, Clock, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const DIFF_COLORS = {
  Easy: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  Hard: 'text-red-400 bg-red-400/10',
}

let debounceTimer

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ category: '', difficulty: '', bookmarked_only: false })
  const navigate = useNavigate()

  const doSearch = useCallback(async (q, f = filters) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const params = { q }
      if (f.category) params.category = f.category
      if (f.difficulty) params.difficulty = f.difficulty
      if (f.bookmarked_only) params.bookmarked_only = true
      const { data } = await searchAPI.search(params)
      setResults(data.results)
      setTotal(data.total)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }, [filters])

  const handleInput = (e) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => doSearch(q), 400)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-bright mb-1">Search</h1>
        <p className="text-muted text-sm">Find any concept, topic, or tag</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input pl-9"
          placeholder="Search concepts, topics, tags..."
          value={query}
          onChange={handleInput}
          autoFocus
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          className="input w-auto text-xs py-1.5"
          value={filters.category}
          onChange={e => { const f = { ...filters, category: e.target.value }; setFilters(f); doSearch(query, f) }}
        >
          <option value="">All Categories</option>
          {['DSA', 'System Design', 'OS', 'DBMS', 'CN', 'Other'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          className="input w-auto text-xs py-1.5"
          value={filters.difficulty}
          onChange={e => { const f = { ...filters, difficulty: e.target.value }; setFilters(f); doSearch(query, f) }}
        >
          <option value="">All Difficulties</option>
          {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer px-3 py-1.5 border border-border rounded-lg hover:border-accent2 hover:text-accent2 transition-colors">
          <input
            type="checkbox"
            checked={filters.bookmarked_only}
            onChange={e => { const f = { ...filters, bookmarked_only: e.target.checked }; setFilters(f); doSearch(query, f) }}
            className="accent-green-400"
          />
          Bookmarked only
        </label>
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && searched && (
        <div>
          {results.length > 0 ? (
            <>
              <p className="text-xs text-muted mb-3">{total} result{total !== 1 ? 's' : ''} for "{query}"</p>
              <div className="space-y-3">
                {results.map(doc => (
                  <div
                    key={doc.id}
                    className="card cursor-pointer hover:border-accent2/40 transition-colors"
                    onClick={() => navigate(`/docs/${doc.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${DIFF_COLORS[doc.difficulty]}`}>{doc.difficulty}</span>
                      <span className="badge bg-surface border border-border text-muted text-xs">{doc.category}</span>
                      {doc.is_ai_generated && <span className="badge bg-accent/10 text-accent text-xs">AI</span>}
                      <span className="flex items-center gap-1 text-xs text-muted ml-auto">
                        <Clock size={11} />{doc.read_time_minutes}m
                      </span>
                    </div>
                    <h3 className="font-semibold text-bright text-sm mb-1">{doc.title}</h3>
                    {doc.summary && <p className="text-muted text-xs line-clamp-2">{doc.summary}</p>}
                    {doc.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags.slice(0, 3).map(t => <span key={t} className="tag text-xs">#{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted">
              <p className="text-3xl mb-3">🔍</p>
              <p className="font-medium text-text">No results for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords or create a new doc</p>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="text-center py-12 text-muted">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Start typing to search your docs</p>
        </div>
      )}
    </div>
  )
}
