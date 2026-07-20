'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { SignalsData, SignalCategoryKey, SignalCuePart, SignalTechnique } from '@/lib/types'

interface Props {
  signals: SignalsData
  exampleCounts: Record<string, number>
}

const C = {
  bg: '#F0EDE6',
  surface: '#FEFDFB',
  border: '#E3DFD6',
  text: '#2B2825',
  muted: '#8B8680',
  accent: '#B5651D',
  accentPale: '#F5DFC2',
} as const

const SERIF = "Georgia, 'Iowan Old Style', 'Times New Roman', serif"
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

const CAT_COLORS: Record<SignalCategoryKey, { accent: string; pale: string }> = {
  objective: { accent: '#2563A6', pale: '#DCE8F5' },
  structure: { accent: '#3F7D58', pale: '#DEEAE0' },
  property: { accent: '#7B4B94', pale: '#EAE0EF' },
  constraint: { accent: '#B5651D', pale: '#F5DFC2' },
}

function cueToText(cue: SignalCuePart[]): string {
  return cue.map((part) => (Array.isArray(part) ? part[0] : part)).join('')
}

function CueSentence({
  cue,
  colors,
}: {
  cue: SignalCuePart[]
  colors: { accent: string; pale: string }
}) {
  return (
    <>
      {cue.map((part, i) =>
        Array.isArray(part) ? (
          <mark
            key={i}
            style={{ background: colors.pale, color: colors.accent, padding: '0 3px', borderRadius: 2 }}
          >
            {part[0]}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export default function SignalsExplorer({ signals, exampleCounts }: Props) {
  const [search, setSearch] = useState('')
  const [activeCats, setActiveCats] = useState<Set<SignalCategoryKey>>(
    () => new Set(signals.categories.map((c) => c.key))
  )
  const [focusedTechnique, setFocusedTechnique] = useState<string | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setFocusedTechnique(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const techniquesBySignal = useMemo(() => {
    const map = new Map<string, SignalTechnique[]>()
    for (const sig of signals.signals) map.set(sig.id, [])
    for (const tech of signals.techniques) {
      for (const sid of tech.s) {
        map.get(sid)?.push(tech)
      }
    }
    return map
  }, [signals.signals, signals.techniques])

  const cueTextBySignal = useMemo(() => {
    const map = new Map<string, string>()
    for (const sig of signals.signals) map.set(sig.id, cueToText(sig.cue).toLowerCase())
    return map
  }, [signals.signals])

  const filteredSignals = useMemo(() => {
    const q = search.trim().toLowerCase()
    return signals.signals.filter((sig) => {
      if (!activeCats.has(sig.cat)) return false
      if (!q) return true
      if (sig.id.toLowerCase().includes(q)) return true
      if (sig.name.toLowerCase().includes(q)) return true
      if (cueTextBySignal.get(sig.id)?.includes(q)) return true
      const techs = techniquesBySignal.get(sig.id) ?? []
      return techs.some((t) => t.t.toLowerCase().includes(q))
    })
  }, [signals.signals, activeCats, search, cueTextBySignal, techniquesBySignal])

  const focusedTechniqueObj = useMemo(
    () => (focusedTechnique ? signals.techniques.find((t) => t.t === focusedTechnique) ?? null : null),
    [focusedTechnique, signals.techniques]
  )

  const toggleCategory = (key: SignalCategoryKey) => {
    setActiveCats((prev) => {
      if (prev.has(key) && prev.size === 1) return prev
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectTechnique = (name: string) => {
    setFocusedTechnique((prev) => (prev === name ? null : name))
  }

  const inputStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.text,
    borderRadius: 4,
  }

  return (
    <div className="min-h-screen relative z-10" style={{ background: C.bg, color: C.text }}>
      <header
        className="border-b px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{ background: C.surface, borderColor: C.border }}
      >
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold" style={{ fontFamily: SERIF }}>
            CodeFit
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.25em]"
            style={{ color: C.muted }}
          >
            Signal Recognition
          </span>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="hover:underline" style={{ color: C.muted }}>
            Daily Workout
          </Link>
          <Link href="/problems" className="hover:underline" style={{ color: C.muted }}>
            Problems
          </Link>
          <Link href="/signals" className="font-semibold" style={{ color: C.accent }}>
            Signals
          </Link>
        </nav>
      </header>

      {focusedTechniqueObj && (
        <div
          className="sticky top-0 z-20 px-4 sm:px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-2"
          style={{ background: C.text, color: C.surface }}
        >
          <span className="font-bold" style={{ fontFamily: SERIF }}>
            {focusedTechniqueObj.t}
          </span>
          <span className="text-sm" style={{ fontFamily: MONO, opacity: 0.85 }}>
            {focusedTechniqueObj.s.join(' + ')}
          </span>
          <span className="text-sm flex-1 min-w-[200px]" style={{ opacity: 0.9 }}>
            {focusedTechniqueObj.note}
          </span>
          {exampleCounts[focusedTechniqueObj.t] > 0 && (
            <span className="text-sm whitespace-nowrap" style={{ opacity: 0.85 }}>
              {exampleCounts[focusedTechniqueObj.t].toLocaleString()} practice problems on CodeFit
            </span>
          )}
          <button
            type="button"
            onClick={() => setFocusedTechnique(null)}
            aria-label="Clear focused technique"
            className="text-sm px-2.5 py-1 rounded shrink-0"
            style={{ border: `1px solid ${C.surface}`, color: C.surface }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.25em] mb-2"
          style={{ color: C.muted }}
        >
          CodeFit · field manual
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: SERIF }}>
          Signal Recognition
        </h1>
        <p className="text-sm max-w-2xl mb-6" style={{ color: C.muted }}>
          {signals.signals.length} observable signals — cues you can spot in a problem statement — mapped
          to the {signals.techniques.length} solve techniques they point to. Read the statement, spot the
          signal, know the move.
        </p>

        <div className="flex flex-col gap-4 mb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search signals, cues, or techniques..."
            className="w-full max-w-md px-3 py-2 text-sm outline-none focus:border-[#B5651D]"
            style={inputStyle}
          />

          <div className="flex flex-wrap gap-2">
            {signals.categories.map((cat) => {
              const colors = CAT_COLORS[cat.key]
              const active = activeCats.has(cat.key)
              return (
                <button
                  key={cat.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCategory(cat.key)}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors motion-reduce:transition-none"
                  style={{
                    border: `1px solid ${active ? colors.accent : C.border}`,
                    background: active ? colors.pale : C.surface,
                    color: active ? colors.accent : C.muted,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span
                    className="inline-block rounded-full shrink-0"
                    style={{ width: 8, height: 8, background: colors.accent, opacity: active ? 1 : 0.35 }}
                  />
                  {cat.label}
                  <span style={{ opacity: 0.7, fontWeight: 400 }}>· {cat.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        <p
          className="text-sm mb-6"
          style={{ color: C.muted, fontFamily: focusedTechniqueObj ? MONO : undefined }}
        >
          {focusedTechniqueObj
            ? `${filteredSignals.length} signals shown · recipe: ${focusedTechniqueObj.s.join(' + ')}`
            : `${filteredSignals.length} of ${signals.signals.length} signals · ${signals.techniques.length} techniques`}
        </p>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(420px, 100%), 1fr))' }}
        >
          {filteredSignals.map((sig) => {
            const colors = CAT_COLORS[sig.cat]
            const techs = techniquesBySignal.get(sig.id) ?? []
            const dimmed = !!focusedTechniqueObj && !focusedTechniqueObj.s.includes(sig.id)
            const category = signals.categories.find((c) => c.key === sig.cat)
            return (
              <div
                key={sig.id}
                className="rounded p-4 transition-opacity motion-reduce:transition-none"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${colors.accent}`,
                  opacity: dimmed ? 0.4 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{ fontFamily: MONO, background: colors.pale, color: colors.accent }}
                  >
                    {sig.id}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.15em] shrink-0"
                    style={{ color: colors.accent }}
                  >
                    {category?.label}
                  </span>
                </div>
                <div className="font-bold mb-1.5">{sig.name}</div>
                <p className="text-[13px] leading-relaxed mb-3" style={{ fontFamily: MONO, color: C.text }}>
                  <CueSentence cue={sig.cue} colors={colors} />
                </p>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5"
                  style={{ color: C.muted }}
                >
                  → points to
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {techs.map((t) => {
                    const isFocused = focusedTechnique === t.t
                    return (
                      <button
                        key={t.t}
                        type="button"
                        aria-pressed={isFocused}
                        onClick={() => selectTechnique(t.t)}
                        className="text-[12px] px-2 py-1 rounded transition-colors motion-reduce:transition-none"
                        style={{
                          fontFamily: MONO,
                          border: `1px solid ${isFocused ? C.text : C.border}`,
                          background: isFocused ? C.text : C.bg,
                          color: isFocused ? C.surface : C.text,
                          fontWeight: isFocused ? 600 : 400,
                        }}
                      >
                        {t.t}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {filteredSignals.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: C.muted }}>
              No signals match the current filters.
            </div>
          )}
        </div>

        <footer className="mt-10 pt-6 text-xs" style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}>
          {signals.source}
        </footer>
      </div>
    </div>
  )
}
