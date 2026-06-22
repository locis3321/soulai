import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createServer } from 'http'

// Import routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import insightRoutes from './routes/insights.js'
import tarotRoutes from './routes/tarot.js'
import astrologyRoutes from './routes/astrology.js'
import baziRoutes from './routes/bazi.js'
import numerologyRoutes from './routes/numerology.js'
import ziweiRoutes from './routes/ziwei.js'
import chatRoutes from './routes/chat.js'
import healingRoutes from './routes/healing.js'
import paymentRoutes from './routes/payments.js'
import paymentCallbackRoutes from './routes/payments-callback.js'
import memoryRoutes from './routes/memory.js'
import healthRoutes from './routes/health.js'
import privacyRoutes from './routes/privacy.js'
import analyticsRoutes from './routes/analytics.js'
import communityRoutes from './routes/community.js'
import marketplaceRoutes from './routes/marketplace.js'

// Import middleware
import { errorHandler } from './middleware/errorHandler.js'
import { authenticateToken } from './middleware/auth.js'
import { downgradeExpiredSubscriptions } from './lib/subscription.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))

// Rate limiting (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
  })
  app.use('/api/', limiter)
}

// Logging
app.use(morgan('dev'))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check (no auth required)
app.use('/health', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', authenticateToken, userRoutes)
app.use('/api/insights', authenticateToken, insightRoutes)
app.use('/api/tarot', authenticateToken, tarotRoutes)
app.use('/api/astrology', authenticateToken, astrologyRoutes)
app.use('/api/bazi', authenticateToken, baziRoutes)
app.use('/api/numerology', authenticateToken, numerologyRoutes)
app.use('/api/ziwei', authenticateToken, ziweiRoutes)
app.use('/api/chat', authenticateToken, chatRoutes)
app.use('/api/healing', authenticateToken, healingRoutes)
app.use('/api/payments/callback', paymentCallbackRoutes) // No auth - payment providers call these
app.use('/api/payments', authenticateToken, paymentRoutes)
app.use('/api/memory', authenticateToken, memoryRoutes)
app.use('/api/privacy', authenticateToken, privacyRoutes)
app.use('/api/analytics', authenticateToken, analyticsRoutes)
app.use('/api/community', authenticateToken, communityRoutes)
app.use('/api/marketplace', authenticateToken, marketplaceRoutes)

// Error handling
app.use(errorHandler)

// Create HTTP server
const server = createServer(app)

// Downgrade expired subscriptions on startup and periodically (every hour)
downgradeExpiredSubscriptions()
setInterval(downgradeExpiredSubscriptions, 60 * 60 * 1000)

// Start server
server.listen(PORT, () => {
  console.log(`🚀 SoulAI Backend Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

export default app
