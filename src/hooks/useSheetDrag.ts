import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type RefCallback,
} from "react"

// The sheet turns into a bottom drawer below the desktop width; Sheet.module.css repeats it, a media query cannot read a variable.
export const SHEET_DRAWER = "(max-width: 1199px)"
// A slider moves sideways and a chart scrubs; neither may become a pull on the sheet.
const NO_DRAG = '[data-no-drag], input[type="range"]'
const SLOP = 6
const CLOSE_RATIO = 0.25
const CLOSE_VELOCITY = 0.4

export interface SheetDrag {
  ref: RefCallback<HTMLElement>
  element: MutableRefObject<HTMLElement | null>
  offset: number
  dragging: boolean
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
  }
}

interface DragState {
  startX: number
  startY: number
  startTime: number
  height: number
  scroller: Element | null
  decided: boolean
  active: boolean
}

const IDLE: DragState = { startX: 0, startY: 0, startTime: 0, height: 0, scroller: null, decided: true, active: false }

const scrollerAt = (target: Element, sheet: Element): Element | null => {
  let node: Element | null = target
  while (node && sheet.contains(node)) {
    if (node.scrollHeight > node.clientHeight) {
      const overflow = getComputedStyle(node).overflowY
      if (overflow === "auto" || overflow === "scroll") return node
    }
    node = node.parentElement
  }
  return null
}

// A pull anywhere on the sheet closes it, once the gesture reads as downward and whatever scrolls under the finger is
// at its top. Touch goes through touch events, not pointer ones: iOS webviews only let a non-passive touchmove stop the
// page from scrolling under the drag. A mouse drags through pointer events.
export const useSheetDrag = (enabled: boolean, onDismiss: () => void, media?: string): SheetDrag => {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const sheet = useRef<HTMLElement | null>(null)
  const state = useRef<DragState>(IDLE)
  const frame = useRef(0)
  const live = useRef({ enabled, onDismiss, media })
  live.current = { enabled, onDismiss, media }

  const begin = useCallback((target: Element, x: number, y: number) => {
    const element = sheet.current
    const { enabled: on, media: query } = live.current
    if (!on || !element || (query && !window.matchMedia(query).matches) || target.closest(NO_DRAG)) {
      state.current = IDLE
      return
    }
    state.current = {
      startX: x,
      startY: y,
      startTime: performance.now(),
      height: element.getBoundingClientRect().height,
      scroller: scrollerAt(target, element),
      decided: false,
      active: false,
    }
  }, [])

  const move = useCallback((x: number, y: number): boolean => {
    const drag = state.current
    if (drag.decided && !drag.active) return false
    const dy = y - drag.startY

    if (!drag.decided) {
      const dx = x - drag.startX
      if (Math.abs(dy) < SLOP && Math.abs(dx) < SLOP) return false
      drag.decided = true
      const atTop = !drag.scroller || drag.scroller.scrollTop <= 0
      drag.active = dy > Math.abs(dx) && atTop
      if (!drag.active) return false
      setDragging(true)
    }

    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => setOffset(Math.max(0, dy)))
    return true
  }, [])

  const finish = useCallback((y: number) => {
    const drag = state.current
    state.current = IDLE
    if (!drag.active) return
    cancelAnimationFrame(frame.current)
    setDragging(false)
    const distance = y - drag.startY
    const elapsed = performance.now() - drag.startTime
    const velocity = elapsed > 0 ? distance / elapsed : 0
    if (distance <= drag.height * CLOSE_RATIO && velocity <= CLOSE_VELOCITY) {
      setOffset(0)
      return
    }
    // The offset stays: the close slides on from where the finger let go.
    live.current.onDismiss()
  }, [])

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches[0]
      if (event.touches.length !== 1 || !touch) return
      begin(event.target as Element, touch.clientX, touch.clientY)
    },
    [begin],
  )

  const onTouchMove = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      if (move(touch.clientX, touch.clientY) && event.cancelable) event.preventDefault()
    },
    [move],
  )

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      finish(touch ? touch.clientY : state.current.startY)
    },
    [finish],
  )

  const ref = useCallback<RefCallback<HTMLElement>>(
    (element) => {
      const previous = sheet.current
      if (previous) {
        previous.removeEventListener("touchstart", onTouchStart)
        previous.removeEventListener("touchmove", onTouchMove)
        previous.removeEventListener("touchend", onTouchEnd)
        previous.removeEventListener("touchcancel", onTouchEnd)
      }
      sheet.current = element
      if (!element) return
      element.addEventListener("touchstart", onTouchStart, { passive: true })
      element.addEventListener("touchmove", onTouchMove, { passive: false })
      element.addEventListener("touchend", onTouchEnd)
      element.addEventListener("touchcancel", onTouchEnd)
    },
    [onTouchStart, onTouchMove, onTouchEnd],
  )

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return {
    ref,
    element: sheet,
    offset,
    dragging,
    handlers: {
      onPointerDown: (event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return
        begin(event.target as Element, event.clientX, event.clientY)
      },
      onPointerMove: (event) => {
        if (event.pointerType !== "mouse") return
        move(event.clientX, event.clientY)
      },
      onPointerUp: (event) => {
        if (event.pointerType !== "mouse") return
        finish(event.clientY)
      },
      onPointerCancel: (event) => {
        if (event.pointerType !== "mouse") return
        finish(event.clientY)
      },
    },
  }
}
