import React, { useState, useEffect } from 'react'
import { adminApi } from './api'
import AdminLoginPage from './LoginPage'

// ─── Types ─────────────────────────────────────────────────────────────

type Page = 'dashboard' | 'users' | 'payments' | 'ai-logs' | 'safety' | 'audit'

interface AdminUser { id: string; email: string; name: string; role: string }

// ─── Main App ──────────────────────────────────────────────────────────

export default function AdminApp() {
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

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', paddingTop: '20vh', background: '#0a0a1a', minHeight: '100vh' }}>Loading...</div>
  if (!token || !admin) return <AdminLoginPage onLogin={(t, a) => { setToken(t); setAdmin(a) }} />

  const env = import.meta.env.MODE || 'development'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: '200px', background: '#111827', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>SoulAI Admin</div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.25rem' }}>{env.toUpperCase()}</div>
        </div>

        {(['dashboard', 'users', 'payments', 'ai-logs', 'safety', 'audit'] as Page[]).map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            background: page === p ? 'rgba(124,92,255,0.15)' : 'transparent',
            color: page === p ? '#a78bfa' : '#94a3b8',
            border: 'none', borderRadius: '6px', padding: '0.4rem 0.6rem',
            textAlign: 'left', fontSize: '0.75rem', cursor: 'pointer',
            fontWeight: page === p ? 600 : 400,
          }}>
            {p === 'dashboard' && '📊 Dashboard'}
            {p === 'users' && '👥 Users'}
            {p === 'payments' && '💳 Payments'}
            {p === 'ai-logs' && '🤖 AI Logs'}
            {p === 'safety' && '🛡️ Safety'}
            {p === 'audit' && '📋 Audit Log'}
          </button>
        ))}

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{admin.email}</div>
          <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{admin.role}</div>
          <button onClick={() => { localStorage.removeItem('admin_token'); setToken(null); setAdmin(null) }}
            style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
        {page === 'dashboard' && <DashboardPage />}
        {page === 'users' && <UsersPage />}
        {page === 'payments' && <PaymentsPage />}
        {page === 'ai-logs' && <AiLogsPage />}
        {page === 'safety' && <SafetyPage />}
        {page === 'audit' && <AuditPage />}
      </main>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────

function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [days, setDays] = useState(1)

  useEffect(() => { adminApi.dashboard(days).then(setData).catch(() => {}) }, [days])

  if (!data) return <Loading />

  const cards = [
    { label: 'New Users', value: data.newUsers, color: '#10b981' },
    { label: 'Active Users', value: data.activeUsers, color: '#3b82f6' },
    { label: 'Paid Users', value: data.paidUsers, color: '#f59e0b' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Dashboard</h2>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
          <option value={1}>Last 24h</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#111827', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{c.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {data.paymentBreakdown?.length > 0 && (
        <Section title="Payment Breakdown">
          <SimpleTable
            headers={['Status', 'Count']}
            rows={data.paymentBreakdown.map((p: any) => [p.payment_status, p.c])}
          />
        </Section>
      )}

      {data.safetyHits?.length > 0 && (
        <Section title="Safety Events">
          <SimpleTable
            headers={['Type', 'Count']}
            rows={data.safetyHits.map((s: any) => [s.event_type, s.c])}
          />
        </Section>
      )}
    </div>
  )
}

// ─── Users ─────────────────────────────────────────────────────────────

function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)

  const load = () => adminApi.getUsers({ limit: 50, search }).then(d => setUsers(d.users)).catch(() => {})
  useEffect(() => { load() }, [search])

  const openDetail = async (id: string) => {
    setSelected(id)
    try { const d = await adminApi.getUser(id); setDetail(d) } catch { setDetail(null) }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Users</h2>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by email or name..."
        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem', marginBottom: '1rem' }}
      />

      <SimpleTable
        headers={['Email', 'Name', 'Tier', 'Birth', 'Active', 'Created']}
        rows={users.map(u => [
          u.email, u.name, u.subscription_tier,
          u.has_birth_data ? '✓' : '✗',
          u.is_active ? '✓' : '✗',
          new Date(u.created_at).toLocaleDateString(),
        ])}
        onRowClick={(_, i) => openDetail(users[i].id)}
      />

      {detail && (
        <div style={{ marginTop: '1.5rem', background: '#111827', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{detail.user.email}</h3>
            <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            <div><span style={{ color: '#64748b' }}>Name:</span> {detail.user.name}</div>
            <div><span style={{ color: '#64748b' }}>Tier:</span> {detail.user.subscription_tier}</div>
            <div><span style={{ color: '#64748b' }}>Birth:</span> {detail.user.birth_date || 'N/A'}</div>
            <div><span style={{ color: '#64748b' }}>Language:</span> {detail.user.language}</div>
          </div>

          {detail.subscriptions?.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>Subscriptions</div>
              <SimpleTable
                headers={['Tier', 'Start', 'End', 'Active']}
                rows={detail.subscriptions.map((s: any) => [s.tier, s.start_date?.slice(0,10), s.end_date?.slice(0,10) || '—', s.is_active ? '✓' : '✗'])}
              />
            </div>
          )}

          {detail.recentActivity?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>Activity (30d)</div>
              <SimpleTable
                headers={['Type', 'Count']}
                rows={detail.recentActivity.map((a: any) => [a.activity_type, a.count])}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Payments ──────────────────────────────────────────────────────────

function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [status, setStatus] = useState('all')

  useEffect(() => {
    adminApi.getPayments({ limit: 50, status: status === 'all' ? undefined : status })
      .then(d => setPayments(d.payments)).catch(() => {})
  }, [status])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Payments</h2>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <SimpleTable
        headers={['Order ID', 'User', 'Plan', 'Amount', 'Method', 'Status', 'Created']}
        rows={payments.map(p => [
          p.order_id?.slice(0, 16) + '...',
          p.user_email,
          p.plan_id,
          `${p.currency} ${p.amount}`,
          p.payment_method,
          p.payment_status,
          new Date(p.created_at).toLocaleDateString(),
        ])}
      />
    </div>
  )
}

// ─── AI Logs ───────────────────────────────────────────────────────────

function AiLogsPage() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => { adminApi.getAiLogs({ limit: 100 }).then(d => setLogs(d.logs)).catch(() => {}) }, [])

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>AI Request Logs</h2>
      <SimpleTable
        headers={['User', 'Provider', 'Type', 'Latency', 'Tokens', 'Fallback', 'Time']}
        rows={logs.map(l => [
          l.user_email?.slice(0, 20) || '—',
          l.provider,
          l.request_type,
          `${l.latency_ms}ms`,
          l.tokens_used || '—',
          l.was_fallback ? '⚠️' : '✓',
          new Date(l.created_at).toLocaleString(),
        ])}
      />
    </div>
  )
}

// ─── Safety ────────────────────────────────────────────────────────────

function SafetyPage() {
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
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Safety Events</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
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
                Resolve
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
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => { adminApi.getAuditLog({ limit: 100 }).then(d => setLogs(d.logs)).catch(() => {}) }, [])

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Audit Log</h2>
      <SimpleTable
        headers={['Admin', 'Action', 'Target', 'Time']}
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
  return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>Loading...</div>
}
