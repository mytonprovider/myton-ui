import type { CSSProperties } from "react"
import { cx } from "../../lib/cx"
import styles from "./Skeleton.module.css"

interface SkeletonProps {
  width?: CSSProperties["width"]
  height?: CSSProperties["height"]
  round?: boolean
  className?: string
}

// The shape for a front's own placeholder element, sized by the front as the real one is: a text-shaped stand-in
// keeps its sample text for the width and hides it.
export const skeletonClass = (className?: string, round?: boolean) => cx(styles.shape, round && styles.round, className)

export const Skeleton = ({ width, height, round, className }: SkeletonProps) => (
  <span aria-hidden="true" className={skeletonClass(className, round)} style={{ width, height }} />
)

// A number's stand-in: the sample a formatter gives, set in the row's own type and hidden, so it takes the value's
// width; `vary` lets a row of placeholders differ in length the way real values do.
export const GhostValue = ({ sample, vary, className }: { sample: string; vary?: boolean; className?: string }) => (
  <span aria-hidden="true" className={skeletonClass(cx(styles.ghostValue, vary && styles.ghostVary, className))}>
    {sample}
  </span>
)

// An icon's stand-in: a round of the glyph's size, inside the box of the control that holds it.
export const GhostGlyph = ({ size = "xs" }: { size?: "xs" | "sm" }) => {
  const side = size === "sm" ? "var(--icon-control)" : "var(--icon-sm)"
  return <Skeleton round width={side} height={side} />
}

export const GhostIcon = ({ size = "xs", className }: { size?: "xs" | "sm"; className?: string }) => (
  <span aria-hidden="true" className={cx(styles.ghostBox, styles[size], className)}>
    <GhostGlyph size={size} />
  </span>
)
