import { Check } from "lucide-react"
import { cx } from "../../lib/cx"
import styles from "./CheckMark.module.css"

interface CheckMarkProps {
  checked: boolean
  className?: string
}

// Only the box: the whole row is the control (role="checkbox" aria-checked on its button), so the mark stays
// out of the accessibility tree.
export const CheckMark = ({ checked, className }: CheckMarkProps) => (
  <span className={cx(styles.box, checked && styles.on, className)} aria-hidden="true">
    {checked && <Check strokeWidth={3.5} className={styles.icon} />}
  </span>
)
