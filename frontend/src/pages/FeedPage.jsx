import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { feedAPI, docsAPI } from '../api'
import { useAppStore } from '../store'
import { Clock, Bookmark, RotateCcw, CheckCircle, ChevronDown, Filter, Trash2, Bot } from 'lucide-react'
import { useAuthStore } from '../store'
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

function FeedCard({ doc, onBookmark, onAddRevision, onMarkRead, onDelete }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [bookmarked, setBookmarked] = useState(doc.is_bookmarked)
  const [inRevision, setInRevision] = useState(false)
  const [isRead, setIsRead] = useState(doc.is_read)
  const isOwner = user?.id === doc.owner_id

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

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this card?')) return
    try {
      await onDelete(doc.id)
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    navigate(`/create?edit=${doc.id}`)
  }

  const handleAskAI = (e) => {
    e.stopPropagation()
    navigate(`/ai?topic=${encodeURIComponent(doc.title)}`)
  }

  return (
    <div
      className="feed-card card hover-lift cursor-pointer group relative overflow-hidden flex flex-col"
      onClick={() => navigate(`/docs/${doc.id}`)}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent2/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge border-2 shadow-sm ${DIFF_COLORS[doc.difficulty] || DIFF_COLORS.Medium}`}>
            {doc.difficulty}
          </span>
          <span className={`badge bg-surface/50 border border-border/30 backdrop-blur-sm ${CAT_COLORS[doc.category] || CAT_COLORS.Other}`}>
            {doc.category}
          </span>
          {doc.is_ai_generated && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
              <Bot size={10} /> AI
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted bg-surface/30 px-2 py-1 rounded-lg border border-border/20">
          <Clock size={12} className="text-accent2" />
          {doc.read_time_minutes}m
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-bright text-lg mb-2.5 group-hover:text-accent2 transition-colors duration-300 leading-tight relative z-10">
        {doc.title}
      </h3>

      {/* Summary */}
      {doc.summary && (
        <p className="text-muted text-sm line-clamp-2 mb-4 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity relative z-10">
          {doc.summary}
        </p>
      )}

      {/* Tags */}
      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5 relative z-10">
          {doc.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag text-[10px]" onClick={e => e.stopPropagation()}>#{tag}</span>
          ))}
          {doc.tags.length > 3 && (
            <span className="text-[10px] text-muted font-medium px-1">+{doc.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 pt-4 border-t border-border/40 mt-auto relative z-10">
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl transition-all duration-300 ${
            bookmarked ? 'text-accent2 bg-accent2/10 shadow-inner' : 'text-muted hover:text-accent2 hover:bg-accent2/5'
          }`}
        >
          <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
          <span className="hidden xs:inline">{bookmarked ? 'Saved' : 'Save'}</span>
        </button>
        <button
          onClick={handleRevision}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl transition-all duration-300 ${
            inRevision ? 'text-yellow-400 bg-yellow-400/10 shadow-inner' : 'text-muted hover:text-yellow-400 hover:bg-yellow-400/5'
          }`}
        >
          <RotateCcw size={14} />
          <span className="hidden xs:inline">Revise</span>
        </button>
        {!isRead && (
          <button
            onClick={handleMarkRead}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl text-muted hover:text-green-400 hover:bg-green-400/5 transition-all duration-300"
          >
            <CheckCircle size={14} />
            <span className="hidden xs:inline">Read</span>
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handleAskAI}
            className="p-2 rounded-xl text-muted hover:text-accent2 hover:bg-accent2/10 transition-all duration-300"
            title="Ask AI about this"
          >
            <Bot size={18} />
          </button>
          
          {isOwner && (
            <div className="flex items-center gap-1 border-l border-border/30 ml-1 pl-1">
              <button
                onClick={handleEdit}
                className="p-2 rounded-xl text-muted hover:text-accent hover:bg-accent/10 transition-all duration-300"
                title="Edit Card"
              >
                <div className="w-4 h-4 flex items-center justify-center text-xs font-bold">✎</div>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl text-muted hover:text-red-400 hover:bg-red-400/10 transition-all duration-300"
                title="Delete Card"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Done status indicator */}
      {isRead && (
        <div className="absolute -top-6 -right-6 w-12 h-12 bg-green-500/20 rotate-45 flex items-end justify-center pb-1">
          <CheckCircle size={12} className="text-green-400 -rotate-45" />
        </div>
      )}
    </div>
  )
}

export default function FeedPage() {
  const { 
    feedDocs: docs, feedPage: page, feedHasMore: hasMore, 
    feedCategory: category, feedDifficulty: difficulty,
    setFeed, appendFeed, setFeedFilter
  } = useAppStore()
  
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const loaderRef = useRef(null)
  const isInitialMount = useRef(true)

  const loadFeed = useCallback(async (pg = 1, isReset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const params = { page: pg, limit: 10 }
      if (category) params.category = category
      if (difficulty) params.difficulty = difficulty
      const { data } = await feedAPI.get(params)
      
      if (isReset) {
        setFeed(data.feed, data.has_more, pg)
      } else {
        appendFeed(data.feed, data.has_more, pg)
      }
    } catch {
      toast.error('Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [category, difficulty, loading, setFeed, appendFeed])

  const handleDeleteDoc = async (id) => {
    await docsAPI.delete(id)
    setFeed(docs.filter(d => d.id !== id), hasMore, page)
  }

  // Reload only if filters change OR if feed is empty
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (docs.length === 0) {
        loadFeed(1, true)
      }
      return
    }
    // If we're here, it means category or difficulty changed
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-8 grad-accent rounded-full" />
            <h1 className="text-3xl font-black text-bright tracking-tight">Learning Feed</h1>
          </div>
          <p className="text-muted text-sm font-medium ml-4">Personalized knowledge stream for your growth</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost rounded-2xl ${showFilters ? 'border-accent2 text-accent2 bg-accent2/10 shadow-lg shadow-accent2/5' : ''}`}>
          <Filter size={16} />
          <span className="font-bold">Filter</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card mb-8 animate-slide-up !p-5 border-accent2/20 bg-accent2/5">
          <div className="mb-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-accent2 mb-3">Category</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setFeedFilter(c === 'All' ? null : c, difficulty)}
                  className={`text-xs px-4 py-2 rounded-xl border-2 transition-all duration-300 font-bold ${
                    (c === 'All' && !category) || category === c
                      ? 'border-accent2 text-accent2 bg-accent2/10'
                      : 'border-border/40 text-muted hover:border-accent2/30 hover:text-bright bg-surface/30'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">Difficulty</div>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setFeedFilter(category, d === 'All' ? null : d)}
                  className={`text-xs px-4 py-2 rounded-xl border-2 transition-all duration-300 font-bold ${
                    (d === 'All' && !difficulty) || difficulty === d
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border/40 text-muted hover:border-accent/30 hover:text-bright bg-surface/30'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feed Content */}
      <div className="space-y-6 stagger-load">
        {docs.map((doc, idx) => (
          <div key={doc.id} style={{ animationDelay: `${idx * 50}ms` }}>
            <FeedCard
              doc={doc}
              onBookmark={(id) => docsAPI.bookmark(id)}
              onAddRevision={handleRevision}
              onMarkRead={handleMarkRead}
              onDelete={handleDeleteDoc}
            />
          </div>
        ))}

        {/* Skeleton loaders */}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card space-y-4 animate-pulse">
            <div className="flex gap-2">
              <div className="skeleton h-6 w-20" />
              <div className="skeleton h-6 w-28" />
            </div>
            <div className="skeleton h-7 w-3/4" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="skeleton h-8 w-24" />
              <div className="skeleton h-8 w-24" />
            </div>
          </div>
        ))}

        {/* Loader trigger */}
        <div ref={loaderRef} className="h-20 flex items-center justify-center">
          {loading && hasMore && (
             <div className="w-6 h-6 border-2 border-accent2/30 border-t-accent2 rounded-full animate-spin" />
          )}
        </div>

        {!hasMore && docs.length > 0 && (
          <div className="text-center py-12 border-t border-border/20">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-bold text-bright mb-1">You're all caught up!</h3>
            <p className="text-muted text-sm">Create more documents or explore the AI Assistant.</p>
            <button 
              onClick={() => navigate('/create')}
              className="mt-6 btn-primary mx-auto"
            >
              Create New Doc
            </button>
          </div>
        )}

        {!loading && docs.length === 0 && (
          <div className="text-center py-20 bg-surface/20 rounded-3xl border border-dashed border-border/50">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="text-muted" size={32} />
            </div>
            <h3 className="font-bold text-bright text-xl mb-2">No documents found</h3>
            <p className="text-muted text-sm max-w-xs mx-auto">Try adjusting your filters or creating a new document to start your feed.</p>
            <button 
              onClick={() => { setFeedFilter(null, null); setShowFilters(false) }}
              className="mt-6 btn-ghost mx-auto"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
