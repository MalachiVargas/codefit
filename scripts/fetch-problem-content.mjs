// Fetches full problem statements from LeetCode's public GraphQL endpoint for a
// list of {lc_id, slug} entries, strips markup to plain text, and caches the
// result to a JSON file. Used to verify technique classifications against the
// actual problem text rather than title/tags alone.
//
// Run: node scripts/fetch-problem-content.mjs <input.json> <output.json>
//   input.json  — array of objects with at least a `slug` field
//   output.json — default data/problem-statements-cache.json

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const [, , inputArg, outputArg] = process.argv
const INPUT_PATH = path.resolve(inputArg ?? path.join(__dirname, '..', 'data', 'techniques-verify-sample.json'))
const OUTPUT_PATH = path.resolve(outputArg ?? path.join(__dirname, '..', 'data', 'problem-statements-cache.json'))

const QUERY = `
  query questionContent($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      content
      difficulty
      isPaidOnly
      topicTags { name slug }
    }
  }
`

function htmlToText(html) {
  if (!html) return ''
  return html
    .replace(/<pre>/g, '\n```\n')
    .replace(/<\/pre>/g, '\n```\n')
    .replace(/<li>/g, '\n- ')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function fetchOne(slug) {
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { titleSlug: slug } }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${slug}`)
  const json = await res.json()
  const q = json.data?.question
  if (!q) throw new Error(`no question data for ${slug}`)
  return q
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const entries = JSON.parse(await readFile(INPUT_PATH, 'utf-8'))
  const results = {}
  const failures = []

  for (const [i, entry] of entries.entries()) {
    const slug = entry.slug
    try {
      const q = await fetchOne(slug)
      results[slug] = {
        lc_id: entry.lc_id,
        title: q.title,
        difficulty: q.difficulty,
        isPaidOnly: q.isPaidOnly,
        topicTags: q.topicTags.map((t) => t.name),
        content: htmlToText(q.content),
      }
      console.log(`[${i + 1}/${entries.length}] fetched ${slug}`)
    } catch (err) {
      console.error(`[${i + 1}/${entries.length}] FAILED ${slug}: ${err.message}`)
      failures.push({ slug, error: err.message })
    }
    await sleep(400)
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2))
  console.log(`\nWrote ${Object.keys(results).length} statements to ${OUTPUT_PATH}`)
  if (failures.length) {
    console.log(`${failures.length} failures:`, failures)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
