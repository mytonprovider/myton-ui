import { useState, type ReactNode } from "react"
import { formatPercent } from "../../domain/format"
import { checkCounts, ratioPercent, reasonTone, type ReasonCount } from "../../domain/status"
import type { StatusTone } from "../../domain/tone"
import { cx } from "../../lib/cx"
import { Card } from "../Card/Card"
import { Cell } from "../Cell/Cell"
import { FieldList } from "../FieldRow/FieldRow"
import { CheckRatio } from "../CheckRatio/CheckRatio"
import { skeletonClass } from "../Skeleton/Skeleton"
import { StatusBar, StatusLine } from "../StatusBar/StatusBar"
import { StatusDot } from "../StatusDot/StatusDot"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./StatusCard.module.css"

interface StatusCardProps {
  tone: StatusTone
  label: string
  // The share of passed checks providerStatus gives; null while a failure leads, and then no percent is shown.
  ratio: number | null
  description: ReactNode
  reasons: readonly ReasonCount[]
  describe: (reason: number) => string
  // The card's own placeholder: the same parts as shapes, sized by the sample texts and reasons the front passes.
  loading?: boolean
  className?: string
}

// With more than one code a row opens them all in the leading reason's place.
export const StatusCard = ({
  tone,
  label,
  ratio,
  description,
  reasons,
  describe,
  loading,
  className,
}: StatusCardProps) => {
  const { labels } = useUi()
  const [open, setOpen] = useState(false)
  const { passed, total } = checkCounts(reasons)
  const parts = [...reasons].sort((a, b) => b.count - a.count)
  const percent = ratioPercent(ratio)
  const several = parts.length > 1

  return (
    <Card frame data-tone={tone} aria-hidden={loading ? "true" : undefined} className={cx(styles.card, className)}>
      {total > 0 && (
        <StatusBar
          parts={parts.map((part) => ({
            key: part.reason,
            count: part.count,
            tone: reasonTone(part.reason),
            title: `${describe(part.reason)} • ${part.count}`,
          }))}
          loading={loading}
        />
      )}

      <FieldList divided>
        <div className={styles.body}>
          <StatusLine
            label={label}
            percent={percent !== null ? formatPercent(percent, 0) : undefined}
            trailing={
              total > 0 && (
                <>
                  <span className={styles.ratioLabel}>{labels.filesAvailable}</span>
                  <CheckRatio passed={passed} total={total} tone={tone} loading={loading} />
                </>
              )
            }
            loading={loading}
          />

          {several && open ? (
            <div className={styles.legend}>
              {parts.map((part) => (
                <div key={part.reason} data-tone={reasonTone(part.reason)} className={styles.legendRow}>
                  <StatusDot color="var(--tone)" size={8} />
                  <span className={styles.legendLabel}>{describe(part.reason)}</span>
                  <span className={styles.legendCount}>
                    {part.count} • {formatPercent((part.count / total) * 100, 1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.description}>
              {loading ? <span className={skeletonClass()}>{description}</span> : description}
            </p>
          )}
        </div>

        {several && !loading && (
          <Cell
            label={open ? labels.hideDetails : labels.showDetails}
            expanded={open}
            onClick={() => setOpen((value) => !value)}
          />
        )}
      </FieldList>
    </Card>
  )
}
