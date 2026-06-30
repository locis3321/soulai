import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from './api'

export default function CommunityPage() {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<any[]>([])
  const [category, setCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comments, setComments] = useState<any[]>([])

  const loadPosts = () => {
    adminApi.get('/community/posts', { category: category === 'all' ? undefined : category, limit: 100 })
      .then(d => setPosts(d.posts)).catch(() => {})
  }
  useEffect(() => { loadPosts() }, [category])

  const togglePin = async (id: string) => {
    await adminApi.post(`/community/posts/${id}/toggle-pin`)
    loadPosts()
  }

  const deletePost = async (id: string) => {
    await adminApi.delete(`/community/posts/${id}`)
    setExpandedId(null)
    loadPosts()
  }

  const deleteComment = async (id: string) => {
    await adminApi.delete(`/community/comments/${id}`)
    if (expandedId) loadComments(expandedId)
  }

  const loadComments = async (postId: string) => {
    try {
      const d = await adminApi.get(`/ai-masters/masters/00000000-0000-0000-0000-000000000000/prompts`)
      setComments([])
    } catch { setComments([]) }
  }

  const categories = ['all', 'astrology', 'tarot', 'bazi', 'ziwei', 'healing', 'relationships']

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{t('admin.community.title')}</h2>

      <select value={category} onChange={e => setCategory(e.target.value)}
        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.75rem', marginBottom: '1rem' }}>
        {categories.map(c => <option key={c} value={c}>{c === 'all' ? t('admin.community.allCategories') : c}</option>)}
      </select>

      {posts.map(post => (
        <div key={post.id} style={{ background: '#111827', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem', border: post.is_pinned ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                {post.is_pinned && <span style={{ fontSize: '0.55rem', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>📌 PIN</span>}
                <span style={{ fontSize: '0.6rem', color: '#7C5CFF', background: 'rgba(124,92,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{post.category}</span>
                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{post.author_email}</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem' }}>{post.title}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>{post.content?.slice(0, 200)}{post.content?.length > 200 ? '...' : ''}</div>
              <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '0.25rem' }}>
                ❤️ {post.likes_count} · 💬 {post.comments_count} · {new Date(post.created_at).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
              <button onClick={() => togglePin(post.id)}
                style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                {post.is_pinned ? t('admin.community.unpin') : t('admin.community.pin')}
              </button>
              <button onClick={() => deletePost(post.id)}
                style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                {t('admin.community.delete')}
              </button>
            </div>
          </div>
        </div>
      ))}
      {posts.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.8rem' }}>{t('admin.community.empty')}</div>}
    </div>
  )
}
