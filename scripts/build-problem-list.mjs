// Generates data/problems.json by merging LeetCode's official problem/tag list
// with real Elo ratings from zerotrac/leetcode_problem_rating.
//
// Run manually: npm run data:problems
// Network-dependent and not part of `next build` — re-run periodically to refresh.

import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, '..', 'data', 'problems.json')

const DIFFICULTY_APPROX = { Easy: 1200, Medium: 1600, Hard: 2100 }

const QUERY = `
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
    total: totalNum
    questions: data {
      questionFrontendId
      title
      titleSlug
      difficulty
      isPaidOnly
      topicTags { name slug }
    }
  }
}
`

async function fetchAllQuestions() {
  const limit = 100
  let skip = 0
  let total = Infinity
  const questions = []

  while (skip < total) {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { categorySlug: '', skip, limit, filters: {} },
      }),
    })
    if (!res.ok) throw new Error(`LeetCode GraphQL error: ${res.status}`)
    const json = await res.json()
    const page = json.data.problemsetQuestionList
    total = page.total
    questions.push(...page.questions)
    skip += limit
    console.log(`fetched ${questions.length}/${total} problems`)
  }

  return questions
}

async function fetchRatings() {
  const res = await fetch(
    'https://raw.githubusercontent.com/zerotrac/leetcode_problem_rating/main/ratings.txt'
  )
  if (!res.ok) throw new Error(`ratings.txt fetch error: ${res.status}`)
  const text = await res.text()
  const lines = text.trim().split('\n')
  const ratingBySlug = new Map()

  for (const line of lines.slice(1)) {
    const cols = line.split('\t')
    const rating = parseFloat(cols[0])
    const slug = cols[4]
    if (slug && Number.isFinite(rating)) {
      ratingBySlug.set(slug, rating)
    }
  }

  return ratingBySlug
}

async function main() {
  console.log('Fetching LeetCode problem list...')
  const questions = await fetchAllQuestions()

  console.log('Fetching zerotrac ratings...')
  const ratingBySlug = await fetchRatings()

  let ratedCount = 0
  const problems = questions.map((q) => {
    const zerotrakRating = ratingBySlug.get(q.titleSlug)
    const rating = zerotrakRating ?? DIFFICULTY_APPROX[q.difficulty]
    const ratingSource = zerotrakRating != null ? 'zerotrak' : 'proxy'
    if (ratingSource === 'zerotrak') ratedCount++

    return {
      lc_id: Number(q.questionFrontendId),
      title: q.title,
      slug: q.titleSlug,
      difficulty: q.difficulty,
      premium: q.isPaidOnly,
      tags: q.topicTags.map((t) => ({ name: t.name, slug: t.slug })),
      rating,
      ratingSource,
    }
  })

  const output = {
    generatedAt: new Date().toISOString(),
    total: problems.length,
    ratedCount,
    problems,
  }

  await writeFile(OUT_PATH, JSON.stringify(output, null, 2))
  console.log(`Wrote ${problems.length} problems (${ratedCount} zerotrak-rated) to ${OUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
