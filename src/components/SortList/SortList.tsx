import { ArrowDown, ArrowUp } from "lucide-react"
import { Cell } from "../Cell/Cell"
import { FieldList } from "../FieldRow/FieldRow"
import type { SortDirection } from "../../domain/sort"
import styles from "./SortList.module.css"

interface SortListProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  direction: SortDirection
  // The direction in words, such as "descending", for a screen reader; the eye gets the arrow of the sort button and
  // the table headers
  directionLabel: string
  // A tap on the active row turns its direction, on another row picks that field.
  onPick: (value: T) => void
}

// The sort sheet's list on a phone, where the table's sortable headers are gone.
export const SortList = <T extends string>({ options, value, direction, directionLabel, onPick }: SortListProps<T>) => (
  <FieldList card>
    {options.map((option) => {
      const active = option.value === value
      const Arrow = direction === "asc" ? ArrowUp : ArrowDown
      return (
        <Cell
          key={option.value}
          label={option.label}
          trailing={active && <Arrow className={styles.arrow} aria-hidden="true" />}
          aria-pressed={active}
          aria-label={active ? `${option.label}, ${directionLabel}` : undefined}
          onClick={() => onPick(option.value)}
        />
      )
    })}
  </FieldList>
)
