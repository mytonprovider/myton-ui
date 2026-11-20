import { cx } from "../../lib/cx"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./Toggle.module.css"

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export const Toggle = ({ checked, onChange, label }: ToggleProps) => {
  const { onFeedback } = useUi()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx(styles.track, checked && styles.on)}
      onClick={() => {
        onFeedback?.()
        onChange(!checked)
      }}
    >
      <span className={styles.knob} />
    </button>
  )
}
