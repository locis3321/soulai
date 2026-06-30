import React, { useState, useEffect } from 'react'
import { adminApi } from './api'

const inputStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }
const btnStyle: React.CSSProperties = { padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }
const cardStyle: React.CSSProperties = { background: '#111827', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.5rem' }
const cellStyle: React.CSSProperties = { padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', whiteSpace: 'nowrap' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.3rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }

export default function AiProvidersPage() {
  const [providers, setProviders] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const load = () => { adminApi.getAiProviders().then(d => setProviders(d.providers)).catch(() => {}) }
  useEffect(() => { load() }, [])

  const Form = ({ initial, onDone }: { initial?: any; onDone: () => void }) => {
    const [name, setName] = useState(initial?.name || '')
    const [apiUrl, setApiUrl] = useState(initial?.api_url || '')
    const [apiKey, setApiKey] = useState(initial?.api_key || '')
    const [model, setModel] = useState(initial?.model || '')
    const [priority, setPriority] = useState(initial?.priority_order || 0)
    const [isActive, setIsActive] = useState(initial?.is_active ?? true)

    const submit = async () => {
      const data = { name, api_url: apiUrl, api_key: apiKey, model, provider_type: 'openai_compatible', priority_order: priority, is_active: isActive }
      if (initial) await adminApi.updateAiProvider(initial.id, data)
      else await adminApi.createAiProvider(data)
      onDone(); load()
    }

    return (
      <div style={{ ...cardStyle, border: '1px solid rgba(124,92,255,0.3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={inputStyle} />
          <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="API URL" style={inputStyle} />
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" style={inputStyle} />
          <input value={model} onChange={e => setModel(e.target.value)} placeholder="Model" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.65rem', color: labelStyle.color }}>Priority: <input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} style={{ ...inputStyle, width: '60px' }} /></label>
          <label style={{ fontSize: '0.65rem', color: labelStyle.color }}>Active: <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /></label>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={submit} style={{ ...btnStyle, background: '#10b981', color: '#fff' }}>Save</button>
          <button onClick={() => { setShowForm(false); setEditing(null) }} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>Cancel</button>
        </div>
      </div>
    )
  }

  const del = async (id: string) => { await adminApi.deleteAiProvider(id); load() }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Providers</h2>
        <button onClick={() => { setShowForm(true); setEditing(null) }} style={{ ...btnStyle, background: '#7C5CFF', color: '#fff' }}>+ Add Provider</button>
      </div>
      {(showForm || editing) && <Form initial={editing} onDone={() => { setShowForm(false); setEditing(null) }} />}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
          <thead><tr>{['Name','API URL','Model','Priority','Active','Actions'].map(k => <th key={k} style={thStyle}>{k}</th>)}</tr></thead>
          <tbody>{providers.map(p => <tr key={p.id}>
            <td style={cellStyle}>{p.name}</td><td style={cellStyle}>{p.api_url?.slice(0, 40)}</td>
            <td style={cellStyle}>{p.model}</td><td style={cellStyle}>{p.priority_order}</td>
            <td style={cellStyle}>{p.is_active ? '✓' : '✗'}</td>
            <td style={cellStyle}><div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => setEditing(p)} style={{ ...btnStyle, background: 'rgba(124,92,255,0.15)', color: '#a78bfa', fontSize: '0.6rem' }}>Edit</button>
              <button onClick={() => del(p.id)} style={{ ...btnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.6rem' }}>Del</button>
            </div></td>
          </tr>)}</tbody></table></div>
      {providers.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No providers configured. Add one above.</div>}
    </div>
  )
}

const labelStyle = { color: '#64748b' }
