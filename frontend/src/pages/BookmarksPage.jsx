import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { docsAPI } from '../api'
import { Bookmark, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BookmarksPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    docsAPI.bookmarks()
      .then(({ data }) => setDocs(data.docs))
      .catch(() => toast.error('Failed to load bookmarks'))
      .finally(() => setLoading(false))
  }, [])

  const DIFF_COLORS = {
    Easy: 'text-green-400 bg-green-400/10 border-green-400/20 shadow-green-400/5',
    Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-yellow-400/5',
    Hard: 'text-red-400 bg-red-400/10 border-red-400/20 shadow-red-400/5',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-8 grad-accent rounded-full" />
            <h1 className="text-3xl font-black text-bright tracking-tight">Bookmarks</h1>
          </div>
          <p className="text-muted text-sm font-medium ml-4">Docs you've saved for deep learning</p>
        </div>
        <div className="bg-card/40 border border-border/40 px-3 py-1.5 rounded-2xl flex items-center gap-2">
           <Bookmark size={16} className="text-accent2" />
           <span className="text-bright font-bold text-sm tracking-tight">{docs.length} saved</span>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
             <div key={i} className="card space-y-3 animate-pulse">
               <div className="skeleton h-5 w-24" />
               <div className="skeleton h-7 w-3/4" />
               <div className="skeleton h-4 w-full" />
             </div>
          ))}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="text-center py-24 bg-surface/20 rounded-3xl border border-dashed border-border/50">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Bookmark size={40} className="text-muted/40" />
          </div>
          <h3 className="font-bold text-bright text-xl mb-2">Your library is empty</h3>
          <p className="text-muted text-sm max-w-xs mx-auto">Explore your feed and bookmark docs to build your personalized learning library.</p>
          <button onClick={() => navigate('/feed')} className="mt-8 btn-primary mx-auto">
             Go to Feed
          </button>
        </div>
      )}

      <div className="space-y-4 stagger-load">
        {docs.map((doc, idx) => (
          <div
            key={doc.id}
            className="card hover-lift cursor-pointer group relative overflow-hidden flex flex-col border-border/40 hover:border-accent2/30"
            onClick={() => navigate(`/docs/${doc.id}`)}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent2/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <span className={`badge border shadow-sm ${DIFF_COLORS[doc.difficulty] || DIFF_COLORS.Medium}`}>
                {doc.difficulty}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">{doc.category}</span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted ml-auto bg-surface/30 px-2 py-0.5 rounded-lg border border-border/20">
                <Clock size={12} className="text-accent2" /> {doc.read_time_minutes}m
              </span>
            </div>
            
            <h3 className="font-bold text-bright text-lg mb-2 group-hover:text-accent2 transition-colors duration-300 relative z-10">
              {doc.title}
            </h3>
            
            {doc.summary && (
              <p className="text-muted text-sm line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity relative z-10">
                {doc.summary}
              </p>
            )}
            
            <div className="mt-4 pt-4 border-t border-border/20 flex justify-end relative z-10">
               <span className="text-[10px] font-black uppercase tracking-widest text-accent2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  Read Document →
               </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
