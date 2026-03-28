import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { feedAPI, docsAPI } from '../api'
import { useAppStore } from '../store'
import { 
  Clock, Bookmark, RotateCcw, CheckCircle, ChevronDown, 
  Filter, Trash2, Bot, Plus, X, FileText, Upload, Globe, Search
} from 'lucide-react'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

// We reuse the FeedCard from FeedPage or redefine it here if needed.
// For consistency, let's redefine a simpler version or import if possible.
// Since it's a new file, I'll provide a slightly more "discovery" oriented version.

const DIFF_COLORS = {
  Easy: 'text-green-400 border-green-400 group-hover:bg-green-400/10',
  Medium: 'text-yellow-400 border-yellow-400 group-hover:bg-yellow-400/10',
  Hard: 'text-red-400 border-red-400 group-hover:bg-red-400/10',
}

function DiscoveryCard({ doc, onBookmark, onAddRevision, onAskAI }) {
  const navigate = useNavigate()
  const [bookmarked, setBookmarked] = useState(doc.is_bookmarked)
  const [inRevision, setInRevision] = useState(false)

  const handleBookmark = async (e) => {
    e.stopPropagation()
    try {
      await onBookmark(doc.id)
      setBookmarked(!bookmarked)
      toast.success(bookmarked ? 'Removed' : 'Saved to Library')
    } catch { toast.error('Failed') }
  }

  const handleRevision = async (e) => {
    e.stopPropagation()
    try {
      await onAddRevision(doc.id)
      setInRevision(true)
      toast.success('Added to your revision stream')
    } catch { toast.error('Failed') }
  }

  const { user } = useAuthStore()
  const isOwner = user?.id === doc.owner_id

  return (
    <div 
      className="feed-card card !p-6 hover-lift group relative overflow-hidden flex flex-col min-h-[250px] bg-card/10 backdrop-blur-xl border-border/20 transition-all duration-500"
      onClick={() => navigate(`/docs/${doc.id}`)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent2/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-start justify-between gap-3 mb-5 relative z-10 transition-transform group-hover:-translate-y-0.5">
        <div className="flex gap-2">
          <span className={`badge border-2 shadow-sm font-black transition-all group-hover:shadow-accent2/20 py-1 px-3 ${DIFF_COLORS[doc.difficulty] || DIFF_COLORS.Medium}`}>
            {doc.difficulty}
          </span>
          {doc.is_ai_generated && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-accent/20 text-accent border border-accent/40 shadow-sm animate-pulse">
              <Bot size={11} /> Neural
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black text-muted/80 bg-surface/50 px-3 py-1.5 rounded-xl border border-border/10 shadow-sm">
          <Clock size={13} className="text-accent2" />
          {doc.read_time_minutes}m
        </div>
      </div>

      <div className="relative z-10 flex-1">
        <h3 className="font-black text-bright text-xl mb-3 group-hover:text-accent font-display leading-tight tracking-tight">
          {doc.title}
        </h3>
        <p className="text-muted/90 text-[13.5px] line-clamp-2 mb-6 leading-relaxed opacity-90 group-hover:opacity-100">
          {doc.summary || 'Tap to explore this neural architecture...'}
        </p>
        
        <div className="flex items-center gap-3 mt-auto pb-6">
           <div className="w-7 h-7 rounded-full grad-accent flex items-center justify-center text-[10px] font-black text-white uppercase border border-white/10 shadow-lg">
              {doc.owner_name?.[0] || 'U'}
           </div>
           <span className="text-[10px] font-black text-muted/70 uppercase tracking-widest leading-none">
             Archived by <span className="text-accent2/90">{doc.owner_name || 'Anonymous'}</span>
           </span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-5 border-t border-border/10 mt-auto relative z-10">
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl transition-all duration-300 transform active:scale-95 ${
            bookmarked ? 'text-accent2 bg-accent2/10 shadow-lg shadow-accent2/5 border border-accent2/30' : 'text-muted hover:text-accent2 hover:bg-accent2/5'
          }`}
        >
          <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
          <span>{bookmarked ? 'Saved' : 'Save'}</span>
        </button>
        
        <button
          onClick={handleRevision}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl transition-all duration-300 transform active:scale-95 ${
            inRevision ? 'text-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/5 border border-yellow-400/30' : 'text-muted hover:text-yellow-400 hover:bg-yellow-400/5'
          }`}
        >
          <RotateCcw size={15} />
          <span>Revise</span>
        </button>

        {isOwner && (
           <button
             onClick={(e) => { e.stopPropagation(); toast.error('Use the Library to delete your own docs.') }}
             className="p-2.5 rounded-2xl text-muted/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group/del"
           >
             <Trash2 size={16} className="group-hover/del:scale-110" />
           </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onAskAI(doc) }}
          className="ml-auto p-2.5 rounded-2xl text-muted/60 hover:text-accent hover:bg-accent/10 transition-all duration-300 active:scale-90"
        >
          <Bot size={20} />
        </button>
      </div>
    </div>
  )
}

export default function DiscoveryPage() {
  const navigate = useNavigate()
  const { 
    discoveryDocs: docs, discoveryPage: page, discoveryHasMore: hasMore, 
    discoveryCategory: category, discoveryDifficulty: difficulty,
    setDiscovery, appendDiscovery, setDiscoveryFilter
  } = useAppStore()
  
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef(null)
  const isInitialMount = useRef(true)

  const loadDocs = useCallback(async (pg = 1, isReset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const params = {
        page: pg,
        category: category,
        difficulty: difficulty
      }
      const { data } = await feedAPI.getPublic(params)
      if (isReset) {
        setDiscovery(data.feed, data.has_more, pg)
      } else {
        appendDiscovery(data.feed, data.has_more, pg)
      }
    } catch {
      toast.error('Failed to load discovery feed')
    } finally {
      setLoading(false)
    }
  }, [category, difficulty, loading, setDiscovery, appendDiscovery])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (docs.length === 0) loadDocs(1, true)
      return
    }
    loadDocs(1, true)
  }, [category, difficulty])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadDocs(page + 1)
      }
    }, { threshold: 0.5 })

    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, page, loadDocs])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      {/* Search & Inspo Header */}
      <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
        <div className="w-16 h-16 rounded-[2rem] grad-accent flex items-center justify-center mb-6 shadow-2xl animate-float">
           <Globe size={32} className="text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-bright mb-4 tracking-tighter sm:tracking-normal">
          Knowledge <span className="text-gradient-accent">Cosmos</span>
        </h1>
        <p className="text-muted max-w-md text-sm sm:text-base font-medium opacity-80">
          Explore concepts built and verified by the community. Discover your next deep-dive target.
        </p>
      </div>

      {/* Filters Hub */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        {['All', 'DSA', 'System Design', 'OS', 'DBMS', 'CN'].map(c => (
           <button 
             key={c}
             onClick={() => setDiscoveryFilter(c === 'All' ? null : c, difficulty)}
             className={`px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border-2 ${
               (c === 'All' && !category) || category === c
                 ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                 : 'bg-surface/40 text-muted border-border/40 hover:border-accent/30 hover:text-bright'
             }`}
           >
             {c}
           </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {docs.map(doc => (
          <DiscoveryCard 
            key={doc.id}
            doc={doc}
            onBookmark={(id) => docsAPI.bookmark(id)}
            onAddRevision={(id) => feedAPI.addToRevision(id)}
            onAskAI={(d) => navigate(`/ai?topic=${encodeURIComponent(d.title)}&doc_id=${d.id}`)}
          />
        ))}

        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-64 w-full rounded-3xl" />
        ))}
      </div>

      {/* Empty State */}
      {!loading && docs.length === 0 && (
        <div className="text-center py-24">
           <div className="text-4xl mb-4 opacity-30">🌌</div>
           <h3 className="font-bold text-muted">A quiet corner of the cosmos...</h3>
           <p className="text-sm text-muted/60 mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Load More Trigger */}
      <div ref={loaderRef} className="h-20" />
    </div>
  )
}
