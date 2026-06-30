import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'

const inputStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }
const btnStyle: React.CSSProperties = { padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }
const cardStyle: React.CSSProperties = { background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem' }
const cellStyle: React.CSSProperties = { padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', whiteSpace: 'nowrap' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }

type Tab = 'adminUsers' | 'loginHistory' | 'auditLog' | 'dashboard'

export default function SecurityPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('dashboard')
  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: t('admin.security.tabs.dashboard') },
    { key: 'adminUsers', label: t('admin.security.tabs.adminUsers') },
    { key: 'loginHistory', label: t('admin.security.tabs.loginHistory') },
    { key: 'auditLog', label: t('admin.security.tabs.auditLog') },
  ]
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.security.title')}</h2>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ padding: '0.4rem 0.75rem', border: 'none', borderBottom: tab === tb.key ? '2px solid #7C5CFF' : '2px solid transparent', background: 'transparent', color: tab === tb.key ? '#a78bfa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>{tb.label}</button>
        ))}
      </div>
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'adminUsers' && <AdminUsersTab />}
      {tab === 'loginHistory' && <LoginHistoryTab />}
      {tab === 'auditLog' && <AuditLogTab />}
    </div>
  )
}

function DashboardTab() {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  useEffect(() => { adminApi.getSecuritySummary().then(setData).catch(() => {}) }, [])
  if (!data) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('admin.loading')}</div>
  const cards = [
    { l: t('admin.security.dashboard.failedLogin24h'), v: data.failedLogin24h, c: data.failedLogin24h > 10 ? '#ef4444' : '#10b981' },
    { l: t('admin.security.dashboard.lockedAccounts'), v: data.lockedAccounts?.length || 0, c: data.lockedAccounts?.length > 0 ? '#ef4444' : '#10b981' },
    { l: t('admin.security.dashboard.activeSessions'), v: data.activeSessions, c: '#3b82f6' },
    { l: t('admin.security.dashboard.suspiciousIps'), v: data.suspiciousIps?.length || 0, c: data.suspiciousIps?.length > 0 ? '#ef4444' : '#10b981' },
    { l: t('admin.security.dashboard.success24h'), v: data.loginStats?.success24h, c: '#3b82f6' },
    { l: t('admin.security.dashboard.failed24h'), v: data.loginStats?.failed24h, c: '#f59e0b' },
    { l: t('admin.security.dashboard.audit24h'), v: data.loginStats?.audit24h, c: '#8b5cf6' },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {cards.map(c => <div key={c.l} style={cardStyle}><div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{c.l}</div><div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.c }}>{c.v}</div></div>)}
      </div>
      {data.lockedAccounts?.length > 0 && <div style={cardStyle}><h4 style={{ fontSize: '0.7rem', color: '#ef4444', marginBottom: '0.5rem' }}>{t('admin.security.dashboard.lockedAccounts')}</h4>{data.lockedAccounts.map((a:any) => <div key={a.id} style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{a.email} — {new Date(a.locked_until).toLocaleString()}</div>)}</div>}
      {data.suspiciousIps?.length > 0 && <div style={cardStyle}><h4 style={{ fontSize: '0.7rem', color: '#ef4444', marginBottom: '0.5rem' }}>{t('admin.security.dashboard.suspiciousIps')}</h4>{data.suspiciousIps.map((s:any) => <div key={s.ip} style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.ip} — {s.count} failures</div>)}</div>}
    </div>
  )
}

function AdminUsersTab() {
  const { t } = useTranslation()
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); adminApi.getAdminUsers().then(d => setAdmins(d.admins)).catch(() => setAdmins([])).finally(() => setLoading(false)) }, [])
  const doToggle = async (id: string) => { await adminApi.toggleAdminUser(id); window.location.reload() }
  const doUnlock = async (id: string) => { await adminApi.unlockAdminUser(id); window.location.reload() }
  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('admin.loading')}</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
        <thead><tr>{['email','name','role','status','failedAttempts','locked','created','actions'].map(k => <th key={k} style={thStyle}>{t(`admin.security.adminUsers.${k}`)}</th>)}</tr></thead>
        <tbody>{admins.map(a => <tr key={a.id}>
          <td style={cellStyle}>{a.email}</td><td style={cellStyle}>{a.name}</td><td style={cellStyle}>{a.role}</td>
          <td style={cellStyle}>{a.is_active ? <span style={{color:'#10b981'}}>✓</span> : <span style={{color:'#ef4444'}}>✗</span>}</td>
          <td style={cellStyle}>{a.failed_login_attempts || 0}</td>
          <td style={cellStyle}>{a.locked_until && new Date(a.locked_until) > new Date() ? <span style={{color:'#ef4444'}}>{t('admin.security.adminUsers.locked')}</span> : '—'}</td>
          <td style={cellStyle}>{new Date(a.created_at).toLocaleDateString()}</td>
          <td style={cellStyle}><div style={{display:'flex',gap:'0.25rem'}}>
            <button onClick={() => doToggle(a.id)} style={{...btnStyle,background:'rgba(124,92,255,0.15)',color:'#a78bfa',fontSize:'0.6rem'}}>{a.is_active ? t('admin.security.adminUsers.toggle') : t('admin.security.adminUsers.toggle')}</button>
            {a.locked_until && new Date(a.locked_until) > new Date() && <button onClick={() => doUnlock(a.id)} style={{...btnStyle,background:'rgba(16,185,129,0.15)',color:'#10b981',fontSize:'0.6rem'}}>{t('admin.security.adminUsers.unlock')}</button>}
          </div></td>
        </tr>)}</tbody></table></div>
  )
}

function LoginHistoryTab() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); adminApi.getLoginLogs({ limit: 100 }).then(d => setLogs(d.logs)).catch(() => setLogs([])).finally(() => setLoading(false)) }, [])
  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('admin.loading')}</div>
  return <div style={{ overflowX: 'auto' }}><table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.7rem'}}><thead><tr>{['email','ip','success','reason','time'].map(k => <th key={k} style={thStyle}>{t(`admin.security.loginHistory.${k}`)}</th>)}</tr></thead><tbody>{logs.map(l => <tr key={l.id}><td style={cellStyle}>{l.email}</td><td style={cellStyle}>{l.ip}</td><td style={cellStyle}>{l.success ? <span style={{color:'#10b981'}}>✓</span> : <span style={{color:'#ef4444'}}>✗</span>}</td><td style={cellStyle}>{l.failure_reason || '—'}</td><td style={cellStyle}>{new Date(l.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
}

function AuditLogTab() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  useEffect(() => { setLoading(true); adminApi.getAuditLog({ limit: 100 }).then(d => setLogs(d.logs)).catch(() => setLogs([])).finally(() => setLoading(false)) }, [])
  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('admin.loading')}</div>
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.7rem'}}><thead><tr>{['admin','action','target','ip','time'].map(k => <th key={k} style={thStyle}>{t(`admin.security.audit.${k}`)}</th>)}</tr></thead>
        <tbody>{logs.map(l => <tr key={l.id} onClick={() => setSelected(l)} style={{cursor:'pointer'}}><td style={cellStyle}>{l.admin_email || '—'}</td><td style={cellStyle}>{l.action}</td><td style={cellStyle}>{l.target_type}/{l.target_id?.slice(0,8)}</td><td style={cellStyle}>{l.ip || '—'}</td><td style={cellStyle}>{new Date(l.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
      {selected && (
        <div style={cardStyle}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><h4 style={{fontSize:'0.7rem',color:'#64748b'}}>{selected.action}</h4><button onClick={() => setSelected(null)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer'}}>✕</button></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',fontSize:'0.7rem'}}>
            <div><span style={{color:'#64748b'}}>Admin:</span> {selected.admin_email}</div><div><span style={{color:'#64748b'}}>Target:</span> {selected.target_type}/{selected.target_id}</div>
            <div><span style={{color:'#64748b'}}>IP:</span> {selected.ip || '—'}</div><div><span style={{color:'#64748b'}}>Device:</span> {(selected.user_agent || '').slice(0, 60)}</div>
            <div><span style={{color:'#64748b'}}>Time:</span> {new Date(selected.created_at).toLocaleString()}</div>
          </div>
          {selected.before_data && <div style={{marginTop:'0.5rem'}}><div style={{fontSize:'0.65rem',color:'#64748b'}}>Before:</div><pre style={{background:'#0a0a1a',padding:'0.25rem',borderRadius:'4px',fontSize:'0.6rem',color:'#94a3b8',maxHeight:'100px',overflow:'auto'}}>{JSON.stringify(selected.before_data,null,2)}</pre></div>}
          {selected.after_data && <div style={{marginTop:'0.5rem'}}><div style={{fontSize:'0.65rem',color:'#64748b'}}>After:</div><pre style={{background:'#0a0a1a',padding:'0.25rem',borderRadius:'4px',fontSize:'0.6rem',color:'#94a3b8',maxHeight:'100px',overflow:'auto'}}>{JSON.stringify(selected.after_data,null,2)}</pre></div>}
        </div>
      )}
    </div>
  )
}
