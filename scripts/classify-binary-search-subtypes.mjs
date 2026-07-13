// Classifies every "Binary Search" problem in data/problems.json into a finer subtype.
// Same two-tier pattern as classify-prefix-sum-subtypes.mjs:
//   1. Deterministic priority rules from co-occurring LeetCode tags (graph traversal tags ->
//      parametric search on a graph, matrix -> 2D search, dynamic-programming -> BS-optimized
//      DP/LIS, segment-tree/BIT/ordered-set/design -> BS over a data structure, two-pointers/
//      sliding-window -> paired verification).
//   2. A manual override map for the large "no distinguishing tag" bucket, which turned out on
//      inspection to be a roughly even split between two very different skills that LeetCode's
//      own tags don't separate: classic index/value lookup in an already-sorted structure
//      (Peak Index in a Mountain Array, Find in Mountain Array) vs. "binary search on the
//      answer" over an implicit monotonic search space (Koko Eating Bananas, Capacity To Ship
//      Packages Within D Days) — classified by hand from problem knowledge.
//
// Writes data/binary-search-subtypes.json ({lc_id, subtype, confidence}[]).
// Run: node scripts/classify-binary-search-subtypes.mjs

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROBLEMS_PATH = path.join(__dirname, '..', 'data', 'problems.json')
const OUT_PATH = path.join(__dirname, '..', 'data', 'binary-search-subtypes.json')

const SUBTYPES = {
  ANSWER: 'Binary Search on Answer (Search Space)',
  CLASSIC: 'Classic Search in Sorted Array',
  TP_SW: 'Binary Search + Two Pointers / Sliding Window',
  DS: 'Binary Search + Data Structure (Segment Tree / BIT / Ordered Set)',
  DP_OPT: 'Binary Search Optimized DP',
  GRAPH: 'Binary Search + Graph Feasibility (Parametric Search)',
  MATRIX: 'Binary Search on Matrix',
}

// Manually classified: the co-tag signal is absent or misleading for these (LeetCode doesn't
// tag "binary search on the answer" as such, so it looks identical to classic search by tag).
const MANUAL = {
  // Classic index/value lookup in an already-sorted structure
  852: [SUBTYPES.CLASSIC, 'high'], // Peak Index in a Mountain Array
  1064: [SUBTYPES.CLASSIC, 'high'], // Fixed Point
  1095: [SUBTYPES.CLASSIC, 'high'], // Find in Mountain Array
  1150: [SUBTYPES.CLASSIC, 'high'], // Check If a Number Is Majority Element in a Sorted Array
  1539: [SUBTYPES.CLASSIC, 'medium'], // Kth Missing Positive Number
  1894: [SUBTYPES.CLASSIC, 'medium'], // Find the Student that Will Replace the Chalk
  2055: [SUBTYPES.CLASSIC, 'medium'], // Plates Between Candles
  2529: [SUBTYPES.CLASSIC, 'high'], // Maximum Count of Positive Integer and Negative Integer
  3113: [SUBTYPES.CLASSIC, 'low'], // Find the Number of Subarrays Where Boundary Elements Are Maximum
  3152: [SUBTYPES.CLASSIC, 'medium'], // Special Array II
  3911: [SUBTYPES.CLASSIC, 'low'], // K-th Smallest Remaining Even Integer in Subarray Queries
  3932: [SUBTYPES.CLASSIC, 'medium'], // Count K-th Roots in a Range
  1213: [SUBTYPES.CLASSIC, 'medium'], // Intersection of Three Sorted Arrays
  3488: [SUBTYPES.CLASSIC, 'medium'], // Closest Equal Element Queries
  3636: [SUBTYPES.CLASSIC, 'medium'], // Threshold Majority Queries

  // Binary search on the answer / implicit monotonic search space
  754: [SUBTYPES.ANSWER, 'high'], // Reach a Number
  774: [SUBTYPES.ANSWER, 'high'], // Minimize Max Distance to Gas Station
  793: [SUBTYPES.ANSWER, 'medium'], // Preimage Size of Factorial Zeroes Function
  875: [SUBTYPES.ANSWER, 'high'], // Koko Eating Bananas
  878: [SUBTYPES.ANSWER, 'high'], // Nth Magical Number
  1011: [SUBTYPES.ANSWER, 'high'], // Capacity To Ship Packages Within D Days
  1201: [SUBTYPES.ANSWER, 'high'], // Ugly Number III
  1231: [SUBTYPES.ANSWER, 'high'], // Divide Chocolate
  1283: [SUBTYPES.ANSWER, 'high'], // Find the Smallest Divisor Given a Threshold
  1482: [SUBTYPES.ANSWER, 'high'], // Minimum Number of Days to Make m Bouquets
  1760: [SUBTYPES.ANSWER, 'high'], // Minimum Limit of Balls in a Bag
  1862: [SUBTYPES.ANSWER, 'medium'], // Sum of Floored Pairs
  1870: [SUBTYPES.ANSWER, 'high'], // Minimum Speed to Arrive on Time
  1923: [SUBTYPES.ANSWER, 'medium'], // Longest Common Subpath
  1954: [SUBTYPES.ANSWER, 'high'], // Minimum Garden Perimeter to Collect Enough Apples
  2040: [SUBTYPES.ANSWER, 'medium'], // Kth Smallest Product of Two Sorted Arrays
  2187: [SUBTYPES.ANSWER, 'high'], // Minimum Time to Complete Trips
  2223: [SUBTYPES.ANSWER, 'medium'], // Sum of Scores of Built Strings
  2226: [SUBTYPES.ANSWER, 'high'], // Maximum Candies Allocated to K Children
  2513: [SUBTYPES.ANSWER, 'medium'], // Minimize the Maximum of Two Arrays
  2594: [SUBTYPES.ANSWER, 'high'], // Minimum Time to Repair Cars
  2861: [SUBTYPES.ANSWER, 'medium'], // Maximum Number of Alloys
  3048: [SUBTYPES.ANSWER, 'medium'], // Earliest Second to Mark Indices I
  3350: [SUBTYPES.ANSWER, 'medium'], // Adjacent Increasing Subarrays Detection II
  3398: [SUBTYPES.ANSWER, 'medium'], // Smallest Substring With Identical Characters I
  3399: [SUBTYPES.ANSWER, 'medium'], // Smallest Substring With Identical Characters II
  3453: [SUBTYPES.ANSWER, 'medium'], // Separate Squares I
  3639: [SUBTYPES.ANSWER, 'medium'], // Minimum Time to Activate String
  3733: [SUBTYPES.ANSWER, 'medium'], // Minimum Time to Complete All Deliveries
  3748: [SUBTYPES.ANSWER, 'low'], // Count Stable Subarrays
  3771: [SUBTYPES.ANSWER, 'low'], // Total Score of Dungeon Runs
  3824: [SUBTYPES.ANSWER, 'medium'], // Minimum K to Reduce Array Within Limit
  1562: [SUBTYPES.ANSWER, 'medium'], // Find Latest Group of Size M
  3312: [SUBTYPES.ANSWER, 'medium'], // Sorted GCD Pair Queries
  3934: [SUBTYPES.ANSWER, 'medium'], // Smallest Unique Subarray

  // Untagged but algorithmically LIS-via-binary-search (patience sorting)
  2111: [SUBTYPES.DP_OPT, 'medium'], // Minimum Operations to Make the Array K-Increasing
}

function has(p, slug) {
  return p.tags.some((t) => t.slug === slug)
}

const GRAPH_SLUGS = [
  'union-find',
  'depth-first-search',
  'breadth-first-search',
  'graph-theory',
  'minimum-spanning-tree',
  'shortest-path',
]
const DS_SLUGS = ['segment-tree', 'binary-indexed-tree', 'ordered-set', 'design']
const TP_SW_SLUGS = ['two-pointers', 'sliding-window']

function autoClassify(p) {
  if (GRAPH_SLUGS.some((s) => has(p, s))) return SUBTYPES.GRAPH
  if (has(p, 'matrix')) return SUBTYPES.MATRIX
  if (has(p, 'dynamic-programming')) return SUBTYPES.DP_OPT
  if (DS_SLUGS.some((s) => has(p, s))) return SUBTYPES.DS
  if (TP_SW_SLUGS.some((s) => has(p, s))) return SUBTYPES.TP_SW
  return SUBTYPES.ANSWER
}

async function main() {
  const data = JSON.parse(await readFile(PROBLEMS_PATH, 'utf-8'))
  const binarySearchProblems = data.problems.filter((p) => p.techniques?.includes('Binary Search'))

  const out = binarySearchProblems.map((p) => {
    if (MANUAL[p.lc_id]) {
      const [subtype, confidence] = MANUAL[p.lc_id]
      return { lc_id: p.lc_id, subtype, confidence }
    }
    return { lc_id: p.lc_id, subtype: autoClassify(p), confidence: 'high' }
  })

  out.sort((a, b) => a.lc_id - b.lc_id)
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2))
  console.log(`Classified ${out.length} Binary Search problems -> ${OUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
