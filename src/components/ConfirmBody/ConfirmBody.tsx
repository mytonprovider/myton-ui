import type { ReactNode } from "react"
import { Button } from "../Button/Button"
import { Notice } from "../Notice/Notice"
import { SheetFooter } from "../Sheet/Sheet"
import styles from "./ConfirmBody.module.css"

interface ConfirmBodyProps {
  // What goes wrong if the person goes on, in red.
  alert?: string
  note?: ReactNode
  children?: ReactNode
  confirmLabel: string
  onConfirm: () => void
  // Closes the sheet around the body: confirming closes it, so no caller has to.
  close: () => void
}

// One action: the sheet's own close and a pull down already cancel.
export const ConfirmBody = ({ alert, note, children, confirmLabel, onConfirm, close }: ConfirmBodyProps) => (
  <>
    {alert && (
      <Notice tone="red" className={styles.alert}>
        {alert}
      </Notice>
    )}
    {note && <p className={styles.note}>{note}</p>}
    {children}
    <SheetFooter>
      <Button
        variant="danger"
        size="xl"
        onClick={() => {
          onConfirm()
          close()
        }}
      >
        {confirmLabel}
      </Button>
    </SheetFooter>
  </>
)
