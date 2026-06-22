import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()

const bookingSchema = z.object({
  practitionerId: z.string().uuid(),
  bookingDate: z.string(),
  bookingTime: z.string(),
  consultationMode: z.enum(['text', 'voice', 'video']).default('text'),
})

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
})

// List practitioners
router.get('/practitioners', async (req: AuthRequest, res: Response) => {
  try {
    const category = req.query.category as string
    const search = req.query.search as string
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
    const offset = parseInt(req.query.offset as string) || 0

    let query = `
      SELECT id, name, avatar, specialties, rating, reviews_count, experience_years,
             location, price_per_session, bio, languages, is_verified
      FROM practitioners WHERE is_active = true
    `
    const params: any[] = []

    if (category && category !== 'all') {
      query += ` AND $${params.length + 1} = ANY(specialties)`
      params.push(category)
    }

    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR bio ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY rating DESC, reviews_count DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await db.query(query, params)

    const practitioners = result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      avatar: r.avatar,
      specialties: r.specialties || [],
      rating: parseFloat(r.rating),
      reviewsCount: r.reviews_count,
      experienceYears: r.experience_years,
      location: r.location,
      pricePerSession: r.price_per_session,
      bio: r.bio,
      languages: r.languages || [],
      isVerified: r.is_verified,
    }))

    res.json({ practitioners })
  } catch (error) {
    console.error('List practitioners error:', error)
    res.status(500).json({ error: 'Failed to list practitioners' })
  }
})

// Get practitioner detail
router.get('/practitioners/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const result = await db.query(
      `SELECT id, name, avatar, specialties, rating, reviews_count, experience_years,
              location, price_per_session, bio, languages, is_verified
       FROM practitioners WHERE id = $1 AND is_active = true`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Practitioner not found' })
    }

    const reviews = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as reviewer_name
       FROM practitioner_reviews r JOIN users u ON r.user_id = u.id
       WHERE r.practitioner_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
      [id]
    )

    const p = result.rows[0]
    res.json({
      practitioner: {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        specialties: p.specialties || [],
        rating: parseFloat(p.rating),
        reviewsCount: p.reviews_count,
        experienceYears: p.experience_years,
        location: p.location,
        pricePerSession: p.price_per_session,
        bio: p.bio,
        languages: p.languages || [],
        isVerified: p.is_verified,
      },
      reviews: reviews.rows.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reviewerName: r.reviewer_name,
      })),
    })
  } catch (error) {
    console.error('Get practitioner error:', error)
    res.status(500).json({ error: 'Failed to get practitioner' })
  }
})

// Create booking
router.post('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { practitionerId, bookingDate, bookingTime, consultationMode } = bookingSchema.parse(req.body)

    // Verify practitioner exists
    const practitioner = await db.query(
      `SELECT id, name FROM practitioners WHERE id = $1 AND is_active = true`,
      [practitionerId]
    )

    if (practitioner.rows.length === 0) {
      return res.status(404).json({ error: 'Practitioner not found' })
    }

    const result = await db.query(
      `INSERT INTO bookings (user_id, practitioner_id, booking_date, booking_time, consultation_mode)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, booking_date, booking_time, consultation_mode, status, created_at`,
      [userId, practitionerId, bookingDate, bookingTime, consultationMode]
    )

    res.status(201).json({
      booking: {
        id: result.rows[0].id,
        practitionerName: practitioner.rows[0].name,
        bookingDate: result.rows[0].booking_date,
        bookingTime: result.rows[0].booking_time,
        consultationMode: result.rows[0].consultation_mode,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create booking error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

// Get user bookings
router.get('/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const result = await db.query(
      `SELECT b.id, b.booking_date, b.booking_time, b.consultation_mode, b.status, b.created_at,
              p.name as practitioner_name, p.avatar as practitioner_avatar
       FROM bookings b JOIN practitioners p ON b.practitioner_id = p.id
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
      [userId]
    )

    res.json({
      bookings: result.rows.map((r: any) => ({
        id: r.id,
        bookingDate: r.booking_date,
        bookingTime: r.booking_time,
        consultationMode: r.consultation_mode,
        status: r.status,
        createdAt: r.created_at,
        practitionerName: r.practitioner_name,
        practitionerAvatar: r.practitioner_avatar,
      })),
    })
  } catch (error) {
    console.error('Get bookings error:', error)
    res.status(500).json({ error: 'Failed to get bookings' })
  }
})

// Submit review
router.post('/practitioners/:id/reviews', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { id: practitionerId } = req.params
    const { rating, comment } = reviewSchema.parse(req.body)

    const result = await db.query(
      `INSERT INTO practitioner_reviews (practitioner_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING id, rating, comment, created_at`,
      [practitionerId, userId, rating, comment || null]
    )

    // Update practitioner average rating
    await db.query(
      `UPDATE practitioners SET
        rating = (SELECT AVG(rating) FROM practitioner_reviews WHERE practitioner_id = $1),
        reviews_count = (SELECT COUNT(*) FROM practitioner_reviews WHERE practitioner_id = $1)
       WHERE id = $1`,
      [practitionerId]
    )

    res.status(201).json({ review: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Submit review error:', error)
    res.status(500).json({ error: 'Failed to submit review' })
  }
})

export default router
