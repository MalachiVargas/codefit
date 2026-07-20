import type { Metadata } from 'next'
import signalsData from '../../data/signals.json'
import problemsData from '../../data/problems.json'
import type { SignalsData, ProblemListData } from '@/lib/types'
import SignalsExplorer from '@/components/SignalsExplorer'

export const metadata: Metadata = {
  title: 'CodeFit — Signal Recognition',
  description: 'Map observable signals in a problem statement to the solve techniques they point to.',
}

export default function SignalsPage() {
  const signals = signalsData as SignalsData
  const problems = problemsData as ProblemListData

  const exampleCounts: Record<string, number> = {}
  for (const t of signals.techniques) {
    exampleCounts[t.t] = problems.problems.filter((p) => p.techniques.includes(t.t)).length
  }

  return <SignalsExplorer signals={signals} exampleCounts={exampleCounts} />
}
