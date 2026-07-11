'use client'

import { useEffect, useState } from 'react'

interface Props {
  target: number
  duration?: number
  className?: string
  style?: React.CSSProperties
}

/** Counts up to target on mount; respects prefers-reduced-motion. */
export default function CodCounter({ target, duration = 1100, className, style }: Props) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const reduced = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    if (reduced) {
      raf = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(raf)
    }
    const start = performance.now()
    const tick = (t: number) => {
      const elapsed = t - start
      const p = Math.min(1, elapsed / duration)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.floor(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setValue(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return (
    <span className={className} style={style}>
      {value.toString().padStart(3, '0')}
    </span>
  )
}
