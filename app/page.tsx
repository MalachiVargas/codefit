import patternsData from '../data/patterns.json'
import { generateWorkout } from '@/lib/workout-generator'
import type { PatternsData } from '@/lib/types'
import WorkoutClient from '@/components/WorkoutClient'

export default function Home() {
  const data = patternsData as PatternsData
  const patterns = data.patterns

  // Server-rendered daily seed; intentional non-pure read.
  // eslint-disable-next-line react-hooks/purity
  const seed = (Math.floor(Date.now() / 86_400_000) % patterns.length) / patterns.length
  const initial = generateWorkout(patterns, undefined, seed)

  if (!initial) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="mono text-sm" style={{ color: 'var(--muted)' }}>
          Failed to generate workout. Check patterns.json.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative">
      {/* Subtle grid backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 100% 80% at 50% 30%, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 80% at 50% 30%, black 30%, transparent 90%)',
          zIndex: 0,
        }}
      />

      {/* Lime hairline at very top */}
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[2px] z-30"
        style={{ background: 'var(--lime)', boxShadow: '0 0 12px var(--lime)' }}
      />

      {/* Scanline atmosphere */}
      <div aria-hidden className="scanline" />

      <WorkoutClient patterns={patterns} initial={initial} />
    </main>
  )
}
