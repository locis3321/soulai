import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'

const inputStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
const btnStyle: React.CSSProperties = { padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }
const cardStyle: React.CSSProperties = { background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem' }
const cellStyle: React.CSSProperties = { padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', whiteSpace: 'nowrap' }

function statusBadge(status: string): React.CSSProperties {
  const colors: Record<string, string> = { completed: '#10b981', pending: '#f59e0b', failed: '#ef4444', cancelled: '#64748b' }
  const c = colors[status] || '#64748b'
  return { display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, background: `${c}22`, color: c }
}

type Tab = 'orders' | 'subscriptions' | 'callbackLogs' | 'refunds' | 'analytics'

export default function PaymentsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('orders')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'orders', label: t('admin.payments.tabs.orders') },
    { key: 'subscriptions', label: t('admin.payments.tabs.subscriptions') },
    { key: 'callbackLogs', label: t('admin.payments.tabs.callbackLogs') },
    { key: 'refunds', label: t('admin.payments.tabs.refunds') },
    { key: 'analytics', label: t('admin.payments.tabs.analytics') },
  ]

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.payments.title')}</h2>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            padding: '0.4rem 0.75rem', border: 'none', borderBottom: tab === tb.key ? '2px solid #7C5CFF' : '2px solid transparent',
            background: 'transparent', color: tab === tb.key ? '#a78bfa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
          }}>{tb.label}</button>
        ))}
      </div>
      {tab === 'orders' && <OrdersTab />}
      {tab === 'subscriptions' && <SubscriptionsTab />}
      {tab === 'callbackLogs' && <CallbackLogsTab />}
      {tab === 'refunds' && <RefundsTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  )
}

function OrdersTab() {
  const { t } = useTranslation()
  const [payments, setPayments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: 'all', method: 'all', refund_status: 'all', created_after: '', created_before: '' })
  const [page, setPage] = useState(0)
  const [actionPayment, setActionPayment] = useState<any>(null)
  const [refundPayment, setRefundPayment] = useState<any>(null)
  const limit = 25

  const load = useCallback(() => {
    setLoading(true)
    const params = { limit, offset: page * limit, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all')) }
    adminApi.getPayments(params).then(d => { setPayments(d.payments); setTotal(d.total) }).catch(() => { setPayments([]); setTotal(0) }).finally(() => setLoading(false))
  }, [filters, page])
  useEffect(() => { load() }, [load])

  const doExport = async () => {
    try {
      const resp = await adminApi.exportPaymentsCsv({ status: filters.status !== 'all' ? filters.status : undefined, method: filters.method !== 'all' ? filters.method : undefined })
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'text/csv' }))
      const a = document.createElement('a'); a.href = url; a.download = `payments-${new Date().toISOString().slice(0,10)}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.payments.status')}: {t('admin.payments.all')}</option>
          <option value="pending">{t('admin.payments.pending')}</option><option value="completed">{t('admin.payments.completed')}</option><option value="failed">{t('admin.payments.failed')}</option><option value="cancelled">{t('admin.payments.cancelled')}</option>
        </select>
        <select value={filters.method} onChange={e => { setFilters(f => ({ ...f, method: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.payments.paymentMethod')}: {t('admin.payments.all')}</option>
          <option value="alipay">Alipay</option><option value="wechat">WeChat Pay</option>
        </select>
        <select value={filters.refund_status} onChange={e => { setFilters(f => ({ ...f, refund_status: e.target.value })); setPage(0) }} style={selectStyle}>
          <option value="all">{t('admin.payments.refundStatus')}: {t('admin.payments.all')}</option>
          <option value="none">{t('admin.payments.none')}</option><option value="partial">{t('admin.payments.partial')}</option><option value="full">{t('admin.payments.full')}</option>
        </select>
        <input type="date" value={filters.created_after} onChange={e => { setFilters(f => ({ ...f, created_after: e.target.value })); setPage(0) }} style={inputStyle} />
        <span style={{ color: '#64748b', fontSize: '0.65rem' }}>—</span>
        <input type="date" value={filters.created_before} onChange={e => { setFilters(f => ({ ...f, created_before: e.target.value })); setPage(0) }} style={inputStyle} />
        <button onClick={doExport} style={{ ...btnStyle, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', marginLeft: 'auto' }}>{t('admin.payments.exportCsv')}</button>
      </div>

      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : payments.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.payments.noData')}</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead><tr>{['orderId','user','plan','amount','method','status','refundStatus','failureReason','created'].map(k => <th key={k} style={{ textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{t(`admin.payments.${k}`)}</th>)}</tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={cellStyle}>{p.order_id?.slice(0, 20)}</td>
                  <td style={cellStyle}>{p.user_email}</td>
                  <td style={cellStyle}>{p.plan_id}</td>
                  <td style={cellStyle}>{p.currency} {p.amount}</td>
                  <td style={cellStyle}>{p.payment_method}</td>
                  <td style={cellStyle}><span style={statusBadge(p.payment_status)}>{p.payment_status}</span></td>
                  <td style={cellStyle}>{p.refund_status !== 'none' ? <span style={{ color: '#f59e0b', fontSize: '0.6rem' }}>{p.refund_status} ({p.refunded_amount})</span> : '—'}</td>
                  <td style={cellStyle} title={p.failure_reason || ''}>{p.failure_reason?.slice(0, 30) || '—'}</td>
                  <td style={cellStyle}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={cellStyle}><button onClick={() => setActionPayment(p)} style={{ ...btnStyle, background: 'rgba(124,92,255,0.15)', color: '#a78bfa', fontSize: '0.6rem' }}>{t('admin.payments.changeStatus')}</button></td>
                  <td style={cellStyle}>{p.payment_status === 'completed' && p.refund_status !== 'full' && <button onClick={() => setRefundPayment(p)} style={{ ...btnStyle, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.6rem' }}>{t('admin.payments.refund')}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{t('admin.payments.totalOrders', { count: total })}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ ...btnStyle, background: page === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(124,92,255,0.15)', color: page === 0 ? '#475569' : '#a78bfa' }}>←</button>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ ...btnStyle, background: page >= totalPages - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(124,92,255,0.15)', color: page >= totalPages - 1 ? '#475569' : '#a78bfa' }}>→</button>
        </div>
      </div>
      {actionPayment && <StatusModal payment={actionPayment} onClose={() => setActionPayment(null)} onSaved={() => { setActionPayment(null); load() }} />}
      {refundPayment && <RefundModal payment={refundPayment} onClose={() => setRefundPayment(null)} onSaved={() => { setRefundPayment(null); load() }} />}
    </div>
  )
}

function SubscriptionsTab() {
  const { t } = useTranslation()
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState('all')
  useEffect(() => { setLoading(true); adminApi.getSubscriptions({ limit: 50, tier: tier !== 'all' ? tier : undefined }).then(d => setSubs(d.subscriptions)).catch(() => setSubs([])).finally(() => setLoading(false)) }, [tier])
  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', gap: '0.5rem' }}>
        <select value={tier} onChange={e => setTier(e.target.value)} style={selectStyle}>
          <option value="all">{t('admin.payments.all')}</option><option value="free">Free</option><option value="plus">Plus</option><option value="premium">Premium</option>
        </select>
      </div>
      {loading ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div> : subs.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.payments.noData')}</div> : (
        <SimpleTable headers={['User','Tier','Start','End','Auto','Active']} rows={subs.map(s => [s.user_email, s.tier, s.start_date?.slice(0,10), s.end_date?.slice(0,10) || '—', s.auto_renew ? '✓':'✗', s.is_active ? '✓':'✗'])} />
      )}
    </div>
  )
}

function CallbackLogsTab() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminApi.getCallbackLogs({ limit: 50 }).then(d => setLogs(d.logs)).catch(() => setLogs([])).finally(() => setLoading(false)) }, [])
  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div>
  if (logs.length === 0) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.payments.noData')}</div>
  return <SimpleTable headers={['Provider','Result','Error','Order','Time']} rows={logs.map(l => [l.provider, l.result, l.error_message?.slice(0,40) || '—', l.payment_order_id || '—', new Date(l.created_at).toLocaleString()])} />
}

function RefundsTab() {
  const { t } = useTranslation()
  const [refunds, setRefunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const load = useCallback(() => { setLoading(true); adminApi.getRefunds({ limit: 50, status: statusFilter !== 'all' ? statusFilter : undefined }).then(d => setRefunds(d.refunds)).catch(() => setRefunds([])).finally(() => setLoading(false)) }, [statusFilter])
  useEffect(() => { load() }, [load])
  const process = async (id: string, st: 'completed' | 'rejected') => { await adminApi.processRefund(id, st); load() }
  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div>
  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', gap: '0.5rem' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">{t('admin.payments.all')}</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="rejected">Rejected</option>
        </select>
      </div>
      {refunds.length === 0 ? <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.payments.noData')}</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead><tr>{['Order','User','Pay Amt','Refund','Reason','Status','Admin','Created','Processed',''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>{refunds.map(r => <tr key={r.id}><td style={cellStyle}>{r.payment_order_id?.slice(0,16)}</td><td style={cellStyle}>{r.user_email}</td><td style={cellStyle}>{r.payment_amount}</td><td style={cellStyle}>{r.amount}</td><td style={cellStyle} title={r.reason}>{r.reason?.slice(0,30)}</td><td style={cellStyle}><span style={statusBadge(r.status==='completed'?'completed':r.status==='pending'?'pending':'cancelled')}>{r.status}</span></td><td style={cellStyle}>{r.admin_email||'—'}</td><td style={cellStyle}>{new Date(r.created_at).toLocaleDateString()}</td><td style={cellStyle}>{r.processed_at?new Date(r.processed_at).toLocaleDateString():'—'}</td><td style={cellStyle}>{r.status==='pending'&&<div style={{display:'flex',gap:'0.25rem'}}><button onClick={()=>process(r.id,'completed')} style={{...btnStyle,background:'rgba(16,185,129,0.15)',color:'#10b981',fontSize:'0.6rem'}}>{t('admin.payments.refunds.approve')}</button><button onClick={()=>process(r.id,'rejected')} style={{...btnStyle,background:'rgba(239,68,68,0.15)',color:'#ef4444',fontSize:'0.6rem'}}>{t('admin.payments.refunds.reject')}</button></div>}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AnalyticsTab() {
  const { t } = useTranslation()
  const [data, setData] = useState<any>(null)
  const [days, setDays] = useState(30)
  useEffect(() => { adminApi.getPaymentAnalytics(days).then(setData).catch(() => {}) }, [days])
  if (!data) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.loading')}</div>
  const cards = [
    { l: t('admin.payments.analytics.totalRevenue'), v: `${data.totalRevenue?.toFixed(2)}`, c: '#10b981' },
    { l: t('admin.payments.analytics.paidUsers'), v: data.paidUsers, c: '#3b82f6' },
    { l: t('admin.payments.analytics.arpu'), v: `${data.arpu?.toFixed(2)}`, c: '#8b5cf6' },
    { l: t('admin.payments.analytics.conversionRate'), v: `${data.conversionRate?.toFixed(1)}%`, c: '#f59e0b' },
    { l: t('admin.payments.analytics.churnRate'), v: `${data.churnRate?.toFixed(1)}%`, c: '#ef4444' },
    { l: t('admin.payments.analytics.periodRevenue'), v: `${data.totals?.periodRevenue?.toFixed(2)}`, c: '#10b981' },
    { l: t('admin.payments.analytics.pendingOrders'), v: data.totals?.pending, c: '#f59e0b' },
    { l: t('admin.payments.analytics.completedOrders'), v: data.totals?.completed, c: '#10b981' },
    { l: t('admin.payments.analytics.failedOrders'), v: data.totals?.failed, c: '#ef4444' },
  ]
  return (
    <div>
      <div style={{ marginBottom: '1rem' }}><select value={days} onChange={e => setDays(Number(e.target.value))} style={selectStyle}><option value={7}>7d</option><option value={30}>30d</option><option value={90}>90d</option></select></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {cards.map(c => <div key={c.l} style={cardStyle}><div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{c.l}</div><div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.c }}>{c.v}</div></div>)}
      </div>
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t('admin.payments.analytics.revenueTrend')}</h3>
        {data.revenueTrend?.length > 0 ? <SimpleTable headers={['Date','Revenue','Orders']} rows={data.revenueTrend.map((r:any)=>[r.date, parseFloat(r.revenue).toFixed(2), r.orders])} /> : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t('admin.payments.noData')}</div>}
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }

function SimpleTable({ headers, rows }: { headers: string[]; rows: any[][] }) {
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}><thead><tr>{headers.map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i) => <tr key={i}>{r.map((c,j) => <td key={j} style={cellStyle}>{c}</td>)}</tr>)}</tbody></table></div>
}

function StatusModal({ payment, onClose, onSaved }: { payment: any; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState(payment.payment_status)
  const [reason, setReason] = useState('')
  const save = async () => { if (!reason.trim()) return; await adminApi.updatePaymentStatus(payment.id, status, reason); onSaved() }
  return (
    <Modal onClose={onClose} title={t('admin.payments.changeStatus')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{payment.order_id}</div>
        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}><option value="pending">{t('admin.payments.pending')}</option><option value="completed">{t('admin.payments.completed')}</option><option value="failed">{t('admin.payments.failed')}</option><option value="cancelled">{t('admin.payments.cancelled')}</option></select>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={t('admin.payments.reasonPlaceholder')} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>{t('admin.payments.cancel')}</button>
          <button onClick={save} disabled={!reason.trim()} style={{ ...btnStyle, background: reason.trim() ? '#10b981' : 'rgba(16,185,129,0.3)', color: '#fff' }}>{t('admin.payments.save')}</button>
        </div>
      </div>
    </Modal>
  )
}

function RefundModal({ payment, onClose, onSaved }: { payment: any; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const remaining = parseFloat(payment.amount) - parseFloat(payment.refunded_amount || 0)
  const [amount, setAmount] = useState(remaining.toString())
  const [reason, setReason] = useState('')
  const save = async () => { if (!reason.trim() || !amount) return; await adminApi.createRefund(payment.id, parseFloat(amount), reason); onSaved() }
  return (
    <Modal onClose={onClose} title={t('admin.payments.refund')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{payment.order_id} · {payment.currency} {payment.amount} · {t('admin.payments.refundedAmount')}: {payment.refunded_amount || 0}</div>
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder={t('admin.payments.amountPlaceholder')} type="number" step="0.01" max={remaining} style={inputStyle} />
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={t('admin.payments.reasonPlaceholder')} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>{t('admin.payments.cancel')}</button>
          <button onClick={save} disabled={!reason.trim() || !amount} style={{ ...btnStyle, background: (reason.trim() && amount) ? '#f59e0b' : 'rgba(245,158,11,0.3)', color: '#fff' }}>{t('admin.payments.save')}</button>
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
