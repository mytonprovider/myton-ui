import { useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { SortDirection } from "../../domain/sort"
import { fill } from "../../locale"
import { cx } from "../../lib/cx"
import { Hint } from "../Hint/Hint"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./SortColumn.module.css"

interface SortColumnProps {
  label: string
  hint?: string
  active?: boolean
  direction?: SortDirection
  // Without it the header is a plain label that keeps the same place and hint.
  onSort?: () => void
  className?: string
}

export const SortColumn = ({ label, hint, active = false, direction = "desc", onSort, className }: SortColumnProps) => {
  const { labels } = useUi()
  const [focused, setFocused] = useState(false)

  const body = (
    <>
      <span title={label} className={styles.text}>
        {label}
      </span>
      {hint && <Hint focusable={false} open={focused} text={hint} />}
    </>
  )

  if (!onSort) return <span className={cx(styles.column, className)}>{body}</span>

  const state = active
    ? fill(direction === "asc" ? labels.sortedAsc : labels.sortedDesc, { label })
    : fill(labels.sortColumn, { label })

  return (
    <button
      type="button"
      onClick={onSort}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label={hint ? `${state}. ${hint}` : state}
      className={cx(styles.column, styles.sortable, active && styles.active, className)}
    >
      {body}
      {active && direction === "asc" ? (
        <ArrowUp className={styles.arrow} aria-hidden="true" />
      ) : (
        <ArrowDown className={cx(styles.arrow, !active && styles.idle)} aria-hidden="true" />
      )}
    </button>
  )
}
