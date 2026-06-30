import React, { useState, useEffect } from 'react'
import { adminApi } from './api'

const inputStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }
const btnStyle: React.CSSProperties = { padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }
const cardStyle: React.CSSProperties = { background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.5rem' }
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

type Tab = 'safety' | 'subscription' | 'marketplace' | 'quota' | 'language' | 'announcement'

interface ConfigEntry { key: string; value: string; description: string; updated_at: string }

export default function SystemConfigPage() {
  const [tab, setTab] = useState<Tab>('safety')
  const tabs: { key: Tab; label: string }[] = [
    { key: 'safety', label: '内容安全' },
    { key: 'subscription', label: '订阅权益' },
    { key: 'marketplace', label: 'Marketplace' },
    { key: 'quota', label: '免费额度' },
    { key: 'language', label: '多语言' },
    { key: 'announcement', label: '公告配置' },
  ]
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>系统配置管理</h2>
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{ padding: '0.4rem 0.75rem', border: 'none', borderBottom: tab === tb.key ? '2px solid #7C5CFF' : '2px solid transparent', background: 'transparent', color: tab === tb.key ? '#a78bfa' : '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>{tb.label}</button>
        ))}
      </div>
      {tab === 'safety' && <ConfigGroup prefix="safety_" title="内容安全阈值" />}
      {tab === 'subscription' && <ConfigGroup prefix="subscription_" title="订阅权益配置" />}
      {tab === 'marketplace' && <ConfigGroup prefix="marketplace_" title="Marketplace 配置" />}
      {tab === 'quota' && <ConfigGroup prefix="free_" title="免费额度配置" />}
      {tab === 'language' && <ConfigGroup prefix="lang_" title="多语言配置" />}
      {tab === 'announcement' && <ConfigGroup prefix="announcement_" title="公告配置" />}
    </div>
  )
}

function ConfigGroup({ prefix, title }: { prefix: string; title: string }) {
  const [configs, setConfigs] = useState<ConfigEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const load = () => {
    setLoading(true)
    adminApi.get('/system-config').then((d: any) => {
      setConfigs(d.configs.filter((c: ConfigEntry) => c.key.startsWith(prefix)))
    }).catch(() => setConfigs([])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [prefix])

  const save = async (key: string) => {
    const cfg = configs.find(c => c.key === key)
    await adminApi.post('/system-config', { key, value: editValue, description: cfg?.description })
    setEditing(null)
    load()
  }

  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading...</div>
  if (configs.length === 0) return <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>暂无配置项 (可通过 /api/admin/system-config POST 添加)</div>

  return (
    <div>
      <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem' }}>{title}</h3>
      {configs.map(cfg => (
        <div key={cfg.key} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{cfg.key}</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.15rem' }}>{cfg.description}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {editing === cfg.key ? (
                <>
                  <input value={editValue} onChange={e => setEditValue(e.target.value)} style={{ ...inputStyle, width: '250px' }} autoFocus onKeyDown={e => { if (e.key === 'Enter') save(cfg.key); if (e.key === 'Escape') setEditing(null) }} />
                  <button onClick={() => save(cfg.key)} style={{ ...btnStyle, background: '#10b981', color: '#fff' }}>保存</button>
                  <button onClick={() => setEditing(null)} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>取消</button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.75rem', color: cfg.value === 'true' ? '#10b981' : cfg.value === 'false' ? '#ef4444' : '#f59e0b' }}>{cfg.value}</span>
                  <button onClick={() => { setEditing(cfg.key); setEditValue(cfg.value) }} style={{ ...btnStyle, background: 'rgba(124,92,255,0.15)', color: '#a78bfa' }}>编辑</button>
                </>
              )}
            </div>
          </div>
          {cfg.updated_at && <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '0.25rem' }}>更新于 {new Date(cfg.updated_at).toLocaleString()}</div>}
        </div>
      ))}
    </div>
  )
}
