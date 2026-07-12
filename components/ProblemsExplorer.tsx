'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ListedProblem } from '@/lib/types'

interface Props {
  problems: ListedProblem[]
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

const QUICK_RANGES: { label: string; min: string; max: string }[] = [
  { label: 'All', min: '', max: '' },
  { label: '< 1400', min: '', max: '1399' },
  { label: '1400–1600', min: '1400', max: '1600' },
  { label: '1600–1800', min: '1600', max: '1800' },
  { label: '1800–2100', min: '1800', max: '2100' },
  { label: '2100+', min: '2100', max: '' },
]

const PAGE_SIZE = 100

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2"
      style={{ color: C.muted }}
    >
      {children}
    </div>
  )
}

function LockIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-label="Premium"
      className="inline-block shrink-0"
      style={{ color: C.muted }}
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export default function ProblemsExplorer({ problems }: Props) {
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState('')
  const [maxRating, setMaxRating] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [selectedTechniques, setSelectedTechniques] = useState<Set<string>>(new Set())
  const [showUnrated, setShowUnrated] = useState(false)
  const [sortDesc, setSortDesc] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const resetPage = () => setVisibleCount(PAGE_SIZE)

  const tagList = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>()
    for (const p of problems) {
      for (const t of p.tags) {
        const entry = counts.get(t.slug)
        if (entry) entry.count += 1
        else counts.set(t.slug, { name: t.name, count: 1 })
      }
    }
    return Array.from(counts.entries())
      .map(([slug, { name, count }]) => ({ slug, name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [problems])

  const techniqueList = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of problems) {
      for (const t of p.techniques) {
        counts.set(t, (counts.get(t) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [problems])

  const tagScoped = useMemo(() => {
    if (selectedTags.size === 0) return problems
    return problems.filter((p) => p.tags.some((t) => selectedTags.has(t.slug)))
  }, [problems, selectedTags])

  const facetScoped = useMemo(() => {
    if (selectedTechniques.size === 0) return tagScoped
    return tagScoped.filter((p) => p.techniques.some((t) => selectedTechniques.has(t)))
  }, [tagScoped, selectedTechniques])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const min = minRating === '' ? -Infinity : Number(minRating)
    const max = maxRating === '' ? Infinity : Number(maxRating)
    return facetScoped.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q) && !String(p.lc_id).includes(q)) return false
      if (p.rating < min || p.rating > max) return false
      if (!showUnrated && p.ratingSource !== 'zerotrak') return false
      return true
    })
  }, [facetScoped, search, minRating, maxRating, showUnrated])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => (sortDesc ? b.rating - a.rating : a.rating - b.rating) || a.lc_id - b.lc_id)
    return arr
  }, [filtered, sortDesc])

  const visible = sorted.slice(0, visibleCount)
  const ratedInScope = useMemo(
    () => facetScoped.reduce((n, p) => n + (p.ratingSource === 'zerotrak' ? 1 : 0), 0),
    [facetScoped]
  )

  const hasFilters =
    search !== '' ||
    minRating !== '' ||
    maxRating !== '' ||
    selectedTags.size > 0 ||
    selectedTechniques.size > 0 ||
    showUnrated

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
    resetPage()
  }

  const toggleTechnique = (name: string) => {
    setSelectedTechniques((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
    resetPage()
  }

  const clearAll = () => {
    setSearch('')
    setMinRating('')
    setMaxRating('')
    setSelectedTags(new Set())
    setSelectedTechniques(new Set())
    setShowUnrated(false)
    resetPage()
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
            Problem List
          </span>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="hover:underline" style={{ color: C.muted }}>
            Daily Workout
          </Link>
          <Link href="/problems" className="font-semibold" style={{ color: C.accent }}>
            Problems
          </Link>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row gap-8 items-start">
        <aside className="w-full md:w-[220px] shrink-0 md:sticky md:top-6 space-y-6">
          <div>
            <SectionLabel>Search</SectionLabel>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
              placeholder="Title or number..."
              className="w-full px-2.5 py-1.5 text-sm outline-none focus:border-[#B5651D]"
              style={inputStyle}
            />
          </div>

          <div>
            <SectionLabel>Rating</SectionLabel>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value)
                  resetPage()
                }}
                placeholder="Min"
                className="w-full min-w-0 px-2 py-1.5 text-sm outline-none focus:border-[#B5651D]"
                style={inputStyle}
              />
              <span style={{ color: C.muted }}>–</span>
              <input
                type="number"
                value={maxRating}
                onChange={(e) => {
                  setMaxRating(e.target.value)
                  resetPage()
                }}
                placeholder="Max"
                className="w-full min-w-0 px-2 py-1.5 text-sm outline-none focus:border-[#B5651D]"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1">
              {QUICK_RANGES.map((r) => {
                const active = minRating === r.min && maxRating === r.max
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => {
                      setMinRating(r.min)
                      setMaxRating(r.max)
                      resetPage()
                    }}
                    className="text-left text-sm px-2.5 py-1 rounded"
                    style={{
                      border: `1px solid ${active ? C.accent : C.border}`,
                      background: active ? C.accentPale : C.surface,
                      color: active ? C.accent : C.text,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <SectionLabel>Technique</SectionLabel>
            <div
              className="max-h-72 overflow-y-auto rounded"
              style={{ border: `1px solid ${C.border}`, background: C.surface }}
            >
              {techniqueList.map((t) => {
                const active = selectedTechniques.has(t.name)
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => toggleTechnique(t.name)}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-1 text-[13px] text-left"
                    style={{
                      background: active ? C.accentPale : 'transparent',
                      color: active ? C.accent : C.text,
                      fontWeight: active ? 600 : 400,
                      boxShadow: active ? `inset 2px 0 0 ${C.accent}` : 'none',
                    }}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="tnum" style={{ color: active ? C.accent : C.muted }}>
                      {t.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <SectionLabel>Tags</SectionLabel>
            <div
              className="max-h-72 overflow-y-auto rounded"
              style={{ border: `1px solid ${C.border}`, background: C.surface }}
            >
              {tagList.map((t) => {
                const active = selectedTags.has(t.slug)
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => toggleTag(t.slug)}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-1 text-[13px] text-left"
                    style={{
                      background: active ? C.accentPale : 'transparent',
                      color: active ? C.accent : C.text,
                      fontWeight: active ? 600 : 400,
                      boxShadow: active ? `inset 2px 0 0 ${C.accent}` : 'none',
                    }}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="tnum" style={{ color: active ? C.accent : C.muted }}>
                      {t.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showUnrated}
              onChange={(e) => {
                setShowUnrated(e.target.checked)
                resetPage()
              }}
              className="accent-[#B5651D]"
            />
            Include non-contest-rated
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm underline underline-offset-2"
              style={{ color: C.accent }}
            >
              Clear all filters
            </button>
          )}
        </aside>

        <main className="flex-1 min-w-0 w-full">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: SERIF }}>
                Problem List
              </h1>
              <p className="text-sm mt-1" style={{ color: C.muted }}>
                {sorted.length.toLocaleString()} matches · {ratedInScope.toLocaleString()} of{' '}
                {facetScoped.length.toLocaleString()} contest-rated
              </p>
            </div>
            <div className="flex gap-2">
              {[
                { label: 'Easiest first', desc: false },
                { label: 'Hardest first', desc: true },
              ].map((opt) => {
                const active = sortDesc === opt.desc
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSortDesc(opt.desc)}
                    className="text-sm px-3.5 py-1.5 rounded-full"
                    style={{
                      border: `1px solid ${active ? C.accent : C.border}`,
                      background: active ? C.accentPale : C.surface,
                      color: active ? C.accent : C.muted,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className="rounded overflow-x-auto"
            style={{ border: `1px solid ${C.border}`, background: C.surface }}
          >
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}
                >
                  <th className="text-left font-semibold px-4 py-2.5">Rating</th>
                  <th className="text-left font-semibold px-3 py-2.5">#</th>
                  <th className="text-left font-semibold px-3 py-2.5">Title</th>
                  <th className="text-left font-semibold px-3 py-2.5">Technique · Tags</th>
                  <th className="text-right font-semibold px-4 py-2.5">Level</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.lc_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {p.ratingSource === 'zerotrak' ? (
                        <span
                          className="inline-block rounded px-2 py-0.5 text-[13px] font-semibold tnum"
                          style={{ background: C.accentPale, color: C.text }}
                        >
                          {Math.round(p.rating)}
                        </span>
                      ) : (
                        <span
                          className="inline-block rounded px-2 py-0.5 text-[13px] tnum"
                          style={{ border: `1px dashed ${C.border}`, color: C.muted }}
                        >
                          ≈ {Math.round(p.rating)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 tnum" style={{ color: C.muted }}>
                      {p.lc_id}
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={`https://leetcode.com/problems/${p.slug}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-center gap-1.5"
                        style={{ color: C.text }}
                      >
                        {p.title}
                        {p.premium && <LockIcon />}
                      </a>
                    </td>
                    <td className="px-3 py-2 max-w-[280px]">
                      {p.techniques.length > 0 && (
                        <div className="text-[13px] font-semibold" style={{ color: C.accent }}>
                          {p.techniques.join(' · ')}
                        </div>
                      )}
                      <div style={{ color: C.muted }}>{p.tags.map((t) => t.name).join(' · ')}</div>
                    </td>
                    <td
                      className="px-4 py-2 text-right text-[11px] uppercase tracking-[0.15em] whitespace-nowrap"
                      style={{ color: C.muted }}
                    >
                      {p.difficulty}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center" style={{ color: C.muted }}>
                      No problems match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {visibleCount < sorted.length && (
            <div className="flex justify-center py-5">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="text-sm px-5 py-2 rounded"
                style={{
                  border: `1px solid ${C.accent}`,
                  background: C.surface,
                  color: C.accent,
                  fontWeight: 600,
                }}
              >
                Load more ({(sorted.length - visibleCount).toLocaleString()} remaining)
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
