import { Check } from "lucide-react"
import { CopyIcon } from "../CopyIcon/CopyIcon"
import { IconButton, glyphClass } from "../IconButton/IconButton"
import { useUi } from "../UiProvider/UiProvider"

interface CopyButtonProps {
  value: string
  // The app owns the clipboard and how long "copied" shows; useCopyFeedback keeps both.
  copied: boolean
  onCopy: (value: string) => void
  label?: string
  // A row or a header sets its copy at its other buttons' size.
  size?: "xs" | "sm" | "md"
  className?: string
}

export const CopyButton = ({ value, copied, onCopy, label, size = "xs", className }: CopyButtonProps) => {
  const { labels, onFeedback } = useUi()

  return (
    <IconButton
      size={size}
      label={copied ? labels.copied : (label ?? labels.copy)}
      tone={copied ? "green" : undefined}
      className={className}
      onClick={(event) => {
        event.stopPropagation()
        onFeedback?.()
        onCopy(value)
      }}
    >
      {copied ? <Check className={glyphClass(size)} aria-hidden="true" /> : <CopyIcon className={glyphClass(size)} />}
    </IconButton>
  )
}
