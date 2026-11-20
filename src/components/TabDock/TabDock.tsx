import { useRef, type CSSProperties, type KeyboardEvent } from "react"
import { cx } from "../../lib/cx"
import type { Glyph } from "../../lib/glyph"
import { useSegmentDrag } from "../../hooks/useSegmentDrag"
import { indexOnKey, tabId, tabPanelId } from "../SegmentedControl/SegmentedControl"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./TabDock.module.css"

export interface TabDockItem<T extends string> {
  key: T
  label: string
  icon?: Glyph
  // The lit tab fills its icon (a bell, a star, a folder); an arrow drawn by its stroke alone keeps it open.
  open?: boolean
  badge?: string
}

interface TabDockProps<T extends string> {
  // The id prefix the tab panels are named by, as SegmentedControl's tabs.
  tabs: string
  items: readonly TabDockItem<T>[]
  value: T
  onChange: (value: T) => void
  // The thumb's place in tabs while the panes are swiped, the active index when unset.
  progress?: number
  onScrub?: (position: number | null) => void
}

// The section tabs at the bottom of a phone screen, always in reach of the thumb: the mini-app's dock, and on a site
// the tabs that stand above the content on a wide screen.
export const TabDock = <T extends string>({
  tabs,
  items,
  value,
  onChange,
  progress,
  onScrub,
}: TabDockProps<T>) => {
  const { onFeedback } = useUi()
  const barRef = useRef<HTMLDivElement>(null)
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === value),
  )
  const thumb = Math.min(Math.max(progress ?? activeIndex, 0), items.length - 1)

  const select = (next: T) => {
    if (next === value) return
    onFeedback?.()
    onChange(next)
  }

  const { offset, handlers } = useSegmentDrag(
    barRef,
    items.length,
    activeIndex,
    (index) => {
      const next = items[index]
      if (next) select(next.key)
    },
    onScrub,
  )

  const nearest = offset === null ? Math.round(thumb) : activeIndex

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = indexOnKey(event.key, activeIndex, items.length)
    const next = index === null ? undefined : items[index]
    if (!next) return
    event.preventDefault()
    select(next.key)
    document.getElementById(tabId(`${tabs}-dock`, next.key))?.focus()
  }

  return (
    <div data-tab-dock="" className={styles.dock}>
      <div
        ref={barRef}
        className={styles.bar}
        style={{ "--dock-tabs": items.length } as CSSProperties}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        {...handlers}
      >
        <span
          className={cx(
            styles.thumb,
            offset !== null && styles.thumbHeld,
            offset === null && progress === undefined && styles.thumbGlide,
          )}
          style={{
            width: `calc((100% - 2 * var(--space-1)) / ${items.length})`,
            transform: offset === null ? `translateX(${thumb * 100}%)` : `translateX(${offset}px)`,
          }}
        />
        {items.map((item, index) => {
          const active = item.key === value
          const lit = index === nearest
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={tabId(`${tabs}-dock`, item.key)}
              aria-controls={tabPanelId(tabs, item.key)}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              className={cx(styles.tab, lit && styles.active)}
              onClick={() => select(item.key)}
            >
              {item.icon && (
                <item.icon className={styles.icon} fill={lit && !item.open ? "currentColor" : "none"} aria-hidden="true" />
              )}
              <span className={styles.label}>
                {item.label}
                {item.badge && <span className={styles.badge}>{item.badge}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
