'use client'

import { useMemo } from 'react'

export type ProblemStatus = 'pending' | 'done' | 'dnf'

interface Props {
  statuses: ProblemStatus[]
  onToggle: (i: number) => void
  finalTime?: number | null
  onSetFinalTime?: (s: number | null) => void
}

export default function ScorePanel({ statuses, onToggle, finalTime }: Props) {
  const completed = statuses.filter((s) => s === 'done').length

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const scoreLine = useMemo(() => {
    if (completed === 4 && finalTime != null) return fmt(finalTime)
    if (completed === 4) return '4 / 4'
    return `${completed} / 4`
  }, [completed, finalTime])

  return (
    <div
      className="relative border overflow-hidden"
      style={{ borderColor: 'var(--border-hi)', background: 'var(--bg-card)' }}
    >
      {/* Header band */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-deep)' }}>
        <div className="flex items-center gap-2">
          <span className="display text-[10px] font-700 tracking-[0.3em] uppercase px-2 py-0.5" style={{ background: 'var(--lime)', color: '#000' }}>
            SCORE
          </span>
          <span className="mono text-[10px] tracking-widest" style={{ color: 'var(--muted)' }}>
            {'// CLICK TO TOGGLE'}
          </span>
        </div>
        <div className="display tnum font-900 text-2xl" style={{ color: completed === 4 ? 'var(--lime)' : 'var(--text)' }}>
          {scoreLine}
        </div>
      </div>

      {/* 4 status tiles */}
      <div className="grid grid-cols-4 divide-x" style={{ borderColor: 'var(--border)' }}>
        {statuses.map((status, i) => {
          const isDone = status === 'done'
          const isDnf  = status === 'dnf'
          return (
            <button
              key={i}
              onClick={() => onToggle(i)}
              className="btn-tactile group relative flex flex-col items-center justify-center py-5 transition-colors"
              style={{
                background: isDone ? 'rgba(0,229,142,0.06)' : isDnf ? 'rgba(255,56,56,0.06)' : 'transparent',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div
                className="display text-[10px] font-700 tracking-[0.3em] mb-1.5"
                style={{ color: isDone ? 'var(--emerald)' : isDnf ? 'var(--red)' : 'var(--muted)' }}
              >
                P{i + 1}
              </div>
              <div
                className="display font-900 text-3xl leading-none transition-transform group-hover:scale-110"
                style={{
                  color: isDone ? 'var(--emerald)' : isDnf ? 'var(--red)' : 'var(--border-hot)',
                }}
              >
                {isDone ? '✓' : isDnf ? '✕' : '○'}
              </div>
              <div
                className="display text-[9px] font-700 tracking-[0.25em] mt-2 uppercase"
                style={{ color: isDone ? 'var(--emerald)' : isDnf ? 'var(--red)' : 'var(--muted)' }}
              >
                {isDone ? 'DONE' : isDnf ? 'DNF' : 'PEND'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
