#!/usr/bin/env node

/**
 * Database migration CLI
 *
 * Usage:
 *   node dist/db/migrate-cli.js run      # Apply pending migrations
 *   node dist/db/migrate-cli.js status   # Show migration status
 *   node dist/db/migrate-cli.js bootstrap # Mark all migrations as applied (for existing DBs)
 */

import { runMigrations, getMigrationStatus, markMigrationApplied } from './migrate.js'
import { readdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const MIGRATIONS_DIR = join(__dirname, 'migrations')

const command = process.argv[2]

async function main() {
  switch (command) {
    case 'run': {
      console.log('Running pending migrations...\n')
      const results = await runMigrations()

      if (results.length === 0) {
        console.log('Database is up to date.')
      } else {
        const failed = results.filter(r => !r.applied)
        if (failed.length > 0) {
          console.error(`\n${failed.length} migration(s) failed.`)
          process.exit(1)
        } else {
          console.log(`\n${results.length} migration(s) applied successfully.`)
        }
      }
      break
    }

    case 'status': {
      const status = await getMigrationStatus()

      console.log('Applied migrations:')
      if (status.applied.length === 0) {
        console.log('  (none)')
      } else {
        for (const m of status.applied) {
          console.log(`  ✓ ${m.version}_${m.name} (${m.applied_at})`)
        }
      }

      console.log('\nPending migrations:')
      if (status.pending.length === 0) {
        console.log('  (none)')
      } else {
        for (const m of status.pending) {
          console.log(`  ○ ${m.version}_${m.name}`)
        }
      }
      break
    }

    case 'bootstrap': {
      console.log('Bootstrapping: marking all migrations as applied...\n')
      const files = readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort()

      for (const f of files) {
        const match = f.match(/^(\d+)_(.+)\.sql$/)
        if (match) {
          await markMigrationApplied(match[1], match[2])
          console.log(`  ✓ Marked ${match[1]}_${match[2]} as applied`)
        }
      }
      console.log('\nBootstrap complete.')
      break
    }

    default:
      console.log('Usage: node migrate-cli.js [run|status|bootstrap]')
      console.log('  run       - Apply pending migrations')
      console.log('  status    - Show migration status')
      console.log('  bootstrap - Mark all migrations as applied (for existing DBs)')
      process.exit(1)
  }

  process.exit(0)
}

main().catch(err => {
  console.error('Migration error:', err)
  process.exit(1)
})
