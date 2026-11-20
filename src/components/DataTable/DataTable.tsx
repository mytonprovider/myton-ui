import {
  createContext,
  forwardRef,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type UIEventHandler,
} from "react"
import { cx } from "../../lib/cx"
import { Card } from "../Card/Card"
import { CopyButton } from "../CopyButton/CopyButton"
import { OpenRow } from "../OpenRow/OpenRow"
import { skeletonClass } from "../Skeleton/Skeleton"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./DataTable.module.css"

const Framed = createContext(false)

interface DataTableProps {
  // The grid columns of the wide table, one track per cell of a row.
  columns: string
  // The rows sit in a card and the head above it, outside the card.
  framed?: boolean
  // Below the table width the rows turn into cards.
  stack?: boolean
  // Goes on the grid, the element a front tunes: its gaps, its height, its scroll.
  className?: string
  // The grid is the scroller: a front that pages its rows in as they near the end watches it.
  gridRef?: Ref<HTMLDivElement>
  onScroll?: UIEventHandler<HTMLDivElement>
  style?: CSSProperties
  children: ReactNode
}

export const DataTable = ({
  columns,
  framed = false,
  stack = false,
  className,
  gridRef,
  onScroll,
  style,
  children,
}: DataTableProps) => (
  <Framed.Provider value={framed}>
    <div
      className={cx(styles.table, framed && styles.framed, stack && styles.stack)}
      style={{ "--table-cols": columns, ...style } as CSSProperties}
    >
      <div ref={gridRef} onScroll={onScroll} className={cx(styles.grid, className)}>
        {children}
      </div>
    </div>
  </Framed.Provider>
)

interface PartProps {
  className?: string
  children?: ReactNode
}

export const DataTableHead = ({ className, children }: PartProps) => (
  <div className={cx(useContext(Framed) ? styles.cardHead : styles.head, className)}>{children}</div>
)

export const DataHeadCell = ({ className, children }: PartProps) => (
  <span className={cx(styles.headCell, className)}>{children}</span>
)

// The ref reaches the rows themselves, for a front that measures them to size its window.
export const DataTableRows = forwardRef<HTMLDivElement, PartProps>(({ className, children }, ref) => {
  const rows = (
    <div ref={ref} className={cx(styles.rows, className)}>
      {children}
    </div>
  )
  return useContext(Framed) ? (
    <Card striped className={styles.subgrid}>
      {rows}
    </Card>
  ) : (
    rows
  )
})

DataTableRows.displayName = "DataTableRows"

// A front marks a row's own state on it (data-*), which its stylesheet reads.
interface DataRowBase extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode
}

// A row that opens its details is an OpenRow, which names it and marks it viewed; a loading row is hidden from a
// screen reader.
type DataRowProps = DataRowBase &
  (
    | { onOpen: () => void; label: string; viewed?: boolean; openRef?: Ref<HTMLButtonElement>; ghost?: never }
    | { onOpen?: never; label?: never; viewed?: never; openRef?: never; ghost?: boolean }
  )

export const DataRow = ({ onOpen, label, viewed, openRef, ghost, className, children, ...rest }: DataRowProps) =>
  onOpen ? (
    <OpenRow
      onOpen={onOpen}
      label={label}
      viewed={viewed}
      openRef={openRef}
      className={cx(styles.row, className)}
      {...rest}
    >
      {children}
    </OpenRow>
  ) : (
    <article aria-hidden={ghost || undefined} className={cx(styles.row, className)} {...rest}>
      {children}
    </article>
  )

interface DataCellProps {
  label: string
  value?: ReactNode
  title?: string
  valueClassName?: string
  // The loading row: the label is a shimmering shape of its own width.
  ghost?: boolean
  // Heads the four-column card on a line of its own, without its label; on a phone card it is a cell like the rest.
  lead?: boolean
  className?: string
  children?: ReactNode
}

export const DataCell = ({
  label,
  value,
  title,
  valueClassName,
  ghost,
  lead,
  className,
  children,
}: DataCellProps) => (
  <div className={cx(styles.cell, lead && styles.leadCell, className)}>
    <span className={cx(styles.label, ghost && skeletonClass())}>{label}</span>
    {children ?? (
      <span title={title} className={cx(styles.value, ghost && skeletonClass(), valueClassName)}>
        {value}
      </span>
    )}
  </div>
)

interface DataLeadProps {
  // The short form on screen; the full value goes to the title, the copy and the link.
  value: string
  title: string
  upper?: boolean
  href?: string
  copy: string
  copied: string | null
  // On a phone the copy button gives way to the value.
  copyOnWide?: boolean
  onCopy: (value: string) => void
}

export const DataLead = ({ value, title, upper, href, copy, copied, copyOnWide, onCopy }: DataLeadProps) => {
  const { labels } = useUi()
  return (
    <span className={styles.lead}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={title}
          className={cx(styles.mono, styles.link, upper && styles.upper)}
        >
          {value}
        </a>
      ) : (
        <span title={title} className={cx(styles.mono, upper && styles.upper)}>
          {value}
        </span>
      )}
      <CopyButton
        value={copy}
        copied={copied === copy}
        onCopy={onCopy}
        label={`${labels.copy} ${value}`}
        className={cx(copyOnWide && styles.copyOnWide)}
      />
    </span>
  )
}

interface DataActionsProps extends PartProps {
  // Icon actions: on a phone card they stay one row of equal pills instead of stacking like text buttons.
  fill?: boolean
}

export const DataActions = ({ fill, className, children }: DataActionsProps) => (
  <div className={cx(styles.actions, fill && styles.fill, className)}>{children}</div>
)
