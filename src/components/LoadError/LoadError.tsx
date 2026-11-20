import { Button } from "../Button/Button"
import { EmptyState } from "../EmptyState/EmptyState"
import { useUi } from "../UiProvider/UiProvider"

interface LoadErrorProps {
  message: string
  // The HTTP status of the failed request, set under the message; null when the request never got an answer.
  status?: number | null
  onRetry: () => void
  // `md` takes the place of a site's rows, `lg` a mini app's screen.
  size?: "md" | "lg"
  className?: string
}

export const LoadError = ({ message, status = null, onRetry, size = "md", className }: LoadErrorProps) => {
  const { labels } = useUi()
  return (
    <EmptyState
      role="alert"
      size={size}
      title={message}
      code={status !== null ? `HTTP ${status}` : undefined}
      action={
        <Button variant="text" tone="accent" onClick={onRetry}>
          {labels.retry}
        </Button>
      }
      className={className}
    />
  )
}
