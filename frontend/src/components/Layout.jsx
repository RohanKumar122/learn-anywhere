import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import {
  Zap, BookOpen, Bot, RotateCcw, Search, Bookmark,
  PlusCircle, User, LogOut, Menu, X, Brain, MoreHorizontal, Globe
} from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/feed', icon: Zap, label: 'Feed' },
  { to: '/discovery', icon: Globe, label: 'Discovery' },
  { to: '/ai', icon: Bot, label: 'Neural Chat' },
  { to: '/revision', icon: RotateCcw, label: 'Revision' },
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header - Relative and Glassy */}
        <header className="lg:hidden relative z-30 bg-bg/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-lg shadow-accent/20">
              <Brain size={18} className="text-white" />
            </div>
            <span className="font-bold text-bright text-base tracking-tight">ConceptFlow AI</span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white/10 shadow-md">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar page-transition pb-[80px] lg:pb-0">
          <Outlet />
        </main>

        {/* More Drawer (Mobile Only) */}
        {moreDrawerOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] animate-fade-in"
              onClick={() => setMoreDrawerOpen(false)}
            />
            <div className="fixed bottom-[85px] left-4 right-4 bg-surface/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 z-[70] animate-slide-up shadow-2xl">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/50">
                <span className="font-bold text-bright flex items-center gap-2 text-base">
                  <Menu size={18} className="text-accent2" /> Menu
                </span>
                <button onClick={() => setMoreDrawerOpen(false)} className="btn-icon"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[NAV[4], NAV[6]].map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                        isActive ? 'bg-accent/10 border-accent/40 text-accent shadow-lg shadow-accent/5' : 'border-border/40 bg-card/40 text-muted hover:bg-card/60'
                      }`
                    }
                  >
                    <Icon size={20} />
                    <span className="text-xs font-semibold">{label}</span>
                  </NavLink>
                ))}
                <button 
                  onClick={handleLogout}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 transition-all hover:bg-red-500/10"
                >
                  <LogOut size={20} />
                  <span className="text-xs font-semibold">Logout</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="lg:hidden fixed bottom-4 left-4 right-4 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-2 flex items-center justify-around z-50 shadow-2xl">
          {[
            NAV[0], // Feed
            NAV[1], // Discovery
            NAV[2], // Neural Chat
            NAV[5], // Create Doc (Docs)
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMoreDrawerOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-accent2 bg-accent2/10 shadow-inner'
                    : 'text-muted hover:text-bright'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} className={`transition-transform duration-300 ${to === window.location.pathname ? 'scale-110' : ''}`} />
                {/* Active Indicator Dot removed for cleaner look or changed */}
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {label === 'Create Doc' ? 'Docs' : label.split(' ')[0]}
              </span>
            </NavLink>
          ))}
          
          {/* More Button */}
          <button
            onClick={() => setMoreDrawerOpen(!moreDrawerOpen)}
            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 ${
              moreDrawerOpen ? 'text-accent2 bg-accent2/10' : 'text-muted'
            }`}
          >
            <div className="relative">
              <MoreHorizontal size={20} className="transition-transform duration-300" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase">More</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

