import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { cx } from "../../lib/cx"
import styles from "./TextField.module.css"

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className"> {
  value: string
  onChange: (value: string) => void
  leading?: ReactNode
  trailing?: ReactNode
  // A length counter such as "22 / 100", set small in fixed-width digits after the input.
  counter?: string
  invalid?: boolean
  className?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ value, onChange, leading, trailing, counter, invalid, className, type = "text", ...rest }, ref) => (
    <div className={cx(styles.field, invalid && styles.invalid, className)}>
      {leading}
      <input
        ref={ref}
        type={type}
        className={styles.input}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      />
      {counter !== undefined && <span className={styles.counter}>{counter}</span>}
      {trailing}
    </div>
  ),
)

TextField.displayName = "TextField"
