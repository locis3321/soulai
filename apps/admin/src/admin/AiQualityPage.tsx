import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'

const inputStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
const btnStyle: React.CSSProperties = { padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }
const cardStyle: React.CSSProperties = { background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem' }
const cellStyle: React.CSSProperties = { padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', whiteSpace: 'nowrap' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }

function sevBadge(sev: string): React.CSSProperties {
  const colors: Record<string, string> = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' }
  const c = colors[sev] || '#64748b'
  return { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, background: `${c}22`, color: c }
}

type Tab = 'logs' | 'cost' | 'audit' | 'prompts'

export default function AiQualityPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('logs')
  const tabs: { key: Tab; label: string }[] = [
    { key: 'logs', label: t('admin.aiLogs.tabs.logs') },
    { key: 'cost', label: t('admin.aiLogs.tabs.cost') },
    { key: 'audit', label: t('admin.aiLogs.tabs.audit') },
    { key: 'prompts', label: t('admin.aiLogs.tabs.prompts') },
  ]
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.aiLogs.title')}</h2>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ padding: '0.4rem 0.75rem', border: 'none', borderBottom: tab === tb.key ? '2px solid #7C5CFF' : '2px solid transparent', background: 'transparent', color: tab === tb.key ? '#a78bfa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>{tb.label}</button>
        ))}
      </div>
      {tab === 'logs' && <LogsTab />}
      {tab === 'cost' && <CostTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'prompts' && <PromptsTab />}
    </div>
  )
}

function LogsTab() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ provider: 'all', request_type: 'all', was_fallback: 'all', safety_intercepted: 'all', created_after: '' })
  const [page, setPage] = useState(0)
  const limit = 25
  const load = useCallback(() => {
    setLoading(true)
    const params = { limit, offset: page * limit, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all')) }
    adminApi.getAiLogs(params).then(d => { setLogs(d.logs); setTotal(d.total) }).catch(() => { setLogs([]); setTotal(0) }).finally(() => setLoading(false))
  }, [filters, page])
  useEffect(() => { load() }, [load])
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <select value={filters.provider} onChange={e => { setFilters(f => ({ ...f, provider: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.aiLogs.provider')}: {t('admin.aiLogs.all')}</option><option value="minimax">MiniMax</option><option value="mock-fallback">Mock</option>
        </select>
        <select value={filters.request_type} onChange={e => { setFilters(f => ({ ...f, request_type: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.aiLogs.type')}: {t('admin.aiLogs.all')}</option><option value="chat">Chat</option><option value="tarot">Tarot</option><option value="astrology">Astrology</option><option value="bazi">BaZi</option><option value="insight">Insight</option>
        </select>
        <select value={filters.was_fallback} onChange={e => { setFilters(f => ({ ...f, was_fallback: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.aiLogs.fallback')}: {t('admin.aiLogs.all')}</option><option value="true">Yes</option><option value="false">No</option>
        </select>
        <select value={filters.safety_intercepted} onChange={e => { setFilters(f => ({ ...f, safety_intercepted: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.aiLogs.safetyIntercepted')}: {t('admin.aiLogs.all')}</option><option value="true">Yes</option><option value="false">No</option>
        </select>
        <input type="date" value={filters.created_after} onChange={e => { setFilters(f => ({ ...f, created_after: e.target.value })); setPage(0) }} style={inputStyle} />
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : logs.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.aiLogs.noData')}</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead><tr>{['user','provider','model','type','latency','tokens','cost','fallback','safetyIntercepted','safetyReason','promptVersion','time'].map(k => <th key={k} style={thStyle}>{t(`admin.aiLogs.${k}`)}</th>)}</tr></thead>
            <tbody>{logs.map(l => <tr key={l.id}><td style={cellStyle}>{l.user_email||'—'}</td><td style={cellStyle}>{l.provider}</td><td style={cellStyle}>{l.model||'—'}</td><td style={cellStyle}>{l.request_type||'—'}</td><td style={cellStyle}>{l.latency_ms}ms</td><td style={cellStyle}>{l.tokens_used||0}</td><td style={cellStyle}>{parseFloat(l.cost_estimate||0).toFixed(4)}</td><td style={cellStyle}>{l.was_fallback?<span style={sevBadge('warning')}>Y</span>:'—'}</td><td style={cellStyle}>{l.safety_intercepted?<span style={sevBadge('critical')}>Y</span>:'—'}</td><td style={cellStyle} title={l.safety_reason||''}>{l.safety_reason?.slice(0,30)||'—'}</td><td style={cellStyle}>{l.prompt_version||'—'}</td><td style={cellStyle}>{new Date(l.created_at).toLocaleString()}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{total} total</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ ...btnStyle, background: page === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(124,92,255,0.15)', color: page === 0 ? '#475569' : '#a78bfa' }}>←</button>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ ...btnStyle, background: page >= totalPages - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(124,92,255,0.15)', color: page >= totalPages - 1 ? '#475569' : '#a78bfa' }}>→</button>
        </div>
      </div>
    </div>
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: any[][] }) {
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}><thead><tr>{headers.map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={cellStyle}>{c}</td>)}</tr>)}</tbody></table></div>
}

function CostTab() {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [days, setDays] = useState(30)
  useEffect(() => { adminApi.getAiCostDashboard(days).then(setData).catch(() => {}) }, [days])
  if (!data) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div>
  const s = data.summary || {}
  const cards = [
    { l: t('admin.aiCost.totalCalls'), v: s.totalCalls, c: '#3b82f6' },
    { l: t('admin.aiCost.totalCost'), v: `$${(s.totalCost||0).toFixed(4)}`, c: '#10b981' },
    { l: t('admin.aiCost.avgLatency'), v: `${s.avgLatency||0}ms`, c: '#8b5cf6' },
    { l: t('admin.aiCost.fallbackCount'), v: s.fallbackCount, c: '#f59e0b' },
    { l: t('admin.aiCost.safetyCount'), v: s.safetyCount, c: '#ef4444' },
    { l: t('admin.aiCost.uniqueUsers'), v: s.uniqueUsers, c: '#3b82f6' },
    { l: t('admin.aiCost.failureRate'), v: `${(s.failureRate||0).toFixed(1)}%`, c: '#ef4444' },
    { l: t('admin.aiCost.retryRate'), v: `${(s.retryRate||0).toFixed(1)}%`, c: '#f59e0b' },
  ]
  return (
    <div>
      <div style={{ marginBottom: '1rem' }}><select value={days} onChange={e => setDays(Number(e.target.value))} style={selectStyle}><option value={7}>7d</option><option value={30}>30d</option><option value={90}>90d</option></select></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {cards.map(c => <div key={c.l} style={cardStyle}><div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{c.l}</div><div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.c }}>{c.v}</div></div>)}
      </div>
      <div style={cardStyle}><h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t('admin.aiCost.byFeature')}</h3>{data.byFeature?.length > 0 ? <SimpleTable headers={['Feature','Calls','Cost','Latency','Tokens','Fallbacks']} rows={data.byFeature.map((f:any)=>[f.request_type||'—',f.calls,parseFloat(f.total_cost||0).toFixed(4),`${f.avg_latency}ms`,f.total_tokens||0,f.fallback_count||0])} /> : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t('admin.aiLogs.noData')}</div>}</div>
      <div style={cardStyle}><h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t('admin.aiCost.byUser')}</h3>{data.byUser?.length > 0 ? <SimpleTable headers={['User','Calls','Cost','Tokens']} rows={data.byUser.map((u:any)=>[u.user_email||'—',u.calls,parseFloat(u.total_cost||0).toFixed(4),u.total_tokens||0])} /> : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t('admin.aiLogs.noData')}</div>}</div>
      <div style={cardStyle}><h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t('admin.aiCost.byProvider')}</h3>{data.byProvider?.length > 0 ? <SimpleTable headers={['Provider','Calls','Cost','Latency','Failures']} rows={data.byProvider.map((p:any)=>[p.provider,p.calls,parseFloat(p.total_cost||0).toFixed(4),`${p.avg_latency}ms`,p.failures||0])} /> : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t('admin.aiLogs.noData')}</div>}</div>
    </div>
  )
}

function AuditTab() {
  const { t } = useTranslation()
  const [subtab, setSubtab] = useState<'safety' | 'moderation'>('safety')
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
        <button onClick={() => setSubtab('safety')} style={{ ...btnStyle, background: subtab==='safety'?'rgba(124,92,255,0.15)':'rgba(255,255,255,0.05)', color: subtab==='safety'?'#a78bfa':'#64748b' }}>{t('admin.contentAudit.tabs.safety')}</button>
        <button onClick={() => setSubtab('moderation')} style={{ ...btnStyle, background: subtab==='moderation'?'rgba(124,92,255,0.15)':'rgba(255,255,255,0.05)', color: subtab==='moderation'?'#a78bfa':'#64748b' }}>{t('admin.contentAudit.tabs.moderation')}</button>
      </div>
      {subtab === 'safety' ? <SafetyTab /> : <ModerationTab />}
    </div>
  )
}

function SafetyTab() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ resolved: 'false', event_type: 'all', severity: 'all' })
  const [resolveModal, setResolveModal] = useState<any>(null)
  const load = useCallback(() => {
    setLoading(true)
    adminApi.get('/safety-events', { limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v && v !== 'all')) }).then(d => setEvents(d.events)).catch(() => setEvents([])).finally(() => setLoading(false))
  }, [filters])
  useEffect(() => { load() }, [load])
  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', gap: '0.5rem' }}>
        <select value={filters.resolved} onChange={e => setFilters(f => ({...f, resolved: e.target.value}))} style={selectStyle}><option value="false">{t('admin.contentAudit.unresolved')}</option><option value="true">{t('admin.contentAudit.resolved')}</option><option value="all">{t('admin.contentAudit.all')}</option></select>
        <select value={filters.event_type} onChange={e => setFilters(f => ({...f, event_type: e.target.value}))} style={selectStyle}><option value="all">{t('admin.contentAudit.all')}</option><option value="crisis">{t('admin.contentAudit.crisis')}</option><option value="guarantee_claim">{t('admin.contentAudit.guaranteeClaim')}</option><option value="medical_advice">{t('admin.contentAudit.medicalAdvice')}</option></select>
        <select value={filters.severity} onChange={e => setFilters(f => ({...f, severity: e.target.value}))} style={selectStyle}><option value="all">{t('admin.contentAudit.all')}</option><option value="critical">{t('admin.contentAudit.critical')}</option><option value="warning">{t('admin.contentAudit.warning')}</option></select>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : events.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.contentAudit.noData')}</div> : events.map(ev => (
        <div key={ev.id} style={{ ...cardStyle, border: ev.resolved ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span style={sevBadge(ev.severity)}>{ev.event_type}</span><span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '0.5rem' }}>{ev.user_email}</span></div>
            {!ev.resolved && <button onClick={() => setResolveModal(ev)} style={{ ...btnStyle, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.65rem' }}>{t('admin.contentAudit.resolve')}</button>}
          </div>
          {ev.content_snippet && <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>{ev.content_snippet.slice(0,200)}</p>}
          <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '0.25rem' }}>{new Date(ev.created_at).toLocaleString()}{ev.resolution_notes && ` | ${ev.resolution_notes}`}</div>
        </div>
      ))}
      {resolveModal && <ResolveModal event={resolveModal} type="safety" onClose={() => setResolveModal(null)} onSaved={() => { setResolveModal(null); load() }} />}
    </div>
  )
}

function ModerationTab() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ resolved: 'false', flag_type: 'all' })
  const [resolveModal, setResolveModal] = useState<any>(null)
  const load = useCallback(() => {
    setLoading(true)
    adminApi.getContentModeration({ limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v && v !== 'all')) }).then(d => setEvents(d.events)).catch(() => setEvents([])).finally(() => setLoading(false))
  }, [filters])
  useEffect(() => { load() }, [load])
  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', gap: '0.5rem' }}>
        <select value={filters.resolved} onChange={e => setFilters(f => ({...f, resolved: e.target.value}))} style={selectStyle}><option value="false">{t('admin.contentAudit.unresolved')}</option><option value="true">{t('admin.contentAudit.resolved')}</option><option value="all">{t('admin.contentAudit.all')}</option></select>
        <select value={filters.flag_type} onChange={e => setFilters(f => ({...f, flag_type: e.target.value}))} style={selectStyle}><option value="all">{t('admin.contentAudit.all')}</option><option value="en_profanity">EN Profanity</option><option value="zh_profanity">ZH Profanity</option><option value="excessive_caps">Caps</option><option value="spam_repetition">Spam</option></select>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : events.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.contentAudit.noData')}</div> : (
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}><thead><tr><th style={thStyle}>User</th><th style={thStyle}>Source</th><th style={thStyle}>Flag</th><th style={thStyle}>Severity</th><th style={thStyle}>Action</th><th style={thStyle}>Time</th><th style={thStyle}></th></tr></thead><tbody>{events.map(ev => <tr key={ev.id}><td style={cellStyle}>{ev.user_email||'—'}</td><td style={cellStyle}>{ev.source}</td><td style={cellStyle}>{ev.flag_type}</td><td style={cellStyle}><span style={sevBadge(ev.severity)}>{ev.severity}</span></td><td style={cellStyle}>{ev.action_taken}</td><td style={cellStyle}>{new Date(ev.created_at).toLocaleString()}</td><td style={cellStyle}>{!ev.resolved && <button onClick={() => setResolveModal(ev)} style={{...btnStyle, background:'rgba(16,185,129,0.15)', color:'#10b981', fontSize:'0.6rem'}}>{t('admin.contentAudit.resolve')}</button>}</td></tr>)}</tbody></table></div>
      )}
      {resolveModal && <ResolveModal event={resolveModal} type="moderation" onClose={() => setResolveModal(null)} onSaved={() => { setResolveModal(null); load() }} />}
    </div>
  )
}

function PromptsTab() {
  const { t } = useTranslation()
  const [configs, setConfigs] = useState<any[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editSystem, setEditSystem] = useState('')
  const [editUser, setEditUser] = useState('')
  const [editVersion, setEditVersion] = useState('')

  const load = useCallback(() => { adminApi.getPromptConfigs().then(d => setConfigs(d.configs)).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  const startEdit = (cfg: any) => { setEditing(cfg.key); setEditSystem(cfg.system_prompt); setEditUser(cfg.user_prompt_template || ''); setEditVersion(cfg.version || 'v1') }
  const save = async () => { if (!editing) return; await adminApi.updatePromptConfig(editing, editSystem, editUser || undefined, editVersion); setEditing(null); load() }

  return (
    <div>
      {configs.map(cfg => (
        <div key={cfg.key} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div><span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{cfg.key}</span><span style={{ fontSize: '0.6rem', color: '#64748b', marginLeft: '0.5rem' }}>v{cfg.version}</span></div>
            <button onClick={() => editing === cfg.key ? setEditing(null) : startEdit(cfg)} style={{ fontSize: '0.65rem', color: '#7C5CFF', background: 'none', border: 'none', cursor: 'pointer' }}>{editing === cfg.key ? t('admin.prompts.cancel') : t('admin.prompts.edit')}</button>
          </div>
          {editing === cfg.key ? (
            <div>
              <textarea value={editSystem} onChange={e => setEditSystem(e.target.value)} rows={6} style={{ width: '100%', padding: '0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.7rem', fontFamily: 'monospace', resize: 'vertical', marginBottom: '0.5rem' }} />
              <textarea value={editUser} onChange={e => setEditUser(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.7rem', fontFamily: 'monospace', resize: 'vertical', marginBottom: '0.5rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input value={editVersion} onChange={e => setEditVersion(e.target.value)} style={{ width: '80px', ...inputStyle }} />
                <button onClick={save} style={{ ...btnStyle, background: '#10b981', color: '#fff' }}>{t('admin.prompts.save')}</button>
              </div>
            </div>
          ) : (
            <pre style={{ background: '#0a0a1a', padding: '0.5rem', borderRadius: '6px', fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'auto', margin: 0 }}>{cfg.system_prompt}</pre>
          )}
        </div>
      ))}
      {configs.length === 0 && <div style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', padding: '2rem' }}>{t('admin.prompts.empty')}</div>}
    </div>
  )
}

function ResolveModal({ event, type, onClose, onSaved }: { event: any; type: 'safety' | 'moderation'; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState('')
  const save = async () => {
    if (type === 'safety') { await adminApi.post(`/safety-events/${event.id}/resolve`, { notes }) }
    else { await adminApi.resolveContentModeration(event.id, notes) }
    onSaved()
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#111827', borderRadius: '10px', padding: '1.25rem', width: '400px', maxWidth: '90vw', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('admin.contentAudit.resolve')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('admin.contentAudit.notesPlaceholder')} rows={3} style={{ width: '100%', padding: '0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.75rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>{t('admin.contentAudit.all')}</button>
          <button onClick={save} style={{ ...btnStyle, background: '#10b981', color: '#fff' }}>{t('admin.contentAudit.resolve')}</button>
        </div>
      </div>
    </div>
  )
}

