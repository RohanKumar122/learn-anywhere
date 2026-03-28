import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { docsAPI, aiAPI, feedAPI } from '../api'
import { useAppStore, useAuthStore } from '../store'
import {
  ArrowLeft, Clock, Bookmark, RotateCcw, Bot, Zap,
  StickyNote, X, ChevronRight, ChevronLeft, CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const DIFF_COLORS = {
  Easy: 'text-green-400 bg-green-400/10 border-green-400/20',
  Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export default function DocPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const { modelChoice, setModelChoice, docsCache, setCachedDoc } = useAppStore()
  const [readProgress, setReadProgress] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState('')
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'read'
  const [tab, setTab] = useState(initialTab) // read | quiz | flashcards
  const [quiz, setQuiz] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [flashcards, setFlashcards] = useState(null)
  const [flashcardIdx, setFlashcardIdx] = useState(0)
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)
  const [flashLoading, setFlashLoading] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    loadDoc()
    if (initialTab === 'quiz' && !quiz) loadQuiz()
    if (initialTab === 'flashcards' && !flashcards) loadFlashcards()
  }, [id, initialTab])

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current
      if (!el) return
      const scrolled = window.scrollY - el.offsetTop + window.innerHeight
      const total = el.scrollHeight
      setReadProgress(Math.min(100, Math.max(0, (scrolled / total) * 100)))
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [doc])

  const loadDoc = async () => {
    // Check cache first
    if (docsCache[id]) {
      setDoc(docsCache[id])
      setLoading(false)
      return
    }

    try {
      const { data } = await docsAPI.get(id)
      setDoc(data)
      setIsPublic(data.is_public)
      setBookmarked(data.is_bookmarked)
      setCachedDoc(id, data) // Store in cache
    } catch (err) {
      toast.error('Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublic = async () => {
    const newVal = !isPublic
    setIsPublic(newVal)
    try {
      await docsAPI.update(id, { is_public: newVal })
      toast.success(newVal ? 'Published to Cosmos!' : 'Archived privately')
    } catch {
      setIsPublic(!newVal)
      toast.error('Failed to update visibility')
    }
  }

  const handleBookmark = async () => {
    try {
      const { data } = await docsAPI.bookmark(id)
      setBookmarked(data.bookmarked)
      toast.success(data.bookmarked ? 'Bookmarked!' : 'Removed bookmark')
    } catch { toast.error('Failed') }
  }

  const handleAddRevision = async () => {
    try {
      await feedAPI.addToRevision(id)
      toast.success('Added to revision queue')
    } catch { toast.error('Failed') }
  }

  const handleAddNote = async () => {
    if (!note.trim()) return
    try {
      await docsAPI.addNote(id, { note })
      toast.success('Note saved!')
      setNote('')
      setShowNoteInput(false)
    } catch { toast.error('Failed to save note') }
  }

  const loadQuiz = async (model = modelChoice) => {
    setQuizLoading(true)
    try {
      const { data } = await aiAPI.quiz(id, model)
      setQuiz(data.quiz)
    } catch { toast.error('Failed to generate quiz') }
    finally { setQuizLoading(false) }
  }

  const loadFlashcards = async (model = modelChoice) => {
    setFlashLoading(true)
    try {
      const { data } = await aiAPI.flashcards(id, model)
      setFlashcards(data.flashcards)
    } catch { toast.error('Failed to generate flashcards') }
    finally { setFlashLoading(false) }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="skeleton h-8 w-32" />
      <div className="skeleton h-12 w-full" />
      <div className="space-y-4 pt-8">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-64 w-full mt-8" />
      </div>
    </div>
  )

  if (!doc) return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-8">
        <X size={40} className="text-muted/30" />
      </div>
      <h2 className="text-2xl font-black text-bright mb-2">Document not found</h2>
      <p className="text-muted text-sm mb-8">The document you're looking for might have been moved or deleted.</p>
      <button onClick={() => navigate(-1)} className="btn-primary mx-auto">Go Back</button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-surface z-[100]">
        <div className="h-full grad-accent transition-all duration-300 shadow-[0_0_10px_rgba(233,69,96,0.5)]" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Navigation */}
      <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-muted hover:text-accent2 text-xs font-black uppercase tracking-[0.2em] mb-8 transition-all">
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back
      </button>

      {/* Header Section */}
      <div className="mb-10 animate-slide-up">
        <div className="flex flex-wrap items-center gap-2.5 mb-6 relative z-10">
          <span className={`badge border-2 shadow-sm py-1.5 px-4 ${DIFF_COLORS[doc.difficulty] || DIFF_COLORS.Medium}`}>
            {doc.difficulty}
          </span>
          <span className="badge bg-surface/50 border border-border/30 backdrop-blur-sm text-accent2 py-1.5 px-4 font-black">{doc.category}</span>
          {doc.is_ai_generated && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-accent/10 text-accent border border-accent/20">
              <Bot size={13} /> AI Assisted
            </div>
          )}

          {/* New Toggle for 상세페이지 top */}
          {user?.id === doc.owner_id && (
             <button 
               onClick={handleTogglePublic}
               className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl border transition-all duration-300 active:scale-95 ${
                 isPublic ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/5' : 'bg-surface/30 border-border/40 text-muted hover:border-accent/40 hover:text-bright'
               }`}
             >
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isPublic ? 'bg-accent/60' : 'bg-border/60'}`}>
                   <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-[1.1rem]' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{isPublic ? 'Publicly Visible' : 'Go Public'}</span>
             </button>
          )}

          <div className="hide-on-mobile flex items-center gap-1.5 text-[11px] font-black text-muted ml-auto bg-surface/40 px-3 py-1.5 rounded-xl border border-border/20">
            <Clock size={13} className="text-accent2" /> {doc.read_time_minutes}m read
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-bright leading-[1.1] mb-6 tracking-tight">
          {doc.title}
        </h1>

        {doc.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {doc.tags.map(t => <span key={t} className="tag text-[11px] font-bold">#{t}</span>)}
          </div>
        )}

        {/* Action buttons - Improved for mobile with horizontal scroll if needed */}
        <div className="flex items-center gap-3 mb-10 pb-4 overflow-x-auto no-scrollbar mask-fade-right">
          <button onClick={handleBookmark}
            className={`whitespace-nowrap flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl border transition-all duration-300 transform active:scale-95 ${
              bookmarked ? 'border-accent2 text-accent2 bg-accent2/10 shadow-lg shadow-accent2/10' : 'border-border/40 text-muted hover:border-accent2/40 hover:text-bright bg-surface/20'
            }`}>
            <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
            {bookmarked ? 'Knowledge Saved' : 'Save To Brain'}
          </button>
          
          <button onClick={handleAddRevision}
            className="whitespace-nowrap flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl border border-border/40 text-muted hover:border-yellow-400/40 hover:text-yellow-400 bg-surface/20 transition-all duration-300 transform active:scale-95">
            <RotateCcw size={15} /> Add To Revision
          </button>
          
          <button onClick={() => setShowNoteInput(!showNoteInput)}
            className={`whitespace-nowrap flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl border transition-all duration-300 transform active:scale-95 ${
              showNoteInput ? 'border-accent text-accent bg-accent/10' : 'border-border/40 text-muted hover:border-accent/40 hover:text-bright bg-surface/20'
            }`}>
            <StickyNote size={15} /> Annotate
          </button>
          
          <button onClick={() => navigate(`/ai?topic=${encodeURIComponent(doc.title)}&doc_id=${id}`)}
            className="whitespace-nowrap flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl border border-border/40 text-muted hover:border-accent2/40 hover:text-bright bg-surface/20 transition-all duration-300 transform active:scale-95">
            <Bot size={15} /> Deep Think
          </button>
        </div>

        {/* Note input area */}
        {showNoteInput && (
          <div className="mb-10 card !p-5 border-accent/20 bg-accent/5 animate-slide-up shadow-2xl relative z-10">
            <div className="flex items-center gap-2 mb-3 text-accent text-[10px] font-black uppercase tracking-widest">
              <StickyNote size={14} /> Local Brain Extension
            </div>
            <textarea
              className="w-full bg-bg/50 border border-accent/20 rounded-2xl p-4 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all resize-none h-28"
              placeholder="What did you discover in this concept? Write down your key takeaway..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowNoteInput(false)} className="btn-ghost !px-6 !py-2 text-[10px] font-black uppercase">Forget</button>
              <button onClick={handleAddNote} className="btn-primary !px-8 !py-2 text-[10px] font-black uppercase">Store Note</button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Interface - Optimized for touch */}
      <div className="sticky top-0 lg:static z-40 py-2 sm:py-0 mb-8 sm:mb-10 bg-bg lg:bg-transparent">
        <div className="flex gap-1 bg-surface/60 backdrop-blur-xl rounded-[1.25rem] p-1 border border-border/30 shadow-2xl">
          {[
            { key: 'read', label: 'Docs', full: 'Knowledge Base', icon: Zap },
            { key: 'quiz', label: 'Quiz', full: 'Recall Test', icon: CheckCircle },
            { key: 'flashcards', label: 'Flash', full: 'Active Recall', icon: RotateCcw },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key)
                if (t.key === 'quiz' && !quiz) loadQuiz()
                if (t.key === 'flashcards' && !flashcards) loadFlashcards()
              }}
              className={`flex-1 flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all duration-300 ${
                tab === t.key 
                  ? 'bg-accent/10 text-accent border border-accent/20 shadow-inner' 
                  : 'text-muted hover:text-bright hover:bg-surface'
              }`}
            >
              <t.icon size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Rendering */}
      <div className="min-h-[50vh] pb-12 relative z-10">
        {tab === 'read' && (
          <div ref={contentRef} className="animate-fade-in">
            <div className="prose-dark max-w-none overflow-x-hidden">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {doc.content}
              </ReactMarkdown>
            </div>

            {/* In-Context Notes Display */}
            {doc.personal_notes?.length > 0 && (
              <div className="mt-16 card border-yellow-400/20 bg-yellow-400/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 grad-accent opacity-5 -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl" />
                <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-6 flex items-center gap-2">
                  <StickyNote size={14} /> Personal Annotations
                </h3>
                <div className="space-y-4">
                  {doc.personal_notes.map((n, i) => (
                    <div key={i} className="text-sm text-text/90 border-l-4 border-yellow-400/30 pl-6 py-1 leading-relaxed italic bg-surface/30 rounded-r-xl">
                      {n.note}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'quiz' && (
          <div className="animate-slide-up max-w-2xl mx-auto">
            {quizLoading ? (
              <div className="text-center py-24 flex flex-col items-center">
                 <div className="w-12 h-12 border-4 border-accent2/20 border-t-accent2 rounded-full animate-spin mb-6" />
                 <div className="text-bright font-black uppercase tracking-widest text-xs">AI Architecting Quiz...</div>
              </div>
            ) : quiz ? (
              <div className="space-y-6">
                {quiz.map((q, qi) => (
                  <div key={qi} className="card !p-6 border-border/40 hover:border-accent2/30 transition-all group">
                    <p className="font-bold text-bright mb-6 flex items-start gap-4">
                       <span className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center text-[10px] font-black text-accent2 border border-border/60">{qi + 1}</span>
                       <span className="text-lg leading-snug">{q.question}</span>
                    </p>
                    <div className="space-y-3 pl-10">
                      {q.options.map((opt, oi) => {
                        const answered = quizAnswers[qi] !== undefined
                        const isCorrect = oi === q.correct
                        const isSelected = quizAnswers[qi] === oi
                        return (
                          <button
                            key={oi}
                            disabled={answered}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                            className={`w-full text-left text-sm px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 font-medium ${
                              answered
                                ? isCorrect
                                  ? 'border-green-400 bg-green-400/10 text-green-400'
                                  : isSelected
                                    ? 'border-red-400 bg-red-400/10 text-red-400'
                                    : 'border-border/30 text-muted opacity-50'
                                : 'border-border/60 text-text hover:border-accent2 hover:bg-card/40'
                            }`}
                          >
                            <span className="font-black mr-3">{String.fromCharCode(65 + oi)}</span>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                    {quizAnswers[qi] !== undefined && (
                      <div className="mt-8 text-xs leading-relaxed text-muted bg-surface/50 rounded-2xl p-5 border border-border/30 shadow-inner">
                        <div className="flex items-center gap-2 mb-2 text-accent2 font-bold uppercase tracking-widest">
                           <Zap size={14} /> Explanation
                        </div>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
                
                {Object.keys(quizAnswers).length === quiz.length && (
                  <div className="card text-center !p-10 border-accent2/20 bg-accent2/5 animate-slide-up">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-bright font-black text-2xl mb-2">Quiz Finished!</h3>
                    <div className="text-4xl font-black text-accent2 mb-6">
                       {Object.entries(quizAnswers).filter(([qi, oi]) => oi === quiz[qi]?.correct).length} / {quiz.length}
                    </div>
                    <button onClick={() => setQuizAnswers({})} className="btn-primary mx-auto">Try Again</button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {tab === 'flashcards' && (
          <div className="animate-slide-up max-w-xl mx-auto">
            {flashLoading ? (
              <div className="text-center py-24 flex flex-col items-center">
                 <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-6" />
                 <div className="text-bright font-black uppercase tracking-widest text-xs">AI Crafting Flashcards...</div>
              </div>
            ) : flashcards ? (
              <div className="relative">
                <div className="flex items-center justify-between mb-6 px-1">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Active Recall Mode</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                      {flashcardIdx + 1} <span className="text-muted">/</span> {flashcards.length}
                   </span>
                </div>
                
                <div
                  className={`card cursor-pointer min-h-[320px] flex items-center justify-center text-center p-12 select-none hover:border-accent2/40 transition-all duration-500 shadow-2xl relative overflow-hidden group ${flashcardFlipped ? 'rotate-y-180' : ''}`}
                  onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 grad-accent opacity-5 -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl group-hover:opacity-10 transition-opacity" />
                  
                  {!flashcardFlipped ? (
                    <div className="animate-fade-in flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-accent2/10 flex items-center justify-center mb-6 border border-accent2/20">
                         <Zap size={20} className="text-accent2" />
                      </div>
                      <p className="text-bright font-black text-2xl leading-tight mb-8">{flashcards[flashcardIdx]?.front}</p>
                      <div className="px-4 py-2 rounded-full bg-surface/50 border border-border/40 text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-accent2 transition-colors">
                         Click to reveal essence
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-6 border border-accent/20">
                         <Bot size={20} className="text-accent" />
                      </div>
                      <p className="text-text leading-relaxed text-lg font-medium">{flashcards[flashcardIdx]?.back}</p>
                      <div className="mt-8 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-black uppercase tracking-widest text-accent">
                         Knowledge Unlocked
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-center gap-6 mt-10">
                  <button
                    disabled={flashcardIdx === 0}
                    onClick={() => { setFlashcardIdx(flashcardIdx - 1); setFlashcardFlipped(false) }}
                    className="btn-icon !p-4 !rounded-2xl border-border/40 hover:border-accent2/40 bg-surface/30 disabled:opacity-20"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setFlashcardFlipped(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-bright transition-colors"
                  >Reset Orientation</button>
                  <button
                    disabled={flashcardIdx === flashcards.length - 1}
                    onClick={() => { setFlashcardIdx(flashcardIdx + 1); setFlashcardFlipped(false) }}
                    className="btn-icon !p-4 !rounded-2xl border-border/40 hover:border-accent2/40 bg-surface/30 disabled:opacity-20"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
