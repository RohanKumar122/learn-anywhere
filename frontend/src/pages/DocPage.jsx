import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { docsAPI, aiAPI, feedAPI } from '../api'
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
  const [readProgress, setReadProgress] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState('')
  const [tab, setTab] = useState('read') // read | quiz | flashcards
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
  }, [id])

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
    try {
      // Try direct API call with correct URL
      const { data } = await docsAPI.get(id)
      setDoc(data)
    } catch (err) {
      toast.error('Failed to load document')
    } finally {
      setLoading(false)
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

  const loadQuiz = async () => {
    setQuizLoading(true)
    try {
      const { data } = await aiAPI.quiz(id)
      setQuiz(data.quiz)
    } catch { toast.error('Failed to generate quiz') }
    finally { setQuizLoading(false) }
  }

  const loadFlashcards = async () => {
    setFlashLoading(true)
    try {
      const { data } = await aiAPI.flashcards(id)
      setFlashcards(data.flashcards)
    } catch { toast.error('Failed to generate flashcards') }
    finally { setFlashLoading(false) }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div className="skeleton h-8 w-24 mb-6" />
      <div className="skeleton h-8 w-3/4" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-64 w-full" />
    </div>
  )

  if (!doc) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="text-text font-medium">Document not found</p>
      <button onClick={() => navigate(-1)} className="btn-ghost mt-4">Go Back</button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-border z-50">
        <div className="h-full bg-accent2 transition-all duration-150" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-text text-sm mb-5 transition-colors">
        <ArrowLeft size={16} /> Back to Feed
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`badge border ${DIFF_COLORS[doc.difficulty]}`}>{doc.difficulty}</span>
          <span className="badge bg-surface border border-border text-muted">{doc.category}</span>
          {doc.is_ai_generated && <span className="badge bg-accent/10 text-accent border border-accent/20">AI Generated</span>}
          <span className="flex items-center gap-1 text-xs text-muted ml-auto">
            <Clock size={12} /> {doc.read_time_minutes} min read
          </span>
        </div>

        <h1 className="text-2xl font-bold text-bright leading-tight mb-3">{doc.title}</h1>

        {doc.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {doc.tags.map(t => <span key={t} className="tag">#{t}</span>)}
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button onClick={handleBookmark}
            className={`flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border transition-all ${
              bookmarked ? 'border-accent2 text-accent2 bg-accent2/5' : 'border-border text-muted hover:border-accent2 hover:text-accent2'
            }`}>
            <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
            {bookmarked ? 'Saved' : 'Save'}
          </button>
          <button onClick={handleAddRevision}
            className="flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-border text-muted hover:border-yellow-400 hover:text-yellow-400 transition-all">
            <RotateCcw size={15} /> Revise
          </button>
          <button onClick={() => setShowNoteInput(!showNoteInput)}
            className="flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-border text-muted hover:border-accent hover:text-accent transition-all">
            <StickyNote size={15} /> Add Note
          </button>
          <button onClick={() => navigate(`/ai?topic=${encodeURIComponent(doc.title)}`)}
            className="flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-border text-muted hover:border-accent2 hover:text-accent2 transition-all">
            <Bot size={15} /> Ask AI
          </button>
        </div>

        {/* Note input */}
        {showNoteInput && (
          <div className="mt-3 card animate-fade-in">
            <textarea
              className="input resize-none h-20 mb-2"
              placeholder="Your personal note or important takeaway..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNoteInput(false)} className="btn-ghost text-xs py-1.5">Cancel</button>
              <button onClick={handleAddNote} className="btn-primary text-xs py-1.5">Save Note</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6">
        {[
          { key: 'read', label: 'Read' },
          { key: 'quiz', label: 'Quiz' },
          { key: 'flashcards', label: 'Flashcards' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key)
              if (t.key === 'quiz' && !quiz) loadQuiz()
              if (t.key === 'flashcards' && !flashcards) loadFlashcards()
            }}
            className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${
              tab === t.key ? 'bg-card text-bright shadow' : 'text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Read tab */}
      {tab === 'read' && (
        <div ref={contentRef} className="prose-dark animate-fade-in">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {doc.content}
          </ReactMarkdown>

          {/* Personal notes */}
          {doc.personal_notes?.length > 0 && (
            <div className="mt-8 card border-yellow-400/20 bg-yellow-400/5">
              <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <StickyNote size={14} /> Your Notes
              </h3>
              <div className="space-y-2">
                {doc.personal_notes.map((n, i) => (
                  <div key={i} className="text-sm text-muted border-l-2 border-yellow-400/40 pl-3">
                    {n.note}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quiz tab */}
      {tab === 'quiz' && (
        <div className="animate-fade-in">
          {quizLoading ? (
            <div className="text-center py-12 text-muted">
              <div className="w-8 h-8 border-2 border-border border-t-accent2 rounded-full animate-spin mx-auto mb-3" />
              Generating quiz with AI...
            </div>
          ) : quiz ? (
            <div className="space-y-5">
              {quiz.map((q, qi) => (
                <div key={qi} className="card">
                  <p className="font-medium text-bright mb-3">{qi + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const answered = quizAnswers[qi] !== undefined
                      const isCorrect = oi === q.correct
                      const isSelected = quizAnswers[qi] === oi
                      return (
                        <button
                          key={oi}
                          disabled={answered}
                          onClick={() => setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                          className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                            answered
                              ? isCorrect
                                ? 'border-green-400 bg-green-400/10 text-green-400'
                                : isSelected
                                  ? 'border-red-400 bg-red-400/10 text-red-400'
                                  : 'border-border text-muted'
                              : 'border-border text-text hover:border-accent2'
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                        </button>
                      )
                    })}
                  </div>
                  {quizAnswers[qi] !== undefined && (
                    <div className="mt-3 text-xs text-muted bg-surface rounded-lg p-3">
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              ))}
              <div className="text-center text-sm text-muted">
                Score: {Object.entries(quizAnswers).filter(([qi, oi]) => oi === quiz[qi]?.correct).length} / {quiz.length}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Flashcards tab */}
      {tab === 'flashcards' && (
        <div className="animate-fade-in">
          {flashLoading ? (
            <div className="text-center py-12 text-muted">
              <div className="w-8 h-8 border-2 border-border border-t-accent2 rounded-full animate-spin mx-auto mb-3" />
              Generating flashcards...
            </div>
          ) : flashcards ? (
            <div>
              <div className="text-center text-sm text-muted mb-4">
                {flashcardIdx + 1} / {flashcards.length} — Click card to flip
              </div>
              <div
                className="card cursor-pointer min-h-48 flex items-center justify-center text-center p-8 select-none hover:border-accent2/40 transition-colors"
                onClick={() => setFlashcardFlipped(!flashcardFlipped)}
              >
                {!flashcardFlipped ? (
                  <div>
                    <div className="text-xs font-medium text-accent2 mb-3 uppercase tracking-wider">Concept</div>
                    <p className="text-bright font-semibold text-lg">{flashcards[flashcardIdx]?.front}</p>
                    <p className="text-muted text-xs mt-4">Click to reveal answer</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-medium text-accent mb-3 uppercase tracking-wider">Answer</div>
                    <p className="text-text leading-relaxed">{flashcards[flashcardIdx]?.back}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  disabled={flashcardIdx === 0}
                  onClick={() => { setFlashcardIdx(flashcardIdx - 1); setFlashcardFlipped(false) }}
                  className="btn-ghost disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setFlashcardFlipped(false)}
                  className="text-xs text-muted hover:text-text"
                >Reset</button>
                <button
                  disabled={flashcardIdx === flashcards.length - 1}
                  onClick={() => { setFlashcardIdx(flashcardIdx + 1); setFlashcardFlipped(false) }}
                  className="btn-ghost disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
