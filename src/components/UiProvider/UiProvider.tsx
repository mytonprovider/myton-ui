import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Locale } from "../../locale"
import { ru } from "../../locale/ru"

export type UiLabels = Locale["ui"]

export interface Ui {
  labels: UiLabels
  // The platform's haptic tick; the package does not know about Telegram
  onFeedback?: () => void
}

const UiContext = createContext<Ui>({ labels: ru.ui })

interface UiProviderProps {
  labels?: UiLabels
  onFeedback?: () => void
  children: ReactNode
}

export const UiProvider = ({ labels = ru.ui, onFeedback, children }: UiProviderProps) => {
  const ui = useMemo(() => ({ labels, onFeedback }), [labels, onFeedback])
  return <UiContext.Provider value={ui}>{children}</UiContext.Provider>
}

export const useUi = (): Ui => useContext(UiContext)
