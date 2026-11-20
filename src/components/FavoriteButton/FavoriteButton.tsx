import { Star } from "lucide-react"
import { cx } from "../../lib/cx"
import { IconButton, glyphClass } from "../IconButton/IconButton"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./FavoriteButton.module.css"

// The star a step under its button's glyph: lucide draws it denser than its neighbours, 15 × 14.3 px of ink at 18
// against the share's 13.5 × 12 and the copy's 10 × 12 at 16; at 16 the star's 13.3 × 12.7 stands level with them.
const STAR_GLYPH = { sm: "xs", md: "sm" } as const

interface FavoriteButtonProps {
  active: boolean
  label: string
  // A row's actions are sm, a sheet header's md.
  size: "sm" | "md"
  onToggle: () => void
  className?: string
}

export const FavoriteButton = ({ active, label, size, onToggle, className }: FavoriteButtonProps) => {
  const { onFeedback } = useUi()

  return (
    <IconButton
      size={size}
      label={label}
      aria-pressed={active}
      tone={active ? "accent" : undefined}
      className={cx(active && styles.active, className)}
      onClick={(event) => {
        event.stopPropagation()
        onFeedback?.()
        onToggle()
      }}
    >
      <Star className={glyphClass(STAR_GLYPH[size])} aria-hidden="true" />
    </IconButton>
  )
}
