import { useLayoutEffect, useRef, type ReactNode } from "react"
import { reducedMotion, toMs } from "../../lib/motion"
import { tabId, tabPanelId } from "../SegmentedControl/SegmentedControl"

interface TabPanelProps<T> {
  // The id prefix of the tabs that name this panel.
  tabs: string
  value: T
  // The tabs in their order, for the side the panel comes in from.
  order: readonly T[]
  className?: string
  children: ReactNode
}

// A hint of the side the new tab lies on, not a slide across the screen.
const SHIFT_PX = 24

// The content of the chosen tab. On a change it comes in from the new tab's side, fading up, on the thumb's own
// duration and curve, so the two move as one; its content stays mounted, and the first show does not move.
export const TabPanel = <T,>({ tabs, value, order, className, children }: TabPanelProps<T>) => {
  const ref = useRef<HTMLDivElement>(null)
  const shown = useRef(value)

  useLayoutEffect(() => {
    const from = order.indexOf(shown.current)
    const to = order.indexOf(value)
    shown.current = value
    const panel = ref.current
    if (!panel || from === to || reducedMotion()) return

    const style = getComputedStyle(panel)
    panel.animate(
      [
        { opacity: 0, transform: `translateX(${Math.sign(to - from) * SHIFT_PX}px)` },
        // Visible by half the move: the old panel is gone at once, so a long fade would leave the place blank.
        { opacity: 1, offset: 0.5 },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: toMs(style.getPropertyValue("--dur-base")),
        easing: style.getPropertyValue("--ease-standard").trim(),
      },
    )
  }, [value, order])

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={tabPanelId(tabs, value)}
      aria-labelledby={tabId(tabs, value)}
      className={className}
    >
      {children}
    </div>
  )
}
