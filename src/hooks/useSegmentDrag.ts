import { type PointerEvent as ReactPointerEvent, type RefObject, useRef, useState } from "react"

// Movement under this many pixels stays a tap.
const SLOP = 4

interface Held {
  pointerId: number
  startX: number
  grab: number
  index: number
  active: boolean
}

export interface SegmentDrag {
  offset: number | null
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
    onLostPointerCapture: (event: ReactPointerEvent<HTMLElement>) => void
  }
}

// The thumb follows the finger across the track and lands on the nearest option on release.
export const useSegmentDrag = (
  boxRef: RefObject<HTMLElement | null>,
  count: number,
  activeIndex: number,
  onIndex: (index: number) => void,
  onScrub?: (position: number | null) => void,
): SegmentDrag => {
  const held = useRef<Held | null>(null)
  const [offset, setOffset] = useState<number | null>(null)

  const metrics = () => {
    const box = boxRef.current
    if (!box) return null
    const rect = box.getBoundingClientRect()
    const padding = parseFloat(getComputedStyle(box).paddingLeft) || 0
    // clientWidth leaves the border out: a 1px ring made each step 0.67px longer than the thumb.
    const span = (box.clientWidth - padding * 2) / count
    return { left: rect.left + box.clientLeft + padding, span, limit: (count - 1) * span }
  }

  const apply = (clientX: number) => {
    const size = metrics()
    const drag = held.current
    if (!size || !drag) return
    const position = Math.max(0, Math.min(size.limit, clientX - size.left - drag.grab))
    setOffset(position)
    onScrub?.(position / size.span)
    const index = Math.max(0, Math.min(count - 1, Math.round(position / size.span)))
    if (index === drag.index) return
    drag.index = index
    onIndex(index)
  }

  // A press the finger did not drag picks the option it went down on: a finger that drifts past the browser's tap
  // slop gets no click at all, and the tap was lost.
  const stop = (pointerId: number, released: boolean) => {
    const drag = held.current
    if (!drag || pointerId !== drag.pointerId) return
    held.current = null
    if (!drag.active) {
      const size = metrics()
      if (!released || !size) return
      const index = Math.floor((drag.startX - size.left) / size.span)
      if (index >= 0 && index < count && index !== activeIndex) onIndex(index)
      return
    }
    setOffset(null)
    onScrub?.(null)
  }

  return {
    offset,
    handlers: {
      onPointerDown: (event) => {
        if (event.button !== 0 || !event.isPrimary) return
        const size = metrics()
        if (!size) return
        const inside = event.clientX - size.left - activeIndex * size.span
        held.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          grab: inside >= 0 && inside <= size.span ? inside : size.span / 2,
          index: activeIndex,
          active: false,
        }
      },
      onPointerMove: (event) => {
        const drag = held.current
        if (!drag || event.pointerId !== drag.pointerId) return
        if (!drag.active) {
          if (Math.abs(event.clientX - drag.startX) < SLOP) return
          drag.active = true
          boxRef.current?.setPointerCapture(event.pointerId)
        }
        apply(event.clientX)
      },
      onPointerUp: (event) => stop(event.pointerId, true),
      onPointerCancel: (event) => stop(event.pointerId, false),
      onLostPointerCapture: (event) => {
        if (event.target === boxRef.current) stop(event.pointerId, false)
      },
    },
  }
}
