import type { HTMLAttributes, ReactNode } from "react"
import { cx } from "../../lib/cx"
import type { Glyph } from "../../lib/glyph"
import styles from "./EmptyState.module.css"

interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode
  hint?: ReactNode
  // A failure's status code, set in mono under the message.
  code?: ReactNode
  icon?: Glyph
  action?: ReactNode
  // `md` is the line a site shows in place of its rows, `lg` the mini-app's screen-sized state under a large icon.
  size?: "md" | "lg"
  // A failure or a dead end draws its icon grey; an invitation to act keeps the accent.
  muted?: boolean
}

export const EmptyState = ({
  title,
  hint,
  code,
  icon: Icon,
  action,
  size = "md",
  muted,
  className,
  ...rest
}: EmptyStateProps) => (
  <div className={cx(styles.state, styles[size], muted && styles.muted, className)} {...rest}>
    {Icon && (
      <span className={styles.mark}>
        <Icon className={styles.icon} aria-hidden="true" />
      </span>
    )}
    {title && <p className={styles.title}>{title}</p>}
    {hint && <p className={styles.hint}>{hint}</p>}
    {code && <p className={styles.code}>{code}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
)
