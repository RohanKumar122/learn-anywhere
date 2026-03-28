import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import {
  Zap, BookOpen, Bot, RotateCcw, Search, Bookmark,
  PlusCircle, User, LogOut, Menu, X, Brain
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

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border px-2 py-2 flex items-center justify-around z-50">
          {NAV.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-accent2'
                    : 'text-muted hover:text-text'
                }`
              }
            >
              <Icon size={20} className="transition-transform duration-200" />
              <span className="text-[10px] font-medium tracking-wide">{label.split(' ')[0]}</span>
              {/* Active Indicator */}
              <NavLink to={to} className={({ isActive }) => `h-1 w-1 rounded-full bg-accent2 transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
            </NavLink>
          ))}
          
          {/* Menu Dropup/More Button if needed, or just link to profile */}
          <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-accent2' : 'text-muted'
                }`
              }
            >
              <User size={20} />
              <span className="text-[10px] font-medium tracking-wide">Me</span>
               <NavLink to="/profile" className={({ isActive }) => `h-1 w-1 rounded-full bg-accent2 transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
            </NavLink>
        </nav>
      </div>
    </div>
  )
}

