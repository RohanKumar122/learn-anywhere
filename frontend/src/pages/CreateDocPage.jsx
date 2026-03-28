import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { docsAPI } from '../api'
import { Eye, Code, Save, HelpCircle, Upload, FileText } from 'lucide-react'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import toast from 'react-hot-toast'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

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
  const [fetching, setFetching] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  useEffect(() => {
    if (editId) {
      loadEditData()
    }
  }, [editId])

  const loadEditData = async () => {
    setFetching(true)
    try {
      const { data } = await docsAPI.get(editId)
      setForm({
        ...data,
        tags: data.tags?.join(', ') || '',
      })
    } catch {
      toast.error('Failed to load doc for editing')
      navigate('/feed')
    } finally {
      setFetching(false)
    }
  }

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || file.type !== 'application/pdf') {
      toast.error('Invalid file')
      return
    }

    setExtracting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target.result)
        const pdf = await pdfjs.getDocument(typedArray).promise
        let fullText = ''
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          fullText += content.items.map(item => item.str).join(' ') + '\n\n'
        }
        
        const title = file.name.replace('.pdf', '').replace(/[-_]/g, ' ')
        
        const tid = toast.loading('Intelligently formatting...')
        try {
          const { data: fmt } = await aiAPI.format({ text: fullText.trim() })
          setForm(prev => ({
            ...prev,
            title: prev.title || title,
            content: fmt.markdown
          }))
          toast.success('Formatted!', { id: tid })
        } catch (err) {
          const errMsg = err.response?.data?.description || 'AI formatting failed'
          setForm(prev => ({
            ...prev,
            title: prev.title || title,
            content: fullText.trim()
          }))
          toast.error(`${errMsg}, showing raw text`, { id: tid, duration: 4000 })
        }
      } catch { toast.error('Extraction failed') }
      finally { setExtracting(false); e.target.value = '' }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.content.trim()) { toast.error('Content is required'); return }
    setLoading(true)
    try {
      const docData = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      
      let res;
      if (editId) {
        res = await docsAPI.update(editId, docData)
        toast.success('Doc updated!')
      } else {
        res = await docsAPI.create(docData)
        toast.success('Doc created!')
      }
      navigate(`/docs/${res.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save doc')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-bright">{editId ? 'Edit Doc' : 'Create Doc'}</h1>
          <p className="text-muted text-sm">Write in Markdown — code blocks and tables supported</p>
        </div>
        <div className="flex gap-2">
          <label className={`btn-ghost cursor-pointer flex items-center gap-2 ${extracting ? 'opacity-50 pointer-events-none' : ''}`}>
             <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
             {extracting ? (
               <div className="w-3 h-3 border border-accent2/30 border-t-accent2 rounded-full animate-spin" />
             ) : (
               <Upload size={15} className="text-accent2" />
             )}
             <span className="hidden sm:inline">Import PDF</span>
          </label>
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

      {fetching ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-border border-t-accent2 rounded-full animate-spin mb-4" />
          <p className="text-muted">Loading document data...</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}
