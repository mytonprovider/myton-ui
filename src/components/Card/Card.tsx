import { forwardRef, type HTMLAttributes } from "react"
import { cx } from "../../lib/cx"
import styles from "./Card.module.css"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  frame?: boolean
  // A card holding one row of its own or a short field list takes the row inset; a card of figures, the
  // wider block one. A card of rows leaves it unset: its rows carry their own.
  pad?: "row" | "block"
  // Rows alternating with the screen colour, framed as `frame` frames them.
  striped?: boolean
}

// A card is a surface; `frame` is the list variant: rows paint themselves, the frame clips them to its radius. The ref
// reaches a virtualised list that measures its frame.
export const Card = forwardRef<HTMLDivElement, CardProps>(({ frame, striped, pad, className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cx(styles.card, (frame || striped) && styles.frame, pad && styles[pad], className)}
    {...rest}
  />
))

Card.displayName = "Card"
