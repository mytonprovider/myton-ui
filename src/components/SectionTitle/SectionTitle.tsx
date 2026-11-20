import type { HTMLAttributes } from "react"
import { cx } from "../../lib/cx"
import type { Glyph } from "../../lib/glyph"
import styles from "./SectionTitle.module.css"

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  icon?: Glyph
  // `lg` heads a page section or a table, `md` a block inside a sheet or a card.
  size?: "md" | "lg"
  level?: 2 | 3
}

export const SectionTitle = ({ icon: Icon, size = "lg", level = 2, className, children, ...rest }: SectionTitleProps) => {
  const Heading = level === 2 ? "h2" : "h3"
  return (
    <Heading className={cx(styles.title, styles[size], className)} {...rest}>
      {Icon && <Icon className={styles.icon} aria-hidden="true" />}
      {children}
    </Heading>
  )
}
