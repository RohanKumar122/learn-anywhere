import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FeedPage from './pages/FeedPage'
import DiscoveryPage from './pages/DiscoveryPage'
import DocPage from './pages/DocPage'
import CreateDocPage from './pages/CreateDocPage'
import AIPage from './pages/AIPage'
import RevisionPage from './pages/RevisionPage'
import SearchPage from './pages/SearchPage'
import BookmarksPage from './pages/BookmarksPage'
import ProfilePage from './pages/ProfilePage'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1a2e', color: '#ccd6f6', border: '1px solid #0f3460' },
          success: { iconTheme: { primary: '#4ecca3', secondary: '#0f0f23' } },
          error: { iconTheme: { primary: '#e94560', secondary: '#0f0f23' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="discovery" element={<DiscoveryPage />} />
          <Route path="docs/:id" element={<DocPage />} />
          <Route path="create" element={<CreateDocPage />} />
          <Route path="ai" element={<AIPage />} />
          <Route path="revision" element={<RevisionPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="bookmarks" element={<BookmarksPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
