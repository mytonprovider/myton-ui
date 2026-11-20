import type { StatusTone } from "../../domain/tone"
import { Badge } from "../Badge/Badge"
import { skeletonClass } from "../Skeleton/Skeleton"
import styles from "./CheckRatio.module.css"

interface CheckRatioProps {
  passed: number
  total: number
  tone: StatusTone
  // Both plates as shapes, sized by the numbers passed.
  loading?: boolean
}

// Two of the package's plates, not a counter of its own: beside a status plate in the same column it reads as its
// neighbour.
export const CheckRatio = ({ passed, total, tone, loading }: CheckRatioProps) => {
  const shape = loading ? skeletonClass() : undefined
  return (
    <span aria-hidden={loading ? "true" : undefined} className={styles.ratio}>
      <Badge tone={tone} size="sm" className={shape}>
        {passed}
      </Badge>
      <span className={styles.slash}>/</span>
      <Badge tone="gray" size="sm" className={shape}>
        {total}
      </Badge>
    </span>
  )
}
