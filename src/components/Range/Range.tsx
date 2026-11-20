import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { fill } from "../../locale"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./Range.module.css"

const percent = (value: number, min: number, max: number) => (max > min ? ((value - min) / (max - min)) * 100 : 0)

const TICK_GAP = 12

// The ends always stay; an inner label stays only with TICK_GAP to the last kept one and to the end.
export const fitTicks = (boxes: Pick<DOMRect, "left" | "right">[]) => {
  const last = boxes.length - 1
  if (last < 1) return [0]

  const kept = [0]
  for (let index = 1; index < last; index += 1) {
    const behind = boxes[index].left - boxes[kept[kept.length - 1]].right
    const ahead = boxes[last].left - boxes[index].right
    if (behind >= TICK_GAP && ahead >= TICK_GAP) kept.push(index)
  }
  kept.push(last)

  return kept
}

export interface RangeTick {
  at: number
  label: string
}

interface RangeProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  valueText?: string
  disabled?: boolean
  // A second thumb makes it a span; the two never cross, and the ends read "label, from / to".
  highValue?: number
  onHighChange?: (value: number) => void
  ticks?: RangeTick[]
}

export const Range = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
  valueText,
  disabled,
  highValue,
  onHighChange,
  ticks,
}: RangeProps) => {
  const { labels } = useUi()
  const ticksRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState<number[] | null>(null)
  const dual = highValue !== undefined
  const lowAria = dual ? fill(labels.rangeFrom, { label }) : label
  const highAria = fill(labels.rangeTo, { label })
  const left = dual ? percent(value, min, max) : 0
  const right = 100 - percent(dual ? highValue : value, min, max)
  const scale = `${min}:${max}:${(ticks ?? []).map((tick) => `${tick.at}${tick.label}`).join("|")}`

  useLayoutEffect(() => {
    const node = ticksRef.current
    if (!node) return

    const measure = () => {
      const next = fitTicks(Array.from(node.children, (child) => child.getBoundingClientRect()))
      setShown((current) => (current?.join() === next.join() ? current : next))
    }

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    for (const child of Array.from(node.children)) observer.observe(child)

    return () => observer.disconnect()
  }, [scale])

  return (
    <>
      <div className={styles.track} data-dual={dual ? "" : undefined}>
        <span className={styles.rail} />
        <span
          className={styles.fill}
          style={{ "--fill-start": `${left}%`, "--fill-end": `${right}%` } as CSSProperties}
        />
        <input
          type="range"
          className={styles.thumb}
          data-raised={dual && left > 50 ? "" : undefined}
          disabled={disabled}
          aria-label={lowAria}
          aria-valuetext={valueText}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value)
            onChange(dual ? Math.min(next, highValue) : next)
          }}
        />
        {dual && onHighChange && (
          <input
            type="range"
            className={styles.thumb}
            disabled={disabled}
            aria-label={highAria}
            min={min}
            max={max}
            step={step}
            value={highValue}
            onChange={(event) => onHighChange(Math.max(Number(event.target.value), value))}
          />
        )}
      </div>

      {ticks && ticks.length > 0 && (
        <div ref={ticksRef} className={styles.ticks} aria-hidden="true">
          {ticks.map((tick, index) => (
            <span
              key={tick.at}
              className={styles.tick}
              data-off={shown && !shown.includes(index) ? "" : undefined}
              style={{ "--tick": `${percent(tick.at, min, max) / 100}` } as CSSProperties}
            >
              {tick.label}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
