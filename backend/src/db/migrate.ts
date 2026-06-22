import pg from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MIGRATIONS_DIR = join(__dirname, 'migrations')

export interface MigrationResult {
  version: string
  name: string
  applied: boolean
  error?: string
}

/**
 * Ensure schema_migrations table exists
 */
async function ensureMigrationsTable(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

/**
 * Get list of already-applied migration versions
 */
async function getAppliedVersions(pool: pg.Pool): Promise<Set<string>> {
  const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version')
  return new Set(result.rows.map((r: any) => r.version))
}

/**
 * Get sorted list of migration files from disk
 */
function getMigrationFiles(): Array<{ version: string; name: string; path: string }> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  return files.map(f => {
    const match = f.match(/^(\d+)_(.+)\.sql$/)
    if (!match) return null
    return { version: match[1], name: match[2], path: join(MIGRATIONS_DIR, f) }
  }).filter(Boolean) as Array<{ version: string; name: string; path: string }>
}

/**
 * Run all pending migrations
 */
export async function runMigrations(connectionString?: string): Promise<MigrationResult[]> {
  const connStr = connectionString || process.env.DATABASE_URL || 'postgresql://soulai:soulai_password@localhost:5432/soulai_db'
  const pool = new pg.Pool({ connectionString: connStr })

  try {
    await ensureMigrationsTable(pool)
    const applied = await getAppliedVersions(pool)
    const pending = getMigrationFiles().filter(m => !applied.has(m.version))

    if (pending.length === 0) {
      console.log('No pending migrations.')
      return []
    }

    const results: MigrationResult[] = []

    for (const migration of pending) {
      console.log(`Running migration ${migration.version}_${migration.name}...`)
      const client = await pool.connect()

      try {
        const sql = readFileSync(migration.path, 'utf-8')
        await client.query('BEGIN')
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [migration.version, migration.name]
        )
        await client.query('COMMIT')

        console.log(`  ✓ ${migration.version}_${migration.name}`)
        results.push({ version: migration.version, name: migration.name, applied: true })
      } catch (error: any) {
        await client.query('ROLLBACK')
        console.error(`  ✗ ${migration.version}_${migration.name}: ${error.message}`)
        results.push({ version: migration.version, name: migration.name, applied: false, error: error.message })
        break // Stop on first failure
      } finally {
        client.release()
      }
    }

    return results
  } finally {
    await pool.end()
  }
}

/**
 * Get migration status (which applied, which pending)
 */
export async function getMigrationStatus(connectionString?: string): Promise<{
  applied: Array<{ version: string; name: string; applied_at: string }>
  pending: Array<{ version: string; name: string }>
}> {
  const connStr = connectionString || process.env.DATABASE_URL || 'postgresql://soulai:soulai_password@localhost:5432/soulai_db'
  const pool = new pg.Pool({ connectionString: connStr })

  try {
    await ensureMigrationsTable(pool)
    const appliedResult = await pool.query('SELECT version, name, applied_at FROM schema_migrations ORDER BY version')
    const applied = appliedResult.rows.map((r: any) => ({
      version: r.version,
      name: r.name,
      applied_at: r.applied_at,
    }))

    const appliedVersions = new Set(applied.map(a => a.version))
    const allMigrations = getMigrationFiles()
    const pending = allMigrations
      .filter(m => !appliedVersions.has(m.version))
      .map(m => ({ version: m.version, name: m.name }))

    return { applied, pending }
  } finally {
    await pool.end()
  }
}

/**
 * Mark a migration as applied without running it (for bootstrapping)
 */
export async function markMigrationApplied(version: string, name: string, connectionString?: string): Promise<void> {
  const connStr = connectionString || process.env.DATABASE_URL || 'postgresql://soulai:soulai_password@localhost:5432/soulai_db'
  const pool = new pg.Pool({ connectionString: connStr })

  try {
    await ensureMigrationsTable(pool)
    await pool.query(
      'INSERT INTO schema_migrations (version, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [version, name]
    )
  } finally {
    await pool.end()
  }
}
