import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'

interface AdminLoginPageProps {
  onLogin: (token: string, admin: any) => void
}

export default function AdminLoginPage({ onLogin }: AdminLoginPageProps) {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await adminApi.login(email, password)
      localStorage.setItem('admin_token', data.token)
      onLogin(data.token, data.admin)
    } catch (err: any) {
      setError(err.response?.data?.error || t('admin.login.error'))
    } finally {
      setLoading(false)
    }
  }

  const switchLang = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('admin_lang', lng)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1a1a2e', padding: '2rem', borderRadius: '12px', width: '360px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
          {t('admin.login.title')}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', marginBottom: '1rem' }}>
          {t('admin.login.subtitle')}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '1.25rem' }}>
          {['zh', 'en'].map(lng => (
            <button key={lng} type="button" onClick={() => switchLang(lng)} style={{
              padding: '0.15rem 0.5rem', borderRadius: '4px', border: 'none', fontSize: '0.65rem', cursor: 'pointer',
              background: i18n.language === lng ? '#7C5CFF' : 'rgba(255,255,255,0.08)',
              color: i18n.language === lng ? '#fff' : '#94a3b8',
            }}>
              {lng.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{t('admin.login.email')}</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{t('admin.login.password')}</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.875rem' }}
          />
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '1rem' }}>{error}</p>}

        <button
          type="submit" disabled={loading}
          style={{ width: '100%', padding: '0.6rem', background: '#7C5CFF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? t('admin.login.signingIn') : t('admin.login.signIn')}
        </button>
      </form>
    </div>
  )
}
