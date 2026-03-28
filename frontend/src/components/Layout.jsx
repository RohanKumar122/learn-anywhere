import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import {
  Zap, BookOpen, Bot, RotateCcw, Search, Bookmark,
  PlusCircle, User, LogOut, Menu, X, Brain, MoreHorizontal
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/feed', icon: Zap, label: 'Feed' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
  { to: '/revision', icon: RotateCcw, label: 'Revision' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/create', icon: PlusCircle, label: 'Create Doc' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-bright text-sm leading-tight">ConceptFlow</div>
            <div className="text-xs text-muted">AI Learning</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-muted hover:text-text hover:bg-surface'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text truncate">{user?.name}</div>
            <div className="text-xs text-muted truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="btn-icon text-muted hover:text-accent" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-surface border-r border-border">
        <SidebarContent />
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-[70px] lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="font-bold text-bright text-sm tracking-tight">ConceptFlow AI</span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white text-[10px] font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>

        {/* More Drawer (Mobile Only) */}
        {moreDrawerOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in"
              onClick={() => setMoreDrawerOpen(false)}
            />
            <div className="fixed bottom-[70px] left-4 right-4 bg-surface border border-border rounded-2xl p-4 z-[70] animate-slide-up shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                <span className="font-bold text-bright flex items-center gap-2">
                  <Menu size={16} className="text-accent2" /> More
                </span>
                <button onClick={() => setMoreDrawerOpen(false)} className="text-muted"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[NAV[3], NAV[4], NAV[6]].map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isActive ? 'bg-accent/10 border-accent/30 text-accent' : 'border-border bg-card/40 text-muted'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{label}</span>
                  </NavLink>
                ))}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 transition-all text-left"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border px-2 py-2 flex items-center justify-around z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
          {[
            NAV[0], // Feed
            NAV[1], // AI Assistant
            NAV[5], // Create Doc (Docs)
            NAV[2], // Revision
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMoreDrawerOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-accent2'
                    : 'text-muted hover:text-text'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} className="transition-transform duration-200" />
                {/* Active Indicator Dot */}
                <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent2 transition-all duration-300 ${to === window.location.pathname ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
              </div>
              <span className="text-[10px] font-medium tracking-wide">
                {label === 'Create Doc' ? 'Docs' : label.split(' ')[0]}
              </span>
            </NavLink>
          ))}
          
          {/* More Button */}
          <button
            onClick={() => setMoreDrawerOpen(!moreDrawerOpen)}
            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
              moreDrawerOpen ? 'text-accent2' : 'text-muted'
            }`}
          >
            <div className="relative">
              <MoreHorizontal size={20} className="transition-transform duration-200" />
            </div>
            <span className="text-[10px] font-medium tracking-wide">More</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

