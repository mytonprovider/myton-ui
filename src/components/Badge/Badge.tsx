import type { ReactNode } from "react"
import { cx } from "../../lib/cx"
import type { Tone } from "../../domain/tone"
import styles from "./Badge.module.css"

interface BadgeProps {
  tone: Tone
  size?: "sm" | "md"
  dot?: boolean
  // The dot alone, the label kept for screen readers: a row that ran out of room for the word (useCompactStatus).
  compact?: boolean
  // Every word the badge can show: it holds the widest one's room, so a column of badges reads one width whichever
  // word each shows.
  reserve?: ReactNode[]
  children: ReactNode
  className?: string
}

export const Badge = ({ tone, size = "md", dot, compact, reserve, children, className }: BadgeProps) => (
  <span
    data-tone={tone}
    data-badge=""
    data-compact={compact ? "" : undefined}
    className={cx(styles.badge, styles[size], className)}
  >
    {dot && <span className={styles.dot} aria-hidden="true" />}
    {reserve ? (
      <span className={styles.fit}>
        <span className={styles.label}>{children}</span>
        {reserve.map((item, index) => (
          <span key={index} className={styles.room} aria-hidden="true">
            {item}
          </span>
        ))}
      </span>
    ) : (
      <span className={styles.label}>{children}</span>
    )}
  </span>
)
