import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import type { Tone } from "../../domain/tone"
import { cx } from "../../lib/cx"
import styles from "./IconButton.module.css"

export interface IconButtonLook {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?: "plain" | "secondary" | "primary"
  tone?: Extract<Tone, "red" | "yellow" | "green" | "accent">
}

// A link wears the same look without being a <button>.
export const iconButtonClass = ({ size = "md", variant = "plain", tone }: IconButtonLook, className?: string) =>
  cx(styles.button, styles[size], variant !== "plain" && styles[variant], tone && styles[tone], className)

const GLYPH = { xs: styles.glyphXs, sm: styles.glyphSm, md: styles.glyphMd }

// A glyph inside an IconButton, on the three steps the buttons use.
export const glyphClass = (size: keyof typeof GLYPH) => GLYPH[size]

interface IconButtonProps extends IconButtonLook, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string
  // A toggle: pressed, it holds the accent fill, under the pointer too.
  pressed?: boolean
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size, variant, tone, pressed, children, className, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      className={iconButtonClass({ size, variant, tone }, cx(pressed && styles.pressed, className))}
      {...rest}
    >
      {children}
    </button>
  ),
)

IconButton.displayName = "IconButton"
