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

export type SignalCategoryKey = 'objective' | 'structure' | 'property' | 'constraint'

export interface SignalCategory {
  key: SignalCategoryKey
  label: string
  desc: string
}

/** A cue is a mix of plain strings and single-element tuples ([text]) marking the part to highlight. */
export type SignalCuePart = string | [string]

export interface Signal {
  id: string
  name: string
  cat: SignalCategoryKey
  cue: SignalCuePart[]
}

export interface SignalTechnique {
  t: string
  s: string[]
  note: string
}

export interface SignalsData {
  version: string
  source: string
  categories: SignalCategory[]
  signals: Signal[]
  techniques: SignalTechnique[]
}
