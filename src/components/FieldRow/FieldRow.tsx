import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import type { Tone } from "../../domain/tone"
import { cx } from "../../lib/cx"
import { CopyButton } from "../CopyButton/CopyButton"
import { SectionTitle } from "../SectionTitle/SectionTitle"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./FieldRow.module.css"

interface FieldGroupProps {
  title?: string
  // A control that changes the card's rows, such as a period: the card's first line, parted from the rows by its
  // hairline, so it reads as the card's own.
  head?: ReactNode
  className?: string
  children: ReactNode
}

interface FieldListProps {
  // Rows parted by a full-width hairline, each inset by a row's padding: a list item's rows.
  divided?: boolean
  // The same rows on a card's surface: details, filters, sorting, menus. Implies divided.
  card?: boolean
  className?: string
  children: ReactNode
}

// The column of rows on its own, for a front's panel or form that is not a card. A row sets its own height: a FieldRow
// stands 36, a Cell 44.
export const FieldList = ({ divided, card, className, children }: FieldListProps) => (
  <div className={cx(styles.rows, (divided || card) && styles.divided, card && styles.card, className)}>{children}</div>
)

// A card of label–value rows with its section title above it, as iOS and Telegram head their groups: the provider's and
// the contract's details on every front.
export const FieldGroup = ({ title, head, className, children }: FieldGroupProps) => (
  <section className={className}>
    {title && (
      <SectionTitle size="md" level={3} className={styles.title}>
        <span>{title}</span>
      </SectionTitle>
    )}
    <FieldList card>
      {head && <div className={styles.head}>{head}</div>}
      {children}
    </FieldList>
  </section>
)

interface FieldRowProps {
  label: ReactNode
  value: ReactNode
  // The full text when the value is shortened; a long plain value cuts with an ellipsis and keeps it here.
  title?: string
  href?: string
  mono?: boolean
  upper?: boolean
  tone?: Extract<Tone, "red" | "yellow">
  copy?: string
  copied?: boolean
  onCopy?: (value: string) => void
  // A front's own skeleton or busy look, and a mark after the value such as a pending icon.
  labelClassName?: string
  valueClassName?: string
  trailing?: ReactNode
  busy?: boolean
  hidden?: boolean
  // The row opens something (a name to edit, a list): the whole row is the button and ends in a chevron, as a list row
  // that leads on does.
  onClick?: () => void
}

export const FieldRow = ({
  label,
  value,
  title,
  href,
  mono,
  upper,
  tone,
  copy,
  copied = false,
  onCopy,
  labelClassName,
  valueClassName,
  trailing,
  busy,
  hidden,
  onClick,
}: FieldRowProps) => {
  const { labels } = useUi()
  const valueClass = cx(styles.value, mono && styles.mono, upper && styles.upper, tone && styles[tone], valueClassName)

  if (onClick) {
    return (
      <button type="button" className={cx(styles.row, styles.action)} onClick={onClick}>
        <span className={cx(styles.label, labelClassName)}>{label}</span>
        <span className={styles.gap} />
        <span title={title} className={valueClass}>
          {value}
        </span>
        <ChevronRight className={styles.chevron} aria-hidden="true" />
      </button>
    )
  }

  return (
    <div aria-hidden={hidden ? "true" : undefined} className={styles.row}>
      <span className={cx(styles.label, labelClassName)}>{label}</span>
      <span className={styles.gap} />
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={cx(valueClass, styles.link)}>
          {value}
        </a>
      ) : (
        <span title={title} aria-busy={busy ? "true" : undefined} className={valueClass}>
          {value}
        </span>
      )}
      {trailing}
      {copy && onCopy && (
        <CopyButton
          value={copy}
          copied={copied}
          onCopy={onCopy}
          label={typeof value === "string" ? `${labels.copy} ${value}` : undefined}
          className={styles.copy}
        />
      )}
    </div>
  )
}
