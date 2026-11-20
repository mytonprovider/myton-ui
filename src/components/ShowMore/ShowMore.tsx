import { fill } from "../../locale"
import { Button, buttonClass } from "../Button/Button"
import { skeletonClass } from "../Skeleton/Skeleton"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./ShowMore.module.css"

interface ShowMoreProps {
  shown: number
  total: number
  onMore: () => void
  // The last visit's counts while the list loads, so the end of the list holds its place
  loading?: boolean
}

// The end of a paged list: how much of it is out, and the next page while there is one
export const ShowMore = ({ shown, total, onMore, loading = false }: ShowMoreProps) => {
  const { labels } = useUi()
  const text = fill(labels.showing, { shown, total })

  if (loading) {
    return (
      <div className={styles.more} aria-hidden="true">
        <span className={skeletonClass(styles.showing)}>{text}</span>
        {shown < total && <span className={buttonClass({}, skeletonClass(undefined, true))}>{labels.loadMore}</span>}
      </div>
    )
  }

  return (
    <div className={styles.more}>
      <span className={styles.showing} role="status">
        {text}
      </span>
      {shown < total && <Button onClick={onMore}>{labels.loadMore}</Button>}
    </div>
  )
}
