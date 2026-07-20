// Adds the 12 technique labels introduced by the "Recognition Layer" signal taxonomy
// (app/signals) that classify-techniques.mjs didn't originally cover. Additive only —
// does NOT touch classify-techniques.mjs's output, so it's safe to run after the
// greedy/prefix-sum/binary-search subtype passes without clobbering them.
//
// Tier 1 (this file): 4 techniques with an unambiguous 1:1 LeetCode tag.
// Tier 2: the remaining 8 have no distinguishing tag and are classified by hand in
// data/recognition-technique-manual.json (see classify-recognition-techniques-manual.mjs).
//
// Run: node scripts/apply-new-recognition-techniques.mjs

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROBLEMS_PATH = path.join(__dirname, '..', 'data', 'problems.json')

const TAG_RULES = [
  ['line-sweep', 'Sweep Line'],
  ['simulation', 'Simulation'],
  ['number-theory', 'Math / Number Theory'],
]

// Either tag implies KMP / Rolling Hash.
const KMP_TAGS = ['rolling-hash', 'string-matching']

function has(p, slug) {
  return p.tags.some((t) => t.slug === slug)
}

async function main() {
  const data = JSON.parse(await readFile(PROBLEMS_PATH, 'utf-8'))
  let applied = 0

  for (const p of data.problems) {
    if (p.ratingSource !== 'zerotrak') continue

    for (const [tag, label] of TAG_RULES) {
      if (has(p, tag) && !p.techniques.includes(label)) {
        p.techniques.push(label)
        applied++
      }
    }
    if (KMP_TAGS.some((t) => has(p, t)) && !p.techniques.includes('KMP / Rolling Hash')) {
      p.techniques.push('KMP / Rolling Hash')
      applied++
    }
  }

  await writeFile(PROBLEMS_PATH, JSON.stringify(data, null, 2))
  console.log(`Applied ${applied} new technique labels (Sweep Line / Simulation / Math-Number Theory / KMP-Rolling Hash).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
