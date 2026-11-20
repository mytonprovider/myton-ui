import { useCallback, useEffect, useId, useRef, type MouseEvent, type PointerEvent, type ReactNode } from "react"
import { CircleHelp } from "lucide-react"
import { cx } from "../../lib/cx"
import { clampToViewport } from "../../lib/viewport"
import styles from "./Hint.module.css"

const GAP = 9

interface HintProps {
  text: string
  // Off inside a control that already takes focus (a sort header); that control opens the hint through `open`.
  focusable?: boolean
  open?: boolean
  className?: string
  // A label to explain instead of the question mark.
  children?: ReactNode
}

// A popover in the top layer, so no card's clip or stacking cuts it; it closes on the first scroll, as it would drift.
export const Hint = ({ text, focusable = true, open, className, children }: HintProps) => {
  const id = useId()
  const wrapRef = useRef<HTMLSpanElement>(null)
  const popRef = useRef<HTMLSpanElement>(null)

  const hide = useCallback(() => {
    const pop = popRef.current
    if (pop?.matches(":popover-open")) pop.hidePopover()
  }, [])

  const show = useCallback(() => {
    const wrap = wrapRef.current
    const pop = popRef.current
    if (!wrap || !pop) return
    if (!pop.matches(":popover-open")) pop.showPopover()
    const rect = wrap.getBoundingClientRect()
    const left = rect.left + rect.width / 2 - pop.offsetWidth / 2
    pop.style.left = `${clampToViewport(left, pop.offsetWidth)}px`
    pop.style.top = `${rect.bottom + GAP}px`
    window.addEventListener("scroll", hide, { once: true, capture: true })
  }, [hide])

  useEffect(() => {
    if (open === undefined) return
    if (open) show()
    else hide()
  }, [open, show, hide])

  useEffect(() => () => window.removeEventListener("scroll", hide, { capture: true }), [hide])

  // A finger opens it by the click and closes it by a tap elsewhere: the mouse events a browser makes up around a tap
  // end in a mouseout right after the click (Chromium), which would close it as it opens.
  const hover = (act: () => void) => (event: PointerEvent) => {
    if (event.pointerType === "mouse") act()
  }

  const tap = (event: MouseEvent) => {
    event.stopPropagation()
    show()
  }

  return (
    <span
      ref={wrapRef}
      tabIndex={focusable ? 0 : undefined}
      aria-label={focusable && !children ? text : undefined}
      aria-describedby={children ? id : undefined}
      aria-hidden={focusable ? undefined : true}
      onPointerEnter={hover(show)}
      onPointerLeave={hover(hide)}
      onFocus={show}
      onBlur={hide}
      onClick={tap}
      className={cx(children ? styles.label : styles.mark, className)}
    >
      {children ?? <CircleHelp aria-hidden="true" className={styles.icon} />}
      <span id={children ? id : undefined} ref={popRef} popover="auto" role="tooltip" className={styles.pop}>
        {text}
      </span>
    </span>
  )
}
