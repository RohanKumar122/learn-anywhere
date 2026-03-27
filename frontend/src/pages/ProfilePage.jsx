import { useState, useEffect } from 'react'
import { useAuthStore } from '../store'
import { revisionAPI } from '../api'
import { User, BookOpen, RotateCcw, TrendingUp, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    revisionAPI.stats().then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-bright mb-6">Profile</h1>

      {/* User card */}
      <div className="card mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-bright text-lg">{user?.name}</div>
          <div className="text-muted text-sm">{user?.email}</div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: 'Docs Created', value: stats.total_docs, icon: BookOpen, color: 'text-accent2' },
            { label: 'Docs Read', value: stats.docs_read, icon: TrendingUp, color: 'text-blue-400' },
            { label: 'In Revision', value: stats.in_revision, icon: RotateCcw, color: 'text-yellow-400' },
            { label: 'Learning Streak', value: `${stats.streak_days}d`, icon: TrendingUp, color: 'text-accent' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card text-center">
              <Icon size={20} className={`${color} mx-auto mb-1`} />
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="card mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-text">Account</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Name</span>
          <span className="text-text">{user?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Email</span>
          <span className="text-text">{user?.email}</span>
        </div>
      </div>

      {/* App info */}
      <div className="card mb-5 space-y-2">
        <h2 className="text-sm font-semibold text-text">About</h2>
        <p className="text-xs text-muted leading-relaxed">
          ConceptFlow AI is your DSA + System Design learning companion. Build knowledge in 2–10 minute sessions, save AI answers as docs, and use spaced repetition to actually retain what you learn.
        </p>
        <div className="text-xs text-muted pt-1">
          <span className="text-accent2">v1.0.0</span> · Built for metro commutes and focused sessions
        </div>
      </div>

      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 btn-ghost text-accent border-accent/30 hover:bg-accent/10">
        <LogOut size={16} /> Log Out
      </button>
    </div>
  )
}
