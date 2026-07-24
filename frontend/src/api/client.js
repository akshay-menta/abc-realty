import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token automatically; let the browser set multipart boundaries for FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('abc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type')
    } else {
      delete config.headers['Content-Type']
    }
  }
  return config
})

// Properties
export const propertiesApi = {
  list: (params) => api.get('/properties', { params }),
  get: (slugOrId) => api.get(`/properties/${slugOrId}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  updateStatus: (id, status) => api.patch(`/properties/${id}/status`, { status }),
  delete: (id) => api.delete(`/properties/${id}`),
  uploadPhotos: (id, formData) => api.post(`/properties/${id}/photos`, formData),
  replacePhotos: (id, photos) => api.put(`/properties/${id}/photos`, { photos }),
  uploadDocuments: (id, formData) => api.post(`/properties/${id}/documents`, formData),
  inquire: (id, data) => api.post(`/properties/${id}/inquire`, data),
  listInquiries: () => api.get('/properties/inquiries'),
}

export const inquiriesApi = {
  create: (data) => api.post('/properties/inquiries', data),
}

// Auth
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
}

// Chatbot
export const chatApi = {
  send: (message, history) => api.post('/chat', { message, history }),
}

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  sales: () => api.get('/dashboard/sales'),
  inquiries: () => api.get('/dashboard/inquiries'),
}

export default api
