import { readFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-status origin/main...HEAD', { cwd: rootDir, encoding: 'utf8' })
    return output
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [status, ...pathParts] = l.split(/\s+/)
        return { status, file: pathParts.join(' ') }
      })
  } catch (err) {
    console.warn('Could not run git diff against origin/main; falling back to checking all packs/*.json')
    return null
  }
}

async function validate() {
  const changes = getChangedFiles()

  if (changes && changes.length > 0) {
    console.log('Validating PR changes against main branch...')
    for (const change of changes) {
      console.log(`Checking change: ${change.status} ${change.file}`)

      // 1. Strict rule: only files in packs/*.json can be touched
      if (!change.file.startsWith('packs/') || !change.file.endsWith('.json')) {
        throw new Error(
          `Security violation: Pull Requests must only add files inside 'packs/*.json'. Modifying '${change.file}' is not permitted.`
        )
      }

      // 2. Strict rule: only Added ('A') files are allowed. Editing/deleting existing packs is blocked.
      if (change.status !== 'A') {
        throw new Error(
          `Policy violation: Editing or deleting existing packs is currently disabled. Pack '${change.file}' has status '${change.status}'. Only new packs ('A') are allowed.`
        )
      }

      // 3. Validate JSON content
      const raw = await readFile(join(rootDir, change.file), 'utf8')
      let pack
      try {
        pack = JSON.parse(raw)
      } catch (e) {
        throw new Error(`Invalid JSON syntax in '${change.file}': ${e.message}`)
      }

      if (pack.schemaVersion !== 1) {
        throw new Error(`Invalid schemaVersion in '${change.file}'. Expected 1, got ${pack.schemaVersion}`)
      }

      if (!pack.name || !/^[a-z0-9_-]+$/.test(pack.name)) {
        throw new Error(`Invalid pack name '${pack.name}' in '${change.file}'. Must match ^[a-z0-9_-]+$`)
      }

      if (!pack.version) {
        throw new Error(`Missing version in '${change.file}'`)
      }

      if (!pack.contents || typeof pack.contents !== 'object') {
        throw new Error(`Missing or invalid 'contents' object in '${change.file}'`)
      }

      console.log(`✓ Pack '${pack.name}' (v${pack.version}) is valid!`)
    }
  } else {
    console.log('No PR changes diff detected. Verifying all pack JSON files...')
    const { readdir } = await import('node:fs/promises')
    const files = (await readdir(join(rootDir, 'packs'))).filter((f) => f.endsWith('.json'))
    for (const f of files) {
      const raw = await readFile(join(rootDir, 'packs', f), 'utf8')
      JSON.parse(raw)
    }
    console.log(`✓ All ${files.length} packs in repository are valid JSON.`)
  }
}

validate().catch((err) => {
  console.error(`❌ Validation failed: ${err.message}`)
  process.exit(1)
})
