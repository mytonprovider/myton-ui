import type { HTMLAttributes, ReactNode, Ref } from "react"
import { cx } from "../../lib/cx"
import styles from "./OpenRow.module.css"

interface OpenRowProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  onOpen: () => void
  // The stretched button's name for a screen reader, such as "Provider details 4D4F01…A569A8".
  label: string
  // The stretched button, for a front that opens the row from a control of its own (the key's text): focused first,
  // it is where the sheet hands the focus back.
  openRef?: Ref<HTMLButtonElement>
  // The row whose details are open, or were last.
  viewed?: boolean
  children: ReactNode
}

// A list row that opens its details. The row is not a button itself: a button stretched over it opens it, and the
// row's own buttons and links stand above that one, so no control sits inside another and Enter needs no handler.
// A front colours the row through --row-surface (its stripe), --row-mark (viewed and focused) and --row-hover (under
// the pointer): a background of its own would outrank the states, which live in the package's layer.
export const OpenRow = ({ onOpen, label, openRef, viewed, className, children, ...rest }: OpenRowProps) => (
  <article data-viewed={viewed || undefined} className={cx(styles.row, className)} {...rest}>
    <button
      ref={openRef}
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={onOpen}
      className={styles.open}
    />
    {children}
  </article>
)
