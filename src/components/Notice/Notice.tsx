import type { ReactNode } from "react"
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react"
import { cx } from "../../lib/cx"
import type { Glyph } from "../../lib/glyph"
import type { Tone } from "../../domain/tone"
import styles from "./Notice.module.css"

const ICONS: Record<Tone, LucideIcon> = {
  green: CircleCheck,
  yellow: TriangleAlert,
  orange: TriangleAlert,
  red: CircleAlert,
  gray: CircleAlert,
  accent: Info,
}

interface NoticeProps {
  tone: Tone
  children: ReactNode
  icon?: Glyph
  action?: ReactNode
  className?: string
}

export const Notice = ({ tone, children, icon, action, className }: NoticeProps) => {
  const Icon = icon ?? ICONS[tone]

  return (
    <div role={tone === "red" ? "alert" : "status"} data-tone={tone} className={cx(styles.notice, className)}>
      <div className={styles.body}>
        <Icon className={styles.icon} aria-hidden="true" />
        <div className={styles.text}>{children}</div>
        {action && <span className={styles.action}>{action}</span>}
      </div>
    </div>
  )
}
