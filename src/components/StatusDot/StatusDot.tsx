import styles from "./StatusDot.module.css"

interface StatusDotProps {
  color: string
  size: number
}

export const StatusDot = ({ color, size }: StatusDotProps) => (
  <span className={styles.dot} style={{ width: size, height: size, background: color }} aria-hidden="true" />
)
