import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { KEY_SIDE, fitKey } from "../../domain/format"
import { cx } from "../../lib/cx"
import styles from "./ShortId.module.css"

interface ShortIdProps {
  value: string
  // Keys, bag ids and hashes read in capitals; a base64 address keeps its case, which is part of it.
  upper?: boolean
  className?: string
}

// At most 6…6. Short of room the tail gives way first, 6…5, 6…4, and the head keeps its six.
export const ShortId = ({ value, upper = true, className }: ShortIdProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const cellRef = useRef<HTMLSpanElement>(null)
  const widest = Math.min(value.length, KEY_SIDE * 2 + 1)
  const [cells, setCells] = useState(widest)

  useLayoutEffect(() => {
    const element = ref.current
    const probe = cellRef.current
    if (!element || !probe) return
    const measure = () => {
      const cell = probe.getBoundingClientRect().width
      const room = element.getBoundingClientRect().width
      if (!cell || !room) return
      // The box is cells × 1ch when it has room; the margin keeps subpixel layout from dropping a cell.
      setCells(Math.max(1, Math.min(widest, Math.floor(room / cell + 0.01))))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [widest])

  const short = fitKey(value, cells) ?? value

  return (
    <span
      ref={ref}
      data-short-id=""
      className={cx(styles.id, className)}
      style={{ "--id-cells": widest } as CSSProperties}
      title={value}
    >
      {upper ? short.toUpperCase() : short}
      <span ref={cellRef} data-cell="" className={styles.cell} aria-hidden="true" />
    </span>
  )
}
