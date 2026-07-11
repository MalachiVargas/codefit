import type { Problem } from './types'

export const DIFFICULTY_APPROX: Record<string, number> = {
  Easy: 1200,
  Medium: 1600,
  Hard: 2100,
}

export function effectiveRating(p: Problem): number {
  return p.zerotrak_rating ?? DIFFICULTY_APPROX[p.difficulty]
}

export function leetcodeUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy':   return 'text-emerald-400'
    case 'Medium': return 'text-amber-400'
    case 'Hard':   return 'text-red-400'
    default:       return 'text-zinc-400'
  }
}

export function ratingLabel(p: Problem): string {
  if (p.zerotrak_rating) return `★ ${p.zerotrak_rating.toFixed(0)}`
  return p.difficulty
}
