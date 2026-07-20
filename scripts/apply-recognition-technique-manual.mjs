// Merges data/recognition-technique-manual.json into data/problems.json's `techniques` field.
// These 8 techniques have no distinguishing LeetCode tag, so they were classified by hand
// (Fable-model agent, working from a tag-narrowed candidate pool + its own knowledge of each
// named problem) rather than by a deterministic tag rule — same pattern as the binary search /
// greedy / prefix-sum subtype passes.
//
// Run: node scripts/apply-recognition-technique-manual.mjs

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROBLEMS_PATH = path.join(__dirname, '..', 'data', 'problems.json')
const MANUAL_PATH = path.join(__dirname, '..', 'data', 'recognition-technique-manual.json')

async function main() {
  const data = JSON.parse(await readFile(PROBLEMS_PATH, 'utf-8'))
  const manual = JSON.parse(await readFile(MANUAL_PATH, 'utf-8'))

  const labelByLcId = new Map()
  for (const [label, lcIds] of Object.entries(manual)) {
    for (const lcId of lcIds) {
      if (!labelByLcId.has(lcId)) labelByLcId.set(lcId, [])
      labelByLcId.get(lcId).push(label)
    }
  }

  let applied = 0
  for (const p of data.problems) {
    const labels = labelByLcId.get(p.lc_id)
    if (!labels) continue
    for (const label of labels) {
      if (!p.techniques.includes(label)) {
        p.techniques.push(label)
        applied++
      }
    }
  }

  await writeFile(PROBLEMS_PATH, JSON.stringify(data, null, 2))
  console.log(`Applied ${applied} manually-classified technique labels.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
