'use client'

import { useRef } from 'react'
import type { Pattern } from '@/lib/types'

interface Props {
  patterns: Pattern[]
  value: string
  onChange: (id: string) => void
}

export default function PatternSelector({ patterns, value, onChange }: Props) {
  const railRef = useRef<HTMLDivElement | null>(null)

  const scroll = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  const items: { id: string; name: string; meta: string }[] = [
    { id: 'random', name: 'RANDOM', meta: 'AUTO' },
    ...patterns.map((p) => ({
      id: p.id,
      name: p.name.toUpperCase(),
      meta: `${p.problems.length} PRB`,
    })),
  ]

  return (
    <div className="relative">
      {/* Edge fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, var(--bg) 0%, transparent 100%)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(-90deg, var(--bg) 0%, transparent 100%)' }} />

      {/* Scroll arrows */}
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 display font-900 text-xl px-2 py-1"
        style={{ color: 'var(--muted-hi)' }}
        aria-label="Scroll patterns left"
      >‹</button>
      <button
        type="button"
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 display font-900 text-xl px-2 py-1"
        style={{ color: 'var(--muted-hi)' }}
        aria-label="Scroll patterns right"
      >›</button>

      <div
        ref={railRef}
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1 px-8"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item) => {
          const active = value === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className="btn-tactile flex-shrink-0 border px-3 py-2 transition-colors text-left"
              style={{
                scrollSnapAlign: 'start',
                background: active ? 'var(--lime)' : 'var(--bg-card)',
                borderColor: active ? 'var(--lime)' : 'var(--border-hi)',
                color: active ? '#000' : 'var(--text)',
                minWidth: 140,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="display text-sm font-800 tracking-[0.05em] uppercase whitespace-nowrap">
                  {item.name}
                </span>
                <span
                  className="mono text-[9px] tnum tracking-wider px-1.5 py-0.5"
                  style={{
                    color: active ? '#000' : 'var(--muted-hi)',
                    background: active ? 'rgba(0,0,0,0.18)' : 'transparent',
                    border: active ? 'none' : '1px solid var(--border-hi)',
                  }}
                >
                  {item.meta}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
