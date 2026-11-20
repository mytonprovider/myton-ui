import { useCallback, useId, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import type { ListOption } from "../../domain"
import { cx } from "../../lib/cx"
import { CheckMark } from "../CheckMark/CheckMark"
import { Popover } from "../Popover/Popover"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./FilterSelect.module.css"

interface FilterSelectProps {
  label: string
  anyLabel: string
  options: ListOption[]
  value: string[]
  mono?: boolean
  onChange: (value: string[]) => void
}

interface FilterOptionProps {
  label: string
  count: number
  checked: boolean
  mono?: boolean
  disabled?: boolean
  onToggle: () => void
}

export const FilterOption = ({ label, count, checked, mono, disabled, onToggle }: FilterOptionProps) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-disabled={disabled || undefined}
    className={styles.option}
    onClick={disabled ? undefined : onToggle}
  >
    <CheckMark checked={checked} />
    <span className={cx(styles.optionLabel, mono && styles.mono)}>{label}</span>
    <span className={styles.count}>{count}</span>
  </button>
)

// Country names need no more: on a desktop sheet the row's width stood a thousand pixels wide
const MAX_WIDTH = 360

// A row of the filter card that names the pick and opens the options over the sheet, as the MTS menus do: a list
// laid in the card scrolled inside the scrolling sheet and stood a screen tall
export const FilterSelect = ({ label, anyLabel, options, value, mono, onChange }: FilterSelectProps) => {
  const { onFeedback } = useUi()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const picked = options.filter((option) => value.includes(option.value))
  const summary =
    picked.length === 0 ? anyLabel : picked.length === 1 ? picked[0].label : `${picked[0].label} +${picked.length - 1}`

  const close = useCallback(() => setOpen(false), [])

  // Picked values keep the list's order, not the tap order, so the summary always names the same first one
  const toggle = (option: string) => {
    onFeedback?.()
    const next = value.includes(option) ? value.filter((item) => item !== option) : [...value, option]
    onChange(options.filter((candidate) => next.includes(candidate.value)).map((candidate) => candidate.value))
  }

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${summary}`}
        aria-expanded={open}
        aria-controls={panelId}
        className={cx(styles.trigger, picked.length > 0 && styles.picked)}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.label}>{label}</span>
        <span className={cx(styles.summary, mono && picked.length > 0 && styles.mono)}>{summary}</span>
        <ChevronDown className={styles.chevron} aria-hidden="true" />
      </button>
      {open && (
        <Popover
          id={panelId}
          anchor={triggerRef}
          within="scroller"
          align="end"
          maxWidth={MAX_WIDTH}
          onLost={close}
          onDismiss={close}
        >
          <div role="group" aria-label={label} className={styles.options}>
            {options.map((option) => (
              <FilterOption
                key={option.value}
                label={option.label}
                count={option.count}
                checked={value.includes(option.value)}
                mono={mono}
                onToggle={() => toggle(option.value)}
              />
            ))}
          </div>
        </Popover>
      )}
    </div>
  )
}
