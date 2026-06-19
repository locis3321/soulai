import pg from 'pg'
import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

// PostgreSQL Configuration
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://soulai:soulai_password@localhost:5432/soulai_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Redis Configuration - prefer REDIS_URL (Docker), fall back to individual vars
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        return Math.min(times * 50, 2000)
      },
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        return Math.min(times * 50, 2000)
      },
    })

// Database connection wrapper
export const db = {
  async query(text: string, params?: any[]) {
    const start = Date.now()
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount })
    return res
  },

  async getClient() {
    const client = await pool.connect()
    return client
  },

  async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  },

  async close() {
    await pool.end()
  },
}

// Redis cache wrapper
export const cache = {
  async get(key: string) {
    return await redis.get(key)
  },

  async set(key: string, value: string, expireSeconds?: number) {
    if (expireSeconds) {
      await redis.setex(key, expireSeconds, value)
    } else {
      await redis.set(key, value)
    }
  },

  async del(key: string) {
    await redis.del(key)
  },

  async exists(key: string) {
    return (await redis.exists(key)) === 1
  },

  async expire(key: string, seconds: number) {
    await redis.expire(key, seconds)
  },

  async ttl(key: string) {
    return await redis.ttl(key)
  },

  async keys(pattern: string) {
    return await redis.keys(pattern)
  },

  async flushall() {
    await redis.flushall()
  },

  async close() {
    redis.disconnect()
  },
}

// Health check functions
export async function checkDatabase() {
  try {
    const result = await db.query('SELECT NOW()')
    return result.rows.length > 0
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

export async function checkRedis() {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}

// Cache helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  const cached = await cache.get(key)
  if (cached) {
    return JSON.parse(cached)
  }
  return null
}

export async function setCache<T>(key: string, value: T, expireSeconds?: number) {
  await cache.set(key, JSON.stringify(value), expireSeconds)
}

export async function deleteCache(key: string) {
  await cache.del(key)
}

export default { db, cache, checkDatabase, checkRedis, getCached, setCache, deleteCache }
