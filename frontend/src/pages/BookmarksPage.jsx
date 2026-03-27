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
    Easy: 'text-green-400',
    Medium: 'text-yellow-400',
    Hard: 'text-red-400',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-bright flex items-center gap-2">
          <Bookmark size={20} className="text-accent2" /> Bookmarks
        </h1>
        <p className="text-muted text-sm">Docs you've saved for later</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="text-center py-16 text-muted">
          <Bookmark size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-text">No bookmarks yet</p>
          <p className="text-sm mt-1">Save docs from the feed to find them here</p>
        </div>
      )}

      <div className="space-y-3">
        {docs.map(doc => (
          <div
            key={doc.id}
            className="card cursor-pointer hover:border-accent2/40 transition-colors"
            onClick={() => navigate(`/docs/${doc.id}`)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium ${DIFF_COLORS[doc.difficulty]}`}>{doc.difficulty}</span>
              <span className="text-xs text-muted">·</span>
              <span className="text-xs text-muted">{doc.category}</span>
              <span className="flex items-center gap-1 text-xs text-muted ml-auto">
                <Clock size={11} /> {doc.read_time_minutes}m
              </span>
            </div>
            <h3 className="font-semibold text-bright text-sm">{doc.title}</h3>
            {doc.summary && <p className="text-muted text-xs mt-1 line-clamp-1">{doc.summary}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
