import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'

const inputStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
const btnStyle: React.CSSProperties = { padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }
const cardStyle: React.CSSProperties = { background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem' }
const cellStyle: React.CSSProperties = { padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', whiteSpace: 'nowrap' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }

function typeBadge(type: string): React.CSSProperties {
  const colors: Record<string, string> = { tarot: '#8b5cf6', astrology: '#3b82f6', bazi: '#10b981', ziwei: '#f59e0b', numerology: '#ef4444', natal: '#3b82f6' }
  const c = colors[type] || '#64748b'
  return { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, background: `${c}22`, color: c }
}

type Tab = 'list' | 'reports'

export default function ReadingsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('list')
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.readings.title')}</h2>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setTab('list')} style={{ padding: '0.4rem 0.75rem', border: 'none', borderBottom: tab === 'list' ? '2px solid #7C5CFF' : '2px solid transparent', background: 'transparent', color: tab === 'list' ? '#a78bfa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>{t('admin.readings.tabs.list')}</button>
        <button onClick={() => setTab('reports')} style={{ padding: '0.4rem 0.75rem', border: 'none', borderBottom: tab === 'reports' ? '2px solid #7C5CFF' : '2px solid transparent', background: 'transparent', color: tab === 'reports' ? '#a78bfa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>{t('admin.readings.tabs.reports')}</button>
      </div>
      {tab === 'list' && <ReadingsListTab />}
      {tab === 'reports' && <ReportsTab />}
    </div>
  )
}

function ReadingsListTab() {
  const { t } = useTranslation()
  const [readings, setReadings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: 'all', is_reported: 'all', is_flagged: 'all', language: 'all', created_after: '' })
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = { limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all')) }
    adminApi.getReadings(params).then(d => setReadings(d.readings)).catch(() => setReadings([])).finally(() => setLoading(false))
  }, [filters])
  useEffect(() => { load() }, [load])

  const openDetail = async (r: any) => {
    setSelected(r)
    try { const d = await adminApi.getReadingDetail(r.type, r.id); setDetail(d.reading) } catch { setDetail(null) }
  }

  if (selected && detail) return <ReadingDetail reading={detail} type={selected.type} onBack={() => { setSelected(null); setDetail(null); load() }} />

  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} style={selectStyle}>
          <option value="all">{t('admin.readings.all')}</option>
          <option value="tarot">{t('admin.readings.tarot')}</option><option value="astrology">{t('admin.readings.astrology')}</option><option value="bazi">{t('admin.readings.bazi')}</option><option value="ziwei">{t('admin.readings.ziwei')}</option><option value="numerology">{t('admin.readings.numerology')}</option>
        </select>
        <select value={filters.is_reported} onChange={e => setFilters(f => ({ ...f, is_reported: e.target.value }))} style={selectStyle}>
          <option value="all">{t('admin.readings.isReported')}: {t('admin.readings.all')}</option><option value="true">{t('admin.readings.yes')}</option><option value="false">{t('admin.readings.no')}</option>
        </select>
        <select value={filters.is_flagged} onChange={e => setFilters(f => ({ ...f, is_flagged: e.target.value }))} style={selectStyle}>
          <option value="all">{t('admin.readings.isFlagged')}: {t('admin.readings.all')}</option><option value="true">{t('admin.readings.yes')}</option><option value="false">{t('admin.readings.no')}</option>
        </select>
        <select value={filters.language} onChange={e => setFilters(f => ({ ...f, language: e.target.value }))} style={selectStyle}>
          <option value="all">{t('admin.readings.language')}: {t('admin.readings.all')}</option>
          <option value="zh">ZH</option><option value="en">EN</option><option value="vi">VI</option><option value="th">TH</option><option value="my">MY</option>
        </select>
        <input type="date" value={filters.created_after} onChange={e => setFilters(f => ({ ...f, created_after: e.target.value }))} style={inputStyle} />
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : readings.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.readings.noData')}</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead><tr>{['readingType','user','language','promptVersion','isReported','isFlagged','created'].map(k => <th key={k} style={thStyle}>{t(`admin.readings.${k}`)}</th>)}</tr></thead>
            <tbody>{readings.map(r => (
              <tr key={r.id} onClick={() => openDetail(r)} style={{ cursor: 'pointer' }}>
                <td style={cellStyle}><span style={typeBadge(r.reading_type)}>{r.reading_type}</span></td>
                <td style={cellStyle}>{r.user_email || '—'}</td>
                <td style={cellStyle}>{r.language || '—'}</td>
                <td style={cellStyle}>{r.prompt_version || '—'}</td>
                <td style={cellStyle}>{r.is_reported ? <span style={{ color: '#ef4444', fontSize: '0.6rem' }}>{t('admin.readings.yes')}</span> : '—'}</td>
                <td style={cellStyle}>{r.is_flagged ? <span style={{ color: '#f59e0b', fontSize: '0.6rem' }}>{t('admin.readings.yes')}</span> : '—'}</td>
                <td style={cellStyle}>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ReadingDetail({ reading, type, onBack }: { reading: any; type: string; onBack: () => void }) {
  const { t } = useTranslation()
  const [flagModal, setFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const doFlag = async (isFlagged: boolean) => { await adminApi.flagReading(type, reading.id, isFlagged, flagReason); setFlagModal(false); setFlagReason(''); onBack() }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onBack} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← Back</button>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('admin.readings.detail')}</h3>
          <span style={typeBadge(type)}>{reading.reading_type || type}</span>
          {reading.is_flagged && <span style={{ color: '#f59e0b', fontSize: '0.6rem' }}>{t('admin.readings.flagReason')}: {reading.flag_reason || '—'}</span>}
        </div>
        <button onClick={() => setFlagModal(true)} style={{ ...btnStyle, background: reading.is_flagged ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: reading.is_flagged ? '#10b981' : '#f59e0b' }}>{reading.is_flagged ? t('admin.readings.unflag') : t('admin.readings.flag')}</button>
      </div>

      <div style={cardStyle}>
        <h4 style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('admin.readings.user')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div><span style={{ color: '#64748b' }}>Email:</span> {reading.user_email || '—'}</div>
          <div><span style={{ color: '#64748b' }}>{t('admin.readings.language')}:</span> {reading.language || '—'}</div>
          <div><span style={{ color: '#64748b' }}>{t('admin.readings.promptVersion')}:</span> {reading.prompt_version || '—'}</div>
          <div><span style={{ color: '#64748b' }}>{t('admin.readings.created')}:</span> {new Date(reading.created_at).toLocaleString()}</div>
          {reading.question && <div><span style={{ color: '#64748b' }}>{t('admin.readings.question')}:</span> {reading.question}</div>}
          {reading.spread_type && <div><span style={{ color: '#64748b' }}>{t('admin.readings.spreadType')}:</span> {reading.spread_type}</div>}
        </div>
      </div>

      {reading.birth_data && <div style={cardStyle}><h4 style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('admin.readings.inputParams')}</h4><pre style={{ background: '#0a0a1a', padding: '0.5rem', borderRadius: '6px', fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto', margin: 0 }}>{typeof reading.birth_data === 'string' ? reading.birth_data : JSON.stringify(reading.birth_data, null, 2)}</pre></div>}
      {reading.chart_data && <div style={cardStyle}><h4 style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('admin.readings.chartData')}</h4><pre style={{ background: '#0a0a1a', padding: '0.5rem', borderRadius: '6px', fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto', margin: 0 }}>{typeof reading.chart_data === 'string' ? reading.chart_data : JSON.stringify(reading.chart_data, null, 2)}</pre></div>}

      <div style={cardStyle}>
        <h4 style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('admin.readings.readingText')}</h4>
        <div style={{ background: '#0a0a1a', padding: '0.5rem', borderRadius: '6px', fontSize: '0.7rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: '400px', overflow: 'auto' }}>{reading.reading_text || '—'}</div>
      </div>

      {flagModal && (
        <div onClick={() => setFlagModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', borderRadius: '10px', padding: '1.25rem', width: '400px', maxWidth: '90vw', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>{reading.is_flagged ? t('admin.readings.unflag') : t('admin.readings.flag')}</h3>
            {!reading.is_flagged && <textarea value={flagReason} onChange={e => setFlagReason(e.target.value)} placeholder={t('admin.readings.flagPlaceholder')} rows={3} style={{ width: '100%', padding: '0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.75rem' }} />}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setFlagModal(false)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>{t('admin.payments.cancel')}</button>
              <button onClick={() => doFlag(!reading.is_flagged)} style={{ ...btnStyle, background: reading.is_flagged ? '#10b981' : '#f59e0b', color: '#fff' }}>{t('admin.payments.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReportsTab() {
  const { t } = useTranslation()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); adminApi.getReadingReports({ limit: 50 }).then(d => setReports(d.reports)).catch(() => setReports([])).finally(() => setLoading(false)) }, [])
  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div>
  if (reports.length === 0) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.readings.noData')}</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
        <thead><tr>{['readingType','user','reason','resolved','created'].map(k => <th key={k} style={thStyle}>{t(`admin.readings.${k}`)}</th>)}</tr></thead>
        <tbody>{reports.map(r => <tr key={r.id}><td style={cellStyle}><span style={typeBadge(r.reading_type)}>{r.reading_type}</span></td><td style={cellStyle}>{r.user_email || '—'}</td><td style={cellStyle}>{r.reason}</td><td style={cellStyle}>{r.resolved ? <span style={{ color: '#10b981', fontSize: '0.6rem' }}>✓</span> : '—'}</td><td style={cellStyle}>{new Date(r.created_at).toLocaleDateString()}</td></tr>)}</tbody>
      </table>
    </div>
  )
}
