import type { ReactNode } from "react"
import { cx } from "../../lib/cx"
import styles from "./ActionRow.module.css"

interface ActionRowProps {
  className?: string
  children: ReactNode
}

// The main actions at the foot of a sheet or a step: at the right end, the main one last; one under another on a phone.
export const ActionRow = ({ className, children }: ActionRowProps) => (
  <div className={cx(styles.row, className)}>{children}</div>
)
