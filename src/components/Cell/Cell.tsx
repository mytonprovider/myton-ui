import { ChevronDown, ChevronRight } from "lucide-react"
import type { HTMLAttributes, ReactNode } from "react"
import { cx } from "../../lib/cx"
import styles from "./Cell.module.css"

interface CellProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  label: ReactNode
  // A front's own mark before the label, such as the menu's icon tile.
  leading?: ReactNode
  trailing?: ReactNode
  // The row opens something. A row that cannot be pressed keeps the chevron's place, so its neighbours' tails line up.
  chevron?: boolean
  // The row folds something open under it: a chevron down that turns up while it is open.
  expanded?: boolean
  href?: string
  external?: boolean
}

// A row that is pressed, or holds controls of its own, in a card of rows: 44 high, the label in the text colour, a tail
// on the right. A button with onClick, a link with href, a plain block otherwise.
export const Cell = ({
  label,
  leading,
  trailing,
  chevron,
  expanded,
  href,
  external,
  className,
  onClick,
  ...rest
}: CellProps) => {
  const folds = expanded !== undefined
  const pressable = href !== undefined || onClick !== undefined
  const body = (
    <>
      {leading}
      <span className={styles.label}>{label}</span>
      {(trailing || chevron || folds) && (
        <span className={styles.tail}>
          {trailing}
          {chevron && <ChevronRight className={styles.chevron} aria-hidden="true" />}
          {folds && <ChevronDown className={cx(styles.chevron, styles.fold)} aria-hidden="true" />}
        </span>
      )}
    </>
  )
  const classes = cx(styles.cell, pressable && styles.press, className)

  if (href !== undefined) {
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        {...rest}
      >
        {body}
      </a>
    )
  }
  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} aria-expanded={expanded} {...rest}>
        {body}
      </button>
    )
  }
  return (
    <div className={classes} {...rest}>
      {body}
    </div>
  )
}
