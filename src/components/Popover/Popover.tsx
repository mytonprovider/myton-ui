import { useCallback, useEffect, useRef, type HTMLAttributes, type RefObject } from "react"
import { cx } from "../../lib/cx"
import { VIEWPORT_EDGE, clampToViewport } from "../../lib/viewport"
import styles from "./Popover.module.css"

const GAP = 6

const scrollerOf = (node: Element): Element | null => {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const overflow = getComputedStyle(parent).overflowY
    if (overflow === "auto" || overflow === "scroll") return parent
  }
  return null
}

interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  anchor: RefObject<HTMLElement | null>
  // The box it may stand in: the anchor's scrolling body, so a list in a sheet never covers the sheet's title or its
  // button; or the whole screen, for a toolbar menu on a page
  within?: "scroller" | "viewport"
  align?: "start" | "end"
  // "anchor": the anchor's width up to maxWidth; "content": its own width, never narrower than the anchor
  fit?: "anchor" | "content"
  maxWidth?: number
  maxHeight?: number
  // The anchor scrolled out of its box: the panel would float over whatever took its place
  onLost?: () => void
  // A tap past the panel and its anchor, or Escape
  onDismiss?: () => void
}

// A panel over everything else in the top layer, placed at its anchor: below while it fits, above when there is more
// room there, the side kept once chosen so a list that shortens does not jump under the finger
export const Popover = ({
  anchor,
  within = "viewport",
  align = "start",
  fit = "anchor",
  maxWidth,
  maxHeight,
  onLost,
  onDismiss,
  className,
  children,
  ...rest
}: PopoverProps) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const dropRef = useRef<boolean | null>(null)
  const lost = useRef(onLost)
  lost.current = onLost
  const dismiss = useRef(onDismiss)
  dismiss.current = onDismiss
  const dismissible = onDismiss !== undefined

  const place = useCallback(() => {
    const trigger = anchor.current
    const panel = panelRef.current
    if (!trigger || !panel) return
    if (!panel.matches(":popover-open")) panel.showPopover()

    const rect = trigger.getBoundingClientRect()
    const box = within === "scroller" ? scrollerOf(trigger)?.getBoundingClientRect() : undefined
    const top = Math.max(box?.top ?? 0, 0)
    const bottom = Math.min(box?.bottom ?? window.innerHeight, window.innerHeight)
    if (rect.bottom < top || rect.top > bottom) {
      lost.current?.()
      return
    }

    panel.style.maxHeight = ""
    if (fit === "anchor") {
      panel.style.width = `${Math.min(rect.width, maxWidth ?? Infinity)}px`
    } else {
      // Widened to the anchor only when the anchor is the wider: an inline minimum always set would override the
      // caller's own
      panel.style.minWidth = ""
      if (maxWidth) panel.style.maxWidth = `${maxWidth}px`
      if (rect.width > panel.offsetWidth) panel.style.minWidth = `${rect.width}px`
    }
    const width = panel.offsetWidth
    const wanted = align === "end" ? rect.right - width : rect.left
    panel.style.left = `${clampToViewport(wanted, width)}px`

    const below = bottom - rect.bottom - GAP - VIEWPORT_EDGE
    const above = rect.top - top - GAP - VIEWPORT_EDGE
    const drop = dropRef.current ?? (panel.offsetHeight <= below || below >= above)
    dropRef.current = drop
    panel.style.maxHeight = `${Math.max(Math.min(drop ? below : above, maxHeight ?? Infinity), 0)}px`
    panel.style.top = drop ? `${rect.bottom + GAP}px` : "auto"
    panel.style.bottom = drop ? "auto" : `${window.innerHeight - rect.top + GAP}px`
  }, [anchor, within, align, fit, maxWidth, maxHeight])

  useEffect(() => {
    place()
    const onScroll = (event: Event) => {
      if (!(event.target instanceof Node && panelRef.current?.contains(event.target))) place()
    }
    window.addEventListener("resize", place)
    window.addEventListener("scroll", onScroll, { passive: true, capture: true })
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", onScroll, { capture: true })
    }
  }, [place])

  useEffect(() => {
    if (!dismissible) return
    const outside = (target: EventTarget | null) =>
      !(target instanceof Node && (panelRef.current?.contains(target) || anchor.current?.contains(target)))
    const onPointerDown = (event: PointerEvent) => {
      if (!outside(event.target)) return
      // In a sheet a tap past the panel only closes it, as a native menu does: the same tap on the backdrop closed the
      // sheet too. On a page it goes on, so the next menu of a toolbar opens with one tap.
      if (anchor.current?.closest("dialog[open]")) {
        const swallow = (click: MouseEvent) => {
          click.preventDefault()
          click.stopPropagation()
        }
        document.addEventListener("click", swallow, { capture: true, once: true })
        window.setTimeout(() => document.removeEventListener("click", swallow, { capture: true }), 600)
      }
      dismiss.current?.()
    }
    // Escape stops here: a sheet's dialog takes it as its own cancel and closed the whole sheet with the panel
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      event.stopPropagation()
      dismiss.current?.()
      anchor.current?.focus()
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown, true)
    }
  }, [anchor, dismissible])

  return (
    <div ref={panelRef} popover="manual" data-no-drag="" className={cx(styles.panel, className)} {...rest}>
      {children}
    </div>
  )
}
