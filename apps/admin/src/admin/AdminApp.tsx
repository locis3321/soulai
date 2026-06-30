import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'
import AdminLoginPage from './LoginPage'
import AiMastersPage from './AiMastersPage'
import MarketplacePage from './MarketplacePage'
import CommunityPage from './CommunityPage'
import UsersPage from './UsersPage'
import PaymentsPage from './PaymentsPage'
import AiQualityPage from './AiQualityPage'
import ReadingsPage from './ReadingsPage'
import SecurityPage from './SecurityPage'
import PrivacyCompliancePage from './PrivacyCompliancePage'
import SystemConfigPage from './SystemConfigPage'
import AnalyticsPage from './AnalyticsPage'
import AiProvidersPage from './AiProvidersPage'

type Page = 'dashboard' | 'users' | 'payments' | 'ai-masters' | 'ai-providers' | 'ai-logs' | 'readings' | 'safety' | 'marketplace' | 'community' | 'feature-flags' | 'prompts' | 'audit' | 'security' | 'privacy' | 'system' | 'analytics'

interface AdminUser { id: string; email: string; name: string; role: string }

export default function AdminApp() {
  const { t, i18n } = useTranslation()
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'))
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    adminApi.me()
      .then(data => { setAdmin(data.admin); setLoading(false) })
      .catch(() => { localStorage.removeItem('admin_token'); setToken(null); setLoading(false) })
  }, [token])

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('admin_lang', lng)
  }

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', paddingTop: '20vh', background: '#0a0a1a', minHeight: '100vh' }}>{t('admin.loading')}</div>
  if (!token || !admin) return <AdminLoginPage onLogin={(t, a) => { setToken(t); setAdmin(a) }} />

  const env = import.meta.env.MODE || 'development'
  const navItems: { key: Page; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '📊', label: t('admin.nav.dashboard') },
    { key: 'users', icon: '👥', label: t('admin.nav.users') },
    { key: 'payments', icon: '💳', label: t('admin.nav.payments') },
    { key: 'ai-masters', icon: '🧙', label: t('admin.nav.aiMasters') },
    { key: 'ai-providers', icon: '⚡', label: 'AI Providers' },
    { key: 'ai-logs', icon: '🤖', label: t('admin.nav.aiLogs') },
    { key: 'readings', icon: '🔮', label: '占卜记录' },
    { key: 'marketplace', icon: '🏪', label: t('admin.nav.marketplace') },
    { key: 'community', icon: '💬', label: t('admin.nav.community') },
    { key: 'safety', icon: '🛡️', label: t('admin.nav.safety') },
    { key: 'feature-flags', icon: '🚩', label: t('admin.nav.featureFlags') },
    { key: 'prompts', icon: '📝', label: t('admin.nav.prompts') },
    { key: 'audit', icon: '📋', label: t('admin.nav.audit') },
    { key: 'security', icon: '🔒', label: '安全管理' },
    { key: 'privacy', icon: '🛡️', label: '隐私合规' },
    { key: 'system', icon: '⚙️', label: '系统配置' },
    { key: 'analytics', icon: '📈', label: '运营分析' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <aside style={{ width: '200px', background: '#111827', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>{t('admin.title')}</div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.25rem' }}>{env.toUpperCase()}</div>
        </div>

        {navItems.map(n => (
          <button key={n.key} onClick={() => setPage(n.key)} style={{
            background: page === n.key ? 'rgba(124,92,255,0.15)' : 'transparent',
            color: page === n.key ? '#a78bfa' : '#94a3b8',
            border: 'none', borderRadius: '6px', padding: '0.4rem 0.6rem',
            textAlign: 'left', fontSize: '0.75rem', cursor: 'pointer',
            fontWeight: page === n.key ? 600 : 400,
          }}>
            {n.icon} {n.label}
          </button>
        ))}

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {['zh', 'en'].map(lng => (
              <button key={lng} onClick={() => switchLang(lng)} style={{
                padding: '0.15rem 0.4rem', borderRadius: '4px', border: 'none', fontSize: '0.6rem', cursor: 'pointer',
                background: i18n.language === lng ? '#7C5CFF' : 'rgba(255,255,255,0.08)',
                color: i18n.language === lng ? '#fff' : '#94a3b8',
              }}>
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{admin.email}</div>
          <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{admin.role}</div>
          <button onClick={() => { localStorage.removeItem('admin_token'); setToken(null); setAdmin(null) }}
            style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
            {t('admin.signOut')}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
        {page === 'dashboard' && <DashboardPage />}
        {page === 'users' && <UsersPage />}
        {page === 'payments' && <PaymentsPage />}
        {page === 'ai-masters' && <AiMastersPage />}
        {page === 'ai-providers' && <AiProvidersPage />}
        {page === 'ai-logs' && <AiQualityPage />}
        {page === 'readings' && <ReadingsPage />}
        {page === 'marketplace' && <MarketplacePage />}
        {page === 'community' && <CommunityPage />}
        {page === 'safety' && <SafetyPage />}
        {page === 'feature-flags' && <FeatureFlagsPage />}
        {page === 'prompts' && <PromptsPage />}
        {page === 'audit' && <AuditPage />}
        {page === 'security' && <SecurityPage />}
        {page === 'privacy' && <PrivacyCompliancePage />}
        {page === 'system' && <SystemConfigPage />}
        {page === 'analytics' && <AnalyticsPage />}
      </main>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────

function DashboardPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [days, setDays] = useState(1)

  useEffect(() => { adminApi.dashboard(days).then(setData).catch(() => {}) }, [days])

  if (!data) return <Loading />

  const cards = [
    { label: t('admin.dashboard.newUsers'), value: data.newUsers, color: '#10b981' },
    { label: t('admin.dashboard.activeUsers'), value: data.activeUsers, color: '#3b82f6' },
    { label: t('admin.dashboard.paidUsers'), value: data.paidUsers, color: '#f59e0b' },
    { label: t('admin.dashboard.revenue'), value: `${data.revenue?.toFixed(2) || '0'}`, color: '#10b981' },
    { label: t('admin.dashboard.aiCalls'), value: data.aiTotal || 0, color: '#8b5cf6' },
    { label: t('admin.dashboard.aiFailureRate'), value: `${data.aiFailureRate || 0}%`, color: data.aiFailureRate > 5 ? '#ef4444' : '#10b981' },
    { label: t('admin.dashboard.aiAvgLatency'), value: `${data.aiAvgLatency || 0}ms`, color: '#64748b' },
  ]

  const m = data.marketplace || {}
  const c = data.community || {}

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('admin.dashboard.title')}</h2>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
          <option value={1}>{t('admin.dashboard.last24h')}</option>
          <option value={7}>{t('admin.dashboard.last7d')}</option>
          <option value={30}>{t('admin.dashboard.last30d')}</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {cards.map(c2 => (
          <div key={c2.label} style={{ background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{c2.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c2.color }}>{c2.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('admin.dashboard.marketplace')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
            <div><span style={{ color: '#64748b' }}>{t('admin.dashboard.practitioners')}:</span> {m.active_practitioners || 0}</div>
            <div><span style={{ color: '#64748b' }}>{t('admin.dashboard.bookings')}:</span> {m.total_bookings || 0}</div>
            <div><span style={{ color: '#64748b' }}>{t('admin.dashboard.completed')}:</span> {m.completed_bookings || 0}</div>
            <div><span style={{ color: '#64748b' }}>{t('admin.dashboard.reviews')}:</span> {m.reviews || 0}</div>
          </div>
        </div>
        <div style={{ background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('admin.dashboard.community')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
            <div><span style={{ color: '#64748b' }}>{t('admin.dashboard.newPosts')}:</span> {c.new_posts || 0}</div>
            <div><span style={{ color: '#64748b' }}>{t('admin.dashboard.newComments')}:</span> {c.new_comments || 0}</div>
            <div><span style={{ color: '#64748b' }}>{t('admin.dashboard.pinned')}:</span> {c.pinned_posts || 0}</div>
          </div>
        </div>
      </div>

      {data.featureUsage?.length > 0 && (
        <Section title={t('admin.dashboard.featureUsage')}>
          <SimpleTable
            headers={[t('admin.dashboard.feature'), t('admin.dashboard.count')]}
            rows={data.featureUsage.map((f: any) => [f.request_type, f.c])}
          />
        </Section>
      )}

      {data.paymentBreakdown?.length > 0 && (
        <Section title={t('admin.dashboard.paymentBreakdown')}>
          <SimpleTable
            headers={[t('admin.dashboard.status'), t('admin.dashboard.count')]}
            rows={data.paymentBreakdown.map((p: any) => [p.payment_status, p.c])}
          />
        </Section>
      )}

      {data.safetyHits?.length > 0 && (
        <Section title={t('admin.dashboard.safetyEvents')}>
          <SimpleTable
            headers={[t('admin.dashboard.type'), t('admin.dashboard.count')]}
            rows={data.safetyHits.map((s: any) => [s.event_type, s.c])}
          />
        </Section>
      )}
    </div>
  )
}

// ─── Safety ────────────────────────────────────────────────────────────

function SafetyPage() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<any[]>([])
  const [filter, setFilter] = useState('false')

  const load = () => adminApi.getSafetyEvents({ limit: 50, resolved: filter }).then(d => setEvents(d.events)).catch(() => {})
  useEffect(() => { load() }, [filter])

  const resolve = async (id: string) => {
    await adminApi.resolveSafetyEvent(id)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('admin.safety.title')}</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
          <option value="false">{t('admin.safety.unresolved')}</option>
          <option value="true">{t('admin.safety.resolved')}</option>
          <option value="">{t('admin.safety.all')}</option>
        </select>
      </div>

      {events.map(ev => (
        <div key={ev.id} style={{ background: '#111827', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem', border: ev.resolved ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: ev.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>{ev.event_type}</span>
              <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '0.5rem' }}>{ev.user_email}</span>
            </div>
            {!ev.resolved && (
              <button onClick={() => resolve(ev.id)} style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>
                {t('admin.safety.resolve')}
              </button>
            )}
          </div>
          {ev.content_snippet && <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>{ev.content_snippet.slice(0, 200)}</p>}
          <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '0.25rem' }}>{new Date(ev.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Audit Log ─────────────────────────────────────────────────────────

function AuditPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => { adminApi.getAuditLog({ limit: 100 }).then(d => setLogs(d.logs)).catch(() => {}) }, [])

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.audit.title')}</h2>
      <SimpleTable
        headers={[t('admin.audit.admin'), t('admin.audit.action'), t('admin.audit.target'), t('admin.audit.time')]}
        rows={logs.map(l => [
          l.admin_email || '—',
          l.action,
          `${l.target_type}/${l.target_id?.slice(0, 8)}`,
          new Date(l.created_at).toLocaleString(),
        ])}
      />
    </div>
  )
}

// ─── Feature Flags ─────────────────────────────────────────────────────

function FeatureFlagsPage() {
  const { t } = useTranslation()
  const [flags, setFlags] = useState<any[]>([])
  const [newKey, setNewKey] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const load = () => adminApi.getFeatureFlags().then(d => setFlags(d.flags)).catch(() => {})
  useEffect(() => { load() }, [])

  const toggle = async (key: string, current: boolean) => {
    await adminApi.updateFeatureFlag(key, !current)
    load()
  }

  const create = async () => {
    if (!newKey.trim()) return
    await adminApi.updateFeatureFlag(newKey, false, newDesc || undefined)
    setNewKey('')
    setNewDesc('')
    load()
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.featureFlags.title')}</h2>

      <div style={{ background: '#111827', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem' }}>{t('admin.featureFlags.createNew')}</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder={t('admin.featureFlags.flagKey')}
            style={{ flex: 1, padding: '0.4rem 0.6rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }} />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={t('admin.featureFlags.description')}
            style={{ flex: 2, padding: '0.4rem 0.6rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }} />
          <button onClick={create}
            style={{ padding: '0.4rem 0.8rem', background: '#7C5CFF', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
            {t('admin.featureFlags.add')}
          </button>
        </div>
      </div>

      {flags.map(f => (
        <div key={f.key} style={{ background: '#111827', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{f.key}</div>
            {f.description && <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{f.description}</div>}
          </div>
          <button onClick={() => toggle(f.key, f.value)} style={{
            padding: '0.3rem 0.8rem', borderRadius: '12px', border: 'none', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
            background: f.value ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            color: f.value ? '#10b981' : '#ef4444',
          }}>
            {f.value ? t('admin.featureFlags.on') : t('admin.featureFlags.off')}
          </button>
        </div>
      ))}

      {flags.length === 0 && <div style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', padding: '2rem' }}>{t('admin.featureFlags.empty')}</div>}
    </div>
  )
}

// ─── Prompt Configs ────────────────────────────────────────────────────

function PromptsPage() {
  const { t } = useTranslation()
  const [configs, setConfigs] = useState<any[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editSystem, setEditSystem] = useState('')
  const [editUser, setEditUser] = useState('')
  const [editVersion, setEditVersion] = useState('')

  const load = () => adminApi.getPromptConfigs().then(d => setConfigs(d.configs)).catch(() => {})
  useEffect(() => { load() }, [])

  const startEdit = (cfg: any) => {
    setEditing(cfg.key)
    setEditSystem(cfg.system_prompt)
    setEditUser(cfg.user_prompt_template || '')
    setEditVersion(cfg.version || 'v1')
  }

  const save = async () => {
    if (!editing) return
    await adminApi.updatePromptConfig(editing, editSystem, editUser || undefined, editVersion)
    setEditing(null)
    load()
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.prompts.title')}</h2>

      {configs.map(cfg => (
        <div key={cfg.key} style={{ background: '#111827', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{cfg.key}</span>
              <span style={{ fontSize: '0.6rem', color: '#64748b', marginLeft: '0.5rem' }}>v{cfg.version}</span>
            </div>
            <button onClick={() => editing === cfg.key ? setEditing(null) : startEdit(cfg)}
              style={{ fontSize: '0.65rem', color: '#7C5CFF', background: 'none', border: 'none', cursor: 'pointer' }}>
              {editing === cfg.key ? t('admin.prompts.cancel') : t('admin.prompts.edit')}
            </button>
          </div>

          {editing === cfg.key ? (
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{t('admin.prompts.systemPrompt')}</label>
                <textarea value={editSystem} onChange={e => setEditSystem(e.target.value)} rows={6}
                  style={{ width: '100%', padding: '0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.7rem', fontFamily: 'monospace', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{t('admin.prompts.userPromptTemplate')}</label>
                <textarea value={editUser} onChange={e => setEditUser(e.target.value)} rows={3}
                  style={{ width: '100%', padding: '0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.7rem', fontFamily: 'monospace', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input value={editVersion} onChange={e => setEditVersion(e.target.value)} placeholder="v1"
                  style={{ width: '80px', padding: '0.3rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.7rem' }} />
                <button onClick={save}
                  style={{ padding: '0.4rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                  {t('admin.prompts.save')}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <pre style={{ background: '#0a0a1a', padding: '0.5rem', borderRadius: '6px', fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'auto', margin: 0 }}>
                {cfg.system_prompt}
              </pre>
            </div>
          )}
        </div>
      ))}

      {configs.length === 0 && <div style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', padding: '2rem' }}>{t('admin.prompts.empty')}</div>}
    </div>
  )
}

// ─── Shared Components ─────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>{title}</h3>
      {children}
    </div>
  )
}

function SimpleTable({ headers, rows, onRowClick }: { headers: string[]; rows: any[][]; onRowClick?: (row: any[], i: number) => void }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.65rem', textTransform: 'uppercase' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} onClick={() => onRowClick?.(row, i)} style={{ cursor: onRowClick ? 'pointer' : undefined }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0' }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Loading() {
  const { t } = useTranslation()
  return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div>
}
