export interface Problem {
  lc_id: number
  title: string
  slug: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  premium: boolean
  zerotrak_rating: number | null
  core_candidate: boolean
}

export interface Pattern {
  id: string
  name: string
  category: string
  related_patterns: string[]
  problems: Problem[]
}

export interface PatternsData {
  version: string
  sources: string[]
  notes: Record<string, unknown>
  patterns: Pattern[]
}

export interface Workout {
  codNumber: number
  date: string
  pattern: Pattern
  core: Problem
  metcon: Problem[]
}

export interface ListedProblemTag {
  name: string
  slug: string
}

export interface ListedProblem {
  lc_id: number
  title: string
  slug: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  premium: boolean
  tags: ListedProblemTag[]
  rating: number
  ratingSource: 'zerotrak' | 'proxy'
  techniques: string[]
}

export interface ProblemListData {
  generatedAt: string
  total: number
  ratedCount: number
  problems: ListedProblem[]
}
