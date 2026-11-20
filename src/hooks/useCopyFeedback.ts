import { useCallback, useEffect, useRef, useState } from "react"
import { copyText } from "../lib/clipboard"

// One duration for every front
const COPIED_MS = 1200

export interface CopyFeedback {
  // The value copied last, while its mark is on; a list of copy buttons compares it with its own value
  copied: string | null
  copy: (value: string) => Promise<boolean>
}

export const useCopyFeedback = (ms = COPIED_MS): CopyFeedback => {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(
    async (value: string) => {
      const done = await copyText(value)
      if (done) {
        setCopied(value)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(null), ms)
      }
      return done
    },
    [ms],
  )

  return { copied, copy }
}
