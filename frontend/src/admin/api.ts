import axios from 'axios'

const adminClient = axios.create({
  baseURL: '/api/admin',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

adminClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export const adminApi = {
  login: (email: string, password: string) =>
    adminClient.post('/auth/login', { email, password }).then(r => r.data),

  me: () => adminClient.get('/auth/me').then(r => r.data),

  dashboard: (days = 1) =>
    adminClient.get('/dashboard', { params: { days } }).then(r => r.data),

  getUsers: (params: { limit?: number; offset?: number; search?: string } = {}) =>
    adminClient.get('/users', { params }).then(r => r.data),

  getUser: (id: string) =>
    adminClient.get(`/users/${id}`).then(r => r.data),

  toggleUser: (id: string, reason: string) =>
    adminClient.post(`/users/${id}/toggle-active`, { reason }).then(r => r.data),

  updateSubscription: (id: string, tier: string, reason: string) =>
    adminClient.post(`/users/${id}/subscription`, { tier, reason }).then(r => r.data),

  getPayments: (params: { limit?: number; status?: string } = {}) =>
    adminClient.get('/payments', { params }).then(r => r.data),

  getAiLogs: (params: { limit?: number } = {}) =>
    adminClient.get('/ai-logs', { params }).then(r => r.data),

  getSafetyEvents: (params: { limit?: number; resolved?: string } = {}) =>
    adminClient.get('/safety-events', { params }).then(r => r.data),

  resolveSafetyEvent: (id: string) =>
    adminClient.post(`/safety-events/${id}/resolve`).then(r => r.data),

  getFeatureFlags: () =>
    adminClient.get('/feature-flags').then(r => r.data),

  updateFeatureFlag: (key: string, value: boolean, description?: string) =>
    adminClient.post('/feature-flags', { key, value, description }).then(r => r.data),

  getPromptConfigs: () =>
    adminClient.get('/prompt-configs').then(r => r.data),

  updatePromptConfig: (key: string, systemPrompt: string, userPromptTemplate?: string, version?: string) =>
    adminClient.post('/prompt-configs', { key, systemPrompt, userPromptTemplate, version }).then(r => r.data),

  getAuditLog: (params: { limit?: number } = {}) =>
    adminClient.get('/audit-log', { params }).then(r => r.data),
}
