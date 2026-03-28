import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('cf_user') || 'null'),
  token: localStorage.getItem('cf_token') || null,
  isAuthenticated: !!localStorage.getItem('cf_token'),

  login: (user, token) => {
    localStorage.setItem('cf_token', token)
    localStorage.setItem('cf_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('cf_token')
    localStorage.removeItem('cf_user')
    set({ user: null, token: null, isAuthenticated: false })
  },
  updateUser: (user) => {
    localStorage.setItem('cf_user', JSON.stringify(user))
    set({ user })
  },
}))

export const useAppStore = create((set, get) => ({
  // Feed state
  feedDocs: [],
  feedPage: 1,
  feedHasMore: true,
  feedCategory: null,
  feedDifficulty: null,

  setFeed: (docs, hasMore, page) => set({ feedDocs: docs, feedHasMore: hasMore, feedPage: page }),
  appendFeed: (docs, hasMore, page) => set((s) => ({ feedDocs: [...s.feedDocs, ...docs], feedHasMore: hasMore, feedPage: page })),
  setFeedFilter: (category, difficulty) => set({ feedCategory: category, feedDifficulty: difficulty, feedDocs: [], feedPage: 1, feedHasMore: true }),

  // AI state
  chatHistory: [],
  modelChoice: localStorage.getItem('cf_model') || 'gemini',
  aiMode: localStorage.getItem('cf_ai_mode') || 'cs', // cs | general
  addMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [] }),
  setModelChoice: (m) => {
    localStorage.setItem('cf_model', m)
    set({ modelChoice: m })
  },
  setAiMode: (mode) => {
    localStorage.setItem('cf_ai_mode', mode)
    set({ aiMode: mode })
  },

  // Documents Cache
  docsCache: {}, // { id: docData }
  setCachedDoc: (id, doc) => set((s) => ({
    docsCache: { ...s.docsCache, [id]: doc }
  })),

  // UI state
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}))
