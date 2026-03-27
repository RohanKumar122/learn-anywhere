import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { feedAPI, docsAPI } from '../api'
import { useAppStore } from '../store'
import { Clock, Bookmark, RotateCcw, CheckCircle, ChevronDown, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'DSA', 'System Design', 'OS', 'DBMS', 'CN', 'Other']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

const DIFF_COLORS = {
  Easy: 'text-green-400 bg-green-400/10 border-green-400/20',
  Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const CAT_COLORS = {
  DSA: 'text-purple-400 bg-purple-400/10',
  'System Design': 'text-blue-400 bg-blue-400/10',
  OS: 'text-orange-400 bg-orange-400/10',
  DBMS: 'text-cyan-400 bg-cyan-400/10',
  CN: 'text-pink-400 bg-pink-400/10',
  Other: 'text-gray-400 bg-gray-400/10',
}

function FeedCard({ doc, onBookmark, onAddRevision, onMarkRead }) {
  const navigate = useNavigate()
  const [bookmarked, setBookmarked] = useState(doc.is_bookmarked)
  const [inRevision, setInRevision] = useState(false)
  const [isRead, setIsRead] = useState(doc.is_read)

  const handleBookmark = async (e) => {
    e.stopPropagation()
    try {
      await onBookmark(doc.id)
      setBookmarked(!bookmarked)
      toast.success(bookmarked ? 'Removed from bookmarks' : 'Bookmarked!')
    } catch { toast.error('Failed') }
  }

  const handleRevision = async (e) => {
    e.stopPropagation()
    try {
      await onAddRevision(doc.id)
      setInRevision(true)
      toast.success('Added to revision queue')
    } catch { toast.error('Failed') }
  }

  const handleMarkRead = async (e) => {
    e.stopPropagation()
    try {
      await onMarkRead(doc.id)
      setIsRead(true)
      toast.success('Marked as read')
    } catch { toast.error('Failed') }
  }

  return (
    <div
      className="feed-card card cursor-pointer group relative overflow-hidden"
      onClick={() => navigate(`/docs/${doc.id}`)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge border ${DIFF_COLORS[doc.difficulty] || DIFF_COLORS.Medium}`}>
            {doc.difficulty}
          </span>
          <span className={`badge ${CAT_COLORS[doc.category] || CAT_COLORS.Other}`}>
            {doc.category}
          </span>
          {doc.is_ai_generated && (
            <span className="badge bg-accent/10 text-accent border border-accent/20">AI Generated</span>
          )}
          {isRead && (
            <span className="badge bg-green-400/10 text-green-400 border border-green-400/20">
              <CheckCircle size={10} /> Read
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted flex-shrink-0">
          <Clock size={12} />
          {doc.read_time_minutes}m
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-bright text-base mb-2 group-hover:text-accent2 transition-colors leading-snug">
        {doc.title}
      </h3>

      {/* Summary */}
      {doc.summary && (
        <p className="text-muted text-sm line-clamp-2 mb-3 leading-relaxed">{doc.summary}</p>
      )}

      {/* Tags */}
      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {doc.tags.slice(0, 4).map(tag => (
            <span key={tag} className="tag" onClick={e => e.stopPropagation()}>#{tag}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
            bookmarked ? 'text-accent2 bg-accent2/10' : 'text-muted hover:text-accent2 hover:bg-accent2/10'
          }`}
        >
          <Bookmark size={13} fill={bookmarked ? 'currentColor' : 'none'} />
          {bookmarked ? 'Saved' : 'Save'}
        </button>
        <button
          onClick={handleRevision}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
            inRevision ? 'text-yellow-400 bg-yellow-400/10' : 'text-muted hover:text-yellow-400 hover:bg-yellow-400/10'
          }`}
        >
          <RotateCcw size={13} />
          Revise Later
        </button>
        {!isRead && (
          <button
            onClick={handleMarkRead}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-green-400 hover:bg-green-400/10 transition-colors ml-auto"
          >
            <CheckCircle size={13} />
            Mark Read
          </button>
        )}
        <div className="ml-auto text-xs text-muted">
          {doc.owner_name}
        </div>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const [docs, setDocs] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const loaderRef = useRef(null)

  const loadFeed = useCallback(async (pg = 1, reset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const params = { page: pg, limit: 10 }
      if (category) params.category = category
      if (difficulty) params.difficulty = difficulty
      const { data } = await feedAPI.get(params)
      if (reset) {
        setDocs(data.feed)
      } else {
        setDocs(prev => [...prev, ...data.feed])
      }
      setHasMore(data.has_more)
      setPage(pg)
    } catch {
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [category, difficulty])

  useEffect(() => {
    setDocs([])
    setPage(1)
    setHasMore(true)
    loadFeed(1, true)
  }, [category, difficulty])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading) loadFeed(page + 1) },
      { threshold: 0.5 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, page, loadFeed])

  const handleBookmark = (id) => feedAPI.get(id) // placeholder — actual call in card
  const handleRevision = (id) => feedAPI.addToRevision(id)
  const handleMarkRead = (id) => feedAPI.markRead(id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-bright">Learning Feed</h1>
          <p className="text-muted text-sm">Scroll, read, and grow</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost flex items-center gap-2 ${showFilters ? 'border-accent2 text-accent2' : ''}`}>
          <Filter size={15} />
          Filter
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card mb-5 animate-fade-in">
          <div className="mb-3">
            <div className="text-xs font-medium text-muted mb-2">Category</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c === 'All' ? null : c)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    (c === 'All' && !category) || category === c
                      ? 'border-accent2 text-accent2 bg-accent2/10'
                      : 'border-border text-muted hover:border-border hover:text-text'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted mb-2">Difficulty</div>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d === 'All' ? null : d)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    (d === 'All' && !difficulty) || difficulty === d
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border text-muted hover:text-text'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {docs.map(doc => (
          <FeedCard
            key={doc.id}
            doc={doc}
            onBookmark={(id) => docsAPI.bookmark(id)}
            onAddRevision={handleRevision}
            onMarkRead={handleMarkRead}
          />
        ))}

        {/* Skeleton loaders */}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card space-y-3">
            <div className="flex gap-2">
              <div className="skeleton h-5 w-16" />
              <div className="skeleton h-5 w-24" />
            </div>
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        ))}

        {/* Loader trigger */}
        <div ref={loaderRef} className="h-4" />

        {!hasMore && docs.length > 0 && (
          <div className="text-center py-8 text-muted text-sm">
            <p>You've caught up! 🎉</p>
            <p className="text-xs mt-1">Create new docs or check your AI chat</p>
          </div>
        )}

        {!loading && docs.length === 0 && (
          <div className="text-center py-16 text-muted">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-medium text-text">No docs yet</p>
            <p className="text-sm mt-1">Create your first doc or change your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
