import { Search, X } from "lucide-react"
import { forwardRef, useImperativeHandle, useRef, type InputHTMLAttributes } from "react"
import { cx } from "../../lib/cx"
import { IconButton, glyphClass } from "../IconButton/IconButton"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./SearchField.module.css"

interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className" | "placeholder" | "size"> {
  value: string
  onChange: (value: string) => void
  // The placeholder and the accessible name: the field has no visible label.
  label: string
  // The clear button only: emptying the field by typing does not call it.
  onClear?: () => void
  invalid?: boolean
  // md matches the 40px controls of a dense toolbar; lg is the page's own search
  size?: "md" | "lg"
  className?: string
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ value, onChange, label, onClear, invalid, size = "lg", className, ...rest }, ref) => {
    const { labels } = useUi()
    const inputRef = useRef<HTMLInputElement>(null)
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    return (
      <div className={cx(styles.field, size === "md" && styles.md, className)}>
        <Search aria-hidden="true" className={styles.icon} />
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          className={cx(styles.input, invalid && styles.invalid)}
          value={value}
          placeholder={label}
          aria-label={label}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          {...rest}
        />
        {value && (
          <IconButton
            size="sm"
            label={labels.clear}
            className={styles.clear}
            onClick={() => {
              onChange("")
              onClear?.()
              inputRef.current?.focus()
            }}
          >
            <X aria-hidden="true" className={glyphClass(size === "md" ? "sm" : "md")} />
          </IconButton>
        )}
      </div>
    )
  },
)

SearchField.displayName = "SearchField"
