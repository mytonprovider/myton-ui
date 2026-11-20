import { forwardRef, type ButtonHTMLAttributes } from "react"
import type { Tone } from "../../domain/tone"
import { cx } from "../../lib/cx"
import styles from "./Button.module.css"

interface ButtonLook {
  variant?: "primary" | "secondary" | "danger" | "text"
  size?: "sm" | "md" | "xl"
  tone?: Extract<Tone, "accent" | "red">
  block?: boolean
}

// A text button defaults to sm: the 32px row action.
const defaultSize = (variant: ButtonLook["variant"]) => (variant === "text" ? "sm" : "md")

// Links and file-input labels wear the same look without being a <button>.
export const buttonClass = ({ variant = "secondary", size = defaultSize(variant), tone, block }: ButtonLook, className?: string) =>
  cx(styles.button, styles[size], styles[variant], tone && styles[`${tone}Tone`], block && styles.block, className)

type ButtonProps = ButtonLook & ButtonHTMLAttributes<HTMLButtonElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, tone, block, className, type = "button", ...rest }, ref) => (
    <button ref={ref} type={type} className={buttonClass({ variant, size, tone, block }, className)} {...rest} />
  ),
)

Button.displayName = "Button"
