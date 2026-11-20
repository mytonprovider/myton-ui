import { X } from "lucide-react"
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { SHEET_DRAWER, useSheetDrag } from "../../hooks/useSheetDrag"
import { cx } from "../../lib/cx"
import { ActionRow } from "../ActionRow/ActionRow"
import { glyphClass, IconButton } from "../IconButton/IconButton"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./Sheet.module.css"

// The close falls back to a timer when no transition ends (reduced motion, a hidden tab).
const LEAVE_GUARD_MS = 400

let lockCount = 0
const LOCKED = ["overflow", "scrollbar-gutter", "padding-right"]
let lockedStyle: [string, string][] = []

const FooterSlot = createContext<HTMLDivElement | null>(null)

interface SheetFooterProps {
  className?: string
  children: ReactNode
}

// Rendered anywhere inside the sheet, it lands in the pinned footer under the scrolling body.
export const SheetFooter = ({ className, children }: SheetFooterProps) => {
  const slot = useContext(FooterSlot)
  const row = <ActionRow className={className}>{children}</ActionRow>

  return slot ? createPortal(row, slot) : row
}

interface SheetHeaderProps {
  title: string
  // Stands in for the title, such as a provider's key; the title still names the sheet.
  lead?: ReactNode
  subject?: string
  badge?: number
  // Header actions left of the close button, such as a reset or a share; sm, as the close is.
  actions?: ReactNode
  onClose: () => void
  // A front that draws its own grabber above the header turns this one off.
  grabber?: boolean
  className?: string
}

export const SheetHeader = ({
  title,
  lead,
  subject,
  badge,
  actions,
  onClose,
  grabber = true,
  className,
}: SheetHeaderProps) => {
  const { labels } = useUi()

  return (
    <div className={cx(styles.header, className)}>
      {grabber && <span className={cx(styles.grabber, styles.grabberMark)} aria-hidden="true" />}
      {lead ? (
        <span className={styles.lead}>{lead}</span>
      ) : (
        <span className={styles.title} title={title}>
          {title}
        </span>
      )}
      {subject && <span className={styles.subject}>{subject}</span>}
      {badge !== undefined && badge > 0 && <span className={styles.badge}>{badge}</span>}
      <span className={styles.spacer} />
      {actions}
      <IconButton size="sm" label={labels.close} onClick={onClose}>
        <X className={glyphClass("sm")} aria-hidden="true" />
      </IconButton>
    </div>
  )
}

interface SheetPanelProps extends HTMLAttributes<HTMLDivElement> {
  onClose: () => void
}

// The sheet's face without its window, for a front that stacks its own layers (the mini-app's routes): the surface,
// the grabber that closes it, and whatever goes inside.
export const SheetPanel = forwardRef<HTMLDivElement, SheetPanelProps>(
  ({ onClose, className, children, ...rest }, ref) => {
    const { labels } = useUi()

    return (
      <div ref={ref} tabIndex={-1} className={cx(styles.panel, className)} {...rest}>
        <button
          type="button"
          className={cx(styles.panelGrabber, styles.grabberMark)}
          aria-label={labels.close}
          onClick={onClose}
        />
        {children}
      </div>
    )
  },
)

SheetPanel.displayName = "SheetPanel"

interface SheetProps extends Omit<SheetHeaderProps, "onClose" | "grabber" | "className"> {
  open: boolean
  onClose: () => void
  children: ReactNode
  wide?: boolean
  prose?: boolean
}

export const Sheet = ({
  open,
  title,
  lead,
  onClose,
  children,
  subject,
  badge,
  actions,
  wide,
  prose,
}: SheetProps) => {
  const ref = useRef<HTMLDialogElement | null>(null)
  const timer = useRef(0)
  const pressedBackdrop = useRef(false)
  const [leaving, setLeaving] = useState(false)
  const [slot, setSlot] = useState<HTMLDivElement | null>(null)

  const requestClose = useCallback(() => {
    setLeaving(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(onClose, LEAVE_GUARD_MS)
  }, [onClose])

  const drag = useSheetDrag(open && !leaving, requestClose, SHEET_DRAWER)
  const dragRef = drag.ref
  const setRef = useCallback(
    (node: HTMLDialogElement | null) => {
      ref.current = node
      dragRef(node)
    },
    [dragRef],
  )

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      dialog.focus()
    }
    if (!open && dialog.open) dialog.close()
    setLeaving(false)
  }, [open])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    const cancel = (event: Event) => {
      event.preventDefault()
      requestClose()
    }

    dialog.addEventListener("cancel", cancel)
    return () => dialog.removeEventListener("cancel", cancel)
  }, [requestClose])

  // A modal dialog leaves the page scrollable under it; the count keeps the lock while sheets stack.
  useLayoutEffect(() => {
    if (!open) return
    const root = document.documentElement
    lockCount += 1
    if (lockCount === 1) {
      lockedStyle = LOCKED.map((name) => [root.style.getPropertyValue(name), root.style.getPropertyPriority(name)])
      // The bar's place, drawn or only kept by a stable gutter. clientWidth misses a gutter the page reserves while
      // its overflow is clipped (MTS), the root's own box does not.
      const bar = window.innerWidth - root.getBoundingClientRect().width
      const padding = parseFloat(getComputedStyle(root).paddingRight) || 0
      root.style.setProperty("overflow", "hidden")
      // The scrim covers the viewport, not a gutter, so the light strip showed beside it: the place goes to the
      // root's padding while the sheet is open and the page stays where it was.
      if (bar > 0) {
        root.style.setProperty("scrollbar-gutter", "auto")
        root.style.setProperty("padding-right", `${padding + bar}px`)
      }
    }
    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        LOCKED.forEach((name, index) => {
          const [value, priority] = lockedStyle[index]
          if (value) root.style.setProperty(name, value, priority)
          else root.style.removeProperty(name)
        })
      }
    }
  }, [open])

  return (
    <dialog
      ref={setRef}
      className={cx(styles.sheet, wide && styles.wide, prose && styles.prose)}
      aria-label={subject ? `${title} ${subject}` : title}
      tabIndex={-1}
      data-dragging={drag.dragging ? "" : undefined}
      data-leaving={leaving ? "" : undefined}
      // Only a live drag moves the sheet; let go, it eases back or, closing, slides on from there.
      style={drag.dragging ? ({ "--sheet-y": `${drag.offset}px` } as CSSProperties) : undefined}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === ref.current
        drag.handlers.onPointerDown(event)
      }}
      onPointerMove={drag.handlers.onPointerMove}
      onPointerUp={drag.handlers.onPointerUp}
      onPointerCancel={drag.handlers.onPointerCancel}
      onClick={(event) => {
        if (event.target === ref.current && pressedBackdrop.current) requestClose()
      }}
      onTransitionEnd={(event) => {
        // The scrim's fade ends on the dialog too; only the sheet's own transition means it has left.
        if (!leaving || event.target !== ref.current || event.pseudoElement) return
        window.clearTimeout(timer.current)
        onClose()
      }}
    >
      <SheetHeader
        title={title}
        lead={lead}
        subject={subject}
        badge={badge}
        actions={actions}
        onClose={requestClose}
      />
      <div className={styles.body}>
        <FooterSlot.Provider value={slot}>{children}</FooterSlot.Provider>
      </div>
      <div ref={setSlot} className={styles.footer} />
    </dialog>
  )
}
