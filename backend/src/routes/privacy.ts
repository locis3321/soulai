import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'

const router = Router()

// Get all user data (GDPR data export)
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const [
      user,
      profile,
      moods,
      journals,
      astrologyReadings,
      tarotReadings,
      chatSessions,
      subscriptions,
      payments,
      communityPosts,
      communityComments,
      communityLikes,
      communityBookmarks,
      bookings,
      practitionerReviews,
    ] = await Promise.all([
      db.query(`SELECT id, email, name, birth_date, birth_time, birth_place, language, subscription_tier, created_at FROM users WHERE id = $1`, [userId]),
      db.query(`SELECT * FROM user_profiles WHERE user_id = $1`, [userId]),
      db.query(`SELECT mood, note, energy_score, created_at FROM mood_checkins WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT title, content, mood, tags, created_at FROM journals WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT reading_type, birth_data, reading_text, created_at FROM astrology_readings WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT question, spread_type, cards, reading_text, created_at FROM tarot_readings WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT id, advisor_key, title, created_at FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT tier, start_date, end_date, is_active FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT order_id, plan_id, period, amount, currency, payment_method, payment_status, provider_transaction_id, description, created_at, updated_at FROM payments WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT id, category, title, content, likes_count, comments_count, is_pinned, created_at, updated_at FROM community_posts WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT id, post_id, content, created_at FROM community_comments WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT id, post_id, created_at FROM community_likes WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT id, post_id, created_at FROM community_bookmarks WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT id, practitioner_id, booking_date, booking_time, consultation_mode, status, payment_id, created_at, updated_at FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT id, practitioner_id, booking_id, rating, comment, created_at FROM practitioner_reviews WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    ])

    // Get chat messages for each session
    const chatMessages: any[] = []
    for (const session of chatSessions.rows) {
      const msgs = await db.query(
        `SELECT role, content, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
        [session.id]
      )
      chatMessages.push({ session: session.title, advisor: session.advisor_key, messages: msgs.rows })
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: user.rows[0] || null,
      profile: profile.rows[0] || null,
      moodCheckins: moods.rows,
      journals: journals.rows,
      readings: {
        astrology: astrologyReadings.rows,
        tarot: tarotReadings.rows,
      },
      chatHistory: chatMessages,
      subscriptions: subscriptions.rows,
      payments: payments.rows,
      community: {
        posts: communityPosts.rows,
        comments: communityComments.rows,
        likes: communityLikes.rows,
        bookmarks: communityBookmarks.rows,
      },
      marketplace: {
        bookings: bookings.rows,
        practitionerReviews: practitionerReviews.rows,
      },
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="soulai-data-export.json"')
    res.json(exportData)
  } catch (error) {
    console.error('Data export error:', error)
    res.status(500).json({ error: 'Failed to export data' })
  }
})

// Delete all user data (GDPR right to erasure)
router.delete('/delete', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    // Delete in order (respecting foreign keys)
    await db.query(`DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = $1)`, [userId])
    await db.query(`DELETE FROM chat_sessions WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM mood_checkins WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM journals WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM tarot_readings WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM astrology_readings WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM community_comments WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM community_likes WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM community_bookmarks WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM community_posts WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM practitioner_reviews WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM bookings WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM user_activity WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM subscriptions WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM payments WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM user_profiles WHERE user_id = $1`, [userId])
    await db.query(`UPDATE users SET email = CONCAT('deleted_', id), name = 'Deleted User', password_hash = NULL, birth_date = NULL, birth_time = NULL, birth_place = NULL, is_active = false WHERE id = $1`, [userId])

    res.json({ message: 'All personal data has been deleted. Your account has been deactivated.' })
  } catch (error) {
    console.error('Data deletion error:', error)
    res.status(500).json({ error: 'Failed to delete data' })
  }
})

// Privacy policy content
router.get('/policy', (_req: AuthRequest, res: Response) => {
  res.json({
    lastUpdated: '2026-06-21',
    sections: [
      {
        title: 'Data We Collect',
        content: 'Account information (email, name), birth profile (date, time, place), mood check-ins, journal entries, divination readings, chat messages, and subscription status.'
      },
      {
        title: 'How We Use Your Data',
        content: 'To provide personalized spiritual wellness insights, AI advisor conversations, and divination readings. Your data improves the quality of recommendations.'
      },
      {
        title: 'Data Storage',
        content: 'Your data is stored securely in our PostgreSQL database. Chat messages and readings are retained to provide continuity in your spiritual journey.'
      },
      {
        title: 'Your Rights',
        content: 'You may export all your data at any time (GET /api/privacy/export). You may delete all your data permanently (DELETE /api/privacy/delete). You may cancel your subscription at any time.'
      },
      {
        title: 'AI Safety',
        content: 'AI outputs are validated for safety. Crisis content triggers professional help referrals. We do not provide medical, legal, or financial advice.'
      },
      {
        title: 'Contact',
        content: 'For privacy inquiries, contact privacy@soulai.app'
      }
    ]
  })
})

export default router
