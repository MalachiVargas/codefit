// Adds a `techniques` field (fine-grained solve-technique labels, independent of
// LeetCode's own topic tags) to every zerotrak-rated problem in data/problems.json.
//
// Taxonomy is self-authored (standard CS/competitive-programming terms — Dijkstra,
// knapsack variants, digit DP, etc. — not copied from any single curated source).
// Most labels are derived deterministically from combinations of LeetCode's own
// official tags. The remainder (DP subtype disambiguation, shortest-path
// single/multi-source split) can't be inferred from tags alone and are written to
// a residual file for LLM-assisted classification.
//
// Run: node scripts/classify-techniques.mjs

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROBLEMS_PATH = path.join(__dirname, '..', 'data', 'problems.json')
const RESIDUAL_PATH = path.join(__dirname, '..', 'data', 'techniques-residual.json')

const TAG_RULES = [
  ['union-find', 'Union-Find'],
  ['minimum-spanning-tree', 'Minimum Spanning Tree'],
  ['topological-sort', 'Topological Sort'],
  ['depth-first-search', 'Depth-First Search'],
  ['breadth-first-search', 'Breadth-First Search'],
  ['enumeration', 'Brute Force / Enumeration'],
  ['greedy', 'Greedy'],
  ['backtracking', 'Backtracking'],
  ['divide-and-conquer', 'Divide and Conquer'],
  ['recursion', 'Recursion'],
  ['bit-manipulation', 'Bit Manipulation'],
  ['two-pointers', 'Two Pointers'],
  ['sliding-window', 'Sliding Window'],
  ['binary-search', 'Binary Search'],
  ['monotonic-stack', 'Monotonic Stack'],
  ['prefix-sum', 'Prefix Sum'],
  ['trie', 'Trie'],
  ['game-theory', 'Game Theory'],
]

function classify(tagSlugs) {
  const has = (slug) => tagSlugs.has(slug)
  const techniques = new Set()

  for (const [tag, label] of TAG_RULES) {
    if (has(tag)) techniques.add(label)
  }
  if (has('segment-tree') || has('binary-indexed-tree')) {
    techniques.add('Segment Tree / Fenwick Tree')
  }

  let dpPending = false
  let shortestPathPending = false

  if (has('dynamic-programming')) {
    if (has('bitmask')) techniques.add('Bitmask DP')
    if (has('matrix')) techniques.add('Grid DP')
    if (has('tree') || has('binary-tree')) techniques.add('Tree DP')
    if (has('string')) techniques.add('Sequence DP (LCS / Edit Distance)')
    if (has('counting')) techniques.add('Counting DP')
    if (has('probability-and-statistics')) techniques.add('Probability DP')
    if (
      !has('bitmask') &&
      !has('matrix') &&
      !has('tree') &&
      !has('binary-tree') &&
      !has('string') &&
      !has('counting') &&
      !has('probability-and-statistics')
    ) {
      dpPending = true
    }
  }

  if (has('shortest-path')) {
    shortestPathPending = true
  }

  return { techniques: Array.from(techniques), dpPending, shortestPathPending }
}

async function main() {
  const data = JSON.parse(await readFile(PROBLEMS_PATH, 'utf-8'))
  const residual = []

  for (const p of data.problems) {
    if (p.ratingSource !== 'zerotrak') {
      p.techniques = []
      continue
    }
    const tagSlugs = new Set(p.tags.map((t) => t.slug))
    const { techniques, dpPending, shortestPathPending } = classify(tagSlugs)
    p.techniques = techniques

    if (dpPending || shortestPathPending) {
      residual.push({
        lc_id: p.lc_id,
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags.map((t) => t.name),
        needs: [dpPending && 'dp-subtype', shortestPathPending && 'shortest-path-subtype'].filter(Boolean),
      })
    }
  }

  await writeFile(PROBLEMS_PATH, JSON.stringify(data, null, 2))
  await writeFile(RESIDUAL_PATH, JSON.stringify(residual, null, 2))

  const withTechniques = data.problems.filter((p) => p.techniques?.length).length
  console.log(`Rule-classified ${withTechniques} problems with at least one technique.`)
  console.log(`${residual.length} problems need LLM-assisted subtype classification -> ${RESIDUAL_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
