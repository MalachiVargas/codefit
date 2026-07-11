import type { Pattern, Problem, Workout } from './types'
import { effectiveRating } from './rating'

export { leetcodeUrl, difficultyColor, ratingLabel } from './rating'

function pickCore(pattern: Pattern): Problem | null {
  const candidates = pattern.problems.filter(
    (p) => p.core_candidate && !p.premium
  )
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function pickMetcon(pattern: Pattern, core: Problem, allPatterns: Pattern[]): Problem[] {
  const TARGETS = [1400, 1600, 1800, 2050]

  // Pool: free problems from this pattern (excluding core) + related patterns
  let pool = pattern.problems.filter((p) => !p.premium && p.lc_id !== core.lc_id)

  if (pool.length < 4) {
    const related = pattern.related_patterns
      .flatMap((id) => allPatterns.find((p) => p.id === id)?.problems ?? [])
      .filter((p) => !p.premium && p.lc_id !== core.lc_id)
    pool = [...pool, ...related]
  }

  // Deduplicate by lc_id
  const seen = new Set<number>()
  pool = pool.filter((p) => {
    if (seen.has(p.lc_id)) return false
    seen.add(p.lc_id)
    return true
  })

  // For each target rating, pick the closest unused problem
  const picked: Problem[] = []
  const usedIds = new Set<number>()

  for (const target of TARGETS) {
    const available = pool.filter((p) => !usedIds.has(p.lc_id))
    if (available.length === 0) break
    const closest = available.reduce((best, p) =>
      Math.abs(effectiveRating(p) - target) < Math.abs(effectiveRating(best) - target) ? p : best
    )
    picked.push(closest)
    usedIds.add(closest.lc_id)
  }

  // Sort ascending by effective rating for the MetCon ladder
  return picked.sort((a, b) => effectiveRating(a) - effectiveRating(b))
}

export function generateWorkout(
  patterns: Pattern[],
  patternId?: string,
  seed?: number
): Workout | null {
  const freeable = patterns.filter((p) =>
    p.problems.some((prob) => prob.core_candidate && !prob.premium)
  )
  if (freeable.length === 0) return null

  const pattern = patternId
    ? (freeable.find((p) => p.id === patternId) ?? freeable[Math.floor(Math.random() * freeable.length)])
    : freeable[Math.floor((seed ?? Math.random()) * freeable.length)]

  const core = pickCore(pattern)
  if (!core) return null

  const metcon = pickMetcon(pattern, core, patterns)
  if (metcon.length < 4) return null

  // Deterministic COD number based on days since epoch
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000)

  return {
    codNumber: (daysSinceEpoch % 9000) + 1,
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    pattern,
    core,
    metcon,
  }
}

