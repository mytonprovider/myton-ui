import { useState } from "react"
import {
  type Edge,
  type FilterEdges,
  type FilterField,
  type FilterValues,
  type ListId,
  type ListOption,
  type RangeValue,
} from "../../domain"
import { FILTER_GROUPS, withFilter } from "../../domain/filters"
import { formatNumber } from "../../domain/format"
import { splitColumns } from "../../lib/columns"
import { cx } from "../../lib/cx"
import { fill, type Locale } from "../../locale"
import { FieldGroup } from "../FieldRow/FieldRow"
import { Range } from "../Range/Range"
import { SegmentedControl } from "../SegmentedControl/SegmentedControl"
import { Toggle } from "../Toggle/Toggle"
import { useUi } from "../UiProvider/UiProvider"
import { FilterSelect } from "./FilterSelect"
import styles from "./FilterPanel.module.css"

type FilterLabels = Locale["filters"]

const digitsOf = (step: number): number => (step >= 1 ? 0 : (String(step).split(".")[1] ?? "").length)

const parseNumber = (text: string): number | null => {
  const normalized = text.replace(",", ".").replace(/\+$/, "").trim()
  if (normalized === "") return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const clamp = (value: number, edge: Edge) => Math.min(edge.max, Math.max(edge.min, value))

interface FilterRangeProps {
  label: string
  edge: Edge
  step: number
  // A fixed scale (a percentage) has a true end; any other ends where 95 % of the catalog does, so its end reads "N+"
  open: boolean
  value: RangeValue
  onChange: (value: RangeValue) => void
}

export const FilterRange = ({ label, edge, step, open, value, onChange }: FilterRangeProps) => {
  const { labels } = useUi()
  const digits = digitsOf(step)
  const format = (number: number) => formatNumber(number, digits) ?? ""
  const shown = {
    from: value.from === undefined ? format(edge.min) : format(value.from),
    to: value.to === undefined ? `${format(edge.max)}${open ? "+" : ""}` : format(value.to),
  }
  const [text, setText] = useState(shown)
  const [synced, setSynced] = useState(shown)
  if (synced.from !== shown.from || synced.to !== shown.to) {
    setSynced(shown)
    setText(shown)
  }

  // Typed numbers may pass the scale: the slider stops at its end, the field keeps what was asked
  const commitFrom = (raw: string) => {
    const parsed = parseNumber(raw)
    const from = parsed === null || parsed <= edge.min ? undefined : parsed
    const to = from !== undefined && value.to !== undefined && from > value.to ? undefined : value.to
    setText(shown)
    onChange({ from, to })
  }

  const commitTo = (raw: string) => {
    const parsed = parseNumber(raw)
    const to = parsed === null || (parsed >= edge.max && (!open || raw.trim().endsWith("+"))) ? undefined : parsed
    const from = to !== undefined && value.from !== undefined && value.from > to ? undefined : value.from
    setText(shown)
    onChange({ from, to })
  }

  // Both numbers share the room of the longest value the scale can show, so the row holds still as the thumb moves: a
  // round end prints without decimals, so the step under it (99.9 under 100) counts too; a longer typed value widens it
  const room = `${Math.max(
    format(edge.min).length,
    `${format(edge.max)}${open ? "+" : ""}`.length,
    (edge.max - step).toFixed(digits).length,
    text.from.length,
    text.to.length,
  )}ch`

  const bound = (name: "from" | "to", commit: (raw: string) => void) => (
    <input
      className={cx(styles.bound, name === "from" ? styles.from : styles.to)}
      style={{ width: room }}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={fill(name === "from" ? labels.rangeFrom : labels.rangeTo, { label })}
      value={text[name]}
      onChange={(event) => setText({ ...text, [name]: event.target.value })}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
    />
  )

  return (
    <div>
      <div className={cx(styles.line, styles.rangeLine)}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
          {bound("from", commitFrom)}
          <span className={styles.dash}>–</span>
          {bound("to", commitTo)}
        </span>
      </div>
      <div className={styles.slider}>
        <Range
          label={label}
          min={edge.min}
          max={edge.max}
          step={step}
          value={clamp(value.from ?? edge.min, edge)}
          highValue={clamp(value.to ?? edge.max, edge)}
          onChange={(next) => onChange({ ...value, from: next <= edge.min ? undefined : next })}
          onHighChange={(next) => onChange({ ...value, to: next >= edge.max ? undefined : next })}
        />
      </div>
    </div>
  )
}

// A column each where the sheet has room for two; the group title counts as a row
const COLUMNS = splitColumns(FILTER_GROUPS, (group) => group.fields.length + 1)

interface FilterPanelProps {
  values: FilterValues
  edges: FilterEdges
  options: Record<ListId, ListOption[]>
  labels: FilterLabels
  onChange: (values: FilterValues) => void
}

// Laid out as the mini-app's alert settings: a group of rows under its title, a name on the left and its
// control on the right. A scale's two numbers stand where a switch would, its slider takes the line under them: beside
// the slider, as the alert's one number sits, two of them left it half the row
export const FilterPanel = ({ values, edges, options, labels, onChange }: FilterPanelProps) => {
  const renderField = (field: FilterField) => {
    const label = labels.field[field.id]

    switch (field.kind) {
      case "range":
        return (
          <FilterRange
            key={field.id}
            label={label}
            edge={edges[field.id]}
            step={field.step}
            open={!field.fixed}
            value={values[field.id] ?? {}}
            onChange={(next) => onChange(withFilter(values, field.id, next))}
          />
        )
      case "list":
        return (
          <FilterSelect
            key={field.id}
            label={label}
            anyLabel={labels.any}
            options={options[field.id]}
            value={values[field.id] ?? []}
            mono={field.mono}
            onChange={(next) => onChange(withFilter(values, field.id, next))}
          />
        )
      case "flag":
        return (
          <div key={field.id} className={styles.line}>
            <span className={styles.label}>{label}</span>
            <Toggle
              checked={values[field.id] === true}
              label={label}
              onChange={(next) => onChange(withFilter(values, field.id, next ? true : undefined))}
            />
          </div>
        )
      case "choice":
        return (
          <div key={field.id} className={styles.line}>
            <span className={styles.label}>{label}</span>
            <SegmentedControl<boolean | undefined>
              size="sm"
              label={label}
              options={[
                { value: undefined, label: labels.any },
                { value: true, label: labels.yes },
                { value: false, label: labels.no },
              ]}
              value={values[field.id]}
              onChange={(next) => onChange(withFilter(values, field.id, next))}
              className={styles.choice}
            />
          </div>
        )
      case "text":
        return (
          <label key={field.id} className={styles.line}>
            <span className={styles.label}>{label}</span>
            <input
              className={styles.text}
              type="text"
              autoComplete="off"
              placeholder={labels.hint[field.id]}
              value={values[field.id] ?? ""}
              onChange={(event) => onChange(withFilter(values, field.id, event.target.value))}
            />
          </label>
        )
    }
  }

  return (
    <div className={styles.panel}>
      {COLUMNS.map((groups, index) => (
        <div key={index} className={styles.column}>
          {groups.map((group) => (
            <FieldGroup key={group.id} title={labels.group[group.id]} className={styles.group}>
              {group.fields.map(renderField)}
            </FieldGroup>
          ))}
        </div>
      ))}
    </div>
  )
}
