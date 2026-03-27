import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { revisionAPI } from '../api'
import { RotateCcw, Clock, CheckCircle, X, AlertCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const QUALITY_LABELS = [
  { value: 0, label: 'Forgot', color: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' },
  { value: 3, label: 'Hard', color: 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20' },
  { value: 4, label: 'Good', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' },
  { value: 5, label: 'Easy', color: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' },
]

export default function RevisionPage() {
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [completing, setCompleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadRevision()
  }, [])

  const loadRevision = async () => {
    setLoading(true)
    try {
      const [revRes, statsRes] = await Promise.all([revisionAPI.due(), revisionAPI.stats()])
      setData(revRes.data)
      setStats(statsRes.data)
    } catch { toast.error('Failed to load revision') }
    finally { setLoading(false) }
  }

  const handleComplete = async (docId, quality) => {
    setCompleting(true)
    try {
      const { data: res } = await revisionAPI.complete(docId, quality)
      toast.success(`Next review in ${res.next_review_days} day${res.next_review_days > 1 ? 's' : ''}`)
      if (currentIdx < (data?.due?.length || 0) - 1) {
        setCurrentIdx(currentIdx + 1)
      } else {
        await loadRevision()
        setCurrentIdx(0)
      }
    } catch { toast.error('Failed') }
    finally { setCompleting(false) }
  }

  const handleRemove = async (docId) => {
    try {
      await revisionAPI.remove(docId)
      await loadRevision()
      toast.success('Removed from revision')
    } catch { toast.error('Failed') }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full rounded-xl" />)}
    </div>
  )

  const current = data?.due?.[currentIdx]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-bright">Revision Queue</h1>
          <p className="text-muted text-sm">Spaced repetition — retain what you learn</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Due Today', value: data?.due_count || 0, icon: Clock, color: 'text-accent' },
            { label: 'In Queue', value: stats.in_revision, icon: RotateCcw, color: 'text-accent2' },
            { label: 'Total Docs', value: stats.total_docs, icon: TrendingUp, color: 'text-blue-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card text-center">
              <Icon size={18} className={`${color} mx-auto mb-1`} />
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Due cards */}
      {data?.due?.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text">
              Due for revision ({currentIdx + 1}/{data.due.length})
            </span>
          </div>

          {current && (
            <div className="card mb-4 animate-fade-in">
              {current.revision_meta?.overdue_days > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-orange-400 mb-3">
                  <AlertCircle size={12} />
                  {current.revision_meta.overdue_days} day{current.revision_meta.overdue_days > 1 ? 's' : ''} overdue
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-bright">{current.title}</h3>
                <button onClick={() => handleRemove(current.id)} className="btn-icon flex-shrink-0">
                  <X size={14} />
                </button>
              </div>

              {current.summary && <p className="text-muted text-sm mb-4">{current.summary}</p>}

              <div className="flex gap-2 flex-wrap mb-4">
                <span className="badge bg-surface border border-border text-muted">{current.category}</span>
                <span className="badge bg-surface border border-border text-muted">{current.difficulty}</span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock size={11} /> {current.read_time_minutes}m
                </span>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => navigate(`/docs/${current.id}`)}
                  className="btn-ghost text-sm flex-1"
                >
                  Read Doc
                </button>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted mb-2 text-center">How well did you remember this?</p>
                <div className="grid grid-cols-4 gap-2">
                  {QUALITY_LABELS.map(({ value, label, color }) => (
                    <button
                      key={value}
                      disabled={completing}
                      onClick={() => handleComplete(current.id, value)}
                      className={`border rounded-lg py-2 text-xs font-medium transition-colors ${color} disabled:opacity-40`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <CheckCircle size={40} className="text-accent2 mx-auto mb-3" />
          <p className="text-bright font-semibold">All caught up!</p>
          <p className="text-muted text-sm mt-1">No revisions due right now. Keep adding docs to your queue.</p>
        </div>
      )}

      {/* Forgotten concepts */}
      {data?.forgotten_count > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-orange-400" />
            Concepts you haven't revisited in 5+ days ({data.forgotten_count})
          </h2>
          <div className="space-y-2">
            {data.forgotten?.map(f => (
              <div key={f.doc_id} className="card flex items-center justify-between py-3">
                <span className="text-sm text-muted">Doc #{f.doc_id.slice(-6)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-orange-400">{f.days_ago} days ago</span>
                  <button
                    onClick={() => navigate(`/docs/${f.doc_id}`)}
                    className="text-xs text-accent2 hover:underline"
                  >
                    Read
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
