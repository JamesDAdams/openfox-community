import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

async function buildIndex() {
  const packsDir = join(rootDir, 'packs')
  const files = (await readdir(packsDir)).filter((f) => f.endsWith('.json'))

  const packs = []

  for (const f of files.sort()) {
    const raw = await readFile(join(packsDir, f), 'utf8')
    const pack = JSON.parse(raw)

    const contents = pack.contents || {}
    const workflows = (contents.workflows || []).map((w) => `${w.name || w.id} (${w.id})`)
    const agents = (contents.agents || []).map((a) => `${a.name || a.id} (${a.id})`)
    const subAgents = (contents.subAgents || []).map((sa) => `${sa.name || sa.id} (${sa.id})`)
    const skills = (contents.skills || []).map((s) => s.name || s.id)
    const commands = (contents.commands || []).map((c) => c.prompt || c.name || c.id)
    const mcpServers = Object.entries(contents.mcpServers || {}).map(([name, conf]) =>
      conf.envRequirements?.length
        ? `${name} (Requires ${conf.envRequirements.map((r) => r.key).join(', ')})`
        : name,
    )

    const rawDownloadUrl = `https://raw.githubusercontent.com/JamesDAdams/openfox-community/main/packs/${pack.name}.json`

    packs.push({
      name: pack.name,
      version: pack.version || '1.0.0',
      displayName: pack.displayName || pack.name,
      description: pack.description || '',
      author: pack.author || 'Community',
      tags: pack.tags || ['community-pack'],
      downloadUrl: rawDownloadUrl,
      updatedAt: new Date().toISOString(),
      contentsSummary: {
        ...(workflows.length ? { workflows } : {}),
        ...(agents.length ? { agents } : {}),
        ...(subAgents.length ? { subAgents } : {}),
        ...(skills.length ? { skills } : {}),
        ...(commands.length ? { commands } : {}),
        ...(mcpServers.length ? { mcpServers } : {}),
      },
    })
  }

  const index = {
    version: 1,
    name: 'OpenFox Official Community Registry',
    updatedAt: new Date().toISOString(),
    packs,
  }

  await writeFile(join(rootDir, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8')
  console.log(`Successfully built index.json with ${packs.length} packs.`)
}

buildIndex().catch((err) => {
  console.error(err)
  process.exit(1)
})
