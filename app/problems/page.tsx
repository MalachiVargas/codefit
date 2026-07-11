import type { Metadata } from 'next'
import problemsData from '../../data/problems.json'
import type { ProblemListData } from '@/lib/types'
import ProblemsExplorer from '@/components/ProblemsExplorer'

export const metadata: Metadata = {
  title: 'CodeFit — Problem List',
  description: 'Every LeetCode problem, ranked by real contest Elo. Filter by tag, rating, and difficulty.',
}

export default function ProblemsPage() {
  const data = problemsData as ProblemListData
  return <ProblemsExplorer problems={data.problems} />
}
