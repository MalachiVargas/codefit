// Merges data/prefix-sum-subtypes.json into data/problems.json's `techniques` field.
// Keeps the existing "Prefix Sum" label and adds the specific subtype as an additional entry.
//
// Run: node scripts/apply-prefix-sum-subtypes.mjs

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROBLEMS_PATH = path.join(__dirname, '..', 'data', 'problems.json')
const SUBTYPES_PATH = path.join(__dirname, '..', 'data', 'prefix-sum-subtypes.json')

async function main() {
  const data = JSON.parse(await readFile(PROBLEMS_PATH, 'utf-8'))
  const subtypes = JSON.parse(await readFile(SUBTYPES_PATH, 'utf-8'))
  const byId = new Map(subtypes.map((s) => [s.lc_id, s.subtype]))

  let applied = 0
  for (const p of data.problems) {
    const subtype = byId.get(p.lc_id)
    if (subtype && !p.techniques.includes(subtype)) {
      p.techniques.push(subtype)
      applied++
    }
  }

  await writeFile(PROBLEMS_PATH, JSON.stringify(data, null, 2))
  console.log(`Applied ${applied} prefix sum subtype labels.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
