'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import type { Pattern, Problem, Workout } from '@/lib/types'
import { generateWorkout, leetcodeUrl, difficultyColor, ratingLabel } from '@/lib/workout-generator'
import Timer from './Timer'
import CodCounter from './CodCounter'
import PatternSelector from './PatternSelector'
import ScorePanel, { type ProblemStatus } from './ScorePanel'

interface Props {
  patterns: Pattern[]
  initial: Workout
}

const CATEGORY_LABELS: Record<string, string> = {
  'arrays-strings':      'Arrays & Strings',
  'linked-list':         'Linked List',
  'arrays-sorting':      'Arrays & Sorting',
  'binary-search':       'Binary Search',
  'heap':                'Heap',
  'trees-graphs':        'Trees & Graphs',
  'stack':               'Stack',
  'backtracking':        'Backtracking',
  'greedy':              'Greedy',
  'trie':                'Trie',
  'bit-manipulation':    'Bit Manipulation',
  'dynamic-programming': 'Dynamic Programming',
}

// Heat colours along the MetCon ladder (cool → hot)
const LADDER_HEAT = [
  { label: 'WARM-UP', accent: '#5DD4FF', bg: 'rgba(93,212,255,0.06)' },
  { label: 'TEMPO',   accent: '#A8FF38', bg: 'rgba(168,255,56,0.06)' },
  { label: 'BURN',    accent: '#FFB800', bg: 'rgba(255,184,0,0.06)' },
  { label: 'REDLINE', accent: '#FF3838', bg: 'rgba(255,56,56,0.06)' },
] as const

// Approx rating used for the difficulty meter only (not authoritative).
const APPROX = { Easy: 1200, Medium: 1600, Hard: 2100 } as const

function effectiveRating(p: Problem): number {
  return p.zerotrak_rating ?? APPROX[p.difficulty]
}

export default function WorkoutClient({ patterns, initial }: Props) {
  const [workout, setWorkout]   = useState<Workout>(initial)
  const [selected, setSelected] = useState<string>('random')
  const [generating, setGenerating] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [statuses, setStatuses] = useState<ProblemStatus[]>(['pending', 'pending', 'pending', 'pending'])
  const [finalTime, setFinalTime] = useState<number | null>(null)

  const generate = useCallback((overrideId?: string) => {
    setGenerating(true)
    setTimeout(() => {
      const id = (overrideId ?? selected) === 'random' ? undefined : (overrideId ?? selected)
      const w = generateWorkout(patterns, id)
      if (w) setWorkout(w)
      setTimerKey((k) => k + 1)
      setStatuses(['pending', 'pending', 'pending', 'pending'])
      setFinalTime(null)
      setGenerating(false)
    }, 220)
  }, [patterns, selected])

  const onPatternChange = useCallback((id: string) => {
    setSelected(id)
  }, [])

  const onToggleStatus = useCallback((i: number) => {
    setStatuses((prev) => {
      const next = [...prev]
      next[i] = next[i] === 'pending' ? 'done' : next[i] === 'done' ? 'dnf' : 'pending'
      return next
    })
  }, [])

  const onLap = useCallback((sec: number) => {
    setStatuses((prev) => {
      // Mark next pending as done
      const idx = prev.findIndex((s) => s === 'pending')
      if (idx === -1) return prev
      const next = [...prev]
      next[idx] = 'done'
      return next
    })
    if (statuses.filter((s) => s === 'done').length === 3) {
      setFinalTime(sec)
    }
  }, [statuses])

  // Difficulty meter: derive a 0..1 intensity from core's effective rating
  const coreIntensity = useMemo(() => {
    const r = effectiveRating(workout.core)
    return Math.max(0, Math.min(1, (r - 1100) / 1300))
  }, [workout.core])

  // MetCon rating spread
  const ladderRatings = useMemo(() => workout.metcon.map(effectiveRating), [workout.metcon])
  const minR = Math.min(...ladderRatings)
  const maxR = Math.max(...ladderRatings)
  const spread = Math.max(1, maxR - minR)

  return (
    <div className="relative z-10">
      {/* === TOP MARQUEE TICKER === */}
      <div
        className="relative border-b overflow-hidden h-7 flex items-center animate-fade delay-0"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-deep)' }}
      >
        <div className="marquee mono text-[10px] tracking-[0.3em] whitespace-nowrap" style={{ color: 'var(--muted-hi)' }}>
          {Array.from({ length: 2 }).map((_, repIdx) => (
            <span key={repIdx} className="flex">
              {[
                'CODEFIT // DAILY CODE WORKOUTS',
                `COD ${workout.codNumber.toString().padStart(3, '0')} ACTIVE`,
                `PATTERN: ${workout.pattern.name.toUpperCase()}`,
                'FOR TIME // 45 MIN CAP',
                '1 CORE / 4 METCON',
                'POST YOUR SCORE',
                'BEAT THE CLOCK',
                'NO EXCUSES',
                `${workout.pattern.problems.length} PROBLEMS IN POOL`,
              ].map((s, j) => (
                <span key={`${repIdx}-${j}`} className="px-6 flex items-center gap-6">
                  <span style={{ color: 'var(--lime)' }}>◆</span>
                  {s}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* === HEADER (scoreboard) === */}
        <header className="animate-slide-up delay-1">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <span className="display text-[10px] font-700 tracking-[0.35em] uppercase" style={{ color: 'var(--lime)' }}>
                LIVE / TODAY
              </span>
            </div>
            <span className="hidden sm:block w-px h-3" style={{ background: 'var(--border-hi)' }} />
            <span className="mono text-[10px] tracking-[0.25em]" style={{ color: 'var(--muted)' }}>
              {workout.date.toUpperCase()}
            </span>
            <Link
              href="/problems"
              className="ml-auto mono text-[10px] tracking-[0.25em] transition-colors hover:text-[var(--lime)]"
              style={{ color: 'var(--muted-hi)' }}
            >
              PROBLEM LIST →
            </Link>
            <Link
              href="/signals"
              className="mono text-[10px] tracking-[0.25em] transition-colors hover:text-[var(--lime)]"
              style={{ color: 'var(--muted-hi)' }}
            >
              SIGNAL GUIDE →
            </Link>
            <span className="display text-[10px] font-700 tracking-[0.3em]" style={{ color: 'var(--muted)' }}>
              {'v0.1 // CODEFIT.OS'}
            </span>
          </div>

          {/* Big scoreboard */}
          <div
            className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 border overflow-hidden"
            style={{ borderColor: 'var(--border-hi)', background: 'var(--bg-card)' }}
          >
            {/* COD number panel */}
            <div className="lg:col-span-7 relative px-5 sm:px-8 py-6 lg:py-8 border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--border-hi)' }}>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="display text-[10px] font-700 tracking-[0.4em] uppercase" style={{ color: 'var(--lime)' }}>
                  CODE OF THE DAY
                </span>
                <span className="mono text-[10px] tracking-widest" style={{ color: 'var(--muted)' }}>
                  {'// COD'}
                </span>
              </div>
              <div className="flex items-end gap-3 leading-none">
                <span className="display font-900" style={{
                  fontSize: 'clamp(4.5rem, 14vw, 10rem)',
                  color: 'var(--text)',
                  letterSpacing: '-0.05em',
                  lineHeight: 0.85,
                }}>
                  #
                </span>
                <CodCounter
                  target={workout.codNumber}
                  className="display font-900 tnum"
                  style={{
                    fontSize: 'clamp(4.5rem, 14vw, 10rem)',
                    color: 'var(--lime)',
                    letterSpacing: '-0.05em',
                    lineHeight: 0.85,
                    textShadow: '0 0 40px rgba(200,255,0,0.25)',
                  }}
                />
              </div>
              <div className="mt-3 mono text-[10px] tracking-[0.25em] flex flex-wrap gap-x-4" style={{ color: 'var(--muted)' }}>
                <span>SEED: {workout.codNumber.toString(16).toUpperCase().padStart(4, '0')}</span>
                <span>POOL: {workout.pattern.problems.length}</span>
                <span>RELATED: {workout.pattern.related_patterns.length}</span>
              </div>
            </div>

            {/* Pattern panel */}
            <div className="lg:col-span-5 relative px-5 sm:px-8 py-6 lg:py-8">
              {/* corner brackets */}
              <span aria-hidden className="absolute top-2 right-2 w-3 h-3 border-t border-r" style={{ borderColor: 'var(--lime)' }} />
              <span aria-hidden className="absolute bottom-2 left-2 w-3 h-3 border-b border-l" style={{ borderColor: 'var(--lime)' }} />

              <div className="display text-[10px] font-700 tracking-[0.35em] uppercase mb-2" style={{ color: 'var(--muted)' }}>
                ACTIVE PATTERN
              </div>
              <div
                className="display font-900 uppercase animate-blade"
                style={{
                  fontSize: 'clamp(1.6rem, 4.5vw, 2.6rem)',
                  letterSpacing: '-0.02em',
                  lineHeight: 0.95,
                  color: 'var(--text)',
                }}
                key={workout.pattern.id}
              >
                {workout.pattern.name}
              </div>
              <div className="mono text-[11px] mt-2 tracking-widest" style={{ color: 'var(--lime-dim)' }}>
                {(CATEGORY_LABELS[workout.pattern.category] ?? workout.pattern.category).toUpperCase()}
              </div>

              {/* mini stats */}
              <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <Stat label="PROBLEMS" value={workout.pattern.problems.length.toString()} />
                <Stat label="RELATED" value={workout.pattern.related_patterns.length.toString()} />
                <Stat label="CAP" value="45M" />
              </div>
            </div>

            {/* shimmer line bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-px shimmer-line opacity-60" />
          </div>
        </header>

        {/* === PATTERN SELECTOR + CTA === */}
        <section className="animate-slide-up delay-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="display text-[10px] font-700 tracking-[0.35em] uppercase" style={{ color: 'var(--muted)' }}>
                SELECT PATTERN
              </span>
              <span className="mono text-[10px]" style={{ color: 'var(--border-hot)' }}>{'///'}</span>
            </div>
            <button
              type="button"
              onClick={() => generate()}
              disabled={generating}
              className="btn-tactile display font-800 text-xs tracking-[0.3em] uppercase px-5 py-2.5"
              style={{
                background: generating ? 'transparent' : 'var(--lime)',
                color: generating ? 'var(--lime)' : '#000',
                border: generating ? '1px solid var(--lime)' : '1px solid var(--lime)',
                cursor: generating ? 'wait' : 'pointer',
                boxShadow: generating ? 'none' : '0 0 24px rgba(200,255,0,0.25)',
              }}
            >
              {generating ? 'COMPILING...' : '↻ NEW COD'}
            </button>
          </div>

          <PatternSelector
            patterns={patterns}
            value={selected}
            onChange={onPatternChange}
          />
        </section>

        {/* === CORE HERO === */}
        <section className="animate-slide-up delay-3">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="display text-[10px] font-800 tracking-[0.4em] uppercase px-2.5 py-1"
              style={{ background: 'var(--lime)', color: '#000' }}
            >
              CORE
            </div>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, var(--lime), transparent)' }} />
            <div className="display text-[10px] font-700 tracking-[0.3em] uppercase" style={{ color: 'var(--muted)' }}>
              20 MIN · UNDERSTAND THE PATTERN
            </div>
          </div>

          <a
            href={leetcodeUrl(workout.core.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="bracket animate-glow group relative block border overflow-hidden"
            style={{ borderColor: 'rgba(200,255,0,0.3)', background: 'var(--bg-card)' }}
          >
            {/* Warning stripe band on left */}
            <div
              aria-hidden
              className="warning-stripes absolute left-0 top-0 bottom-0 w-1.5"
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Left: title + meta */}
              <div className="md:col-span-8 px-6 sm:px-8 py-7 sm:py-9">
                <div className="flex items-center gap-3 mb-3">
                  <span className="mono text-[11px] tracking-widest px-2 py-0.5 border" style={{ color: 'var(--lime)', borderColor: 'rgba(200,255,0,0.3)' }}>
                    LC #{workout.core.lc_id}
                  </span>
                  <span className={`display font-800 text-xs tracking-[0.25em] uppercase ${difficultyColor(workout.core.difficulty)}`}>
                    {workout.core.difficulty}
                  </span>
                  {workout.core.zerotrak_rating && (
                    <span className="mono text-[11px] tnum tracking-widest" style={{ color: 'var(--muted-hi)' }}>
                      ZT {workout.core.zerotrak_rating.toFixed(0)}
                    </span>
                  )}
                </div>

                <h2
                  className="display font-900 uppercase leading-[0.92] group-hover:text-[var(--lime)] transition-colors"
                  style={{
                    fontSize: 'clamp(2rem, 6vw, 4rem)',
                    color: 'var(--text)',
                    letterSpacing: '-0.025em',
                  }}
                >
                  {workout.core.title}
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  Internalise the pattern. Don&apos;t race the clock — race the <em style={{ color: 'var(--lime)' }}>understanding</em>.
                  Then enter the MetCon.
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <span
                    className="display font-800 text-xs tracking-[0.3em] uppercase px-4 py-2 transition-all group-hover:bg-[var(--lime)] group-hover:text-black"
                    style={{ border: '1px solid var(--lime)', color: 'var(--lime)' }}
                  >
                    OPEN ON LEETCODE →
                  </span>
                  <span className="mono text-[10px] tracking-widest" style={{ color: 'var(--muted)' }}>
                    OPENS IN NEW TAB
                  </span>
                </div>
              </div>

              {/* Right: difficulty meter */}
              <div
                className="md:col-span-4 relative border-t md:border-t-0 md:border-l px-6 py-6 flex flex-col justify-between"
                style={{ borderColor: 'rgba(200,255,0,0.15)', background: 'linear-gradient(180deg, rgba(200,255,0,0.04), transparent)' }}
              >
                <div>
                  <div className="display text-[10px] font-700 tracking-[0.35em] uppercase mb-3" style={{ color: 'var(--muted)' }}>
                    INTENSITY
                  </div>
                  {/* Bar meter */}
                  <div className="space-y-1">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const filled = i / 12 < coreIntensity
                      return (
                        <div
                          key={i}
                          className="h-1.5"
                          style={{
                            background: filled ? 'var(--lime)' : 'var(--bg-hi)',
                            boxShadow: filled && i / 12 > 0.7 ? '0 0 8px var(--lime)' : 'none',
                            opacity: filled ? 1 : 0.6,
                            transition: 'background 0.3s',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Stat label="LEVEL" value={workout.core.difficulty.toUpperCase()} accent />
                  <Stat label="RATING" value={workout.core.zerotrak_rating ? workout.core.zerotrak_rating.toFixed(0) : '—'} />
                </div>
              </div>
            </div>
          </a>
        </section>

        {/* === METCON LADDER === */}
        <section className="animate-slide-up delay-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="display text-[10px] font-800 tracking-[0.4em] uppercase px-2.5 py-1 border"
              style={{ borderColor: 'var(--lime)', color: 'var(--lime)' }}
            >
              METCON
            </div>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, var(--lime-dim), transparent)' }} />
            <div className="display text-[10px] font-700 tracking-[0.3em] uppercase" style={{ color: 'var(--muted)' }}>
              FOR TIME · 4 PROBLEMS · CHIPPER
            </div>
          </div>

          {/* Ladder visualization bar */}
          <div className="hidden sm:flex items-center gap-1 mb-1">
            {ladderRatings.map((r, i) => {
              const heat = LADDER_HEAT[i]
              const norm = (r - minR) / spread
              return (
                <div key={i} className="flex-1 flex items-end gap-1">
                  <span className="mono text-[9px] tnum tracking-widest" style={{ color: 'var(--muted)' }}>
                    {r.toFixed(0)}
                  </span>
                  <div className="flex-1 h-1.5" style={{
                    background: `linear-gradient(90deg, ${heat.accent}40, ${heat.accent})`,
                    width: `${30 + norm * 70}%`,
                  }} />
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {workout.metcon.map((problem, i) => {
              const heat = LADDER_HEAT[i]
              const status = statuses[i]
              const isDone = status === 'done'
              const isDnf  = status === 'dnf'
              return (
                <a
                  key={problem.lc_id}
                  href={leetcodeUrl(problem.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile group relative flex flex-col border p-4 sm:p-5 transition-all hover:-translate-y-0.5"
                  style={{
                    background: heat.bg,
                    borderColor: isDone ? 'var(--emerald)' : isDnf ? 'var(--red)' : 'var(--border-hi)',
                  }}
                >
                  {/* Top-left heat tag */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="display font-900 leading-none" style={{
                        fontSize: '1.6rem',
                        color: heat.accent,
                        textShadow: `0 0 8px ${heat.accent}40`,
                      }}>
                        P{i + 1}
                      </span>
                      <span className="display text-[9px] font-700 tracking-[0.25em] uppercase px-1.5 py-0.5 border"
                        style={{ borderColor: heat.accent, color: heat.accent }}>
                        {heat.label}
                      </span>
                    </div>
                    <span
                      className="mono text-[10px] tnum tracking-widest px-1.5 py-0.5"
                      style={{
                        color: problem.zerotrak_rating ? 'var(--lime)' : 'var(--muted)',
                        border: '1px solid',
                        borderColor: problem.zerotrak_rating ? 'rgba(200,255,0,0.3)' : 'var(--border)',
                      }}
                    >
                      {ratingLabel(problem)}
                    </span>
                  </div>

                  <div className="mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                    LC #{problem.lc_id}
                  </div>

                  <h3
                    className="display font-800 uppercase leading-tight mb-3 flex-1 group-hover:text-[var(--lime)] transition-colors"
                    style={{
                      fontSize: 'clamp(0.95rem, 1.4vw, 1.1rem)',
                      color: 'var(--text)',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {problem.title}
                  </h3>

                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span className={`display font-700 text-[10px] tracking-[0.3em] uppercase ${difficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    <span className="display text-[10px] font-700 tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">OPEN →</span>
                    </span>
                  </div>

                  {/* Status overlay strip */}
                  {(isDone || isDnf) && (
                    <div className="absolute top-0 right-0 px-2 py-1 display text-[9px] font-800 tracking-[0.3em]"
                      style={{
                        background: isDone ? 'var(--emerald)' : 'var(--red)',
                        color: '#000',
                      }}>
                      {isDone ? '✓ DONE' : '✕ DNF'}
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        </section>

        {/* === SCORE PANEL === */}
        <section className="animate-slide-up delay-5">
          <ScorePanel statuses={statuses} onToggle={onToggleStatus} finalTime={finalTime} />
        </section>

        {/* === TIMER === */}
        <section className="animate-slide-up delay-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="display text-[10px] font-800 tracking-[0.4em] uppercase px-2.5 py-1 border"
              style={{ borderColor: 'var(--border-hi)', color: 'var(--text)' }}
            >
              TIMER
            </div>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <div className="display text-[10px] font-700 tracking-[0.3em] uppercase" style={{ color: 'var(--muted)' }}>
              45 MIN CAP · TAP SPLIT WHEN P-N DONE
            </div>
          </div>
          <Timer key={timerKey} onLap={onLap} />
        </section>

        {/* === FOOTER === */}
        <footer className="animate-slide-up delay-7 pt-6 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="display text-[10px] font-800 tracking-[0.35em] uppercase" style={{ color: 'var(--lime)' }}>
                CODEFIT.OS
              </span>
              <span className="mono text-[10px] tracking-widest" style={{ color: 'var(--muted)' }}>
                © {new Date().getFullYear()} · DAILY CODE WORKOUTS
              </span>
            </div>
            <div className="mono text-[10px] tracking-widest flex items-center gap-3" style={{ color: 'var(--muted)' }}>
              <span>{workout.pattern.problems.length} PROBLEMS</span>
              <span style={{ color: 'var(--border-hot)' }}>{'//'}</span>
              <span>{workout.pattern.related_patterns.length} RELATED PATTERNS</span>
              <span style={{ color: 'var(--border-hot)' }}>{'//'}</span>
              <span style={{ color: 'var(--lime)' }}>NO EXCUSES</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* === Internal sub-components === */

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="display text-[9px] font-700 tracking-[0.3em] uppercase" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div
        className="display font-900 text-base sm:text-lg tnum mt-0.5 leading-none"
        style={{ color: accent ? 'var(--lime)' : 'var(--text)', letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
    </div>
  )
}
