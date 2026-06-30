import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'

const inputStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
const btnStyle: React.CSSProperties = { padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }
const cardStyle: React.CSSProperties = { background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem' }
const cellStyle: React.CSSProperties = { padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', whiteSpace: 'nowrap' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }

function statusBadge(status: string): React.CSSProperties {
  const colors: Record<string, string> = { completed: '#10b981', confirmed: '#3b82f6', pending: '#f59e0b', cancelled: '#ef4444', approved: '#10b981', rejected: '#ef4444', resolved: '#10b981', paid: '#3b82f6', refunded: '#8b5cf6' }
  const c = colors[status] || '#64748b'
  return { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, background: `${c}22`, color: c }
}

type Tab = 'practitioners' | 'bookings' | 'reviews' | 'complaints'

export default function MarketplacePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('practitioners')
  const tabs: { key: Tab; label: string }[] = [
    { key: 'practitioners', label: t('admin.marketplace.practitioners') },
    { key: 'bookings', label: t('admin.marketplace.bookings') },
    { key: 'reviews', label: '评价管理' },
    { key: 'complaints', label: '投诉管理' },
  ]
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.marketplace.practitioners')}</h2>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ padding: '0.4rem 0.75rem', border: 'none', borderBottom: tab === tb.key ? '2px solid #7C5CFF' : '2px solid transparent', background: 'transparent', color: tab === tb.key ? '#a78bfa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>{tb.label}</button>
        ))}
      </div>
      {tab === 'practitioners' && <PractitionersTab />}
      {tab === 'bookings' && <BookingsTab />}
      {tab === 'reviews' && <ReviewsTab />}
      {tab === 'complaints' && <ComplaintsTab />}
    </div>
  )
}

function PractitionersTab() {
  const { t } = useTranslation()
  const [practitioners, setPractitioners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ review_status: 'all', is_frozen: 'all', is_verified: 'all' })
  const [selected, setSelected] = useState<any>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getPractitioners({ limit: 50, search: search || undefined, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all')) })
      .then(d => setPractitioners(d.practitioners)).catch(() => setPractitioners([])).finally(() => setLoading(false))
  }, [search, filters])
  useEffect(() => { load() }, [load])

  const doToggle = async (id: string, action: string) => {
    await adminApi.post(`/practitioners/${id}/${action}`)
    load()
  }

  if (selected) return <PractitionerDetail practitionerId={selected.id} onBack={() => { setSelected(null); load() }} />

  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('admin.marketplace.searchPlaceholder')} style={{ ...inputStyle, flex: '1 1 200px', minWidth: '200px' }} />
        <select value={filters.review_status} onChange={e => setFilters(f => ({ ...f, review_status: e.target.value }))} style={selectStyle}>
          <option value="all">审核状态: 全部</option><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已拒绝</option>
        </select>
        <select value={filters.is_verified} onChange={e => setFilters(f => ({ ...f, is_verified: e.target.value }))} style={selectStyle}>
          <option value="all">认证: 全部</option><option value="true">已认证</option><option value="false">未认证</option>
        </select>
        <select value={filters.is_frozen} onChange={e => setFilters(f => ({ ...f, is_frozen: e.target.value }))} style={selectStyle}>
          <option value="all">冻结: 全部</option><option value="true">已冻结</option><option value="false">正常</option>
        </select>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : practitioners.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.marketplace.emptyPractitioners')}</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead><tr>{['name','rating','reviews','price','bookingCount','completionRate','complaintCount','reviewStatus','verified','actions'].map(k => <th key={k} style={thStyle}>{k}</th>)}</tr></thead>
            <tbody>{practitioners.map((p: any) => (
              <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(p)}>
                <td style={cellStyle}>{p.avatar} {p.name}</td>
                <td style={cellStyle}>{parseFloat(p.rating).toFixed(1)}</td>
                <td style={cellStyle}>{p.reviews_count}</td>
                <td style={cellStyle}>¥{p.price_per_session}</td>
                <td style={cellStyle}>{p.booking_count || 0}</td>
                <td style={cellStyle}>{p.booking_count > 0 ? `${Math.round((p.completed_count || 0) / p.booking_count * 100)}%` : '—'}</td>
                <td style={cellStyle}>{p.complaint_count > 0 ? <span style={{ color: '#ef4444', fontSize: '0.6rem' }}>{p.complaint_count}</span> : '0'}</td>
                <td style={cellStyle}><span style={statusBadge(p.review_status)}>{p.review_status}</span></td>
                <td style={cellStyle}>{p.is_verified ? <span style={{ color: '#10b981' }}>✓</span> : '✗'}</td>
                <td style={cellStyle} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => doToggle(p.id, 'toggle-verify')} style={{ ...btnStyle, background: p.is_verified ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: p.is_verified ? '#10b981' : '#64748b', fontSize: '0.6rem' }}>认证</button>
                    <button onClick={() => doToggle(p.id, 'toggle-active')} style={{ ...btnStyle, background: p.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: p.is_active ? '#10b981' : '#ef4444', fontSize: '0.6rem' }}>{p.is_active ? '上架' : '下架'}</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PractitionerDetail({ practitionerId, onBack }: { practitionerId: string; onBack: () => void }) {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [weightModal, setWeightModal] = useState(false)
  const [weight, setWeight] = useState(0)
  const [notesText, setNotesText] = useState('')
  const [freezeModal, setFreezeModal] = useState(false)
  const [freezeReason, setFreezeReason] = useState('')
  const [reviewModal, setReviewModal] = useState<{ action: string; id: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getPractitionerDetail(practitionerId).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [practitionerId])
  useEffect(() => { load() }, [load])

  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div>
  if (!data) return <div style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>Error</div>

  const p = data.practitioner
  const doAction = async (action: string, params?: any) => { await adminApi.post(`/practitioners/${practitionerId}/${action}`, params); load() }
  const doFreeze = async (isFrozen: boolean) => { await adminApi.freezePractitioner(practitionerId, isFrozen, freezeReason); setFreezeModal(false); load() }
  const doWeight = async () => { await adminApi.setPractitionerWeight(practitionerId, weight); setWeightModal(false); load() }
  const doNotes = async () => { await adminApi.setPractitionerNotes(practitionerId, notesText); load() }
  const doReviewAction = async () => {
    if (!reviewModal) return
    if (reviewModal.action === 'flag') await adminApi.flagReview(reviewModal.id, true)
    else if (reviewModal.action === 'hide') await adminApi.hideReview(reviewModal.id, true)
    else if (reviewModal.action === 'delete') await adminApi.deleteReview(reviewModal.id)
    setReviewModal(null); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onBack} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← 返回</button>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{p.avatar} {p.name}</h3>
          <span style={statusBadge(p.review_status)}>{p.review_status}</span>
          {p.is_frozen && <span style={{ color: '#ef4444', fontSize: '0.6rem' }}>已冻结: {p.frozen_reason}</span>}
        </div>
      </div>

      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button onClick={() => doAction('approve')} style={{ ...btnStyle, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>审核通过</button>
        <button onClick={() => doAction('reject')} style={{ ...btnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>审核拒绝</button>
        <button onClick={() => doAction('toggle-active')} style={{ ...btnStyle, background: p.is_active ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: p.is_active ? '#ef4444' : '#10b981' }}>{p.is_active ? '下架' : '上架'}</button>
        <button onClick={() => { setWeight(p.recommend_weight || 0); setWeightModal(true) }} style={{ ...btnStyle, background: 'rgba(124,92,255,0.15)', color: '#a78bfa' }}>推荐权重: {p.recommend_weight || 0}</button>
        <button onClick={() => { setFreezeReason(''); setFreezeModal(true) }} style={{ ...btnStyle, background: p.is_frozen ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: p.is_frozen ? '#10b981' : '#f59e0b' }}>{p.is_frozen ? '解冻' : '冻结'}</button>
      </div>

      <Section title="基础资料">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div><span style={{ color: '#64748b' }}>位置:</span> {p.location}</div>
          <div><span style={{ color: '#64748b' }}>评分:</span> {parseFloat(p.rating).toFixed(1)} ({p.reviews_count}条)</div>
          <div><span style={{ color: '#64748b' }}>价格:</span> ¥{p.price_per_session}</div>
          <div><span style={{ color: '#64748b' }}>专长:</span> {p.specialties?.join(', ')}</div>
          <div><span style={{ color: '#64748b' }}>经验:</span> {p.experience_years}年</div>
          <div><span style={{ color: '#64748b' }}>投诉:</span> {p.complaint_count}条</div>
          <div><span style={{ color: '#64748b' }}>认证:</span> {p.is_verified ? '✓' : '✗'}</div>
          <div><span style={{ color: '#64748b' }}>上架:</span> {p.is_active ? '✓' : '✗'}</div>
          <div><span style={{ color: '#64748b' }}>注册:</span> {new Date(p.created_at).toLocaleDateString()}</div>
        </div>
      </Section>

      <Section title="内部备注">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={notesText} onChange={e => setNotesText(e.target.value)} placeholder="输入备注..." style={{ ...inputStyle, flex: 1 }} />
          <button onClick={doNotes} style={{ ...btnStyle, background: '#7C5CFF', color: '#fff' }}>保存</button>
        </div>
        {p.admin_notes && <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#94a3b8', background: '#0a0a1a', padding: '0.5rem', borderRadius: '6px' }}>{p.admin_notes}</div>}
      </Section>

      <Section title={`用户评价 (${data.reviews?.length || 0})`}>
        {data.reviews?.length > 0 ? data.reviews.map((r: any) => (
          <div key={r.id} style={{ ...cardStyle, opacity: r.is_hidden ? 0.5 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><span style={{ fontSize: '0.7rem', color: '#64748b' }}>{r.user_email}</span><span style={{ fontSize: '0.7rem', marginLeft: '0.5rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span></div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {!r.is_flagged && <button onClick={() => setReviewModal({ action: 'flag', id: r.id })} style={{ ...btnStyle, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.6rem' }}>标记</button>}
                {!r.is_hidden && <button onClick={() => setReviewModal({ action: 'hide', id: r.id })} style={{ ...btnStyle, background: 'rgba(100,116,139,0.15)', color: '#64748b', fontSize: '0.6rem' }}>隐藏</button>}
                <button onClick={() => setReviewModal({ action: 'delete', id: r.id })} style={{ ...btnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.6rem' }}>删除</button>
              </div>
            </div>
            {r.comment && <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>{r.comment}</p>}
            <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '0.25rem' }}>{new Date(r.created_at).toLocaleString()}</div>
          </div>
        )) : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>暂无评价</div>}
      </Section>

      <Section title={`预约记录 (${data.bookings?.length || 0})`}>
        {data.bookings?.length > 0 ? data.bookings.map((b: any) => (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '0.7rem' }}><span style={{ color: '#64748b' }}>{b.user_email}</span> · {b.booking_date?.slice(0,10)} {b.booking_time} · {b.consultation_mode}</div>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <span style={statusBadge(b.status)}>{b.status}</span>
              {b.has_dispute && <span style={{ color: '#ef4444', fontSize: '0.6rem' }}>纠纷{b.dispute_resolved ? '(已解决)' : ''}</span>}
            </div>
          </div>
        )) : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>暂无预约</div>}
      </Section>

      <Section title={`投诉记录 (${data.complaints?.length || 0})`}>
        {data.complaints?.length > 0 ? data.complaints.map((c: any) => (
          <div key={c.id} style={{ ...cardStyle, border: c.status === 'pending' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><span style={statusBadge(c.status)}>{c.status}</span><span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '0.5rem' }}>{c.complaint_type}</span></div>
              <span style={{ fontSize: '0.6rem', color: '#475569' }}>{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>{c.description}</p>
          </div>
        )) : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>暂无投诉</div>}
      </Section>

      {weightModal && <Modal title="设置推荐权重" onClose={() => setWeightModal(false)}>
        <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} min={0} max={100} style={{ ...inputStyle, width: '100%', marginBottom: '0.75rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}><button onClick={() => setWeightModal(false)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>取消</button><button onClick={doWeight} style={{ ...btnStyle, background: '#7C5CFF', color: '#fff' }}>保存</button></div>
      </Modal>}
      {freezeModal && <Modal title={p.is_frozen ? '解冻顾问' : '冻结顾问'} onClose={() => setFreezeModal(false)}>
        {!p.is_frozen && <textarea value={freezeReason} onChange={e => setFreezeReason(e.target.value)} placeholder="冻结原因..." rows={3} style={{ width: '100%', ...inputStyle, resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.75rem' }} />}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}><button onClick={() => setFreezeModal(false)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>取消</button><button onClick={() => doFreeze(!p.is_frozen)} style={{ ...btnStyle, background: p.is_frozen ? '#10b981' : '#f59e0b', color: '#fff' }}>{p.is_frozen ? '解冻' : '冻结'}</button></div>
      </Modal>}
      {reviewModal && <Modal title="处理评价" onClose={() => setReviewModal(null)}>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>确定要{reviewModal.action === 'flag' ? '标记' : reviewModal.action === 'hide' ? '隐藏' : '删除'}该评价吗？</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}><button onClick={() => setReviewModal(null)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>取消</button><button onClick={doReviewAction} style={{ ...btnStyle, background: '#ef4444', color: '#fff' }}>确认</button></div>
      </Modal>}
    </div>
  )
}

function BookingsTab() {
  const { t } = useTranslation()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: 'all', has_dispute: 'all' })
  const [disputeModal, setDisputeModal] = useState<{ id: string; resolution: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.get('/bookings', { limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all')) }).then((d: any) => setBookings(d.bookings)).catch(() => setBookings([])).finally(() => setLoading(false))
  }, [filters])
  useEffect(() => { load() }, [load])

  const doStatus = async (id: string, status: string) => { await adminApi.updateBookingStatus(id, status); load() }

  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', gap: '0.5rem' }}>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
          <option value="all">状态: 全部</option><option value="pending">待确认</option><option value="confirmed">已确认</option><option value="completed">已完成</option><option value="cancelled">已取消</option>
        </select>
        <select value={filters.has_dispute} onChange={e => setFilters(f => ({ ...f, has_dispute: e.target.value }))} style={selectStyle}>
          <option value="all">纠纷: 全部</option><option value="true">有纠纷</option><option value="false">无纠纷</option>
        </select>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : bookings.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>暂无预约</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead><tr>{['user','practitioner','date','time','mode','status','payment','dispute','actions'].map(k => <th key={k} style={thStyle}>{k}</th>)}</tr></thead>
            <tbody>{bookings.map((b: any) => (
              <tr key={b.id}>
                <td style={cellStyle}>{b.user_email}</td>
                <td style={cellStyle}>{b.practitioner_name}</td>
                <td style={cellStyle}>{b.booking_date?.slice(0, 10)}</td>
                <td style={cellStyle}>{b.booking_time}</td>
                <td style={cellStyle}>{b.consultation_mode}</td>
                <td style={cellStyle}><span style={statusBadge(b.status)}>{b.status}</span></td>
                <td style={cellStyle}>{b.payment_status ? <span style={statusBadge(b.payment_status)}>{b.payment_status}{b.payment_amount ? ` ¥${b.payment_amount}` : ''}</span> : '—'}</td>
                <td style={cellStyle}>{b.has_dispute ? <span style={{ color: b.dispute_resolved ? '#10b981' : '#ef4444', fontSize: '0.6rem' }}>{b.dispute_resolved ? '已解决' : '有纠纷'}</span> : '—'}</td>
                <td style={cellStyle}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {b.status === 'pending' && <button onClick={() => doStatus(b.id, 'confirmed')} style={{ ...btnStyle, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontSize: '0.6rem' }}>确认</button>}
                    {b.status === 'confirmed' && <button onClick={() => doStatus(b.id, 'completed')} style={{ ...btnStyle, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.6rem' }}>完成</button>}
                    {b.has_dispute && !b.dispute_resolved && <button onClick={() => setDisputeModal({ id: b.id, resolution: '' })} style={{ ...btnStyle, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.6rem' }}>处理纠纷</button>}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {disputeModal && <Modal title="处理预约纠纷" onClose={() => setDisputeModal(null)}>
        <textarea value={disputeModal.resolution} onChange={e => setDisputeModal({ ...disputeModal, resolution: e.target.value })} placeholder="处理结果..." rows={3} style={{ width: '100%', ...inputStyle, resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.75rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}><button onClick={() => setDisputeModal(null)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>取消</button><button onClick={async () => { await adminApi.resolveDispute(disputeModal.id, disputeModal.resolution); setDisputeModal(null); load() }} style={{ ...btnStyle, background: '#10b981', color: '#fff' }}>确认解决</button></div>
      </Modal>}
    </div>
  )
}

function ReviewsTab() {
  const { t } = useTranslation()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ flagged: 'all', anomaly: 'all' })
  const [anomalyData, setAnomalyData] = useState<any>(null)
  const [showAnomaly, setShowAnomaly] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getReviews({ limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all')) }).then(d => setReviews(d.reviews)).catch(() => setReviews([])).finally(() => setLoading(false))
  }, [filters])
  useEffect(() => { load() }, [load])

  const loadAnomaly = async () => {
    const data = await adminApi.getReviewAnomalies(7)
    setAnomalyData(data)
    setShowAnomaly(true)
  }

  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select value={filters.flagged} onChange={e => setFilters(f => ({ ...f, flagged: e.target.value }))} style={selectStyle}>
          <option value="all">举报: 全部</option><option value="true">已举报</option>
        </select>
        <select value={filters.anomaly} onChange={e => setFilters(f => ({ ...f, anomaly: e.target.value }))} style={selectStyle}>
          <option value="all">异常: 全部</option><option value="true">异常</option>
        </select>
        <button onClick={loadAnomaly} style={{ ...btnStyle, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', marginLeft: 'auto' }}>异常检测</button>
      </div>

      {showAnomaly && anomalyData && (
        <div style={{ ...cardStyle, border: '1px solid rgba(245,158,11,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>异常检测结果</h4>
            <button onClick={() => setShowAnomaly(false)} style={{ fontSize: '0.6rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>收起</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.7rem' }}>
            <div><span style={{ color: '#64748b' }}>频繁评价:</span> <span style={{ color: anomalyData.summary.frequentReviewerCount > 0 ? '#f59e0b' : '#10b981' }}>{anomalyData.summary.frequentReviewerCount}</span></div>
            <div><span style={{ color: '#64748b' }}>无预约评价:</span> <span style={{ color: anomalyData.summary.noBookingCount > 0 ? '#ef4444' : '#10b981' }}>{anomalyData.summary.noBookingCount}</span></div>
            <div><span style={{ color: '#64748b' }}>同IP异常:</span> <span style={{ color: anomalyData.summary.ipClusterCount > 0 ? '#ef4444' : '#10b981' }}>{anomalyData.summary.ipClusterCount}</span></div>
            <div><span style={{ color: '#64748b' }}>评分突变:</span> <span style={{ color: anomalyData.summary.ratingSpikeCount > 0 ? '#f59e0b' : '#10b981' }}>{anomalyData.summary.ratingSpikeCount}</span></div>
          </div>
          {anomalyData.frequentReviewers.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}><div style={{ fontSize: '0.65rem', color: '#f59e0b', marginBottom: '0.25rem' }}>频繁评价用户</div>
              {anomalyData.frequentReviewers.map((r: any) => <div key={r.user_id} style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.email} - {r.review_count}条评价 / {r.practitioner_count}位顾问</div>)}
            </div>
          )}
          {anomalyData.noBookingReviews.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}><div style={{ fontSize: '0.65rem', color: '#ef4444', marginBottom: '0.25rem' }}>无完成预约的评价</div>
              {anomalyData.noBookingReviews.map((r: any) => <div key={r.id} style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.email} 评价了 {r.practitioner_name} - {r.rating}星</div>)}
            </div>
          )}
          {anomalyData.ipClusters.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}><div style={{ fontSize: '0.65rem', color: '#ef4444', marginBottom: '0.25rem' }}>同IP多用户</div>
              {anomalyData.ipClusters.map((r: any, i: number) => <div key={i} style={{ fontSize: '0.7rem', color: '#94a3b8' }}>IP: {r.user_ip} - {r.distinct_users}用户 / {r.review_count}条评价</div>)}
            </div>
          )}
          {anomalyData.ratingSpikes.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}><div style={{ fontSize: '0.65rem', color: '#f59e0b', marginBottom: '0.25rem' }}>评分突变顾问</div>
              {anomalyData.ratingSpikes.map((r: any) => <div key={r.id} style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.name} - 近7天: {r.recent_avg} / 历史: {r.historical_avg}</div>)}
            </div>
          )}
        </div>
      )}

      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : reviews.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>暂无评价</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead><tr>{['user','practitioner','rating','comment','hasBooking','flagged','hidden','7dCount','time'].map(k => <th key={k} style={thStyle}>{k}</th>)}</tr></thead>
            <tbody>{reviews.map(r => (
              <tr key={r.id} style={{ opacity: r.is_hidden ? 0.5 : 1 }}>
                <td style={cellStyle}>{r.user_email || '—'}</td>
                <td style={cellStyle}>{r.practitioner_name || '—'}</td>
                <td style={cellStyle}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                <td style={cellStyle} title={r.comment}>{r.comment?.slice(0, 40) || '—'}</td>
                <td style={cellStyle}>{r.has_completed_booking ? <span style={{ color: '#10b981' }}>✓</span> : <span style={{ color: '#ef4444' }}>✗</span>}</td>
                <td style={cellStyle}>{r.is_flagged ? <span style={{ color: '#f59e0b' }}>✓</span> : '—'}</td>
                <td style={cellStyle}>{r.is_hidden ? <span style={{ color: '#ef4444' }}>✓</span> : '—'}</td>
                <td style={cellStyle}>{r.user_review_count_7d || 0}</td>
                <td style={cellStyle}>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ComplaintsTab() {
  const { t } = useTranslation()
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: 'all' })
  const [resolveModal, setResolveModal] = useState<{ id: string; resolution: string; status: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getPractitionerComplaints({ limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all')) }).then(d => setComplaints(d.complaints)).catch(() => setComplaints([])).finally(() => setLoading(false))
  }, [filters])
  useEffect(() => { load() }, [load])

  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', gap: '0.5rem' }}>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
          <option value="all">状态: 全部</option><option value="pending">待处理</option><option value="resolved">已解决</option><option value="rejected">已拒绝</option>
        </select>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : complaints.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>暂无投诉</div> : complaints.map(c => (
        <div key={c.id} style={{ ...cardStyle, border: c.status === 'pending' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span style={statusBadge(c.status)}>{c.status}</span><span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '0.5rem' }}>{c.complaint_type} · {c.practitioner_name} · {c.user_email}</span></div>
            <span style={{ fontSize: '0.6rem', color: '#475569' }}>{new Date(c.created_at).toLocaleString()}</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>{c.description}</p>
          {c.resolution && <p style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.25rem' }}>处理: {c.resolution}</p>}
          {c.status === 'pending' && <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
            <button onClick={() => setResolveModal({ id: c.id, resolution: '', status: 'resolved' })} style={{ ...btnStyle, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.6rem' }}>解决</button>
            <button onClick={() => setResolveModal({ id: c.id, resolution: '', status: 'rejected' })} style={{ ...btnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.6rem' }}>拒绝</button>
          </div>}
        </div>
      ))}
      {resolveModal && <Modal title="处理投诉" onClose={() => setResolveModal(null)}>
        <textarea value={resolveModal.resolution} onChange={e => setResolveModal({ ...resolveModal, resolution: e.target.value })} placeholder="处理结果..." rows={3} style={{ width: '100%', ...inputStyle, resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.75rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}><button onClick={() => setResolveModal(null)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>取消</button><button onClick={async () => { await adminApi.resolveComplaint(resolveModal.id, resolveModal.resolution, resolveModal.status); setResolveModal(null); load() }} style={{ ...btnStyle, background: '#10b981', color: '#fff' }}>确认</button></div>
      </Modal>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={cardStyle}><h4 style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{title}</h4>{children}</div>
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#111827', borderRadius: '10px', padding: '1.25rem', width: '400px', maxWidth: '90vw', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}><h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{title}</h3><button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>✕</button></div>
        {children}
      </div>
    </div>
  )
}
