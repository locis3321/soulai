import React, { useState, useEffect } from 'react'
import { adminApi } from './api'

const cardStyle: React.CSSProperties = { background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.75rem' }
const cellStyle: React.CSSProperties = { padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', whiteSpace: 'nowrap' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }
const selectStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem', cursor: 'pointer' }

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [days, setDays] = useState(30)

  useEffect(() => { adminApi.getAnalytics(days).then(setData).catch(() => {}) }, [days])

  if (!data) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading...</div>

  const fmt = (n: any) => (parseFloat(n) || 0).toFixed(1)
  const pct = (n: any, total: number) => total > 0 ? `${(parseFloat(n) / total * 100).toFixed(1)}%` : '0%'

  const r = data.retention || {}
  const f = data.funnel || {}
  const c = data.aiCostRevenue || {}
  const m = data.marketplaceGmv || {}
  const comm = data.communityActivity || {}

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>运营分析</h2>
      <div style={{ marginBottom: '1rem' }}>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={selectStyle}>
          <option value={7}>7 天</option><option value={30}>30 天</option><option value={90}>90 天</option>
        </select>
      </div>

      {/* Funnel */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>漏斗分析</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          {[
            { l: '注册', v: f.registered || 0, c: '#3b82f6' },
            { l: '首次阅读', v: f.first_reading || 0, c: '#8b5cf6' },
            { l: '聊天', v: f.chat_users || 0, c: '#10b981' },
            { l: '订阅', v: f.subscribed || 0, c: '#f59e0b' },
            { l: '复购', v: f.paying_users || 0, c: '#ef4444' },
          ].map((s, i) => (
            <div key={s.l} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>{s.l}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.c }}>{s.v}</div>
              {i > 0 && <div style={{ fontSize: '0.55rem', color: '#475569' }}>{pct(s.v, f.registered)}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Retention + Growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>留存指标</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <MetricCard label="DAU" value={r.dau || 0} color="#3b82f6" />
            <MetricCard label="WAU" value={r.wau || 0} color="#8b5cf6" />
            <MetricCard label="MAU" value={r.mau || 0} color="#10b981" />
          </div>
        </div>
        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>AI 成本 vs 收入</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <MetricCard label="AI 成本 ($)" value={parseFloat(c.total_cost || 0).toFixed(2)} color="#ef4444" />
            <MetricCard label="收入 ($)" value={parseFloat(c.total_revenue || 0).toFixed(2)} color="#10b981" />
          </div>
        </div>
      </div>

      {/* User Growth Table */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>用户增长</h3>
        {data.userGrowth?.length > 0 ? <SimpleTable headers={['Date','New Users']} rows={data.userGrowth.map((r:any) => [r.date, r.new_users])} /> : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>暂无数据</div>}
      </div>

      {/* Subscription + Feature + Language */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>订阅转化</h3>
          {data.subscriptionConversion?.length > 0 ? <SimpleTable headers={['Tier','Count']} rows={data.subscriptionConversion.map((r:any) => [r.subscription_tier, r.count])} /> : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>暂无数据</div>}
        </div>
        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>功能使用排行</h3>
          {data.featureRanking?.length > 0 ? <SimpleTable headers={['Feature','Count']} rows={data.featureRanking.map((r:any) => [r.request_type, r.count])} /> : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>暂无数据</div>}
        </div>
        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>语言分布</h3>
          {data.languageBreakdown?.length > 0 ? <SimpleTable headers={['Lang','Users','Tarot','Astro']} rows={data.languageBreakdown.map((r:any) => [r.lang, r.users, r.tarot_readings, r.astrology_readings])} /> : <div style={{ fontSize: '0.7rem', color: '#64748b' }}>暂无数据</div>}
        </div>
      </div>

      {/* Marketplace */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Marketplace</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <MetricCard label="预订数" value={m.total_bookings || 0} color="#3b82f6" />
          <MetricCard label="完成率" value={pct(m.completed, m.total_bookings)} color="#10b981" />
          <MetricCard label="取消率" value={pct(m.cancelled, m.total_bookings)} color="#ef4444" />
          <MetricCard label="GMV" value={`$${(m.gmv || 0).toFixed(0)}`} color="#8b5cf6" />
        </div>
        {data.advisorConversion?.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.25rem' }}>顾问转化率</h4>
            <SimpleTable headers={['Advisor','Bookings','Completed','Rating','Price']} rows={data.advisorConversion.map((r:any) => [r.name, r.bookings, pct(r.completed, r.bookings), fmt(r.rating), `¥${r.price_per_session}`])} />
          </div>
        )}
      </div>

      {/* Community */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>社区活跃度</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <MetricCard label="帖子" value={comm.total_posts || 0} color="#3b82f6" />
          <MetricCard label="评论" value={comm.total_comments || 0} color="#8b5cf6" />
          <MetricCard label="点赞" value={comm.total_likes || 0} color="#ef4444" />
          <MetricCard label="收藏" value={comm.total_bookmarks || 0} color="#f59e0b" />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: any; color: string }) {
  return <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
    <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{label}</div>
    <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</div>
  </div>
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: any[][] }) {
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}><thead><tr>{headers.map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={cellStyle}>{c == null ? '—' : String(c)}</td>)}</tr>)}</tbody></table></div>
}
