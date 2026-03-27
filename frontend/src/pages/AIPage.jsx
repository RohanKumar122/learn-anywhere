import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { aiAPI } from '../api'
import { useAppStore } from '../store'
import { Send, Bot, User, Save, Tag, Trash2, Sparkles, X } from 'lucide-react'
import toast from 'react-hot-toast'

const QUICK_PROMPTS = [
  'Explain Binary Search with examples',
  'Design a URL shortener system',
  'What is the difference between TCP and UDP?',
  'Explain CAP theorem in simple terms',
  'How does HashMap work internally?',
  'Explain OS scheduling algorithms',
]

function SaveDocModal({ content, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    category: 'Other',
    difficulty: 'Medium',
    tags: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Add a title'); return }
    setLoading(true)
    try {
      await onSave({
        ...form,
        content,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      toast.success('Saved as doc!')
      onClose()
    } catch { toast.error('Failed to save') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-bright">Save AI Answer as Doc</h3>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1 block">Title *</label>
            <input className="input" placeholder="e.g. Redis vs Kafka Comparison" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {['DSA', 'System Design', 'OS', 'DBMS', 'CN', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Tags (comma-separated)</label>
            <input className="input" placeholder="e.g. redis, kafka, caching" value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />}
            <Save size={14} /> Save Doc
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AIPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { chatHistory, addMessage, clearChat } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveModal, setSaveModal] = useState(null) // content to save
  const bottomRef = useRef(null)

  useEffect(() => {
    const topic = searchParams.get('topic')
    if (topic) setInput(`Explain "${topic}" in detail with examples`)
  }, [searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, loading])

  const sendMessage = async (question = input) => {
    if (!question.trim() || loading) return
    const q = question.trim()
    setInput('')
    addMessage({ role: 'user', content: q })
    setLoading(true)

    try {
      const { data } = await aiAPI.ask({
        question: q,
        history: chatHistory.slice(-10), // Last 10 messages for context
      })
      addMessage({ role: 'assistant', content: data.answer, chat_id: data.chat_id })
    } catch {
      toast.error('AI request failed. Check your API key.')
      addMessage({ role: 'assistant', content: '⚠️ Failed to get a response. Please check your API configuration.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDoc = async (docData) => {
    await aiAPI.saveAsDoc(docData)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-surface/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-bright text-sm">ConceptFlow AI</div>
            <div className="text-xs text-accent2">DSA + System Design Expert</div>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">🤖</div>
            <p className="text-bright font-semibold mb-1">Ask me anything about DSA or System Design</p>
            <p className="text-muted text-sm mb-6">Explanations, examples, interview answers, comparisons — anything</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left text-sm px-3 py-2.5 rounded-lg border border-border text-muted hover:border-accent2 hover:text-accent2 hover:bg-accent2/5 transition-colors"
                >
                  <Sparkles size={12} className="inline mr-1.5 opacity-60" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-2xl ${msg.role === 'user' ? 'order-first' : ''}`}>
              {msg.role === 'user' ? (
                <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-text">
                  {msg.content}
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="prose-dark text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {/* Save as doc button */}
                  <div className="mt-3 pt-3 border-t border-border flex gap-2">
                    <button
                      onClick={() => setSaveModal(msg.content)}
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-accent2 transition-colors"
                    >
                      <Save size={12} /> Save as Doc
                    </button>
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-accent" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 bg-accent2 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border bg-surface/50">
        <div className="flex gap-2">
          <textarea
            className="input flex-1 resize-none h-11 py-2.5 leading-relaxed"
            placeholder="Ask about any DSA or System Design concept..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary px-3 flex items-center justify-center disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-muted mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>

      {/* Save modal */}
      {saveModal && (
        <SaveDocModal
          content={saveModal}
          onClose={() => setSaveModal(null)}
          onSave={handleSaveDoc}
        />
      )}
    </div>
  )
}
