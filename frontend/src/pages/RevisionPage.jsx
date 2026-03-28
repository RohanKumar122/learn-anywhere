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
      <div className="flex gap-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 flex-1" />)}
      </div>
      <div className="skeleton h-64 w-full" />
    </div>
  )

  const current = data?.due?.[currentIdx]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-8 grad-accent rounded-full" />
            <h1 className="text-3xl font-black text-bright tracking-tight">Revision Queue</h1>
          </div>
          <p className="text-muted text-sm font-medium ml-4">Master concepts through spaced repetition</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Due Today', value: data?.due_count || 0, icon: Clock, color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
            { label: 'In Queue', value: stats.in_revision, icon: RotateCcw, color: 'text-accent2', bg: 'bg-accent2/10 border-accent2/20' },
            { label: 'Total Docs', value: stats.total_docs, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`card !p-4 border-2 ${bg} flex flex-col items-center justify-center text-center group hover-lift`}>
              <Icon size={20} className={`${color} mb-2 transition-transform group-hover:scale-110`} />
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Due cards */}
      {data?.due?.length > 0 ? (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-black uppercase tracking-widest text-muted">
              Session Progress: <span className="text-accent2">{currentIdx + 1}</span> / {data.due.length}
            </span>
            <div className="w-32 h-1.5 bg-surface/50 rounded-full overflow-hidden border border-border/20">
              <div 
                className="h-full grad-accent transition-all duration-500" 
                style={{ width: `${((currentIdx + 1) / data.due.length) * 100}%` }}
              />
            </div>
          </div>

          {current && (
            <div className="card !p-0 overflow-hidden border-border/40 hover:border-accent2/30 shadow-2xl relative">
              {current.revision_meta?.overdue_days > 0 && (
                <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-2 flex items-center gap-2">
                  <AlertCircle size={14} className="text-orange-400" />
                  <span className="text-xs font-bold text-orange-400">
                    {current.revision_meta.overdue_days} day{current.revision_meta.overdue_days > 1 ? 's' : ''} overdue
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl font-extrabold text-bright leading-tight">{current.title}</h3>
                  <button onClick={() => handleRemove(current.id)} className="btn-icon !p-1.5 text-muted hover:text-red-400">
                    <X size={18} />
                  </button>
                </div>

                {current.summary && <p className="text-muted text-sm mb-6 leading-relaxed bg-surface/30 p-4 rounded-2xl border border-border/10 italic">"{current.summary}"</p>}

                <div className="flex gap-2 flex-wrap mb-6">
                  <span className="badge bg-surface border border-border text-muted">{current.category}</span>
                  <span className="badge bg-surface border border-border text-muted">{current.difficulty}</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted ml-auto bg-surface/30 px-2 py-0.5 rounded-lg">
                    <Clock size={12} className="text-accent2" /> {current.read_time_minutes}m
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  <button
                    onClick={() => navigate(`/docs/${current.id}`)}
                    className="btn-primary !py-3"
                  >
                    Open Full Document
                  </button>
                  <button
                    onClick={() => navigate(`/ai?topic=${encodeURIComponent(current.title)}`)}
                    className="btn-ghost !py-3 border-accent2/30 text-accent2"
                  >
                    Ask AI for Summary
                  </button>
                </div>

                <div className="border-t border-border/30 pt-6">
                  <p className="text-xs font-black uppercase tracking-widest text-muted mb-4 text-center">Rate your recall quality</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {QUALITY_LABELS.map(({ value, label, color }) => (
                      <button
                        key={value}
                        disabled={completing}
                        onClick={() => handleComplete(current.id, value)}
                        className={`border-2 rounded-2xl py-3 text-sm font-black uppercase tracking-widest transition-all duration-300 ${color} disabled:opacity-40 hover-lift shadow-sm`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-20 bg-accent2/5 border-dashed border-2 border-accent2/30">
          <div className="w-20 h-20 bg-accent2/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent2/10">
            <CheckCircle size={40} className="text-accent2" />
          </div>
          <h3 className="text-bright font-black text-2xl mb-2">Revision Complete!</h3>
          <p className="text-muted text-sm max-w-xs mx-auto mb-8">You've mastered all your due topics for today. Keep expanding your knowledge!</p>
          <button onClick={() => navigate('/feed')} className="btn-primary mx-auto">
             Get New Concepts
          </button>
        </div>
      )}

      {/* Forgotten concepts */}
      {data?.forgotten_count > 0 && (
        <div className="mt-12 stagger-load">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-4 flex items-center gap-2 px-2">
            <AlertCircle size={14} />
            Neglected concepts ({data.forgotten_count})
          </h2>
          <div className="space-y-3">
            {data.forgotten?.map((f, i) => (
              <div 
                key={f.doc_id} 
                className="card flex items-center justify-between !py-3 !px-5 group hover:border-orange-400/30 transition-all duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted group-hover:text-bright transition-colors">Doc #{f.doc_id.slice(-6)}</span>
                  <span className="text-[10px] text-orange-400/60 font-medium">Revisit requested {f.days_ago} days ago</span>
                </div>
                <button
                  onClick={() => navigate(`/docs/${f.doc_id}`)}
                  className="btn-ghost !px-4 !py-1.5 text-xs !border-orange-400/20 text-orange-400 hover:bg-orange-400/10"
                >
                  Recall Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
