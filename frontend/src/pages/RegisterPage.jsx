import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'
import { Brain } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      login(data.user, data.token)
      toast.success(`Welcome to ConceptFlow, ${data.user.name}! 🎉`)
      navigate('/feed')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent2/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent2 mb-4">
            <Brain size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-bright">Join ConceptFlow AI</h1>
          <p className="text-muted text-sm mt-1">Start learning DSA & System Design</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-bright mb-5">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Full Name</label>
              <input className="input" placeholder="Rohan Sharma" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-accent2 hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
