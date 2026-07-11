'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface TimerProps {
  capSeconds?: number
  onLap?: (seconds: number) => void
}

type Phase = 'idle' | 'running' | 'paused' | 'capped'

/**
 * Olympic-style stopwatch.
 * - Massive tabular digits (HH:MM:SS.cs)
 * - SVG arc that drains as time elapses
 * - Phase-driven colour: green → amber (>60%) → red (>80%) → red flash (capped)
 * - Lap markers (P1..P4 splits)
 */
export default function Timer({ capSeconds = 45 * 60, onLap }: TimerProps) {
  const [ms, setMs]       = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [laps, setLaps]   = useState<number[]>([])
  const startRef = useRef<number | null>(null)
  const offsetRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const CAP_MS = capSeconds * 1000

  const tick = useCallback(function tickFn() {
    if (startRef.current == null) return
    const now = performance.now()
    const elapsed = offsetRef.current + (now - startRef.current)
    if (elapsed >= CAP_MS) {
      setMs(CAP_MS)
      setPhase('capped')
      startRef.current = null
      offsetRef.current = CAP_MS
      return
    }
    setMs(elapsed)
    rafRef.current = requestAnimationFrame(tickFn)
  }, [CAP_MS])

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const start = () => {
    if (phase === 'capped') return
    startRef.current = performance.now()
    setPhase('running')
    rafRef.current = requestAnimationFrame(tick)
  }
  const pause = () => {
    if (startRef.current != null) {
      offsetRef.current += performance.now() - startRef.current
      startRef.current = null
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPhase('paused')
  }
  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null
    offsetRef.current = 0
    setMs(0)
    setLaps([])
    setPhase('idle')
  }
  const lap = () => {
    if (phase !== 'running' || laps.length >= 4) return
    const sec = Math.floor(ms / 1000)
    setLaps((l) => [...l, sec])
    onLap?.(sec)
  }

  const seconds = Math.floor(ms / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  const remaining = Math.max(0, CAP_MS - ms)
  const remSec = Math.ceil(remaining / 1000)
  const pct = ms / CAP_MS

  const intensity: 'cool' | 'warm' | 'hot' | 'critical' = useMemo(() => {
    if (phase === 'capped') return 'critical'
    if (pct >= 0.85) return 'critical'
    if (pct >= 0.6)  return 'hot'
    if (pct >= 0.35) return 'warm'
    return 'cool'
  }, [pct, phase])

  const accent =
    intensity === 'critical' ? 'var(--red)'    :
    intensity === 'hot'      ? 'var(--red)'    :
    intensity === 'warm'     ? 'var(--amber)'  :
                               'var(--lime)'

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }
  const fmtCs = (n: number) => n.toString().padStart(2, '0')

  // SVG arc geometry
  const SIZE = 260
  const STROKE = 8
  const R = (SIZE - STROKE * 2) / 2
  const C = 2 * Math.PI * R

  return (
    <div
      className="relative w-full p-6 sm:p-8 border overflow-hidden"
      style={{
        borderColor: intensity === 'critical' ? 'rgba(255,56,56,0.5)' : 'var(--border-hi)',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
        boxShadow: phase === 'running'
          ? `inset 0 0 60px rgba(${intensity === 'critical' ? '255,56,56' : intensity === 'hot' ? '255,56,56' : intensity === 'warm' ? '255,184,0' : '200,255,0'}, 0.06)`
          : 'none',
      }}
    >
      {/* Diagonal warning stripes when critical */}
      {intensity === 'critical' && (
        <div className="danger-stripes absolute inset-0 opacity-40 pointer-events-none" />
      )}

      {/* Top status bar */}
      <div className="relative flex items-center justify-between mb-6 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <span
            className={phase === 'running' ? 'live-dot' : ''}
            style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: phase === 'running' ? accent : phase === 'capped' ? 'var(--red)' : 'var(--muted)',
              boxShadow: phase === 'running' ? `0 0 12px ${accent}` : 'none',
            }}
          />
          <span className="display tnum text-xs font-700 tracking-[0.3em] uppercase" style={{ color: accent }}>
            {phase === 'capped' ? 'TIME CAP' : phase === 'running' ? 'LIVE' : phase === 'paused' ? 'PAUSED' : 'STANDBY'}
          </span>
        </div>
        <div className="display tnum text-xs font-700 tracking-[0.25em] uppercase" style={{ color: 'var(--muted)' }}>
          CAP {fmt(capSeconds)}
        </div>
      </div>

      <div className="relative flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
        {/* Stopwatch face */}
        <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Tick marks */}
            {Array.from({ length: 60 }).map((_, i) => {
              const major = i % 5 === 0
              const angle = (i / 60) * 360
              const inner = R - (major ? 12 : 6)
              const outer = R - 2
              const rad = (angle * Math.PI) / 180
              const cx = SIZE / 2
              const cy = SIZE / 2
              return (
                <line
                  key={i}
                  x1={cx + Math.cos(rad) * inner} y1={cy + Math.sin(rad) * inner}
                  x2={cx + Math.cos(rad) * outer} y2={cy + Math.sin(rad) * outer}
                  stroke={major ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
                  strokeWidth={major ? 1.5 : 1}
                />
              )
            })}
            {/* Background ring */}
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#181818" strokeWidth={STROKE} />
            {/* Progress ring */}
            <circle
              cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
              stroke={accent} strokeWidth={STROKE} strokeLinecap="butt"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              style={{
                transition: 'stroke-dashoffset 0.1s linear, stroke 0.4s',
                filter: phase === 'running' ? `drop-shadow(0 0 6px ${accent})` : 'none',
              }}
            />
            {/* Lap tick markers */}
            {laps.map((lapSec, i) => {
              const lapPct = (lapSec * 1000) / CAP_MS
              const angle = lapPct * 360 - 90
              const rad = (angle * Math.PI) / 180
              const cx = SIZE/2 + Math.cos(rad) * (R + 4)
              const cy = SIZE/2 + Math.sin(rad) * (R + 4)
              return (
                <circle key={i} cx={cx} cy={cy} r={3} fill="var(--lime)" />
              )
            })}
          </svg>

          {/* Centre digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`display tnum font-900 leading-none ${phase === 'running' && intensity === 'critical' ? 'urgent-flash' : ''}`}
              style={{
                fontSize: 'clamp(2.6rem, 5.5vw, 3.8rem)',
                color: accent,
                letterSpacing: '-0.04em',
                textShadow: phase === 'running' ? `0 0 20px ${accent}40` : 'none',
              }}
            >
              {fmt(seconds)}
            </div>
            <div className="display tnum font-700 leading-none mt-1" style={{ fontSize: '0.95rem', color: 'var(--muted-hi)' }}>
              .{fmtCs(cs)}
            </div>
            <div className="mono text-[10px] tracking-[0.3em] mt-3" style={{ color: 'var(--muted)' }}>
              {phase === 'capped' ? 'TIME CAP' : `T-${fmt(remSec)}`}
            </div>
          </div>
        </div>

        {/* Side panel: laps + controls */}
        <div className="flex-1 w-full">
          <div className="display text-xs font-700 tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--muted)' }}>
            SPLITS
          </div>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[0, 1, 2, 3].map((i) => {
              const sec = laps[i]
              const has = sec !== undefined
              return (
                <div
                  key={i}
                  className="border px-2 py-3 text-center"
                  style={{
                    borderColor: has ? 'var(--lime-dim)' : 'var(--border)',
                    background: has ? 'rgba(200,255,0,0.04)' : 'transparent',
                  }}
                >
                  <div className="display text-[10px] font-700 tracking-[0.25em]" style={{ color: has ? 'var(--lime)' : 'var(--muted)' }}>
                    P{i + 1}
                  </div>
                  <div className="display tnum font-800 mt-1" style={{ fontSize: '1.1rem', color: has ? 'var(--text)' : 'var(--border-hot)' }}>
                    {has ? fmt(sec!) : '--:--'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-3 gap-2">
            {phase === 'idle' || phase === 'paused' ? (
              <button
                onClick={start}
                disabled={phase === 'capped' as Phase}
                className="btn-tactile display font-800 text-sm tracking-[0.25em] uppercase py-3 col-span-1"
                style={{ background: 'var(--lime)', color: '#000' }}
              >
                {phase === 'paused' ? 'RESUME' : 'START'}
              </button>
            ) : (
              <button
                onClick={pause}
                className="btn-tactile display font-800 text-sm tracking-[0.25em] uppercase py-3 col-span-1 border"
                style={{ borderColor: 'var(--lime)', color: 'var(--lime)', background: 'rgba(200,255,0,0.08)' }}
              >
                PAUSE
              </button>
            )}
            <button
              onClick={lap}
              disabled={phase !== 'running' || laps.length >= 4}
              className="btn-tactile display font-800 text-sm tracking-[0.25em] uppercase py-3 border disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--border-hi)', color: 'var(--text)' }}
            >
              SPLIT
            </button>
            <button
              onClick={reset}
              className="btn-tactile display font-800 text-sm tracking-[0.25em] uppercase py-3 border"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-hi)' }}
            >
              RESET
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
