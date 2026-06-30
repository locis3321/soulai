import { Router, Response } from 'express'
import { authenticateAdmin, AdminRequest, requireAdminPermission, logAudit } from '../middleware/adminAuth.js'
import { db } from '../lib/db.js'
import { z } from 'zod'
import type { ChatMessage } from '../lib/ai-provider.js'

const router = Router()
router.use(authenticateAdmin)

// ─── List Masters ──────────────────────────────────────────────────────

router.get('/masters', requireAdminPermission('config.read'), async (req: AdminRequest, res: Response) => {
  try {
    const category = req.query.category as string

    let query = `
      SELECT m.*,
        (SELECT COUNT(*) FROM ai_master_prompts p WHERE p.master_id = m.id) as prompt_count,
        (SELECT p.version FROM ai_master_prompts p WHERE p.master_id = m.id AND p.status = 'active' AND p.language = 'en' ORDER BY p.created_at DESC LIMIT 1) as active_version,
        (SELECT p.model FROM ai_master_prompts p WHERE p.master_id = m.id AND p.status = 'active' AND p.language = 'en' ORDER BY p.created_at DESC LIMIT 1) as active_model,
        (SELECT COUNT(*) FROM ai_request_logs l WHERE l.request_type = m.key AND l.created_at > NOW() - INTERVAL '24 hours') as calls_24h,
        (SELECT CASE WHEN COUNT(*) > 0 THEN
          ROUND(COUNT(*) FILTER (WHERE was_fallback = true)::decimal / COUNT(*) * 100, 1)
        ELSE 0 END FROM ai_request_logs l WHERE l.request_type = m.key AND l.created_at > NOW() - INTERVAL '24 hours') as failure_rate_24h
      FROM ai_masters m
    `
    const params: any[] = []
    if (category && category !== 'all') {
      query += ` WHERE m.category = $1`
      params.push(category)
    }
    query += ` ORDER BY m.category, m.name`

    const result = await db.query(query, params)
    res.json({ masters: result.rows })
  } catch (error) {
    console.error('List AI masters error:', error)
    res.status(500).json({ error: 'Failed to list AI masters' })
  }
})

// ─── Get Master Detail ─────────────────────────────────────────────────

router.get('/masters/:id', requireAdminPermission('config.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params

    const master = await db.query(`SELECT * FROM ai_masters WHERE id = $1`, [id])
    if (master.rows.length === 0) {
      return res.status(404).json({ error: 'AI master not found' })
    }

    const prompts = await db.query(
      `SELECT * FROM ai_master_prompts WHERE master_id = $1 ORDER BY created_at DESC`,
      [id]
    )

    res.json({
      master: master.rows[0],
      prompts: prompts.rows,
    })
  } catch (error) {
    console.error('Get AI master error:', error)
    res.status(500).json({ error: 'Failed to get AI master' })
  }
})

// ─── Create Master ─────────────────────────────────────────────────────

const masterSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  description: z.string().optional(),
  avatar: z.string().max(10).optional(),
})

router.post('/masters', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const data = masterSchema.parse(req.body)

    const result = await db.query(
      `INSERT INTO ai_masters (key, name, category, description, avatar)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.key, data.name, data.category, data.description || null, data.avatar || '🤖']
    )

    await logAudit(req.adminUserId!, 'ai_master.create', 'ai_master', result.rows[0].id, null, { key: data.key })

    res.status(201).json({ master: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create AI master error:', error)
    res.status(500).json({ error: 'Failed to create AI master' })
  }
})

// ─── Update Master ─────────────────────────────────────────────────────

router.put('/masters/:id', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, category, description, avatar, is_active } = req.body

    const before = await db.query(`SELECT * FROM ai_masters WHERE id = $1`, [id])
    if (before.rows.length === 0) {
      return res.status(404).json({ error: 'AI master not found' })
    }

    const result = await db.query(
      `UPDATE ai_masters SET
        name = COALESCE($2, name),
        category = COALESCE($3, category),
        description = COALESCE($4, description),
        avatar = COALESCE($5, avatar),
        is_active = COALESCE($6, is_active)
       WHERE id = $1 RETURNING *`,
      [id, name, category, description, avatar, is_active]
    )

    await logAudit(req.adminUserId!, 'ai_master.update', 'ai_master', id, before.rows[0], result.rows[0])

    res.json({ master: result.rows[0] })
  } catch (error) {
    console.error('Update AI master error:', error)
    res.status(500).json({ error: 'Failed to update AI master' })
  }
})

// ─── List Prompts for Master ───────────────────────────────────────────

router.get('/masters/:id/prompts', requireAdminPermission('config.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const language = req.query.language as string

    let query = `SELECT * FROM ai_master_prompts WHERE master_id = $1`
    const params: any[] = [id]

    if (language) {
      query += ` AND language = $2`
      params.push(language)
    }
    query += ` ORDER BY created_at DESC`

    const result = await db.query(query, params)
    res.json({ prompts: result.rows })
  } catch (error) {
    console.error('List prompts error:', error)
    res.status(500).json({ error: 'Failed to list prompts' })
  }
})

// ─── Create Prompt Version ─────────────────────────────────────────────

const promptSchema = z.object({
  version: z.string().min(1).max(20),
  language: z.string().min(2).max(10).default('en'),
  system_prompt: z.string().min(1),
  user_prompt_template: z.string().optional(),
  safety_prompt: z.string().optional(),
  output_schema: z.any().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(8192).optional(),
  change_note: z.string().optional(),
})

router.post('/masters/:id/prompts', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const data = promptSchema.parse(req.body)

    // Verify master exists
    const master = await db.query(`SELECT id FROM ai_masters WHERE id = $1`, [id])
    if (master.rows.length === 0) {
      return res.status(404).json({ error: 'AI master not found' })
    }

    // Check for duplicate version+language
    const existing = await db.query(
      `SELECT id FROM ai_master_prompts WHERE master_id = $1 AND version = $2 AND language = $3`,
      [id, data.version, data.language]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Version already exists for this language' })
    }

    const result = await db.query(
      `INSERT INTO ai_master_prompts
        (master_id, version, language, system_prompt, user_prompt_template, safety_prompt, output_schema, model, temperature, max_tokens, status, change_note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11, $12)
       RETURNING *`,
      [id, data.version, data.language, data.system_prompt,
       data.user_prompt_template || null, data.safety_prompt || null,
       data.output_schema ? JSON.stringify(data.output_schema) : null,
       data.model || 'gemini-2.0-flash', data.temperature ?? 0.7, data.max_tokens || 2048,
       data.change_note || null, req.adminEmail]
    )

    await logAudit(req.adminUserId!, 'ai_master_prompt.create', 'ai_master_prompt', result.rows[0].id, null, { version: data.version, language: data.language })

    res.status(201).json({ prompt: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create prompt error:', error)
    res.status(500).json({ error: 'Failed to create prompt' })
  }
})

// ─── Update Prompt (draft only) ────────────────────────────────────────

router.put('/prompts/:promptId', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { promptId } = req.params
    const before = await db.query(`SELECT * FROM ai_master_prompts WHERE id = $1`, [promptId])
    if (before.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' })
    }
    if (before.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Can only edit draft prompts' })
    }

    const { system_prompt, user_prompt_template, safety_prompt, output_schema, model, temperature, max_tokens, change_note } = req.body

    const result = await db.query(
      `UPDATE ai_master_prompts SET
        system_prompt = COALESCE($2, system_prompt),
        user_prompt_template = COALESCE($3, user_prompt_template),
        safety_prompt = COALESCE($4, safety_prompt),
        output_schema = COALESCE($5, output_schema),
        model = COALESCE($6, model),
        temperature = COALESCE($7, temperature),
        max_tokens = COALESCE($8, max_tokens),
        change_note = COALESCE($9, change_note)
       WHERE id = $1 RETURNING *`,
      [promptId, system_prompt, user_prompt_template, safety_prompt,
       output_schema ? JSON.stringify(output_schema) : null,
       model, temperature, max_tokens, change_note]
    )

    await logAudit(req.adminUserId!, 'ai_master_prompt.update', 'ai_master_prompt', promptId, before.rows[0], result.rows[0])

    res.json({ prompt: result.rows[0] })
  } catch (error) {
    console.error('Update prompt error:', error)
    res.status(500).json({ error: 'Failed to update prompt' })
  }
})

// ─── Publish Prompt (activate) ─────────────────────────────────────────

router.post('/prompts/:promptId/publish', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { promptId } = req.params

    const prompt = await db.query(`SELECT * FROM ai_master_prompts WHERE id = $1`, [promptId])
    if (prompt.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' })
    }

    const p = prompt.rows[0]

    // Archive current active prompt for same master+language
    await db.query(
      `UPDATE ai_master_prompts SET status = 'archived'
       WHERE master_id = $1 AND language = $2 AND status = 'active'`,
      [p.master_id, p.language]
    )

    // Activate this prompt
    const result = await db.query(
      `UPDATE ai_master_prompts SET status = 'active', activated_by = $2, activated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [promptId, req.adminEmail]
    )

    await logAudit(req.adminUserId!, 'ai_master_prompt.publish', 'ai_master_prompt', promptId,
      { version: p.version, status: 'draft' },
      { version: p.version, status: 'active' }
    )

    res.json({ prompt: result.rows[0] })
  } catch (error) {
    console.error('Publish prompt error:', error)
    res.status(500).json({ error: 'Failed to publish prompt' })
  }
})

// ─── Delete Prompt (draft or archived only) ────────────────────────────

router.delete('/prompts/:promptId', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { promptId } = req.params

    const prompt = await db.query(`SELECT * FROM ai_master_prompts WHERE id = $1`, [promptId])
    if (prompt.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' })
    }

    const p = prompt.rows[0]
    if (p.status === 'active') {
      return res.status(400).json({ error: 'Cannot delete an active prompt. Archive it first.' })
    }

    await db.query(`DELETE FROM ai_master_prompt_tests WHERE master_prompt_id = $1`, [promptId])
    await db.query(`DELETE FROM ai_master_prompts WHERE id = $1`, [promptId])

    await logAudit(req.adminUserId!, 'ai_master_prompt.delete', 'ai_master_prompt', promptId,
      { version: p.version, language: p.language, status: p.status }
    )

    res.json({ deleted: true })
  } catch (error) {
    console.error('Delete prompt error:', error)
    res.status(500).json({ error: 'Failed to delete prompt' })
  }
})

// ─── Rollback Archived Prompt ──────────────────────────────────────────

router.post('/prompts/:promptId/rollback', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { promptId } = req.params
    const prompt = await db.query(`SELECT * FROM ai_master_prompts WHERE id = $1`, [promptId])
    if (prompt.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' })
    const p = prompt.rows[0]
    if (p.status !== 'archived') return res.status(400).json({ error: 'Only archived prompts can be rolled back' })

    // Archive current active prompt for same master+language
    await db.query(`UPDATE ai_master_prompts SET status = 'archived' WHERE master_id = $1 AND language = $2 AND status = 'active'`, [p.master_id, p.language])
    // Rollback: set this archived prompt to active
    const result = await db.query(`UPDATE ai_master_prompts SET status = 'active', activated_by = $2, activated_at = NOW() WHERE id = $1 RETURNING *`, [promptId, req.adminEmail])

    await logAudit(req.adminUserId!, 'ai_master_prompt.rollback', 'ai_master_prompt', promptId, { version: p.version, status: 'archived' }, { version: p.version, status: 'active' })
    res.json({ prompt: result.rows[0] })
  } catch (error) { console.error('Rollback prompt error:', error); res.status(500).json({ error: 'Failed to rollback' }) }
})

// ─── Delete Master ──────────────────────────────────────────────────────

router.delete('/masters/:id', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const master = await db.query(`SELECT * FROM ai_masters WHERE id = $1`, [id])
    if (master.rows.length === 0) return res.status(404).json({ error: 'Master not found' })
    await db.query(`DELETE FROM ai_master_prompt_tests WHERE master_prompt_id IN (SELECT id FROM ai_master_prompts WHERE master_id = $1)`, [id])
    await db.query(`DELETE FROM ai_master_prompts WHERE master_id = $1`, [id])
    await db.query(`DELETE FROM ai_masters WHERE id = $1`, [id])
    await logAudit(req.adminUserId!, 'ai_master.delete', 'ai_master', id, { name: master.rows[0].name })
    res.json({ deleted: true })
  } catch (error) { console.error('Delete master error:', error); res.status(500).json({ error: 'Failed to delete master' }) }
})

// ─── Test Prompt ───────────────────────────────────────────────────────

const testSchema = z.object({
  input_payload: z.record(z.any()),
  language: z.string().optional(),
})

router.post('/prompts/:promptId/test', requireAdminPermission('config.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { promptId } = req.params
    const { input_payload, language } = testSchema.parse(req.body)

    const prompt = await db.query(
      `SELECT p.*, m.key as master_key, m.name as master_name
       FROM ai_master_prompts p JOIN ai_masters m ON p.master_id = m.id
       WHERE p.id = $1`,
      [promptId]
    )
    if (prompt.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' })
    }

    const p = prompt.rows[0]

    // Render the prompt by replacing variables
    let rendered = p.system_prompt + '\n\n'
    if (p.safety_prompt) rendered += p.safety_prompt + '\n\n'
    if (p.user_prompt_template) {
      let userPrompt = p.user_prompt_template
      for (const [key, value] of Object.entries(input_payload)) {
        userPrompt = userPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
      }
      rendered += userPrompt
    }

    const startTime = Date.now()

    // Call AI provider
    let output = ''
    let tokenUsage = 0
    try {
      const { aiProvider } = await import('../lib/ai-provider.js')
      const messages: ChatMessage[] = [
        { role: 'system', content: p.system_prompt + (p.safety_prompt ? '\n\n' + p.safety_prompt : '') },
      ]
      let userContent = p.user_prompt_template || ''
      for (const [key, value] of Object.entries(input_payload)) {
        userContent = userContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
      }
      if (userContent) messages.push({ role: 'user', content: userContent })

      const aiResult = await aiProvider.complete({
        messages,
        maxTokens: p.max_tokens,
        temperature: parseFloat(p.temperature),
      })
      output = aiResult.content || ''
      tokenUsage = aiResult.usage?.totalTokens || 0
    } catch (aiError: any) {
      output = `AI Error: ${aiError.message}`
    }

    const latencyMs = Date.now() - startTime

    // Save test result
    const testResult = await db.query(
      `INSERT INTO ai_master_prompt_tests
        (master_prompt_id, input_payload, rendered_prompt, output, model, latency_ms, token_usage, tested_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [promptId, JSON.stringify(input_payload), rendered, output, p.model, latencyMs, tokenUsage, req.adminEmail]
    )

    res.json({
      test: testResult.rows[0],
      rendered,
      output,
      latency_ms: latencyMs,
      token_usage: tokenUsage,
      model: p.model,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Test prompt error:', error)
    res.status(500).json({ error: 'Failed to test prompt' })
  }
})

// ─── Get Test History ──────────────────────────────────────────────────

router.get('/prompts/:promptId/tests', requireAdminPermission('config.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { promptId } = req.params
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    const result = await db.query(
      `SELECT * FROM ai_master_prompt_tests WHERE master_prompt_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [promptId, limit]
    )

    res.json({ tests: result.rows })
  } catch (error) {
    console.error('Get tests error:', error)
    res.status(500).json({ error: 'Failed to get tests' })
  }
})

export default router
