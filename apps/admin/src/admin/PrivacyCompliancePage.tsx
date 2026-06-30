import React, { useState, useEffect } from 'react'
import { adminApi } from './api'

const cardStyle: React.CSSProperties = { background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem' }
const cellStyle: React.CSSProperties = { padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', whiteSpace: 'nowrap' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }
const selectStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem', cursor: 'pointer' }

function statusBadge(status: string): React.CSSProperties {
  const colors: Record<string, string> = { completed: '#10b981', pending: '#f59e0b', processing: '#3b82f6', failed: '#ef4444' }
  const c = colors[status] || '#64748b'
  return { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, background: `${c}22`, color: c }
}

export default function PrivacyCompliancePage() {
  const [tab, setTab] = useState<'requests' | 'audit'>('requests')
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>隐私与合规管理</h2>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setTab('requests')} style={{ padding: '0.4rem 0.75rem', border: 'none', borderBottom: tab === 'requests' ? '2px solid #7C5CFF' : '2px solid transparent', background: 'transparent', color: tab === 'requests' ? '#a78bfa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>隐私请求</button>
        <button onClick={() => setTab('audit')} style={{ padding: '0.4rem 0.75rem', border: 'none', borderBottom: tab === 'audit' ? '2px solid #7C5CFF' : '2px solid transparent', background: 'transparent', color: tab === 'audit' ? '#a78bfa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>合规审计</button>
      </div>
      {tab === 'requests' && <RequestsTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  )
}

function RequestsTab() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: 'all', status: 'all' })

  useEffect(() => {
    setLoading(true)
    adminApi.getPrivacyRequests({ limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all')) })
      .then(d => setRequests(d.requests)).catch(() => setRequests([])).finally(() => setLoading(false))
  }, [filters])

  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', gap: '0.5rem' }}>
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} style={selectStyle}>
          <option value="all">类型: 全部</option><option value="export">导出</option><option value="delete">删除</option>
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
          <option value="all">状态: 全部</option><option value="pending">待处理</option><option value="processing">处理中</option><option value="completed">已完成</option><option value="failed">失败</option>
        </select>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading...</div> : requests.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>暂无隐私请求</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead><tr>{['type','user','status','requestedBy','processedBy','created','completed','failureReason'].map(k => <th key={k} style={thStyle}>{k}</th>)}</tr></thead>
            <tbody>{requests.map(r => <tr key={r.id}>
              <td style={cellStyle}><span style={statusBadge(r.request_type === 'export' ? 'completed' : 'failed')}>{r.request_type === 'export' ? '导出' : '删除'}</span></td>
              <td style={cellStyle}>{r.user_email}</td>
              <td style={cellStyle}><span style={statusBadge(r.status)}>{r.status}</span></td>
              <td style={cellStyle}>{r.requested_by_email || '—'}</td>
              <td style={cellStyle}>{r.processed_by_email || '—'}</td>
              <td style={cellStyle}>{new Date(r.created_at).toLocaleString()}</td>
              <td style={cellStyle}>{r.processed_at ? new Date(r.processed_at).toLocaleString() : '—'}</td>
              <td style={cellStyle} title={r.failure_reason}>{r.failure_reason?.slice(0, 40) || '—'}</td>
            </tr>)}</tbody></table></div>
      )}
    </div>
  )
}

function AuditTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => { adminApi.getComplianceAudit({ limit: 50 }).then(d => setLogs(d.logs)).catch(() => setLogs([])).finally(() => setLoading(false)) }, [])

  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading...</div>
  if (logs.length === 0) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>暂无合规审计记录</div>

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
          <thead><tr>{['admin','action','target','ip','device','time'].map(k => <th key={k} style={thStyle}>{k}</th>)}</tr></thead>
          <tbody>{logs.map(l => <tr key={l.id} onClick={() => setSelected(l)} style={{ cursor: 'pointer' }}>
            <td style={cellStyle}>{l.admin_email || '—'}</td>
            <td style={cellStyle}>{l.action === 'export_user_data' ? '导出数据' : '删除数据'}</td>
            <td style={cellStyle}>{l.target_id?.slice(0, 8)}</td>
            <td style={cellStyle}>{l.ip || '—'}</td>
            <td style={cellStyle}>{(l.user_agent || '').slice(0, 40)}</td>
            <td style={cellStyle}>{new Date(l.created_at).toLocaleString()}</td>
          </tr>)}</tbody></table></div>
      {selected && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '0.7rem', color: '#64748b' }}>{selected.action}</h4>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem' }}>
            <div><span style={{ color: '#64748b' }}>Admin:</span> {selected.admin_email}</div>
            <div><span style={{ color: '#64748b' }}>Target:</span> User {selected.target_id}</div>
            <div><span style={{ color: '#64748b' }}>IP:</span> {selected.ip || '—'}</div>
            <div><span style={{ color: '#64748b' }}>Device:</span> {(selected.user_agent || '').slice(0, 80)}</div>
            <div><span style={{ color: '#64748b' }}>Time:</span> {new Date(selected.created_at).toLocaleString()}</div>
          </div>
          {selected.after_data && <div style={{ marginTop: '0.5rem' }}><div style={{ fontSize: '0.65rem', color: '#64748b' }}>Details:</div><pre style={{ background: '#0a0a1a', padding: '0.25rem', borderRadius: '4px', fontSize: '0.6rem', color: '#94a3b8', maxHeight: '100px', overflow: 'auto' }}>{JSON.stringify(selected.after_data, null, 2)}</pre></div>}
        </div>
      )}
    </div>
  )
}
