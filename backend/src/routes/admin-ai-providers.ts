import { Router, Response } from 'express'
import { authenticateAdmin, AdminRequest, requireAdminPermission, logAudit } from '../middleware/adminAuth.js'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()
router.use(authenticateAdmin)

// ─── List Providers ────────────────────────────────────────────────────

router.get('/ai-providers', requireAdminPermission('config.read'), async (_req: AdminRequest, res: Response) => {
  try {
    const result = await db.query(`SELECT * FROM ai_providers ORDER BY priority_order, created_at DESC`)
    res.json({ providers: result.rows })
  } catch (error) { console.error('List providers error:', error); res.status(500).json({ error: 'Failed to list providers' }) }
})

// ─── Create Provider ───────────────────────────────────────────────────

router.post('/ai-providers', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { name, provider_type, api_url, api_key, model, priority_order } = z.object({
      name: z.string().min(1),
      provider_type: z.enum(['openai_compatible', 'custom']).default('openai_compatible'),
      api_url: z.string().url(),
      api_key: z.string().min(1),
      model: z.string().min(1),
      priority_order: z.number().int().default(0),
    }).parse(req.body)

    const result = await db.query(
      `INSERT INTO ai_providers (name, provider_type, api_url, api_key, model, priority_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, provider_type, api_url, api_key, model, priority_order]
    )
    await logAudit(req.adminUserId!, 'ai_provider.create', 'ai_provider', result.rows[0].id, null, { name }, req.ip, req.headers['user-agent'])
    res.json({ provider: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Create provider error:', error); res.status(500).json({ error: 'Failed to create provider' })
  }
})

// ─── Update Provider ───────────────────────────────────────────────────

router.put('/ai-providers/:id', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, api_url, api_key, model, priority_order, is_active } = z.object({
      name: z.string().min(1).optional(),
      api_url: z.string().url().optional(),
      api_key: z.string().min(1).optional(),
      model: z.string().min(1).optional(),
      priority_order: z.number().int().optional(),
      is_active: z.boolean().optional(),
    }).parse(req.body)

    const fields: string[] = []
    const params: any[] = []
    let idx = 1
    for (const [k, v] of Object.entries({ name, api_url, api_key, model, priority_order, is_active })) {
      if (v !== undefined) { fields.push(`${k} = $${idx}`); params.push(v); idx++ }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' })
    fields.push(`updated_at = NOW()`)

    const result = await db.query(
      `UPDATE ai_providers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...params, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'ai_provider.update', 'ai_provider', id, null, req.body, req.ip, req.headers['user-agent'])
    res.json({ provider: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Update provider error:', error); res.status(500).json({ error: 'Failed to update provider' })
  }
})

// ─── Delete Provider ───────────────────────────────────────────────────

router.delete('/ai-providers/:id', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const result = await db.query('DELETE FROM ai_providers WHERE id = $1 RETURNING id, name', [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'ai_provider.delete', 'ai_provider', id, { name: result.rows[0].name })
    res.json({ deleted: true })
  } catch (error) { console.error('Delete provider error:', error); res.status(500).json({ error: 'Failed to delete' }) }
})

export default router
