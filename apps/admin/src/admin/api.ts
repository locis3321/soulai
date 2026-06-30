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

  getUsers: (params: { limit?: number; offset?: number; search?: string; language?: string; tier?: string; is_active?: string; is_high_risk?: string; created_after?: string; created_before?: string; last_active_after?: string; last_active_before?: string } = {}) =>
    adminClient.get('/users', { params }).then(r => r.data),

  getUser: (id: string) =>
    adminClient.get(`/users/${id}`).then(r => r.data),

  toggleUser: (id: string, reason: string) =>
    adminClient.post(`/users/${id}/toggle-active`, { reason }).then(r => r.data),

  updateSubscription: (id: string, tier: string, reason: string) =>
    adminClient.post(`/users/${id}/subscription`, { tier, reason }).then(r => r.data),

  markRisk: (id: string, reason: string, isHighRisk: boolean) =>
    adminClient.post(`/users/${id}/mark-risk`, { reason, isHighRisk }).then(r => r.data),

  getUserNotes: (id: string) =>
    adminClient.get(`/users/${id}/notes`).then(r => r.data),

  addUserNote: (id: string, note: string) =>
    adminClient.post(`/users/${id}/notes`, { note }).then(r => r.data),

  exportUserData: (id: string) =>
    adminClient.get(`/users/${id}/export`).then(r => r.data),

  getPayments: (params: { limit?: number; offset?: number; status?: string; method?: string; refund_status?: string; created_after?: string; created_before?: string } = {}) =>
    adminClient.get('/payments', { params }).then(r => r.data),

  getSubscriptions: (params: { limit?: number; offset?: number; tier?: string } = {}) =>
    adminClient.get('/subscriptions', { params }).then(r => r.data),

  getCallbackLogs: (params: { limit?: number; offset?: number; payment_id?: string } = {}) =>
    adminClient.get('/payments/callback-logs', { params }).then(r => r.data),

  getRefunds: (params: { limit?: number; offset?: number; status?: string } = {}) =>
    adminClient.get('/refunds', { params }).then(r => r.data),

  createRefund: (paymentId: string, amount: number, reason: string) =>
    adminClient.post(`/payments/${paymentId}/refund`, { amount, reason }).then(r => r.data),

  processRefund: (refundId: string, status: 'completed' | 'rejected') =>
    adminClient.post(`/refunds/${refundId}/process`, { status }).then(r => r.data),

  updatePaymentStatus: (paymentId: string, status: string, reason: string) =>
    adminClient.post(`/payments/${paymentId}/status`, { status, reason }).then(r => r.data),

  getPaymentAnalytics: (days = 30) =>
    adminClient.get('/payments/analytics', { params: { days } }).then(r => r.data),

  exportPaymentsCsv: (params: { status?: string; method?: string } = {}) =>
    adminClient.get('/payments/export', { params, responseType: 'blob' }).then(r => r),

  getAiLogs: (params: { limit?: number; offset?: number; provider?: string; request_type?: string; was_fallback?: string; safety_intercepted?: string; created_after?: string; created_before?: string } = {}) =>
    adminClient.get('/ai-logs', { params }).then(r => r.data),

  getAiCostDashboard: (days = 30) =>
    adminClient.get('/ai-logs/cost-dashboard', { params: { days } }).then(r => r.data),

  getContentModeration: (params: { limit?: number; offset?: number; flag_type?: string; resolved?: string } = {}) =>
    adminClient.get('/content-moderation', { params }).then(r => r.data),

  resolveContentModeration: (id: string, notes?: string) =>
    adminClient.post(`/content-moderation/${id}/resolve`, { notes }).then(r => r.data),

  getReadings: (params: { limit?: number; offset?: number; type?: string; is_reported?: string; is_flagged?: string; language?: string; created_after?: string; created_before?: string } = {}) =>
    adminClient.get('/readings', { params }).then(r => r.data),

  getReadingDetail: (type: string, id: string) =>
    adminClient.get(`/readings/${type}/${id}`).then(r => r.data),

  flagReading: (type: string, id: string, isFlagged: boolean, reason?: string) =>
    adminClient.post(`/readings/${type}/${id}/flag`, { isFlagged, reason }).then(r => r.data),

  getReadingReports: (params: { limit?: number; offset?: number; resolved?: string } = {}) =>
    adminClient.get('/reading-reports', { params }).then(r => r.data),

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

  // Generic methods for AI Masters and other dynamic endpoints
  get: (path: string, params?: any) =>
    adminClient.get(path, { params }).then(r => r.data),

  post: (path: string, data?: any) =>
    adminClient.post(path, data).then(r => r.data),

  put: (path: string, data?: any) =>
    adminClient.put(path, data).then(r => r.data),

  delete: (path: string) =>
    adminClient.delete(path).then(r => r.data),

  // Marketplace management
  getPractitioners: (params: { limit?: number; search?: string; review_status?: string; is_frozen?: string; is_verified?: string } = {}) =>
    adminClient.get('/practitioners', { params }).then(r => r.data),

  getPractitionerDetail: (id: string) =>
    adminClient.get(`/practitioners/${id}`).then(r => r.data),

  approvePractitioner: (id: string) =>
    adminClient.post(`/practitioners/${id}/approve`).then(r => r.data),

  rejectPractitioner: (id: string, reason?: string) =>
    adminClient.post(`/practitioners/${id}/reject`, { reason }).then(r => r.data),

  freezePractitioner: (id: string, isFrozen: boolean, reason?: string) =>
    adminClient.post(`/practitioners/${id}/freeze`, { isFrozen, reason }).then(r => r.data),

  setPractitionerWeight: (id: string, weight: number) =>
    adminClient.post(`/practitioners/${id}/weight`, { weight }).then(r => r.data),

  setPractitionerNotes: (id: string, notes: string) =>
    adminClient.post(`/practitioners/${id}/notes`, { notes }).then(r => r.data),

  getReviews: (params: { limit?: number; practitioner_id?: string; flagged?: string; anomaly?: string } = {}) =>
    adminClient.get('/reviews', { params }).then(r => r.data),

  getReviewAnomalies: (days = 7) =>
    adminClient.get('/reviews/anomaly-detect', { params: { days } }).then(r => r.data),

  flagReview: (id: string, isFlagged: boolean) =>
    adminClient.post(`/reviews/${id}/flag`, { isFlagged }).then(r => r.data),

  hideReview: (id: string, isHidden: boolean) =>
    adminClient.post(`/reviews/${id}/hide`, { isHidden }).then(r => r.data),

  deleteReview: (id: string) =>
    adminClient.delete(`/reviews/${id}`).then(r => r.data),

  updateBookingStatus: (id: string, status: string) =>
    adminClient.post(`/bookings/${id}/status`, { status }).then(r => r.data),

  resolveDispute: (id: string, resolution: string) =>
    adminClient.post(`/bookings/${id}/resolve-dispute`, { resolution }).then(r => r.data),

  getPractitionerComplaints: (params: { limit?: number; status?: string; practitioner_id?: string } = {}) =>
    adminClient.get('/practitioner-complaints', { params }).then(r => r.data),

  resolveComplaint: (id: string, resolution: string, status: string) =>
    adminClient.post(`/practitioner-complaints/${id}/resolve`, { resolution, status }).then(r => r.data),

  // Security
  logout: () =>
    adminClient.post('/auth/logout').then(r => r.data),

  getAdminUsers: () =>
    adminClient.get('/admin-users').then(r => r.data),

  toggleAdminUser: (id: string) =>
    adminClient.post(`/admin-users/${id}/toggle-active`).then(r => r.data),

  unlockAdminUser: (id: string) =>
    adminClient.post(`/admin-users/${id}/unlock`).then(r => r.data),

  getLoginLogs: (params: { limit?: number } = {}) =>
    adminClient.get('/auth/login-logs', { params }).then(r => r.data),

  getSessions: () =>
    adminClient.get('/auth/sessions').then(r => r.data),

  getSecuritySummary: () =>
    adminClient.get('/security-summary').then(r => r.data),

  getPrivacyRequests: (params: { limit?: number; offset?: number; type?: string; status?: string } = {}) =>
    adminClient.get('/privacy-requests', { params }).then(r => r.data),

  getComplianceAudit: (params: { limit?: number } = {}) =>
    adminClient.get('/compliance-audit', { params }).then(r => r.data),

  getAnalytics: (days = 30) =>
    adminClient.get('/analytics', { params: { days } }).then(r => r.data),

  getAiProviders: () =>
    adminClient.get('/ai-providers').then(r => r.data),

  createAiProvider: (data: any) =>
    adminClient.post('/ai-providers', data).then(r => r.data),

  updateAiProvider: (id: string, data: any) =>
    adminClient.put(`/ai-providers/${id}`, data).then(r => r.data),

  deleteAiProvider: (id: string) =>
    adminClient.delete(`/ai-providers/${id}`).then(r => r.data),
}
