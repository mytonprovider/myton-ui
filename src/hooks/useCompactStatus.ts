import { useLayoutEffect, useState, type RefObject } from "react"

// The key keeps at least its head and the ellipsis before the status gives up its word.
const KEY_MIN_CELLS = 7

// A status badge shrinks to its dot only when, with its word in full, the row's ShortId would keep less than six
// characters; the full badge is measured on an off-screen copy, so shrinking never flips the answer back.
export const useCompactStatus = (rowRef: RefObject<HTMLElement | null>): boolean => {
  const [compact, setCompact] = useState(false)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return

    const measure = () => {
      const key = row.querySelector<HTMLElement>("[data-short-id]")
      const badge = row.querySelector<HTMLElement>("[data-badge]")
      const cell = key?.querySelector<HTMLElement>("[data-cell]")?.getBoundingClientRect().width ?? 0
      if (!key || !badge || !cell || !row.clientWidth) return setCompact(false)

      const copy = badge.cloneNode(true) as HTMLElement
      copy.removeAttribute("data-compact")
      copy.style.cssText = "position:absolute;visibility:hidden;left:-9999px"
      row.appendChild(copy)
      const badgeFull = copy.getBoundingClientRect().width
      copy.remove()

      const style = getComputedStyle(row)
      const gap = parseFloat(style.columnGap) || 0
      const items = [...row.children].filter((child) => getComputedStyle(child).display !== "none")
      let taken = gap * (items.length - 1)
      for (const item of items) {
        if (item === badge) continue
        const width = item.getBoundingClientRect().width
        taken += item.contains(key) ? width - key.getBoundingClientRect().width : width
      }
      const room = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - taken - badgeFull
      setCompact(room < cell * KEY_MIN_CELLS)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [rowRef])

  return compact
}
