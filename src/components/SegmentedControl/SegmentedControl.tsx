import { type KeyboardEvent, type ReactNode, useRef } from "react"
import { useSegmentDrag } from "../../hooks/useSegmentDrag"
import { cx } from "../../lib/cx"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./SegmentedControl.module.css"

export interface SegmentOption<T> {
  value: T
  label: ReactNode
  badge?: ReactNode
}

interface SegmentedControlProps<T> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label?: string
  size?: "sm" | "md" | "lg"
  // Tabs switch panels: the options become tabs controlling `${tabs}-panel-${value}`.
  tabs?: string
  // Views of one object, as a Telegram profile's tabs: text over a line, the pick underlined. A choice of value and an
  // app's own sections keep the pill.
  variant?: "underline"
  className?: string
}

// Arrows wrap round, Home and End jump to the ends: the tablist keys every tab row shares.
export const indexOnKey = (key: string, index: number, count: number) => {
  if (key === "ArrowLeft") return (index - 1 + count) % count
  if (key === "ArrowRight") return (index + 1) % count
  if (key === "Home") return 0
  if (key === "End") return count - 1
  return null
}

export const tabId = (tabs: string, value: unknown) => `${tabs}-tab-${String(value)}`
export const tabPanelId = (tabs: string, value: unknown) => `${tabs}-panel-${String(value)}`

export const SegmentedControl = <T,>({
  options,
  value,
  onChange,
  label,
  size = "md",
  tabs,
  variant,
  className,
}: SegmentedControlProps<T>) => {
  const { onFeedback } = useUi()
  const boxRef = useRef<HTMLDivElement>(null)
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => Object.is(option.value, value)),
  )

  const select = (index: number) => {
    const option = options[index]
    if (!option || Object.is(option.value, value)) return
    onFeedback?.()
    onChange(option.value)
  }

  const { offset, handlers } = useSegmentDrag(boxRef, options.length, activeIndex, select)

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = indexOnKey(event.key, activeIndex, options.length)
    if (next === null) return
    event.preventDefault()
    boxRef.current?.querySelectorAll("button")[next]?.focus()
    select(next)
  }

  return (
    <div
      ref={boxRef}
      role={tabs ? "tablist" : "radiogroup"}
      aria-label={label}
      className={cx(styles.box, styles[size], variant && styles[variant], className)}
      {...handlers}
    >
      <span
        aria-hidden="true"
        className={cx(styles.thumb, offset !== null && styles.held)}
        style={{
          width: `calc((100% - var(--space-1) * 2) / ${options.length})`,
          transform: offset === null ? `translateX(${activeIndex * 100}%)` : `translateX(${offset}px)`,
        }}
      />
      {options.map((option, index) => {
        const selected = index === activeIndex
        return (
          <button
            key={String(option.value)}
            type="button"
            role={tabs ? "tab" : "radio"}
            id={tabs ? tabId(tabs, option.value) : undefined}
            aria-selected={tabs ? selected : undefined}
            aria-checked={tabs ? undefined : selected}
            aria-controls={tabs && selected ? tabPanelId(tabs, option.value) : undefined}
            tabIndex={selected ? 0 : -1}
            className={cx(styles.option, selected && styles.selected)}
            onClick={() => select(index)}
            onKeyDown={onKeyDown}
          >
            <span className={styles.text}>{option.label}</span>
            {option.badge !== undefined && <span className={styles.badge}>{option.badge}</span>}
          </button>
        )
      })}
    </div>
  )
}
