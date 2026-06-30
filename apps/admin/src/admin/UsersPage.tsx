import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'

const inputStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem', background: '#0a0a1a',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
  color: '#e2e8f0', fontSize: '0.75rem',
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
const btnStyle: React.CSSProperties = {
  padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none',
  fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
}
const cardStyle: React.CSSProperties = {
  background: '#111827', borderRadius: '8px', padding: '0.75rem',
  border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem',
}
const cellStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0',
}

function tierBadge(tier: string): React.CSSProperties {
  const colors: Record<string, string> = { free: '#64748b', plus: '#3b82f6', premium: '#f59e0b' }
  const c = colors[tier] || '#64748b'
  return { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, background: `${c}22`, color: c }
}
const activeBadge: React.CSSProperties = { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', background: 'rgba(16,185,129,0.15)', color: '#10b981' }
const inactiveBadge: React.CSSProperties = { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
const riskBadge: React.CSSProperties = { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }

export default function UsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    language: 'all', tier: 'all', is_active: 'all', is_high_risk: 'all',
    created_after: '', created_before: '', last_active_after: '', last_active_before: '',
  })
  const [page, setPage] = useState(0)
  const limit = 25

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getUsers({
      limit, offset: page * limit, search: search || undefined,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all')),
    }).then(d => { setUsers(d.users); setTotal(d.total) })
      .catch(() => { setUsers([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [search, filters, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (selectedId) {
    return <UserDetail userId={selectedId} onBack={() => { setSelectedId(null); load() }} />
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.users.title')}</h2>

      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder={t('admin.users.searchPlaceholder')}
          style={{ ...inputStyle, flex: '1 1 200px', minWidth: '200px' }}
        />
        <select value={filters.language} onChange={e => { setFilters(f => ({ ...f, language: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.users.languageFilter')}: {t('admin.users.all')}</option>
          <option value="en">EN</option><option value="zh">ZH</option><option value="vi">VI</option><option value="th">TH</option><option value="my">MY</option>
        </select>
        <select value={filters.tier} onChange={e => { setFilters(f => ({ ...f, tier: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.users.tierFilter')}: {t('admin.users.all')}</option>
          <option value="free">{t('admin.users.free')}</option><option value="plus">{t('admin.users.plus')}</option><option value="premium">{t('admin.users.premium')}</option>
        </select>
        <select value={filters.is_active} onChange={e => { setFilters(f => ({ ...f, is_active: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.users.activeFilter')}: {t('admin.users.all')}</option>
          <option value="true">{t('admin.users.activeStatus')}</option><option value="false">{t('admin.users.inactiveStatus')}</option>
        </select>
        <select value={filters.is_high_risk} onChange={e => { setFilters(f => ({ ...f, is_high_risk: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.users.riskFilter')}: {t('admin.users.all')}</option>
          <option value="true">{t('admin.users.yes')}</option><option value="false">{t('admin.users.no')}</option>
        </select>
      </div>

      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.65rem', color: '#64748b' }}>{t('admin.users.created')}:</label>
        <input type="date" value={filters.created_after} onChange={e => { setFilters(f => ({ ...f, created_after: e.target.value })); setPage(0) }} style={inputStyle} />
        <span style={{ color: '#64748b', fontSize: '0.65rem' }}>—</span>
        <input type="date" value={filters.created_before} onChange={e => { setFilters(f => ({ ...f, created_before: e.target.value })); setPage(0) }} style={inputStyle} />
        <label style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '0.5rem' }}>{t('admin.users.lastActive')}:</label>
        <input type="date" value={filters.last_active_after} onChange={e => { setFilters(f => ({ ...f, last_active_after: e.target.value })); setPage(0) }} style={inputStyle} />
        <span style={{ color: '#64748b', fontSize: '0.65rem' }}>—</span>
        <input type="date" value={filters.last_active_before} onChange={e => { setFilters(f => ({ ...f, last_active_before: e.target.value })); setPage(0) }} style={inputStyle} />
      </div>

      {loading ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div>
      ) : users.length === 0 ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.users.noData')}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr>
                {['email', 'name', 'language', 'region', 'tier', 'active', 'highRisk', 'created', 'lastActive'].map(k => (
                  <th key={k} style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.65rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {t(`admin.users.${k}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} onClick={() => setSelectedId(u.id)} style={{ cursor: 'pointer' }}>
                  <td style={cellStyle}>{u.email}</td>
                  <td style={cellStyle}>{u.name}</td>
                  <td style={cellStyle}>{u.language}</td>
                  <td style={cellStyle}>{u.region || '—'}</td>
                  <td style={cellStyle}><span style={tierBadge(u.subscription_tier)}>{u.subscription_tier}</span></td>
                  <td style={cellStyle}><span style={u.is_active ? activeBadge : inactiveBadge}>{u.is_active ? t('admin.users.activeStatus') : t('admin.users.inactiveStatus')}</span></td>
                  <td style={cellStyle}>{u.is_high_risk ? <span style={riskBadge}>{t('admin.users.yes')}</span> : '—'}</td>
                  <td style={cellStyle}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={cellStyle}>{u.last_active ? new Date(u.last_active).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{t('admin.users.totalUsers', { count: total })}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ ...btnStyle, background: page === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(124,92,255,0.15)', color: page === 0 ? '#475569' : '#a78bfa' }}>
            {t('admin.users.prev')}
          </button>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t('admin.users.page', { page: page + 1, total: totalPages })}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ ...btnStyle, background: page >= totalPages - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(124,92,255,0.15)', color: page >= totalPages - 1 ? '#475569' : '#a78bfa' }}>
            {t('admin.users.next')}
          </button>
        </div>
      </div>
    </div>
  )
}

function UserDetail({ userId, onBack }: { userId: string; onBack: () => void }) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSubModal, setShowSubModal] = useState(false)
  const [showRiskModal, setShowRiskModal] = useState(false)
  const [noteText, setNoteText] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getUser(userId).then(setDetail).catch(() => setDetail(null)).finally(() => setLoading(false))
  }, [userId])
  useEffect(() => { load() }, [load])

  const doToggle = async () => {
    if (!detail) return
    const reason = window.prompt(t('admin.users.reasonPlaceholder'), '')
    if (reason === null) return
    await adminApi.toggleUser(userId, reason)
    load()
  }

  const doExport = async () => {
    try {
      const data = await adminApi.exportUserData(userId)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `user-${userId}-export.json`; a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    await adminApi.addUserNote(userId, noteText)
    setNoteText('')
    load()
  }

  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div>
  if (!detail) return <div style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>Error</div>

  const u = detail.user

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onBack} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← {t('admin.users.back')}</button>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{u.email}</h2>
          <span style={tierBadge(u.subscription_tier)}>{u.subscription_tier}</span>
          <span style={u.is_active ? activeBadge : inactiveBadge}>{u.is_active ? t('admin.users.activeStatus') : t('admin.users.inactiveStatus')}</span>
          {u.is_high_risk && <span style={riskBadge}>{t('admin.users.highRisk')}</span>}
        </div>
      </div>

      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button onClick={doToggle} style={{ ...btnStyle, background: u.is_active ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: u.is_active ? '#ef4444' : '#10b981' }}>
          {u.is_active ? t('admin.users.disable') : t('admin.users.enable')}
        </button>
        <button onClick={() => setShowSubModal(true)} style={{ ...btnStyle, background: 'rgba(124,92,255,0.15)', color: '#a78bfa' }}>{t('admin.users.adjustSubscription')}</button>
        <button onClick={() => setShowRiskModal(true)} style={{ ...btnStyle, background: u.is_high_risk ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: u.is_high_risk ? '#10b981' : '#f59e0b' }}>
          {u.is_high_risk ? t('admin.users.unmarkHighRisk') : t('admin.users.markHighRisk')}
        </button>
        <button onClick={doExport} style={{ ...btnStyle, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>{t('admin.users.exportData')}</button>
      </div>

      <Section title={t('admin.users.profile')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
          <Field label={t('admin.users.name')} value={u.name} />
          <Field label={t('admin.users.email')} value={u.email} />
          <Field label={t('admin.users.language')} value={u.language} />
          <Field label={t('admin.users.region')} value={u.region || '—'} />
          <Field label={t('admin.users.birthDate')} value={u.birth_date || '—'} />
          <Field label={t('admin.users.birthTime')} value={u.birth_time || '—'} />
          <Field label={t('admin.users.birthPlace')} value={u.birth_place || '—'} />
          <Field label={t('admin.users.created')} value={new Date(u.created_at).toLocaleString()} />
          <Field label={t('admin.users.lastActive')} value={u.subscription_end_date ? new Date(u.subscription_end_date).toLocaleDateString() : '—'} />
        </div>
        {u.is_high_risk && u.risk_reason && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#f59e0b' }}>
            {t('admin.users.highRisk')}: {u.risk_reason}
            {u.risk_marked_at && ` (${new Date(u.risk_marked_at).toLocaleString()})`}
          </div>
        )}
      </Section>

      <Section title={t('admin.users.subscriptionHistory')}>
        {detail.subscriptions?.length > 0 ? (
          <DataTable headers={[t('admin.users.tier'), t('admin.users.start'), t('admin.users.end'), t('admin.users.active')]}
            rows={detail.subscriptions.map((s: any) => [s.tier, s.start_date?.slice(0, 10), s.end_date?.slice(0, 10) || '—', s.is_active ? '✓' : '✗'])} />
        ) : <Empty />}
      </Section>

      <Section title={t('admin.users.status')}>
        {detail.payments?.length > 0 ? (
          <DataTable headers={[t('admin.users.orderId'), t('admin.users.plan'), t('admin.users.amount'), t('admin.users.method'), t('admin.users.status'), t('admin.users.created')]}
            rows={detail.payments.map((p: any) => [p.order_id?.slice(0, 16) || '—', p.plan_id, `${p.currency} ${p.amount}`, p.payment_method, p.payment_status, new Date(p.created_at).toLocaleDateString()])} />
        ) : <Empty />}
      </Section>

      <Section title={t('admin.users.aiChat')}>
        {detail.chatSessions?.length > 0 ? (
          <DataTable headers={[t('admin.users.advisor'), t('admin.users.sessionTitle'), t('admin.users.messageCount'), t('admin.users.lastMessage'), t('admin.users.created')]}
            rows={detail.chatSessions.map((s: any) => [s.advisor_key, s.title || '—', s.message_count, s.last_message?.slice(0, 50) || '—', new Date(s.created_at).toLocaleDateString()])} />
        ) : <Empty />}
      </Section>

      <Section title={t('admin.users.tarotReadings')}>
        {detail.tarotReadings?.length > 0 ? (
          <DataTable headers={[t('admin.users.question'), t('admin.users.spreadType'), t('admin.users.reading'), t('admin.users.created')]}
            rows={detail.tarotReadings.map((r: any) => [r.question?.slice(0, 30) || '—', r.spread_type, r.reading_preview?.slice(0, 50) || '—', new Date(r.created_at).toLocaleDateString()])} />
        ) : <Empty />}
      </Section>

      <Section title={t('admin.users.astrologyReadings')}>
        {detail.astrologyReadings?.length > 0 ? (
          <DataTable headers={[t('admin.users.readingType'), t('admin.users.reading'), t('admin.users.created')]}
            rows={detail.astrologyReadings.map((r: any) => [r.reading_type, r.reading_preview?.slice(0, 50) || '—', new Date(r.created_at).toLocaleDateString()])} />
        ) : <Empty />}
      </Section>

      <Section title={t('admin.users.community')}>
        {detail.communityPosts?.length > 0 && (
          <DataTable headers={[t('admin.users.category'), t('admin.users.postTitle'), t('admin.users.likes'), t('admin.users.count'), t('admin.users.created')]}
            rows={detail.communityPosts.map((p: any) => [p.category, p.title?.slice(0, 30), p.likes_count, p.comments_count, new Date(p.created_at).toLocaleDateString()])} />
        )}
        {detail.communityComments?.length > 0 && (
          <DataTable headers={[t('admin.users.postTitle'), t('admin.users.commentContent'), t('admin.users.created')]}
            rows={detail.communityComments.map((c: any) => [c.post_title?.slice(0, 30), c.content?.slice(0, 50), new Date(c.created_at).toLocaleDateString()])} />
        )}
        {(!detail.communityPosts?.length && !detail.communityComments?.length) && <Empty />}
      </Section>

      <Section title={t('admin.users.marketplace')}>
        {detail.bookings?.length > 0 && (
          <DataTable headers={[t('admin.users.practitioner'), t('admin.users.bookingDate'), t('admin.users.mode'), t('admin.users.bookingStatus'), t('admin.users.created')]}
            rows={detail.bookings.map((b: any) => [b.practitioner_name, b.booking_date, b.consultation_mode, b.status, new Date(b.created_at).toLocaleDateString()])} />
        )}
        {detail.practitionerReviews?.length > 0 && (
          <DataTable headers={[t('admin.users.practitioner'), t('admin.users.rating'), t('admin.users.reviewContent'), t('admin.users.created')]}
            rows={detail.practitionerReviews.map((r: any) => [r.practitioner_name, `${r.rating}/5`, r.comment?.slice(0, 50) || '—', new Date(r.created_at).toLocaleDateString()])} />
        )}
        {(!detail.bookings?.length && !detail.practitionerReviews?.length) && <Empty />}
      </Section>

      <Section title={t('admin.users.aiUsage')}>
        {detail.aiRequestSummary?.length > 0 ? (
          <DataTable headers={[t('admin.users.requestType'), t('admin.users.count'), t('admin.users.avgLatency'), t('admin.users.totalTokens'), t('admin.users.lastUsed')]}
            rows={detail.aiRequestSummary.map((a: any) => [a.request_type, a.count, `${a.avg_latency}ms`, a.total_tokens || '—', a.last_used ? new Date(a.last_used).toLocaleDateString() : '—'])} />
        ) : <Empty />}
      </Section>

      <Section title={t('admin.users.privacy')}>
        {detail.privacyStatus?.length > 0 ? (
          <DataTable headers={[t('admin.users.status'), t('admin.users.created')]}
            rows={detail.privacyStatus.map((p: any) => [p.action, new Date(p.created_at).toLocaleString()])} />
        ) : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t('admin.users.noPrivacy')}</div>}
      </Section>

      <Section title={t('admin.users.internalNotes')}>
        {detail.notes?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {detail.notes.map((n: any) => (
              <div key={n.id} style={{ background: '#0a0a1a', borderRadius: '6px', padding: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ color: '#e2e8f0' }}>{n.note}</div>
                <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.25rem' }}>{n.admin_email} · {new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem' }}>{t('admin.users.noNotes')}</div>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder={t('admin.users.notePlaceholder')}
            style={{ ...inputStyle, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') addNote() }} />
          <button onClick={addNote} style={{ ...btnStyle, background: '#7C5CFF', color: '#fff' }}>{t('admin.users.addNote')}</button>
        </div>
      </Section>

      {showSubModal && <SubModal userId={userId} currentTier={u.subscription_tier} onClose={() => setShowSubModal(false)} onSaved={() => { setShowSubModal(false); load() }} />}
      {showRiskModal && <RiskModal userId={userId} currentRisk={u.is_high_risk} onClose={() => setShowRiskModal(false)} onSaved={() => { setShowRiskModal(false); load() }} />}
    </div>
  )
}

function SubModal({ userId, currentTier, onClose, onSaved }: { userId: string; currentTier: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [tier, setTier] = useState(currentTier)
  const [reason, setReason] = useState('')
  const save = async () => {
    if (!reason.trim()) return
    await adminApi.updateSubscription(userId, tier, reason)
    onSaved()
  }
  return (
    <Modal onClose={onClose} title={t('admin.users.adjustSubscription')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <select value={tier} onChange={e => setTier(e.target.value)} style={selectStyle}>
          <option value="free">{t('admin.users.free')}</option>
          <option value="plus">{t('admin.users.plus')}</option>
          <option value="premium">{t('admin.users.premium')}</option>
        </select>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={t('admin.users.reasonPlaceholder')} rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>{t('admin.users.cancel')}</button>
          <button onClick={save} disabled={!reason.trim()} style={{ ...btnStyle, background: reason.trim() ? '#10b981' : 'rgba(16,185,129,0.3)', color: '#fff' }}>{t('admin.users.save')}</button>
        </div>
      </div>
    </Modal>
  )
}

function RiskModal({ userId, currentRisk, onClose, onSaved }: { userId: string; currentRisk: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const save = async () => {
    await adminApi.markRisk(userId, reason, !currentRisk)
    onSaved()
  }
  return (
    <Modal onClose={onClose} title={currentRisk ? t('admin.users.unmarkHighRisk') : t('admin.users.markHighRisk')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {!currentRisk && (
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={t('admin.users.reasonPlaceholder')} rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        )}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>{t('admin.users.cancel')}</button>
          <button onClick={save} style={{ ...btnStyle, background: '#f59e0b', color: '#fff' }}>{t('admin.users.save')}</button>
        </div>
      </div>
    </Modal>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#111827', borderRadius: '10px', padding: '1.25rem', width: '400px', maxWidth: '90vw', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: '#64748b', fontSize: '0.65rem' }}>{label}:</span>{' '}
      <span style={{ color: '#e2e8f0' }}>{value}</span>
    </div>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: any[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
        <thead>
          <tr>{headers.map(h => <th key={h} style={{ textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', whiteSpace: 'nowrap' }}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Empty() {
  const { t } = useTranslation()
  return <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t('admin.users.noData')}</div>
}
