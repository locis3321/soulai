import { beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'

// API test setup
let app: express.Application

beforeAll(async () => {
  // Setup test app
  app = express()
  app.use(express.json())
  
  // Add your API routes here
  // Example:
  // app.use('/api', apiRouter)
})

afterAll(async () => {
  // Cleanup
})

export { app, request }
