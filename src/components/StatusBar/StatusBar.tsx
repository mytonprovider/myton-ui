import type { ReactNode } from "react"
import type { StatusTone } from "../../domain/tone"
import { cx } from "../../lib/cx"
import { skeletonClass } from "../Skeleton/Skeleton"
import { StatusDot } from "../StatusDot/StatusDot"
import styles from "./StatusBar.module.css"

interface StatusBarPart {
  key: string | number
  count: number
  // Unset, the part takes the tone of the card it stands in.
  tone?: StatusTone
  title?: string
}

interface StatusBarProps {
  parts: readonly StatusBarPart[]
  // Above the parts' sum, the rest stays bare track: a contract's providers not yet storing.
  total?: number
  loading?: boolean
}

// The strip along a status card's top edge, one part per share.
export const StatusBar = ({ parts, total, loading }: StatusBarProps) => {
  const rest = total === undefined ? 0 : total - parts.reduce((sum, part) => sum + part.count, 0)
  return (
    <div className={styles.bar}>
      {parts.map((part) => (
        <span
          key={part.key}
          data-tone={part.tone}
          style={{ flexGrow: part.count }}
          title={part.title}
          className={loading ? skeletonClass(styles.part) : styles.part}
        />
      ))}
      {rest > 0 && <span style={{ flexGrow: rest }} />}
    </div>
  )
}

interface StatusLineProps {
  label: ReactNode
  percent?: ReactNode
  // The count on the right: passes over checks, with or without its word.
  trailing?: ReactNode
  loading?: boolean
}

// A status card's first line: the state in its tone, and a count on the right that wraps under it on the narrowest
// phone rather than squeezing it.
export const StatusLine = ({ label, percent, trailing, loading }: StatusLineProps) => (
  <div className={styles.line}>
    <span className={cx(styles.state, loading && skeletonClass(undefined, true))}>
      <StatusDot color="var(--tone)" size={8} />
      <span className={styles.label}>{label}</span>
      {percent !== undefined && <span className={styles.percent}>{percent}</span>}
    </span>
    {trailing && <span className={styles.trailing}>{trailing}</span>}
  </div>
)
