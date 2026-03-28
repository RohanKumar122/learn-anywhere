import api from './client'

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// Docs
export const docsAPI = {
  list: (params) => api.get('/docs/', { params }),
  get: (id) => api.get(`/docs/${id}`),
  create: (data) => api.post('/docs/', data),
  update: (id, data) => api.put(`/docs/${id}`, data),
  delete: (id) => api.delete(`/docs/${id}`),
  bookmark: (id) => api.post(`/docs/${id}/bookmark`),
  addNote: (id, data) => api.post(`/docs/${id}/note`, data),
  bookmarks: () => api.get('/docs/bookmarks/list'),
}

// Feed
export const feedAPI = {
  get: (params) => api.get('/feed/', { params }),
  categories: () => api.get('/feed/categories'),
  markRead: (id) => api.post(`/feed/${id}/mark-read`),
  addToRevision: (id) => api.post(`/feed/${id}/add-to-revision`),
}

// AI
export const aiAPI = {
  ask: (data) => api.post('/ai/ask', data),
  saveAsDoc: (data) => api.post('/ai/save-as-doc', data),
  chats: () => api.get('/ai/chats'),
  quiz: (docId, model_choice) => api.post(`/ai/generate-quiz/${docId}`, null, { params: { model_choice } }),
  flashcards: (docId, model_choice) => api.post(`/ai/generate-flashcards/${docId}`, null, { params: { model_choice } }),
}

// Revision
export const revisionAPI = {
  due: () => api.get('/revision/due'),
  complete: (docId, quality) => api.post(`/revision/${docId}/complete`, null, { params: { quality } }),
  remove: (docId) => api.delete(`/revision/${docId}`),
  stats: () => api.get('/revision/stats'),
}

// Search
export const searchAPI = {
  search: (params) => api.get('/search/', { params }),
}
