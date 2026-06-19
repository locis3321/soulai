import { Router, Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { checkEntitlement, trackUsage } from '../middleware/entitlement.js'
import { db } from '../lib/db.js'
import { generateAIResponse } from '../lib/ai.js'
import { buildUserContext, formatUserContextForPrompt } from '../lib/userContext.js'
import { checkUserInputForCrisis, validateAiOutput } from '../lib/safety.js'
import { z } from 'zod'

const router = Router()

// Validation schemas
const createSessionSchema = z.object({
  advisorKey: z.enum(['luna', 'athena', 'mystic', 'zen'])
})

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000)
})

// Get all chat sessions for user
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const result = await db.query(
      `SELECT id, advisor_key, title, created_at, updated_at 
       FROM chat_sessions 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [userId]
    )

    res.json({ sessions: result.rows })
  } catch (error) {
    console.error('Get chat sessions error:', error)
    res.status(500).json({ error: 'Failed to get chat sessions' })
  }
})

// Create new chat session
router.post('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { advisorKey } = createSessionSchema.parse(req.body)

    // Get advisor info for title
    const advisorNames: Record<string, string> = {
      luna: 'Luna - The Gentle Healer',
      athena: 'Athena - The Rational Counselor',
      mystic: 'Mystic - The Sacred Diviner',
      zen: 'Zen - The Mindful Rishi'
    }

    const title = advisorNames[advisorKey] || 'Chat Session'

    const result = await db.query(
      `INSERT INTO chat_sessions (user_id, advisor_key, title)
       VALUES ($1, $2, $3)
       RETURNING id, advisor_key, title, created_at, updated_at`,
      [userId, advisorKey, title]
    )

    res.status(201).json({ session: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create chat session error:', error)
    res.status(500).json({ error: 'Failed to create chat session' })
  }
})

// Get messages for a session
router.get('/sessions/:sessionId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { sessionId } = req.params

    // Verify session belongs to user
    const sessionCheck = await db.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    )

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const result = await db.query(
      `SELECT id, role, content, created_at 
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [sessionId]
    )

    res.json({ messages: result.rows })
  } catch (error) {
    console.error('Get chat messages error:', error)
    res.status(500).json({ error: 'Failed to get chat messages' })
  }
})

// Send message to session
router.post('/sessions/:sessionId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { sessionId } = req.params
    const { content } = sendMessageSchema.parse(req.body)

    // Check chat entitlement
    const userResult = await db.query('SELECT subscription_tier FROM users WHERE id = $1', [userId])
    const tier = userResult.rows[0]?.subscription_tier || 'free'
    const isUnlimited = tier === 'premium'

    if (!isUnlimited) {
      // Check monthly usage for non-premium users
      const usageResult = await db.query(
        `SELECT COUNT(*) as count FROM user_activity
         WHERE user_id = $1 AND activity_type = 'chat.message'
         AND created_at > date_trunc('month', NOW())`,
        [userId]
      )
      const limit = tier === 'plus' ? 50 : 5
      const used = parseInt(usageResult.rows[0]?.count || '0')
      if (used >= limit) {
        return res.status(429).json({
          error: 'Monthly chat limit reached',
          limit,
          used,
          upgradeTo: tier === 'free' ? 'plus' : 'premium',
        })
      }
    }

    // Verify session belongs to user
    const sessionCheck = await db.query(
      'SELECT id, advisor_key FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    )

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const session = sessionCheck.rows[0]

    // Build user context for personalized responses
    const userContext = await buildUserContext(userId!)
    const contextPrompt = formatUserContextForPrompt(userContext)

    // Safety: check user input for crisis content
    const crisisResponse = checkUserInputForCrisis(content, userContext.language)
    if (crisisResponse) {
      await db.query(`INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`, [sessionId, content])
      const aiMsg = await db.query(
        `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'assistant', $2) RETURNING id, role, content, created_at`,
        [sessionId, crisisResponse]
      )
      return res.json({ userMessage: { role: 'user', content }, aiMessage: aiMsg.rows[0], crisis: true })
    }

    // Get recent messages for context
    const recentMessages = await db.query(
      `SELECT role, content 
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [sessionId]
    )

    // Prepare messages for AI with user context as system message
    const messages = [
      {
        role: 'system' as const,
        content: `你是用户的专属灵性顾问。以下是用户的个人背景信息，请在回复时结合这些信息提供个性化的建议：\n\n${contextPrompt}`
      },
      ...recentMessages.rows.reverse().map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ]

    // Add current user message
    messages.push({ role: 'user', content })

    // Save user message
    const userMessage = await db.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, 'user', $2)
       RETURNING id, role, content, created_at`,
      [sessionId, content]
    )

    // Generate AI response using MiniMax-M3 with user context
    const aiResponse = await generateAIResponse({
      messages,
      advisorKey: session.advisor_key,
      maxTokens: 1500,
      temperature: 0.7
    })

    // Safety: validate AI output
    const validation = validateAiOutput(aiResponse.content, userContext.language)
    const finalContent = validation.safe ? aiResponse.content : (validation.replacement || aiResponse.content)
    if (!validation.safe) {
      console.warn('AI safety intervention:', validation.issues)
    }

    // Save AI message
    const aiMessage = await db.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, 'assistant', $2)
       RETURNING id, role, content, created_at`,
      [sessionId, finalContent]
    )

    // Update session timestamp
    await db.query(
      'UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1',
      [sessionId]
    )

    // Track usage
    trackUsage(userId!, 'chat.message')

    res.json({
      userMessage: userMessage.rows[0],
      aiMessage: aiMessage.rows[0]
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Delete chat session
router.delete('/sessions/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { sessionId } = req.params

    // Verify session belongs to user
    const sessionCheck = await db.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    )

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Delete messages first
    await db.query('DELETE FROM chat_messages WHERE session_id = $1', [sessionId])

    // Delete session
    await db.query('DELETE FROM chat_sessions WHERE id = $1', [sessionId])

    res.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Delete chat session error:', error)
    res.status(500).json({ error: 'Failed to delete chat session' })
  }
})

export default router
