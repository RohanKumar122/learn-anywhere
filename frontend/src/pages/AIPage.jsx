import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { aiAPI } from '../api'
import { useAppStore } from '../store'
import { Send, Bot, User, Save, Tag, Trash2, Sparkles, X, Zap } from 'lucide-react'
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
    const docId = searchParams.get('doc_id')
    setInput('')
    addMessage({ role: 'user', content: q })
    setLoading(true)

    try {
      const { data } = await aiAPI.ask({
        question: q,
        history: chatHistory.slice(-10), // Last 10 messages for context
        model_choice: modelChoice,
        mode: aiMode,
        doc_id: docId
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

  const topic = searchParams.get('topic')
  const docId = searchParams.get('doc_id')

  return (
    <div className="flex flex-col h-full">
      {/* AI Controls Header */}
      <div className="flex flex-col border-b border-border/40 bg-bg/80 backdrop-blur-xl sticky top-0 z-20 shadow-xl shadow-black/5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 lg:px-8 max-w-5xl mx-auto w-full">
          
          {/* Agent Mode - Mobile Optimized */}
          <div className="flex flex-col gap-1.5 flex-1">
             <div className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/60 pl-2">Intelligence Agent</div>
             <div className="flex bg-surface/30 p-1 rounded-2xl border border-border/30 relative h-10 w-full shadow-inner overflow-hidden">
                <div 
                  className="absolute top-1 bottom-1 bg-accent rounded-xl transition-all duration-300 ease-out shadow-lg shadow-accent/10 z-0"
                  style={{ 
                    left: aiMode === 'cs' ? '4px' : 'calc(50% + 2px)', 
                    width: 'calc(50% - 6px)' 
                  }}
                />
                
                <button
                  onClick={() => setAiMode('cs')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    aiMode === 'cs' ? 'text-white' : 'text-muted hover:text-bright'
                  }`}
                >
                  <Sparkles size={12} />
                  <span>CS Expert</span>
                </button>
                
                <button
                  onClick={() => setAiMode('general')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    aiMode === 'general' ? 'text-white' : 'text-muted hover:text-bright'
                  }`}
                >
                  <Bot size={12} />
                  <span>General</span>
                </button>
             </div>
          </div>

          {/* Engine Selection - Mobile Optimized */}
          <div className="flex flex-col gap-1.5 flex-1">
             <div className="flex items-center justify-between px-2">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-accent2/60">AI Engine</div>
                {chatHistory.length > 0 && (
                  <button 
                    onClick={clearChat} 
                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                )}
             </div>
             <div className="flex bg-surface/30 p-1 rounded-2xl border border-border/30 relative h-10 w-full shadow-inner overflow-hidden">
                <div 
                  className="absolute top-1 bottom-1 bg-accent2 rounded-xl transition-all duration-300 ease-out shadow-lg shadow-accent2/10 z-0"
                  style={{ 
                    left: modelChoice === 'gemini' ? '4px' : 'calc(50% + 2px)', 
                    width: 'calc(50% - 6px)' 
                  }}
                />
                
                <button
                  onClick={() => setModelChoice('gemini')}
                  className={`relative z-10 flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    modelChoice === 'gemini' ? 'text-white' : 'text-muted hover:text-bright'
                  }`}
                >
                  {/* Smaller icons or just text */}
                  <Zap size={10} className="mr-1.5" /> Gemini
                </button>
                
                <button
                  onClick={() => setModelChoice('openai')}
                  className={`relative z-10 flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    modelChoice === 'openai' ? 'text-white' : 'text-muted hover:text-bright'
                  }`}
                >
                  OpenAI
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 custom-scrollbar">
        {/* Context indicator */}
        {(topic || docId) && chatHistory.length > 0 && (
           <div className="max-w-2xl mx-auto mb-4 animate-fade-in">
              <div className="flex items-center gap-2 bg-accent2/5 border border-accent2/20 rounded-2xl px-4 py-2 transition-all hover:bg-accent2/10">
                 <div className="w-2 h-2 rounded-full bg-accent2 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted">Discussing:</span>
                 <span className="text-xs font-bold text-accent2 truncate">{topic || 'Context Document'}</span>
                 <button 
                   onClick={() => navigate('/ai')} 
                   className="ml-auto text-[9px] font-black uppercase tracking-widest text-muted hover:text-red-400 transition-colors"
                 >
                   Clear Context
                 </button>
              </div>
           </div>
        )}

        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-slide-up">
            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-accent/20 to-accent2/20 flex items-center justify-center mb-8 animate-float shadow-2xl relative">
              <div className="absolute inset-0 bg-accent2/10 blur-3xl rounded-full" />
              <Sparkles size={48} className="text-accent2 relative z-10" />
            </div>
            <h2 className="text-4xl font-black text-bright mb-3 tracking-tighter">
               Architect Your Knowledge
            </h2>
            <p className="text-muted text-base max-w-sm mb-12 leading-relaxed font-medium">
              {aiMode === 'cs' 
                ? 'Deep dive into computer science with analogies, visual explanations, and expert-level code analysis.'
                : 'Solve complex problems, brainstorm ideas, or learn anything with your advanced AI research partner.'}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-2">
              {QUICK_PROMPTS.slice(0, 4).map((p, idx) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="group text-left p-5 rounded-3xl border-2 border-border/40 bg-card/20 hover:border-accent2/40 hover:bg-accent2/5 transition-all duration-300 hover-lift shadow-lg"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center group-hover:bg-accent2/20 transition-all border border-border/30 group-hover:border-accent2/30">
                      <Sparkles size={16} className="text-muted group-hover:text-accent2" />
                    </div>
                    <span className="text-sm font-bold text-muted group-hover:text-bright transition-colors">{p}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-4 sm:gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-[1.25rem] grad-accent flex items-center justify-center flex-shrink-0 mt-1 shadow-xl shadow-accent/20 border-2 border-white/10">
                <Bot size={20} className="text-white" />
              </div>
            )}
            <div className={`max-w-[90%] sm:max-w-2xl min-w-0 ${msg.role === 'user' ? 'order-first' : ''}`}>
              {msg.role === 'user' ? (
                <div className="bg-accent/10 border-2 border-accent/20 rounded-[2rem] rounded-tr-sm px-6 py-4 text-[15px] font-medium text-text shadow-sm hover:border-accent/40 transition-colors">
                  {msg.content}
                </div>
              ) : (
                <div className="bg-card shadow-2xl border border-border/40 rounded-[2rem] rounded-tl-sm px-7 py-6 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 grad-accent opacity-[0.03] -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl" />
                  <div className="prose-dark relative z-10">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {/* Save as doc button */}
                  <div className="mt-8 pt-5 border-t border-border/10 flex items-center justify-between relative z-10">
                    <button
                      onClick={() => setSaveModal(msg.content)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-accent2 transition-all group/btn bg-surface/50 px-3 py-1.5 rounded-xl border border-border/20"
                    >
                      <Save size={14} className="group-hover/btn:scale-110 transition-transform" /> 
                      <span>Preserve Discovery</span>
                    </button>
                    {msg.chat_id && (
                       <span className="text-[9px] text-muted/30 font-mono">ID: {msg.chat_id.slice(-8)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-[1.25rem] bg-accent/20 border-2 border-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={20} className="text-accent" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-[1.25rem] grad-accent flex items-center justify-center flex-shrink-0 shadow-lg">
              <Bot size={18} className="text-white" />
            </div>
            <div className="bg-card border border-border/40 rounded-[2rem] rounded-tl-sm px-6 py-4 shadow-xl">
              <div className="flex gap-1.5 items-center h-6">
                {[0, 200, 400].map(d => (
                  <div key={d} className="w-2.5 h-2.5 bg-accent2 rounded-full animate-bounce shadow-[0_0_8px_rgba(78,204,163,0.5)]" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-bg/80 backdrop-blur-2xl border-t border-border/40 relative z-30">
        <div className="max-w-3xl mx-auto relative group">
          <textarea
            className="w-full bg-surface/30 border-2 border-border/40 hover:border-accent2/40 focus:border-accent2 rounded-[2rem] pl-6 pr-16 py-5 text-[15px] resize-none focus:outline-none focus:ring-8 focus:ring-accent2/5 transition-all min-h-[64px] custom-scrollbar shadow-2xl"
            placeholder={aiMode === 'cs' ? "Deep dive into algorithms or architectures..." : "What's the next frontier of your curiosity?"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            rows={1}
            style={{ height: 'auto', minHeight: '64px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="absolute right-2.5 top-2.5 bottom-2.5 w-12 grad-accent !p-0 rounded-2xl shadow-xl shadow-accent/20 transition-all hover:scale-105 active:scale-90 disabled:opacity-20 disabled:hover:scale-100 flex items-center justify-center border-t border-white/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={22} className="text-white" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <p className="text-[10px] text-muted font-black uppercase tracking-[0.2em] opacity-40">
            Shift + Enter for new line • Enter to Command
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
