import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'
import { moderateContent } from '../lib/moderation.js'
import { z } from 'zod'

const router = Router()

const postSchema = z.object({
  category: z.enum(['astrology', 'tarot', 'bazi', 'ziwei', 'healing', 'relationships']),
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(5000),
})

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
})

// List posts
router.get('/posts', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const category = req.query.category as string
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    const offset = parseInt(req.query.offset as string) || 0

    let query = `
      SELECT p.id, p.category, p.title, p.content, p.likes_count, p.comments_count, p.created_at,
             u.name as author_name, u.avatar_url as author_avatar,
             EXISTS(SELECT 1 FROM community_likes WHERE post_id = p.id AND user_id = $1) as liked,
             EXISTS(SELECT 1 FROM community_bookmarks WHERE post_id = p.id AND user_id = $1) as bookmarked
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
    `
    const params: any[] = [userId]

    if (category && category !== 'all') {
      query += ` WHERE p.category = $2`
      params.push(category)
    }

    query += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await db.query(query, params)

    const posts = result.rows.map((r: any) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      content: r.content,
      likesCount: r.likes_count,
      commentsCount: r.comments_count,
      createdAt: r.created_at,
      authorName: r.author_name,
      authorAvatar: r.author_avatar || '👤',
      liked: r.liked,
      bookmarked: r.bookmarked,
    }))

    res.json({ posts, total: posts.length })
  } catch (error) {
    console.error('List posts error:', error)
    res.status(500).json({ error: 'Failed to list posts' })
  }
})

// Create post
router.post('/posts', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { category, title, content } = postSchema.parse(req.body)

    const titleMod = moderateContent(title)
    const contentMod = moderateContent(content)

    const result = await db.query(
      `INSERT INTO community_posts (user_id, category, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, category, title, content, likes_count, comments_count, created_at`,
      [userId, category, titleMod.filtered, contentMod.filtered]
    )

    const post = result.rows[0]
    res.status(201).json({
      post: {
        id: post.id,
        category: post.category,
        title: post.title,
        content: post.content,
        likesCount: post.likes_count,
        commentsCount: post.comments_count,
        createdAt: post.created_at,
      },
      moderated: !titleMod.clean || !contentMod.clean,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create post error:', error)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

// Get post with comments
router.get('/posts/:postId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { postId } = req.params

    const postResult = await db.query(
      `SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
              EXISTS(SELECT 1 FROM community_likes WHERE post_id = p.id AND user_id = $2) as liked,
              EXISTS(SELECT 1 FROM community_bookmarks WHERE post_id = p.id AND user_id = $2) as bookmarked
       FROM community_posts p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [postId, userId]
    )

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const commentsResult = await db.query(
      `SELECT c.id, c.content, c.created_at, u.name as author_name, u.avatar_url as author_avatar
       FROM community_comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
      [postId]
    )

    const post = postResult.rows[0]
    res.json({
      post: {
        id: post.id,
        category: post.category,
        title: post.title,
        content: post.content,
        likesCount: post.likes_count,
        commentsCount: post.comments_count,
        createdAt: post.created_at,
        authorName: post.author_name,
        authorAvatar: post.author_avatar || '👤',
        liked: post.liked,
        bookmarked: post.bookmarked,
      },
      comments: commentsResult.rows.map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        authorName: c.author_name,
        authorAvatar: c.author_avatar || '👤',
      })),
    })
  } catch (error) {
    console.error('Get post error:', error)
    res.status(500).json({ error: 'Failed to get post' })
  }
})

// Add comment
router.post('/posts/:postId/comments', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { postId } = req.params
    const { content } = commentSchema.parse(req.body)

    const contentMod = moderateContent(content)

    const result = await db.query(
      `INSERT INTO community_comments (post_id, user_id, content) VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [postId, userId, contentMod.filtered]
    )

    await db.query(`UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = $1`, [postId])

    res.status(201).json({ comment: result.rows[0], moderated: !contentMod.clean })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Add comment error:', error)
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

// Toggle like
router.post('/posts/:postId/like', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { postId } = req.params

    const existing = await db.query(
      `SELECT id FROM community_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    )

    if (existing.rows.length > 0) {
      await db.query(`DELETE FROM community_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId])
      await db.query(`UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1`, [postId])
      res.json({ liked: false })
    } else {
      await db.query(`INSERT INTO community_likes (post_id, user_id) VALUES ($1, $2)`, [postId, userId])
      await db.query(`UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = $1`, [postId])
      res.json({ liked: true })
    }
  } catch (error) {
    console.error('Toggle like error:', error)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// Toggle bookmark
router.post('/posts/:postId/bookmark', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { postId } = req.params

    const existing = await db.query(
      `SELECT id FROM community_bookmarks WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    )

    if (existing.rows.length > 0) {
      await db.query(`DELETE FROM community_bookmarks WHERE post_id = $1 AND user_id = $2`, [postId, userId])
      res.json({ bookmarked: false })
    } else {
      await db.query(`INSERT INTO community_bookmarks (post_id, user_id) VALUES ($1, $2)`, [postId, userId])
      res.json({ bookmarked: true })
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error)
    res.status(500).json({ error: 'Failed to toggle bookmark' })
  }
})

export default router
