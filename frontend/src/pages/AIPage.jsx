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
  const { chatHistory, addMessage, clearChat, modelChoice, setModelChoice, aiMode, setAiMode } = useAppStore()
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
        model_choice: modelChoice,
        mode: aiMode,
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
      <div className="flex flex-col border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-lg shadow-accent/20">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-bright text-xs tracking-tight">ConceptFlow AI</div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] text-muted font-bold uppercase tracking-widest">
                  {aiMode === 'cs' ? 'Expert' : 'General'} Mode
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {chatHistory.length > 0 && (
              <button 
                onClick={clearChat} 
                className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/5 transition-all"
                title="Clear Chat"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 bg-surface/30">
          {/* Mode Selection */}
          <div className="flex items-center bg-bg/50 p-1 rounded-xl border border-border/30">
            {[
              { id: 'cs', label: 'CS Expert', icon: Sparkles },
              { id: 'general', label: 'General AI', icon: Bot },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setAiMode(id)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                  aiMode === id ? 'bg-accent text-white shadow-md' : 'text-muted hover:text-bright'
                }`}
              >
                <Icon size={12} />
                <span className="hidden xs:inline">{label}</span>
                <span className="xs:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Model selection */}
          <div className="flex items-center bg-bg/50 p-1 rounded-xl border border-border/30">
            {['Gemini', 'OpenAI'].map((model) => {
              const id = model.toLowerCase();
              return (
                <button
                  key={id}
                  onClick={() => setModelChoice(id)}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                    modelChoice === id ? 'bg-accent2 text-white shadow-md' : 'text-muted hover:text-bright'
                  }`}
                >
                  {model}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-accent2/20 flex items-center justify-center mb-6 animate-float">
              <Sparkles size={40} className="text-accent2" />
            </div>
            <h2 className="text-2xl font-bold text-bright mb-2 tracking-tight">
              {aiMode === 'cs' ? 'CS Tutor AI' : 'General Assistant'}
            </h2>
            <p className="text-muted text-sm max-w-sm mb-8 leading-relaxed">
              {aiMode === 'cs' 
                ? 'Master DSA, System Design, and CS fundamentals with expert guidance and real-world analogies.'
                : 'Your versatile AI companion for brainstorming, learning, writing, or solving daily tasks.'}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {QUICK_PROMPTS.slice(0, 4).map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="group text-left p-4 rounded-2xl border border-border/40 bg-card/30 hover:border-accent2/50 hover:bg-accent2/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center group-hover:bg-accent2/20 transition-colors">
                      <Sparkles size={14} className="text-muted group-hover:text-accent2" />
                    </div>
                    <span className="text-sm font-medium text-muted group-hover:text-bright transition-colors">{p}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] sm:max-w-2xl min-w-0 ${msg.role === 'user' ? 'order-first' : ''}`}>
              {msg.role === 'user' ? (
                <div className="bg-accent/10 border border-accent/30 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-text shadow-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md">
                  <div className="prose-dark text-[14px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {/* Save as doc button */}
                  <div className="mt-4 pt-3 border-t border-border/30 flex gap-3">
                    <button
                      onClick={() => setSaveModal(msg.content)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent2 transition-all p-1 -m-1"
                    >
                      <Save size={13} /> 
                      <span>Save Discovery</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={16} className="text-accent" />
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

      {/* Input Area */}
      <div className="p-4 bg-bg/80 backdrop-blur-xl border-t border-border">
        <div className="max-w-3xl mx-auto relative group">
          <textarea
            className="w-full bg-surface/50 border border-border/60 hover:border-accent2/30 focus:border-accent2 rounded-2xl pl-4 pr-14 py-4 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-accent2/5 transition-all min-h-[56px] custom-scrollbar"
            placeholder={aiMode === 'cs' ? "Deep dive into DSA or Systems..." : "What's on your mind?"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            rows={1}
            style={{ height: 'auto', minHeight: '56px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 w-10 btn-primary !p-0 rounded-xl shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <p className="text-[10px] text-muted font-medium uppercase tracking-widest opacity-60">
            Shift + Enter for new line • Press Enter to Send
          </p>
        </div>
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
