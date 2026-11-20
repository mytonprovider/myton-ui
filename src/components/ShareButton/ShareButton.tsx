import { Check } from "lucide-react"
import { IconButton, glyphClass } from "../IconButton/IconButton"
import { useUi } from "../UiProvider/UiProvider"
import { ShareIcon } from "../ShareIcon/ShareIcon"

interface ShareButtonProps {
  label: string
  size: "sm" | "md"
  // The link went to the clipboard where no share sheet was there to take it; the check confirms it.
  shared?: boolean
  onShare: () => void
  className?: string
}

export const ShareButton = ({ label, size, shared = false, onShare, className }: ShareButtonProps) => {
  const { onFeedback } = useUi()

  return (
    <IconButton
      size={size}
      label={label}
      className={className}
      onClick={(event) => {
        event.stopPropagation()
        onFeedback?.()
        onShare()
      }}
    >
      {shared ? <Check className={glyphClass(size)} aria-hidden="true" /> : <ShareIcon className={glyphClass(size)} />}
    </IconButton>
  )
}
