import { freeTone, rankTone } from "../../domain/standing"
import { cx } from "../../lib/cx"
import styles from "./StandingMark.module.css"

// `row` is the table's form: the rank leads the row in the value's type, the share follows the unit in brackets.
type MarkVariant = "row"

// `className` takes a placeholder's shape, so the list's stand-in keeps the mark's own type and width.
interface MarkProps {
  variant?: MarkVariant
  className?: string
}

// The place by rating, set after a caption ("Rating #1") in a card or at the head of a table row.
export const RankMark = ({ rank, variant, className }: MarkProps & { rank: number }) => (
  <b data-tone={rankTone(rank)} className={cx(styles.mark, variant === "row" && styles.rank, className)}>
    {`#${rank}`}
  </b>
)

// The share of space left, after a caption in a card or after the unit in a table row.
export const FreeMark = ({ percent, variant, className }: MarkProps & { percent: number }) => {
  const share = `${Math.round(percent)}%`
  return (
    <b data-tone={freeTone(percent)} className={cx(styles.mark, variant === "row" && styles.share, className)}>
      {variant === "row" ? `(${share})` : share}
    </b>
  )
}
