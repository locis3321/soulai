#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd()
const BRIDGE_HOST = process.env.MIMO_BRIDGE_HOST || '127.0.0.1'
const BRIDGE_PORT = Number(process.env.MIMO_BRIDGE_PORT || 7790)
const OPENCODE_BASE_URL = (process.env.OPENCODE_BASE_URL || process.env.MIMO_BASE_URL || 'http://127.0.0.1:7788').replace(/\/$/, '')
const STATE_FILE = process.env.MIMO_BRIDGE_STATE || path.join(PROJECT_ROOT, '.mimo-bridge-state.json')
const PREFERRED_SESSION_ID = process.env.MIMO_SESSION_ID || ''
const PROBE_SESSION_TITLES = new Set(['OK reply instruction'])

let mimoProcess = null

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    const err = new Error('Request body must be valid JSON')
    err.status = 400
    throw err
  }
}

async function opencodeFetch(route, options = {}) {
  const response = await fetch(`${OPENCODE_BASE_URL}${route}`, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let value = text
  if (text) {
    try {
      value = JSON.parse(text)
    } catch {
      value = text
    }
  }
  if (!response.ok) {
    const err = new Error(`opencode-compatible API ${response.status} ${response.statusText}`)
    err.status = response.status
    err.details = value
    throw err
  }
  return value
}

async function readState() {
  if (!existsSync(STATE_FILE)) return {}
  try {
    return JSON.parse(await readFile(STATE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

async function writeState(state) {
  await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

async function getSessions() {
  const sessions = await opencodeFetch('/session')
  return Array.isArray(sessions) ? sessions : []
}

function isUsableProjectSession(session) {
  return (
    session &&
    session.directory === PROJECT_ROOT &&
    typeof session.id === 'string' &&
    !session.parentID &&
    !String(session.title || '').startsWith('checkpoint-writer:')
  )
}

function isPreferredExistingSession(session) {
  const title = String(session.title || '')
  return (
    isUsableProjectSession(session) &&
    !title.startsWith('New session -') &&
    !PROBE_SESSION_TITLES.has(title)
  )
}

async function ensureSession({ title, forceNew = false } = {}) {
  const state = await readState()
  if (!forceNew && PREFERRED_SESSION_ID) {
    const session = await opencodeFetch(`/session/${PREFERRED_SESSION_ID}`)
    if (isUsableProjectSession(session)) {
      state[PROJECT_ROOT] = { sessionID: session.id, updatedAt: new Date().toISOString() }
      await writeState(state)
      return session
    }
  }

  if (!forceNew && state[PROJECT_ROOT]?.sessionID) {
    try {
      const session = await opencodeFetch(`/session/${state[PROJECT_ROOT].sessionID}`)
      if (isPreferredExistingSession(session)) return session
    } catch {
      // Fall through and recover from the session list.
    }
  }

  const sessions = await getSessions()
  if (!forceNew) {
    const existing = sessions
      .filter(isPreferredExistingSession)
      .sort((a, b) => (b.time?.updated || 0) - (a.time?.updated || 0))[0]
    if (existing) {
      state[PROJECT_ROOT] = { sessionID: existing.id, updatedAt: new Date().toISOString() }
      await writeState(state)
      return existing
    }
  }

  const created = await opencodeFetch('/session', { method: 'POST', body: JSON.stringify({}) })
  if (title && created?.id) {
    try {
      await opencodeFetch(`/session/${created.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })
    } catch {
      // Some Mimo builds accept PATCH for other fields only. Session creation still succeeded.
    }
  }
  state[PROJECT_ROOT] = { sessionID: created.id, updatedAt: new Date().toISOString() }
  await writeState(state)
  return created
}

function buildCoordinatorPrompt(message) {
  return `Codex is coordinating this SoulAI development task. Continue in the current project session and preserve project context.

Before editing, read and follow AGENTS.md. Keep the product positioned as spiritual wellness, self-discovery, and emotional reflection. Do not add deterministic fortune-telling claims, medical/legal/investment advice, fear-based upsells, or real secrets.

Work only on the task below. Keep changes focused. If you need to expand scope, stop and ask.

Task:
${message}

Required final report:
- Files changed
- Behavior changed
- Verification commands and results
- Any skipped verification and why
- Risks or decisions for Codex review`
}

async function postMessage(sessionID, message, { raw = false } = {}) {
  const text = raw ? message : buildCoordinatorPrompt(message)
  return opencodeFetch(`/session/${sessionID}/message`, {
    method: 'POST',
    body: JSON.stringify({ parts: [{ type: 'text', text }] }),
  })
}

function summarizeStatus(messages) {
  const last = Array.isArray(messages) ? messages[messages.length - 1] : null
  if (!last) return { status: 'idle', lastMessageID: null, finish: null }
  const finish = last.info?.finish || null
  if (last.info?.role === 'assistant' && finish && finish !== 'tool-calls') {
    return { status: 'idle', lastMessageID: last.info.id, finish }
  }
  if (last.info?.role === 'assistant' && finish === 'tool-calls') {
    return { status: 'running_or_waiting', lastMessageID: last.info.id, finish }
  }
  return { status: 'idle', lastMessageID: last.info?.id || null, finish }
}

function startMimoIfRequested() {
  if (!process.argv.includes('--start-mimo')) return
  mimoProcess = spawn('mimo', [
    'acp',
    '--hostname',
    new URL(OPENCODE_BASE_URL).hostname,
    '--port',
    new URL(OPENCODE_BASE_URL).port || '7788',
    '--cwd',
    PROJECT_ROOT,
  ], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
}

async function handle(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${BRIDGE_HOST}:${BRIDGE_PORT}`}`)

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      const sessions = await getSessions()
      return sendJson(res, 200, {
        ok: true,
        projectRoot: PROJECT_ROOT,
        opencodeBaseUrl: OPENCODE_BASE_URL,
        sessionCount: sessions.length,
      })
    }

    if (req.method === 'GET' && url.pathname === '/sessions') {
      const sessions = await getSessions()
      return sendJson(res, 200, sessions.filter(isUsableProjectSession))
    }

    if (req.method === 'POST' && url.pathname === '/session/ensure') {
      const body = await readJson(req)
      const session = await ensureSession({ title: body.title, forceNew: Boolean(body.forceNew) })
      return sendJson(res, 200, session)
    }

    if (req.method === 'POST' && url.pathname === '/session/select') {
      const body = await readJson(req)
      if (!body.sessionID || typeof body.sessionID !== 'string') {
        return sendJson(res, 400, { error: 'sessionID is required' })
      }
      const session = await opencodeFetch(`/session/${body.sessionID}`)
      if (!isUsableProjectSession(session)) {
        return sendJson(res, 400, { error: 'session does not belong to this project', session })
      }
      const state = await readState()
      state[PROJECT_ROOT] = { sessionID: session.id, updatedAt: new Date().toISOString() }
      await writeState(state)
      return sendJson(res, 200, session)
    }

    if (req.method === 'GET' && url.pathname === '/status') {
      const session = await ensureSession()
      const messages = await opencodeFetch(`/session/${session.id}/message`)
      return sendJson(res, 200, { session, ...summarizeStatus(messages) })
    }

    if (req.method === 'GET' && url.pathname === '/messages') {
      const sessionID = url.searchParams.get('sessionID') || (await ensureSession()).id
      const limit = Number(url.searchParams.get('limit') || 20)
      const messages = await opencodeFetch(`/session/${sessionID}/message`)
      const limited = Number.isFinite(limit) && limit > 0 ? messages.slice(-limit) : messages
      return sendJson(res, 200, { sessionID, messages: limited, total: messages.length })
    }

    if (req.method === 'POST' && url.pathname === '/task') {
      const body = await readJson(req)
      if (!body.message || typeof body.message !== 'string') {
        return sendJson(res, 400, { error: 'message is required' })
      }
      const session = await ensureSession({
        title: body.title || 'Codex-managed SoulAI development',
        forceNew: Boolean(body.forceNew),
      })
      const result = await postMessage(session.id, body.message, { raw: Boolean(body.raw) })
      return sendJson(res, 200, { session, result })
    }

    if (req.method === 'POST' && url.pathname === '/reply') {
      const body = await readJson(req)
      if (!body.message || typeof body.message !== 'string') {
        return sendJson(res, 400, { error: 'message is required' })
      }
      const sessionID = body.sessionID || (await ensureSession()).id
      const result = await postMessage(sessionID, body.message, { raw: Boolean(body.raw) })
      return sendJson(res, 200, { sessionID, result })
    }

    if (req.method === 'POST' && url.pathname === '/abort') {
      const body = await readJson(req)
      const sessionID = body.sessionID || (await ensureSession()).id
      const result = await opencodeFetch(`/session/${sessionID}/abort`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      return sendJson(res, 200, { sessionID, result })
    }

    if (req.method === 'GET' && url.pathname === '/events') {
      const upstream = await fetch(`${OPENCODE_BASE_URL}/global/event`)
      res.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'text/event-stream',
        'cache-control': 'no-cache',
      })
      if (!upstream.body) return res.end()
      for await (const chunk of upstream.body) res.write(Buffer.from(chunk))
      return res.end()
    }

    return sendJson(res, 404, { error: 'not found' })
  } catch (error) {
    return sendJson(res, error.status || 500, {
      error: error.message,
      details: error.details,
    })
  }
}

startMimoIfRequested()

const server = createServer(handle)
server.listen(BRIDGE_PORT, BRIDGE_HOST, () => {
  console.log(`mimo bridge listening on http://${BRIDGE_HOST}:${BRIDGE_PORT}`)
  console.log(`project root: ${PROJECT_ROOT}`)
  console.log(`opencode-compatible base url: ${OPENCODE_BASE_URL}`)
})

function shutdown() {
  if (mimoProcess) mimoProcess.kill('SIGINT')
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
