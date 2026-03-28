import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { docsAPI, aiAPI } from '../api'
import { Eye, Code, Save, HelpCircle, Upload, FileText, Bot } from 'lucide-react'
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
        setForm(prev => ({
          ...prev,
          title: prev.title || title,
          content: fullText.trim()
        }))
        toast.success(`Extracted ${pdf.numPages} pages! Use 'Format with AI' to beautify.`)
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
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10 animate-fade-in">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-8 grad-accent rounded-full" />
            <h1 className="text-3xl font-black text-bright tracking-tight uppercase tracking-widest">{editId ? 'Architect Knowledge' : 'Create Knowledge'}</h1>
          </div>
          <p className="text-muted text-sm font-medium ml-4 leading-relaxed bg-surface/30 px-3 py-1.5 rounded-xl border border-border/20">
             Markdown Support Active — Craft beautiful study materials with ease.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <label className={`btn-ghost !rounded-2xl cursor-pointer flex items-center gap-2 px-4 py-3 border-accent2/30 text-accent2 hover:bg-accent2/5 transition-all active:scale-95 ${extracting ? 'opacity-50 pointer-events-none' : ''}`}>
             <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
             {extracting ? (
               <div className="w-4 h-4 border-2 border-accent2/30 border-t-accent2 rounded-full animate-spin" />
             ) : (
               <Upload size={16} />
             )}
             <span className="font-bold text-[11px] uppercase tracking-widest">Import PDF</span>
          </label>
          <button onClick={() => setPreview(!preview)}
            className={`btn-ghost !rounded-2xl flex items-center gap-2 px-4 py-3 transition-all active:scale-95 ${preview ? 'border-accent text-accent bg-accent/5' : 'border-border/60 text-muted'}`}>
            {preview ? <Code size={16} /> : <Eye size={16} />}
            <span className="font-bold text-[11px] uppercase tracking-widest">{preview ? 'Editor' : 'Preview'}</span>
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary !rounded-2xl !px-6 !py-3 shadow-lg shadow-accent/20 active:scale-95">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span className="font-bold text-[11px] uppercase tracking-widest">Commit Doc</span>
          </button>
        </div>
      </div>

      {fetching ? (
        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
          <div className="w-16 h-16 border-4 border-accent2/20 border-t-accent2 rounded-full animate-spin mb-6" />
          <p className="text-muted font-black tracking-widest text-[10px] uppercase">Retrieving Essence...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metadata Section */}
          <div className="card !p-8 border-border/20 bg-surface/10 animate-slide-up">
            <div className="flex items-center gap-2 mb-8 text-accent2 text-[10px] font-black uppercase tracking-widest">
              <FileText size={16} /> Core Metadata
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Document Title</label>
                <input className="input !bg-bg/40 !py-3.5 !text-lg !font-bold" placeholder="e.g. Master Binary Search in 10 Minutes"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Topic Category</label>
                <select className="input !bg-bg/40 !py-3.5" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {['DSA', 'System Design', 'OS', 'DBMS', 'CN', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Difficulty Level</label>
                <select className="input !bg-bg/40 !py-3.5" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Tags (separated by commas)</label>
                <input className="input !bg-bg/40 !py-3.5" placeholder="e.g. loops, recursion, efficiency"
                  value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block ml-1">Card Summary</label>
                <input className="input !bg-bg/40 !py-3.5" placeholder="A one-liner to describe this concept"
                  value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
              </div>
              <div className="sm:col-span-2 pt-2">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div
                    onClick={() => setForm({ ...form, is_public: !form.is_public })}
                    className={`w-12 h-6 rounded-full transition-all duration-300 ${form.is_public ? 'bg-accent shadow-lg shadow-accent/20' : 'bg-border/60'} relative`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${form.is_public ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-bright group-hover:text-accent transition-colors">Public Access</span>
                    <span className="text-[10px] text-muted font-medium">Visible to everyone in discovery mode</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Editor/Preview Engine */}
          <div className="card !p-0 overflow-hidden border-border/20 bg-surface/5 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="px-8 py-5 border-b border-border/20 flex items-center justify-between bg-surface/10">
               <div className="flex items-center gap-2 text-accent text-[10px] font-black uppercase tracking-widest">
                 {preview ? <Eye size={16} /> : <Code size={16} />} 
                 {preview ? 'Knowledge Preview' : 'Knowledge Architect Engine'}
               </div>
               {!preview && (
                 <button 
                   type="button"
                   onClick={async () => {
                     const tid = toast.loading('Neural Architecting...')
                     try {
                       const { data } = await aiAPI.format({ text: form.content })
                       setForm({ ...form, content: data.markdown })
                       toast.success('Done!', { id: tid })
                     } catch { toast.error('Formatting failed', { id: tid })}
                   }}
                   className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent2 hover:scale-105 transition-all"
                 >
                   <Bot size={14} className="animate-pulse" /> Format with AI
                 </button>
               )}
            </div>
            
            <div className="p-8">
              {preview ? (
                <div className="prose-dark min-h-[500px] animate-fade-in overflow-x-hidden">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {form.content || '*(Void)* Architecture is empty. Architect something amazing.'}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  className="w-full bg-transparent border-none focus:outline-none resize-none min-h-[500px] font-mono text-sm leading-relaxed custom-scrollbar text-text/80"
                  placeholder="Architect your concept using Markdown syntax..."
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
