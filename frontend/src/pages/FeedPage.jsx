import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { feedAPI, docsAPI, aiAPI } from '../api'
import { useAppStore } from '../store'
import { Clock, Bookmark, RotateCcw, CheckCircle, ChevronDown, Filter, Trash2, Bot, Plus, X, FileText, Upload, Zap, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

// Use local worker bundled by Vite instead of CDN for stability
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

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

const TEMPLATE = `# Your Title Here

## Introduction
Brief intro to the concept.

## Key Takeaway
One-liner summary.
`

function ConfirmModal({ title, message, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="card w-full max-w-sm animate-slide-up border-red-500/20 bg-red-500/5">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <Trash2 size={32} className="text-red-500" />
        </div>
        <h3 className="text-xl font-black text-bright text-center mb-2">{title}</h3>
        <p className="text-muted text-center text-sm mb-10 leading-relaxed font-medium">{message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} disabled={loading} className="btn-ghost !py-3">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-primary !bg-red-500 !shadow-red-500/20 !py-3">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DocEditorModal({ editId, onClose, onSave, initialContent, initialTitle }) {
  const [form, setForm] = useState({
    title: initialTitle || '',
    content: initialContent || TEMPLATE,
    summary: '',
    category: 'DSA',
    difficulty: 'Medium',
    tags: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (editId) loadDoc()
  }, [editId])

  const loadDoc = async () => {
    setFetching(true)
    try {
      const { data } = await docsAPI.get(editId)
      setForm({ ...data, tags: data.tags?.join(', ') || '' })
    } catch { toast.error('Failed to load') }
    finally { setFetching(false) }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    setLoading(true)
    try {
      const docData = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      await onSave(editId, docData)
      toast.success(editId ? 'Doc updated' : 'Doc created')
      onClose()
    } catch { toast.error('Failed to save') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up relative">
        <button onClick={onClose} className="absolute top-4 right-4 btn-icon z-10"><X size={18} /></button>
        
        <div className="mb-6">
          <h2 className="text-2xl font-black text-bright tracking-tight">{editId ? 'Edit Knowledge' : 'Architect New Doc'}</h2>
          <p className="text-muted text-xs font-medium uppercase tracking-widest mt-1">Directly from your feed context</p>
        </div>

        {fetching ? (
          <div className="py-20 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-accent2/20 border-t-accent2 rounded-full animate-spin mb-4" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">Title</label>
                <input className="input !bg-surface/30" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">Category</label>
                <select className="input !bg-surface/30" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                   {['DSA', 'System Design', 'OS', 'DBMS', 'CN', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">Difficulty</label>
                <select className="input !bg-surface/30" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                   {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">Tags (comma-separated)</label>
                <input className="input !bg-surface/30" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">Feed Summary</label>
                <input className="input !bg-surface/30" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Content (Markdown)</label>
                <button 
                  onClick={async () => {
                    const tid = toast.loading('Neural Architecting...')
                    try {
                      const { data } = await aiAPI.format({ text: form.content })
                      setForm({ ...form, content: data.markdown })
                      toast.success('Formatted!', { id: tid })
                    } catch { toast.error('AI formatting failed', { id: tid })}
                  }}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
                >
                  <Bot size={12} /> Format with AI
                </button>
              </div>
              <textarea 
                className="input !bg-surface/30 min-h-[200px] font-mono text-sm leading-relaxed" 
                value={form.content} 
                onChange={e => setForm({ ...form, content: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border/20">
              <button onClick={onClose} className="btn-ghost !px-6">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="btn-primary !px-8">
                {loading && <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                Save Knowledge
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FeedCard({ doc, onBookmark, onAddRevision, onMarkRead, onDelete, onEdit, onSave, editId }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [bookmarked, setBookmarked] = useState(doc.is_bookmarked)
  const [inRevision, setInRevision] = useState(false)
  const [isRead, setIsRead] = useState(doc.is_read)
  const [isPublic, setIsPublic] = useState(doc.is_public)
  const isEditing = editId === doc.id
  const [editForm, setEditForm] = useState({ title: doc.title, summary: doc.summary || '' })
  const isOwner = user?.id === doc.owner_id

  const handleTogglePublic = async (e) => {
    e.stopPropagation()
    const newVal = !isPublic
    setIsPublic(newVal)
    try {
      await docsAPI.update(doc.id, { is_public: newVal })
      toast.success(newVal ? 'Published to Cosmos!' : 'Archived privately')
    } catch {
      setIsPublic(!newVal)
      toast.error('Failed to update visibility')
    }
  }

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

  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(doc.id)
      toast.success('Document deleted successfully')
    } catch { 
      toast.error('Failed to eliminate document') 
    } finally { 
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  const handleEditToggle = (e) => {
    e.stopPropagation()
    setIsEditing(!isEditing)
  }

  const handleSaveInline = async (e) => {
    e.stopPropagation()
    try {
      await onSave(doc.id, { ...doc, ...editForm })
      setIsEditing(false)
      toast.success('Updated in-place')
    } catch { toast.error('Update failed') }
  }

  const handleAskAI = (e) => {
    e.stopPropagation()
    navigate(`/ai?topic=${encodeURIComponent(doc.title)}&doc_id=${doc.id}`)
  }

  const handleQuiz = (e) => {
    e.stopPropagation()
    navigate(`/docs/${doc.id}?tab=quiz`)
  }

  const handleFormatInline = async (e) => {
    e.stopPropagation()
    const tid = toast.loading('Formatting with AI...')
    try {
      const { data } = await aiAPI.format({ text: doc.content || doc.summary || doc.title })
      await onSave(doc.id, { ...doc, content: data.markdown, summary: data.markdown.split('\n').slice(1, 4).join('\n') })
      toast.success('Doc Updated!', { id: tid })
    } catch {
      toast.error('AI formatting failed', { id: tid })
    }
  }

  return (
    <div
      className={`feed-card card group relative overflow-hidden flex flex-col transition-all duration-300 ${
        isEditing ? 'border-accent2 ring-4 ring-accent2/5' : 'hover-lift'
      }`}
      onClick={() => !isEditing && navigate(`/docs/${doc.id}`)}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent2/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4 relative z-10 transition-transform group-hover:-translate-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge border-2 shadow-sm font-black transition-all group-hover:shadow-accent2/20 ${DIFF_COLORS[doc.difficulty] || DIFF_COLORS.Medium}`}>
            {doc.difficulty}
          </span>
          {!isEditing && (
            <span className={`badge bg-surface/60 border border-border/20 backdrop-blur-md font-black shadow-sm ${CAT_COLORS[doc.category] || CAT_COLORS.Other}`}>
              {doc.category}
            </span>
          )}
          {doc.is_ai_generated && !isEditing && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-accent/20 text-accent border border-accent/30 shadow-sm animate-pulse">
              <Bot size={11} /> Neural
            </div>
          )}
        </div>
        
        {isEditing ? (
           <span className="text-[10px] font-black uppercase tracking-widest text-accent2 animate-pulse bg-accent2/10 px-2.5 py-1 rounded-lg">Edit Active</span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted/80 bg-surface/50 px-2.5 py-1.5 rounded-xl border border-border/10 shadow-sm transition-all hover:bg-surface/80">
              <Calendar size={13} className="text-accent" />
              {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted/80 bg-surface/50 px-2.5 py-1.5 rounded-xl border border-border/10 shadow-sm transition-all hover:bg-surface/80">
              <Clock size={13} className="text-accent2" />
              {doc.read_time_minutes}m
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="relative z-10 flex-1">
        {isEditing ? (
          <div className="space-y-3 mb-4">
            <input 
              autoFocus
              className="w-full bg-surface/50 border-2 border-accent2/30 rounded-xl px-4 py-2 text-bright font-bold focus:border-accent2 focus:outline-none transition-all" 
              value={editForm.title}
              onClick={e => e.stopPropagation()}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            />
            <textarea 
              className="w-full bg-surface/50 border-2 border-border/30 rounded-xl px-4 py-3 text-muted text-sm focus:border-accent2 focus:outline-none transition-all resize-none min-h-[80px]" 
              value={editForm.summary}
              onClick={e => e.stopPropagation()}
              onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
            />
          </div>
        ) : (
          <>
            <h3 className="font-bold text-bright text-lg mb-2.5 group-hover:text-accent2 transition-colors duration-300 leading-tight">
              {doc.title}
            </h3>
            {doc.summary && (
              <p className="text-muted text-sm line-clamp-2 mb-4 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                {doc.summary || 'Click to read full content...'}
              </p>
            )}
            
            {/* Publisher Name for Public Docs */}
            {doc.is_public && doc.owner_name && (
              <div className="flex items-center gap-2 mt-auto pb-4">
                 <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-black text-accent uppercase border border-accent/20">
                    {doc.owner_name[0]}
                 </div>
                 <span className="text-[10px] font-bold text-muted/60 uppercase tracking-widest leading-none">
                   By <span className="text-accent2/80">{doc.owner_name}</span>
                 </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tags */}
      {!isEditing && doc.tags?.length > 0 && (
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
        {isEditing ? (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-full">
              <button onClick={handleSaveInline} className="btn-primary flex-1 py-1.5 text-xs font-black uppercase">Save</button>
              <button 
                onClick={async (e) => {
                  e.stopPropagation()
                  const tid = toast.loading('Architecting...')
                  try {
                    const { data } = await aiAPI.format({ text: editForm.title + "\n" + editForm.summary })
                    setEditForm(prev => ({ ...prev, summary: data.markdown }))
                    toast.success('Done!', { id: tid })
                  } catch { toast.error('Failed', { id: tid }) }
                }}
                className="btn-ghost flex-1 py-1.5 text-xs text-accent border border-accent/20 flex items-center justify-center gap-1.5"
              >
                <Bot size={13} className="animate-pulse" /> Format
              </button>
              <button onClick={handleEditToggle} className="btn-ghost flex-1 py-1.5 text-xs font-black uppercase">Cancel</button>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onEdit(doc.id); setIsEditing(false) }} 
                    className="w-full sm:w-auto text-[9px] font-black uppercase tracking-widest text-muted/60 hover:text-accent transition-colors py-1">
              Deep Architect Mode
            </button>
          </div>
        ) : (
          <>
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
              <span className="text-[10px] font-black uppercase tracking-widest">Revise</span>
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
                onClick={handleQuiz}
                className="flex items-center gap-1 p-2 rounded-xl text-muted hover:text-yellow-400 hover:bg-yellow-400/10 transition-all duration-300"
                title="Open Quiz"
              >
                <Zap size={15} />
                <span className="text-[10px] font-bold">Quiz</span>
              </button>

              <button
                onClick={handleFormatInline}
                className="flex items-center gap-1 p-2 rounded-xl text-muted hover:text-accent hover:bg-accent/10 transition-all duration-300"
                title="Format with AI"
              >
                <Bot size={15} />
                <span className="text-[10px] font-bold">Format</span>
              </button>

              <button
                onClick={handleAskAI}
                className="flex items-center gap-1 p-2 rounded-xl text-muted hover:text-accent2 hover:bg-accent2/10 transition-all duration-300"
                title="Ask AI about this"
              >
                <Bot size={15} />
                <span className="text-[10px] font-bold">Ask AI</span>
              </button>
              
              {isOwner && (
                <div className="flex items-center gap-1 border-l border-border/30 ml-1 pl-1">
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-1 p-2 rounded-xl text-muted hover:text-accent hover:bg-accent/10 transition-all duration-300"
                    title="Edit Card In-Place"
                  >
                    <div className="w-3 h-3 flex items-center justify-center text-xs font-bold">✎</div>
                    <span className="text-[10px] font-bold">Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 p-2.5 rounded-2xl text-muted/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 active:scale-95 group/del"
                    title="Delete Card"
                  >
                    <Trash2 size={16} className="group-hover/del:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">Eliminate</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Done status indicator */}
      {isRead && !isEditing && (
        <div className="absolute -top-6 -right-6 w-12 h-12 bg-green-500/20 rotate-45 flex items-end justify-center pb-1">
          <CheckCircle size={12} className="text-green-400 -rotate-45" />
        </div>
      )}

      {/* Better Confirm Modal */}
      {showConfirm && (
        <ConfirmModal
          title="Eliminate Doc?"
          message={`Are you sure you want to remove "${doc.title}"? This cannot be undone.`}
          loading={deleting}
          onConfirm={confirmDelete}
          onClose={() => setShowConfirm(false)}
        />
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
  const [processingPdf, setProcessingPdf] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editorModal, setEditorModal] = useState({ open: false, id: null, initialContent: null, initialTitle: null })
  const loaderRef = useRef(null)
  const pdfInputRef = useRef(null)
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

  const handleSaveDoc = async (editId, docData) => {
    if (editId) {
      const { data } = await docsAPI.update(editId, docData)
      setFeed(docs.map(d => d.id === editId ? data : d), hasMore, page)
    } else {
      const { data } = await docsAPI.create(docData)
      setFeed([data, ...docs], hasMore, page)
    }
  }

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file')
      return
    }

    setProcessingPdf(true)
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target.result)
        const pdf = await pdfjs.getDocument(typedArray).promise
        let fullText = ``
        
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) { // Limit for speed/memory
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          const strings = content.items.map(item => item.str)
          fullText += strings.join(' ') + '\n\n'
        }

        const title = file.name.replace('.pdf', '').replace(/[-_]/g, ' ')
        const markdown = `# ${title}\n\n${fullText.trim()}`
        
        setEditorModal({ 
          open: true, 
          id: null, 
          initialContent: markdown, 
          initialTitle: title 
        })
        toast.success(`Extracted ${pdf.numPages} pages! Add AI formatting in the editor if needed.`)
      } catch (err) {
        console.error(err)
        toast.error('Failed to extract text from PDF')
      } finally {
        setProcessingPdf(false)
        if (pdfInputRef.current) pdfInputRef.current.value = ''
      }
    }
    
    reader.readAsArrayBuffer(file)
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || loading) return
    loadFeed(newPage, true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
        <div className="flex gap-2">
           <input
             type="file"
             ref={pdfInputRef}
             className="hidden"
             accept=".pdf"
             onChange={handlePdfUpload}
           />
           <button 
             onClick={() => pdfInputRef.current?.click()}
             disabled={processingPdf}
             className="btn-ghost !rounded-2xl border-accent/30 text-accent hover:bg-accent/5">
             {processingPdf ? (
               <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
             ) : (
               <Upload size={16} />
             )}
             <span className="font-bold hidden xs:inline">PDF</span>
           </button>

           <button onClick={() => setEditorModal({ open: true, id: null, initialContent: null, initialTitle: null })}
             className="btn-primary !rounded-2xl shadow-accent/40">
             <Plus size={16} />
             <span className="font-bold">Quick Doc</span>
           </button>
           <button onClick={() => setShowFilters(!showFilters)}
             className={`btn-ghost rounded-2xl ${showFilters ? 'border-accent2 text-accent2 bg-accent2/10 shadow-lg shadow-accent2/5' : ''}`}>
             <Filter size={16} />
             <span className="font-bold">Filter</span>
           </button>
        </div>
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
        {/* Shimmer Skeletons */}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card !bg-surface/20 border-border/10 p-6 space-y-6 overflow-hidden relative">
            <div className="flex justify-between items-start">
              <div className="flex gap-2">
                <div className="skeleton h-6 w-20 rounded-lg" />
                <div className="skeleton h-6 w-24 rounded-lg" />
              </div>
              <div className="skeleton h-8 w-24 rounded-xl" />
            </div>
            <div className="space-y-3">
              <div className="skeleton h-8 w-3/4 rounded-xl" />
              <div className="skeleton h-4 w-full rounded-lg opacity-60" />
              <div className="skeleton h-4 w-5/6 rounded-lg opacity-60" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="skeleton h-10 w-28 rounded-2xl" />
              <div className="skeleton h-10 w-28 rounded-2xl" />
            </div>
          </div>
        ))}

        {docs.map((doc, idx) => (
          <div key={doc.id} style={{ animationDelay: `${idx * 50}ms` }}>
            <FeedCard
              doc={doc}
              onBookmark={(id) => docsAPI.bookmark(id)}
              onAddRevision={handleRevision}
              onMarkRead={handleMarkRead}
              onDelete={handleDeleteDoc}
              onEdit={(id) => setEditorModal({ open: true, id })}
              onSave={handleSaveDoc}
            />
          </div>
        ))}

        {/* Pagination Controls */}
        {docs.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-12 py-8 border-t border-border/20 relative z-20">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="btn-ghost !p-3 rounded-2xl disabled:opacity-20 border border-border/10 transition-all hover:bg-surface/40 active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/30 rounded-2xl border border-border/10">
              {Array.from({ length: Math.min(5, Math.ceil(docs.length / 10) + page) }).map((_, i) => {
                 const p = page > 2 ? page - 2 + i : i + 1
                 if (p < 1) return null
                 if (p > page && !hasMore) return null
                 
                 return (
                   <button
                     key={p}
                     onClick={() => handlePageChange(p)}
                     className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                       page === p 
                         ? 'bg-accent2 text-white shadow-lg shadow-accent2/20' 
                         : 'text-muted hover:text-bright hover:bg-white/5'
                     }`}
                   >
                     {p}
                   </button>
                 )
              })}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasMore || loading}
              className="btn-ghost !p-3 rounded-2xl disabled:opacity-20 border border-border/10 transition-all hover:bg-surface/40 active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        {!hasMore && docs.length > 0 && (
          <div className="mt-12 p-8 rounded-[2.5rem] bg-surface/30 border border-border/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 grad-accent opacity-[0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col items-center text-center relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-accent2/10 flex items-center justify-center mb-6 shadow-xl shadow-accent2/5 border border-accent2/20">
                  <Zap size={24} className="text-accent2 animate-pulse" />
               </div>
               <h3 className="text-xl font-black text-bright mb-2 tracking-tight uppercase">Knowledge Architecture Complete</h3>
               <p className="text-muted/70 text-sm max-w-sm mb-8 leading-relaxed">
                 You've architected your personalized learning stream for this cycle. Ready to explore the global neural collective?
               </p>
               
               <div className="flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={() => navigate('/discovery')}
                    className="btn-primary !px-8 !rounded-2xl shadow-lg shadow-accent/20 flex items-center gap-2 group/btn"
                  >
                    <span>Explore Cosmos</span>
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="btn-ghost !px-8 !rounded-2xl border-white/5 text-muted hover:text-bright"
                  >
                    Back to Zenith
                  </button>
               </div>
            </div>
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

      {/* Inline Editor Modal */}
      {editorModal.open && (
         <DocEditorModal 
           editId={editorModal.id}
           initialContent={editorModal.initialContent}
           initialTitle={editorModal.initialTitle}
           onClose={() => setEditorModal({ open: false, id: null, initialContent: null, initialTitle: null })}
           onSave={handleSaveDoc}
         />
      )}
    </div>
  )
}
