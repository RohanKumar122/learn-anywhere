import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { docsAPI } from '../api'
import { Eye, Code, Save, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const TEMPLATE = `# Your Title Here

## Introduction
Brief intro to the concept.

## Core Concept
Main explanation with examples.

\`\`\`python
# Code example
def example():
    pass
\`\`\`

## Key Points
- Point 1
- Point 2
- Point 3

## Interview Tip
> What interviewers typically ask about this topic.

## Key Takeaway
One-liner summary.
`

export default function CreateDocPage() {
  const [form, setForm] = useState({
    title: '',
    content: TEMPLATE,
    summary: '',
    category: 'DSA',
    difficulty: 'Medium',
    tags: '',
    is_public: false,
  })
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.content.trim()) { toast.error('Content is required'); return }
    setLoading(true)
    try {
      const { data } = await docsAPI.create({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      toast.success('Doc created!')
      navigate(`/docs/${data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create doc')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-bright">Create Doc</h1>
          <p className="text-muted text-sm">Write in Markdown — code blocks and tables supported</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(!preview)}
            className={`btn-ghost flex items-center gap-2 ${preview ? 'border-accent2 text-accent2' : ''}`}>
            {preview ? <Code size={15} /> : <Eye size={15} />}
            {preview ? 'Editor' : 'Preview'}
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary flex items-center gap-2">
            {loading && <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />}
            <Save size={14} /> Save Doc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Metadata */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted mb-1 block">Title *</label>
              <input className="input" placeholder="e.g. Binary Search — Complete Guide"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
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
            <div>
              <label className="text-xs text-muted mb-1 block">Tags (comma-separated)</label>
              <input className="input" placeholder="e.g. arrays, sorting, binary-search"
                value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Short Summary</label>
              <input className="input" placeholder="One-liner for the feed card"
                value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, is_public: !form.is_public })}
                  className={`w-10 h-5 rounded-full transition-colors ${form.is_public ? 'bg-accent2' : 'bg-border'} relative`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.is_public ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-text">Make public (visible to all users)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="card">
          {preview ? (
            <div className="prose-dark min-h-96">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {form.content || '*Nothing to preview yet*'}
              </ReactMarkdown>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted">Content (Markdown)</label>
                <span className="text-xs text-muted flex items-center gap-1">
                  <HelpCircle size={11} /> Supports code blocks, tables, headers
                </span>
              </div>
              <textarea
                className="input resize-none h-96 font-mono text-sm leading-relaxed"
                placeholder="Write your doc in Markdown..."
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
