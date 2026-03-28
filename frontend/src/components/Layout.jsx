import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import {
  Zap, BookOpen, Bot, RotateCcw, Search, Bookmark,
  PlusCircle, User, LogOut, Menu, X, Brain, MoreHorizontal, Globe
} from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/feed', icon: Zap, label: 'Feed' },
  { path: '/discovery', icon: Globe, label: 'Discovery' },
  { path: '/ai', icon: Bot, label: 'Neural Chat' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/revision', icon: RotateCcw, label: 'Revision' },
  { path: '/bookmarks', icon: Bookmark, label: 'Saved' },
  { path: '/create', icon: PlusCircle, label: 'Create' },
  { path: '/profile', icon: User, label: 'Profile' },
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
        {NAV.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
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
            <div className="fixed bottom-[65px] left-0 right-0 bg-surface/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl p-6 z-[70] animate-slide-up shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                <span className="font-black text-bright flex items-center gap-3 text-lg uppercase tracking-tight">
                  <Menu size={20} className="text-accent2" /> Menu
                </span>
                <button onClick={() => setMoreDrawerOpen(false)} className="btn-icon p-2 hover:bg-white/5 rounded-xl"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[NAV[4], NAV[7]].map(({ path, icon: Icon, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setMoreDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-2.5 p-5 rounded-2xl border transition-all duration-300 ${
                        isActive ? 'bg-accent/15 border-accent/40 text-accent shadow-xl shadow-accent/10' : 'border-border/40 bg-card/40 text-muted hover:bg-card/60'
                      }`
                    }
                  >
                    <Icon size={22} />
                    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
                  </NavLink>
                ))}
                <button 
                  onClick={handleLogout}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 transition-all hover:bg-red-500/10"
                >
                  <LogOut size={22} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-3xl border-t border-white/10 px-2 py-2.5 flex items-center justify-around z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {[
            NAV[0], // Feed
            NAV[1], // Discovery
            NAV[2], // Neural Chat
            NAV[6], // Create
            NAV[5], // Bookmarks
          ].map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMoreDrawerOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-accent2'
                    : 'text-muted hover:text-bright'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={22} className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(233,69,96,0.3)]' : ''}`} />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent2 rounded-full" />
                    )}
                  </div>
                  <span className={`text-[9px] font-black tracking-widest uppercase transition-all duration-300 ${isActive ? 'opacity-100 mt-1' : 'opacity-60'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          
          <button
            onClick={() => setMoreDrawerOpen(!moreDrawerOpen)}
            className={`flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
              moreDrawerOpen ? 'text-accent2' : 'text-muted'
            }`}
          >
            <div className="relative">
              <MoreHorizontal size={22} className="transition-transform duration-300" />
            </div>
            <span className="text-[9px] font-black tracking-widest uppercase opacity-60">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
