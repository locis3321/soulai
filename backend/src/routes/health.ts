import { Router, Request, Response } from 'express'
import { db, cache, checkDatabase, checkRedis } from '../lib/db.js'

const router = Router()

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const [dbHealthy, redisHealthy] = await Promise.all([
      checkDatabase(),
      checkRedis(),
    ])

    const health = {
      status: dbHealthy && redisHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          responseTime: 0, // Could measure actual response time
        },
        redis: {
          status: redisHealthy ? 'healthy' : 'unhealthy',
          responseTime: 0,
        },
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      environment: process.env.NODE_ENV || 'development',
    }

    const statusCode = health.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    })
  }
})

// Readiness probe (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabase()
    if (dbHealthy) {
      res.status(200).json({ status: 'ready' })
    } else {
      res.status(503).json({ status: 'not ready' })
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready' })
  }
})

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' })
})

export default router
