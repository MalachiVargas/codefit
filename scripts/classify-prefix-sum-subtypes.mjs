// Classifies every "Prefix Sum" problem in data/problems.json into a finer subtype
// (mirrors the greedy-subtypes.json / apply-greedy-subtypes.mjs approach).
//
// Two-tier classification, same pattern as classify-techniques.mjs:
//   1. Deterministic priority rules from co-occurring LeetCode tags, for problems where
//      the tag combination is a reliable signal (matrix -> 2D, bit-manipulation -> XOR, etc).
//   2. A manual override map for problems with no distinguishing co-tag (LeetCode doesn't
//      have a "difference array" tag, so range-update problems like Car Pooling look
//      identical to plain running-sum problems by tag alone) — classified by hand from
//      problem knowledge, same as the greedy residual was.
//
// Writes data/prefix-sum-subtypes.json ({lc_id, subtype, confidence}[]).
// Run: node scripts/classify-prefix-sum-subtypes.mjs

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROBLEMS_PATH = path.join(__dirname, '..', 'data', 'problems.json')
const OUT_PATH = path.join(__dirname, '..', 'data', 'prefix-sum-subtypes.json')

const SUBTYPES = {
  RANGE_SUM: '1D Range Sum Query',
  HASH: 'Prefix Sum + Hash Table',
  DIFF: 'Difference Array / Range Update',
  MATRIX: '2D / Matrix Prefix Sum',
  XOR: 'Prefix XOR',
  BINSEARCH: 'Prefix Sum + Binary Search',
  DP_OPT: 'Prefix Sum as DP Optimization',
}

// Manually classified: problems whose LeetCode tags don't reliably distinguish
// "plain running sum" from "difference array / range update" (no LC tag for the latter).
const MANUAL = {
  798: [SUBTYPES.DIFF, 'medium'], // Smallest Rotation with Highest Score
  1094: [SUBTYPES.DIFF, 'high'], // Car Pooling
  848: [SUBTYPES.RANGE_SUM, 'high'], // Shifting Letters
  1109: [SUBTYPES.DIFF, 'high'], // Corporate Flight Bookings
  1413: [SUBTYPES.RANGE_SUM, 'high'],
  1422: [SUBTYPES.RANGE_SUM, 'high'],
  1480: [SUBTYPES.RANGE_SUM, 'high'],
  1588: [SUBTYPES.RANGE_SUM, 'medium'],
  1664: [SUBTYPES.RANGE_SUM, 'high'],
  1685: [SUBTYPES.RANGE_SUM, 'high'],
  1732: [SUBTYPES.RANGE_SUM, 'high'],
  1744: [SUBTYPES.RANGE_SUM, 'medium'],
  1769: [SUBTYPES.RANGE_SUM, 'medium'],
  1854: [SUBTYPES.DIFF, 'high'], // Maximum Population Year
  1856: [SUBTYPES.RANGE_SUM, 'medium'],
  1906: [SUBTYPES.RANGE_SUM, 'medium'],
  1991: [SUBTYPES.RANGE_SUM, 'high'],
  2145: [SUBTYPES.DIFF, 'medium'], // Count the Hidden Sequences
  2256: [SUBTYPES.RANGE_SUM, 'high'],
  2270: [SUBTYPES.RANGE_SUM, 'high'],
  2281: [SUBTYPES.RANGE_SUM, 'medium'], // Sum of Total Strength of Wizards
  2381: [SUBTYPES.DIFF, 'high'], // Shifting Letters II
  2382: [SUBTYPES.RANGE_SUM, 'low'],
  2391: [SUBTYPES.RANGE_SUM, 'medium'],
  2483: [SUBTYPES.RANGE_SUM, 'high'],
  2485: [SUBTYPES.RANGE_SUM, 'high'],
  2559: [SUBTYPES.RANGE_SUM, 'high'],
  2574: [SUBTYPES.RANGE_SUM, 'high'],
  2640: [SUBTYPES.RANGE_SUM, 'high'],
  2772: [SUBTYPES.DIFF, 'medium'], // Apply Operations to Make All Array Elements Equal to Zero
  3015: [SUBTYPES.DIFF, 'medium'], // Count the Number of Houses at a Certain Distance I
  3017: [SUBTYPES.DIFF, 'medium'], // ...II
  3028: [SUBTYPES.RANGE_SUM, 'high'],
  3096: [SUBTYPES.RANGE_SUM, 'high'],
  3179: [SUBTYPES.RANGE_SUM, 'medium'],
  3354: [SUBTYPES.RANGE_SUM, 'medium'],
  3355: [SUBTYPES.DIFF, 'high'], // Zero Array Transformation I
  3361: [SUBTYPES.DIFF, 'medium'], // Shift Distance Between Two Strings
  3427: [SUBTYPES.RANGE_SUM, 'high'],
  3432: [SUBTYPES.RANGE_SUM, 'high'],
  3494: [SUBTYPES.RANGE_SUM, 'medium'],
  3653: [SUBTYPES.DIFF, 'medium'], // XOR After Range Multiplication Queries I
  3655: [SUBTYPES.DIFF, 'low'], // ...II
  3698: [SUBTYPES.RANGE_SUM, 'medium'],
  3707: [SUBTYPES.RANGE_SUM, 'high'],
  3756: [SUBTYPES.RANGE_SUM, 'low'],
  3788: [SUBTYPES.RANGE_SUM, 'high'],
  3862: [SUBTYPES.RANGE_SUM, 'high'],
  3864: [SUBTYPES.RANGE_SUM, 'low'],
  3903: [SUBTYPES.RANGE_SUM, 'high'],
  3904: [SUBTYPES.RANGE_SUM, 'medium'],
  // sorting+greedy co-tag bucket
  1589: [SUBTYPES.DIFF, 'medium'], // Maximum Sum Obtained of Any Permutation
  2171: [SUBTYPES.RANGE_SUM, 'medium'], // Removing Minimum Number of Magic Beans
  2406: [SUBTYPES.DIFF, 'high'], // Divide Intervals Into Minimum Number of Groups
  2587: [SUBTYPES.RANGE_SUM, 'medium'], // Rearrange Array to Maximize Prefix Score
  2971: [SUBTYPES.RANGE_SUM, 'medium'], // Find Polygon With the Largest Perimeter
  3362: [SUBTYPES.DIFF, 'medium'], // Zero Array Transformation III
}

function has(p, slug) {
  return p.tags.some((t) => t.slug === slug)
}

function autoClassify(p) {
  if (has(p, 'matrix')) return SUBTYPES.MATRIX
  if (has(p, 'bit-manipulation')) return SUBTYPES.XOR
  if (has(p, 'dynamic-programming')) return SUBTYPES.DP_OPT
  if (has(p, 'hash-table')) return SUBTYPES.HASH
  if (has(p, 'binary-search')) return SUBTYPES.BINSEARCH
  return SUBTYPES.RANGE_SUM
}

async function main() {
  const data = JSON.parse(await readFile(PROBLEMS_PATH, 'utf-8'))
  const prefixSumProblems = data.problems.filter((p) => p.techniques?.includes('Prefix Sum'))

  const out = prefixSumProblems.map((p) => {
    if (MANUAL[p.lc_id]) {
      const [subtype, confidence] = MANUAL[p.lc_id]
      return { lc_id: p.lc_id, subtype, confidence }
    }
    return { lc_id: p.lc_id, subtype: autoClassify(p), confidence: 'high' }
  })

  out.sort((a, b) => a.lc_id - b.lc_id)
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2))
  console.log(`Classified ${out.length} Prefix Sum problems -> ${OUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
