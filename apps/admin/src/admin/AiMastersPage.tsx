import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'

interface Master {
  id: string; key: string; name: string; category: string; description: string;
  avatar: string; is_active: boolean; prompt_count: string; active_version: string;
  active_model: string; calls_24h: string; failure_rate_24h: string; created_at: string; updated_at: string
}

interface Prompt {
  id: string; master_id: string; version: string; language: string;
  system_prompt: string; user_prompt_template: string; safety_prompt: string;
  output_schema: any; model: string; temperature: string; max_tokens: number;
  status: string; change_note: string; created_by: string; created_at: string;
  activated_by: string; activated_at: string
}

export default function AiMastersPage() {
  const { t } = useTranslation()
  const [masters, setMasters] = useState<Master[]>([])
  const [selected, setSelected] = useState<Master | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [showCreateMaster, setShowCreateMaster] = useState(false)
  const [showCreatePrompt, setShowCreatePrompt] = useState(false)
  const [testInput, setTestInput] = useState('{}')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [activeTab, setActiveTab] = useState<'prompts' | 'test'>('prompts')
  const [filterCategory, setFilterCategory] = useState('all')

  const loadMasters = () => {
    const params = filterCategory !== 'all' ? `?category=${filterCategory}` : ''
    adminApi.get(`/ai-masters/masters${params}`).then(d => setMasters(d.masters)).catch(() => {})
  }
  useEffect(() => { loadMasters() }, [filterCategory])

  const loadPrompts = (masterId: string) => {
    adminApi.get(`/ai-masters/masters/${masterId}/prompts`).then(d => setPrompts(d.prompts)).catch(() => {})
  }

  const selectMaster = (m: Master) => {
    setSelected(m)
    setEditingPrompt(null)
    setTestResult(null)
    loadPrompts(m.id)
  }

  const publishPrompt = async (promptId: string) => {
    await adminApi.post(`/ai-masters/prompts/${promptId}/publish`)
    if (selected) loadPrompts(selected.id)
    loadMasters()
  }

  const rollbackPrompt = async (promptId: string) => {
    await adminApi.post(`/ai-masters/prompts/${promptId}/rollback`)
    if (selected) loadPrompts(selected.id)
  }

  const deleteMaster = async (masterId: string) => {
    if (!window.confirm('确定要删除该 AI 大师吗？此操作不可撤销。')) return
    await adminApi.delete(`/ai-masters/masters/${masterId}`)
    setSelected(null)
    loadMasters()
  }
  const deletePrompt = async (promptId: string) => {
    await adminApi.delete(`/ai-masters/prompts/${promptId}`)
    if (selected) loadPrompts(selected.id)
    loadMasters()
  }

  const runTest = async (promptId: string) => {
    setTesting(true)
    setTestResult(null)
    try {
      let payload = {}
      try { payload = JSON.parse(testInput) } catch { payload = { query: testInput } }
      const result = await adminApi.post(`/ai-masters/prompts/${promptId}/test`, { input_payload: payload })
      setTestResult(result)
    } catch (e: any) {
      setTestResult({ error: e.response?.data?.error || 'Test failed' })
    }
    setTesting(false)
  }

  const categories = ['all', 'divination', 'wellness']

  // ── List View ──────────────────────────────────────────────────────────
  if (!selected) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('admin.aiMasters.title')}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
              {categories.map(c => <option key={c} value={c}>{c === 'all' ? t('admin.aiMasters.allCategories') : c}</option>)}
            </select>
            <button onClick={() => setShowCreateMaster(true)}
              style={{ padding: '0.4rem 0.8rem', background: '#7C5CFF', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
              + {t('admin.aiMasters.createMaster')}
            </button>
          </div>
        </div>

        {showCreateMaster && <CreateMasterForm onCreated={() => { setShowCreateMaster(false); loadMasters() }} onCancel={() => setShowCreateMaster(false)} />}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr>
                {['', t('admin.aiMasters.name'), t('admin.aiMasters.category'), t('admin.aiMasters.version'), t('admin.aiMasters.model'), t('admin.aiMasters.calls24h'), t('admin.aiMasters.failRate'), t('admin.aiMasters.status'), ''].map(h =>
                  <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontWeight: 500, fontSize: '0.65rem', textTransform: 'uppercase' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {masters.map(m => (
                <tr key={m.id} onClick={() => selectMaster(m)} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '1.2rem' }}>{m.avatar}</td>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#94a3b8' }}>{m.category}</td>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{m.active_version || '—'}</td>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: 'monospace', fontSize: '0.65rem' }}>{m.active_model || '—'}</td>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{m.calls_24h || '0'}</td>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: parseFloat(m.failure_rate_24h) > 10 ? '#ef4444' : '#10b981' }}>{m.failure_rate_24h || '0'}%</td>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ padding: '0.1rem 0.4rem', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 600,
                      background: m.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      color: m.is_active ? '#10b981' : '#ef4444' }}>
                      {m.is_active ? t('admin.aiMasters.active') : t('admin.aiMasters.inactive')}
                    </span>
                  </td>
                  <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => deleteMaster(m.id)}
                      style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', border: 'none', fontSize: '0.6rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {masters.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.aiMasters.empty')}</div>}
      </div>
    )
  }

  // ── Detail View ────────────────────────────────────────────────────────
  return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', marginBottom: '1rem' }}>
        ← {t('admin.aiMasters.backToList')}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '2rem' }}>{selected.avatar}</span>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selected.name}</h2>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{selected.category} · {selected.key}</div>
        </div>
      </div>

      {selected.description && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>{selected.description}</p>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['prompts', 'test'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '0.3rem 0.8rem', borderRadius: '6px', border: 'none', fontSize: '0.75rem', cursor: 'pointer',
            background: activeTab === tab ? '#7C5CFF' : 'rgba(255,255,255,0.08)',
            color: activeTab === tab ? '#fff' : '#94a3b8',
          }}>
            {tab === 'prompts' ? t('admin.aiMasters.prompts') : t('admin.aiMasters.testPanel')}
          </button>
        ))}
      </div>

      {activeTab === 'prompts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('admin.aiMasters.promptVersions')}</h3>
            <button onClick={() => setShowCreatePrompt(true)}
              style={{ padding: '0.3rem 0.6rem', background: '#7C5CFF', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}>
              + {t('admin.aiMasters.newVersion')}
            </button>
          </div>

          {showCreatePrompt && <CreatePromptForm masterId={selected.id} onCreated={() => { setShowCreatePrompt(false); loadPrompts(selected.id) }} onCancel={() => setShowCreatePrompt(false)} />}

          {editingPrompt && <EditPromptForm prompt={editingPrompt} onSaved={() => { setEditingPrompt(null); loadPrompts(selected.id) }} onCancel={() => setEditingPrompt(null)} />}

          {prompts.map(p => (
            <div key={p.id} style={{ background: '#111827', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem', border: p.status === 'active' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.version}</span>
                  <span style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace' }}>{p.language}</span>
                  <span style={{ padding: '0.1rem 0.4rem', borderRadius: '8px', fontSize: '0.55rem', fontWeight: 600,
                    background: p.status === 'active' ? 'rgba(16,185,129,0.2)' : p.status === 'draft' ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.2)',
                    color: p.status === 'active' ? '#10b981' : p.status === 'draft' ? '#f59e0b' : '#64748b' }}>
                    {p.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {p.status === 'draft' && (
                    <>
                      <button onClick={() => setEditingPrompt(p)}
                        style={{ fontSize: '0.6rem', color: '#7C5CFF', background: 'none', border: 'none', cursor: 'pointer' }}>
                        {t('admin.aiMasters.edit')}
                      </button>
                      <button onClick={() => publishPrompt(p.id)}
                        style={{ fontSize: '0.6rem', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>
                        {t('admin.aiMasters.publish')}
                      </button>
                      <button onClick={() => deletePrompt(p.id)}
                        style={{ fontSize: '0.6rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                        {t('admin.aiMasters.delete')}
                      </button>
                    </>
                  )}
                  {p.status === 'archived' && (
                    <>
                      <button onClick={() => rollbackPrompt(p.id)}
                        style={{ fontSize: '0.6rem', color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer' }}>
                        回滚
                      </button>
                      <button onClick={() => deletePrompt(p.id)}
                        style={{ fontSize: '0.6rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                        {t('admin.aiMasters.delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.5rem' }}>
                {p.model} · temp={p.temperature} · max={p.max_tokens}
                {p.created_by && <> · {t('admin.aiMasters.by')} {p.created_by}</>}
                {p.change_note && <> · {p.change_note}</>}
              </div>
              <pre style={{ background: '#0a0a1a', padding: '0.5rem', borderRadius: '6px', fontSize: '0.6rem', color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: '100px', overflow: 'auto', margin: 0 }}>
                {p.system_prompt.slice(0, 300)}{p.system_prompt.length > 300 ? '...' : ''}
              </pre>
            </div>
          ))}
          {prompts.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem', fontSize: '0.75rem' }}>{t('admin.aiMasters.noPrompts')}</div>}
        </div>
      )}

      {activeTab === 'test' && (
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>{t('admin.aiMasters.testPanel')}</h3>

          {prompts.length === 0 ? (
            <div style={{ background: '#111827', borderRadius: '8px', padding: '2rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{t('admin.aiMasters.noPrompts')}</div>
            </div>
          ) : (
            <>
              <div style={{ background: '#111827', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{t('admin.aiMasters.selectPrompt')}</label>
                <select style={{ width: '100%', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.4rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}
                  id="test-prompt-select">
                  {prompts.map(p => (
                    <option key={p.id} value={p.id}>{p.version} ({p.language}) [{p.status}] - {p.model}</option>
                  ))}
                </select>

                <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{t('admin.aiMasters.inputPayload')}</label>
                <textarea value={testInput} onChange={e => setTestInput(e.target.value)} rows={4}
                  style={{ width: '100%', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.7rem', fontFamily: 'monospace', padding: '0.5rem', marginBottom: '0.75rem' }}
                  placeholder='{"query": "What do the cards say about my career?"}' />

                <button onClick={() => {
                  const select = document.getElementById('test-prompt-select') as HTMLSelectElement
                  if (select?.value) runTest(select.value)
                }} disabled={testing}
                  style={{ padding: '0.4rem 1rem', background: testing ? '#475569' : '#7C5CFF', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: testing ? 'default' : 'pointer' }}>
                  {testing ? t('admin.aiMasters.testing') : t('admin.aiMasters.runTest')}
                </button>
              </div>

              {testResult && (
                <div style={{ background: '#111827', borderRadius: '8px', padding: '1rem', border: testResult.error ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)' }}>
                  {testResult.error ? (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>{testResult.error}</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.65rem', color: '#64748b' }}>
                        <span>{t('admin.aiMasters.model')}: {testResult.model}</span>
                        <span>{t('admin.aiMasters.latency')}: {testResult.latency_ms}ms</span>
                        <span>{t('admin.aiMasters.tokens')}: {testResult.token_usage}</span>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.25rem' }}>{t('admin.aiMasters.renderedPrompt')}</div>
                        <pre style={{ background: '#0a0a1a', padding: '0.5rem', borderRadius: '6px', fontSize: '0.6rem', color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: '150px', overflow: 'auto' }}>
                          {testResult.rendered}
                        </pre>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.25rem' }}>{t('admin.aiMasters.output')}</div>
                        <pre style={{ background: '#0a0a1a', padding: '0.5rem', borderRadius: '6px', fontSize: '0.7rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
                          {testResult.output}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Create Master Form ────────────────────────────────────────────────

function CreateMasterForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('divination')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState('🤖')

  const submit = async () => {
    if (!key || !name) return
    await adminApi.post('/ai-masters/masters', { key, name, category, description, avatar })
    onCreated()
  }

  return (
    <div style={{ background: '#111827', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(124,92,255,0.3)' }}>
      <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>{t('admin.aiMasters.createMaster')}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Field label={t('admin.aiMasters.fieldKey')} value={key} onChange={setKey} placeholder="tarot" />
        <Field label={t('admin.aiMasters.fieldName')} value={name} onChange={setName} placeholder="Tarot Reader" />
        <div>
          <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{t('admin.aiMasters.fieldCategory')}</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{ width: '100%', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.35rem', fontSize: '0.75rem' }}>
            <option value="divination">divination</option>
            <option value="wellness">wellness</option>
          </select>
        </div>
        <Field label={t('admin.aiMasters.fieldAvatar')} value={avatar} onChange={setAvatar} placeholder="🔮" />
      </div>
      <Field label={t('admin.aiMasters.fieldDescription')} value={description} onChange={setDescription} placeholder="..." />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button onClick={submit} style={{ padding: '0.3rem 0.8rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>{t('admin.aiMasters.save')}</button>
        <button onClick={onCancel} style={{ padding: '0.3rem 0.8rem', background: 'none', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>{t('admin.aiMasters.cancel')}</button>
      </div>
    </div>
  )
}

// ─── Create Prompt Form ────────────────────────────────────────────────

function CreatePromptForm({ masterId, onCreated, onCancel }: { masterId: string; onCreated: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [version, setVersion] = useState('v1')
  const [language, setLanguage] = useState('en')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userPromptTemplate, setUserPromptTemplate] = useState('')
  const [safetyPrompt, setSafetyPrompt] = useState('')
  const [outputSchema, setOutputSchema] = useState('')
  const [model, setModel] = useState('gemini-2.0-flash')
  const [temperature, setTemperature] = useState('0.7')
  const [maxTokens, setMaxTokens] = useState('2048')
  const [changeNote, setChangeNote] = useState('')

  const submit = async () => {
    if (!systemPrompt) return
    await adminApi.post(`/ai-masters/masters/${masterId}/prompts`, {
      version, language, system_prompt: systemPrompt,
      user_prompt_template: userPromptTemplate || undefined,
      safety_prompt: safetyPrompt || undefined,
      output_schema: outputSchema ? JSON.parse(outputSchema) : undefined,
      model, temperature: parseFloat(temperature), max_tokens: parseInt(maxTokens),
      change_note: changeNote || undefined,
    })
    onCreated()
  }

  return (
    <div style={{ background: '#111827', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(124,92,255,0.3)' }}>
      <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>{t('admin.aiMasters.newPromptVersion')}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Field label={t('admin.aiMasters.fieldVersion')} value={version} onChange={setVersion} placeholder="v2" />
        <Field label={t('admin.aiMasters.fieldLanguage')} value={language} onChange={setLanguage} placeholder="en" />
        <Field label={t('admin.aiMasters.fieldModel')} value={model} onChange={setModel} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Field label={t('admin.aiMasters.fieldTemp')} value={temperature} onChange={setTemperature} />
        <Field label={t('admin.aiMasters.fieldMaxTokens')} value={maxTokens} onChange={setMaxTokens} />
        <Field label={t('admin.aiMasters.fieldNote')} value={changeNote} onChange={setChangeNote} placeholder="..." />
      </div>
      <TextArea label={t('admin.aiMasters.fieldSystemPrompt')} value={systemPrompt} onChange={setSystemPrompt} rows={6} required />
      <TextArea label={t('admin.aiMasters.fieldUserTemplate')} value={userPromptTemplate} onChange={setUserPromptTemplate} rows={3} placeholder="{{query}}" />
      <TextArea label="Output Schema (JSON)" value={outputSchema} onChange={setOutputSchema} rows={3} placeholder='{"type":"object","properties":{}}' />
      <TextArea label={t('admin.aiMasters.fieldSafetyPrompt')} value={safetyPrompt} onChange={setSafetyPrompt} rows={3} />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button onClick={submit} style={{ padding: '0.3rem 0.8rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>{t('admin.aiMasters.save')}</button>
        <button onClick={onCancel} style={{ padding: '0.3rem 0.8rem', background: 'none', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>{t('admin.aiMasters.cancel')}</button>
      </div>
    </div>
  )
}

// ─── Edit Prompt Form ──────────────────────────────────────────────────

function EditPromptForm({ prompt, onSaved, onCancel }: { prompt: Prompt; onSaved: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [systemPrompt, setSystemPrompt] = useState(prompt.system_prompt)
  const [userPromptTemplate, setUserPromptTemplate] = useState(prompt.user_prompt_template || '')
  const [safetyPrompt, setSafetyPrompt] = useState(prompt.safety_prompt || '')
  const [outputSchema, setOutputSchema] = useState(prompt.output_schema ? JSON.stringify(prompt.output_schema, null, 2) : '')
  const [model, setModel] = useState(prompt.model)
  const [temperature, setTemperature] = useState(prompt.temperature)
  const [maxTokens, setMaxTokens] = useState(String(prompt.max_tokens))
  const [changeNote, setChangeNote] = useState(prompt.change_note || '')

  const save = async () => {
    await adminApi.put(`/ai-masters/prompts/${prompt.id}`, {
      system_prompt: systemPrompt, user_prompt_template: userPromptTemplate || undefined,
      safety_prompt: safetyPrompt || undefined,
      output_schema: outputSchema ? JSON.parse(outputSchema) : undefined,
      model,
      temperature: parseFloat(temperature), max_tokens: parseInt(maxTokens),
      change_note: changeNote || undefined,
    })
    onSaved()
  }

  return (
    <div style={{ background: '#111827', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(245,158,11,0.3)' }}>
      <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>{t('admin.aiMasters.editPrompt')} {prompt.version}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Field label={t('admin.aiMasters.fieldModel')} value={model} onChange={setModel} />
        <Field label={t('admin.aiMasters.fieldTemp')} value={temperature} onChange={setTemperature} />
        <Field label={t('admin.aiMasters.fieldMaxTokens')} value={maxTokens} onChange={setMaxTokens} />
      </div>
      <Field label={t('admin.aiMasters.fieldNote')} value={changeNote} onChange={setChangeNote} />
      <TextArea label={t('admin.aiMasters.fieldSystemPrompt')} value={systemPrompt} onChange={setSystemPrompt} rows={6} />
      <TextArea label={t('admin.aiMasters.fieldUserTemplate')} value={userPromptTemplate} onChange={setUserPromptTemplate} rows={3} />
      <TextArea label="Output Schema (JSON)" value={outputSchema} onChange={setOutputSchema} rows={3} />
      <TextArea label={t('admin.aiMasters.fieldSafetyPrompt')} value={safetyPrompt} onChange={setSafetyPrompt} rows={3} />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button onClick={save} style={{ padding: '0.3rem 0.8rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>{t('admin.aiMasters.save')}</button>
        <button onClick={onCancel} style={{ padding: '0.3rem 0.8rem', background: 'none', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>{t('admin.aiMasters.cancel')}</button>
      </div>
    </div>
  )
}

// ─── Shared Field Components ───────────────────────────────────────────

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{label}{required && ' *'}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ width: '100%', padding: '0.35rem 0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem' }} />
    </div>
  )
}

function TextArea({ label, value, onChange, rows, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; rows: number; placeholder?: string; required?: boolean }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{label}{required && ' *'}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} required={required}
        style={{ width: '100%', padding: '0.5rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.7rem', fontFamily: 'monospace', resize: 'vertical' }} />
    </div>
  )
}
