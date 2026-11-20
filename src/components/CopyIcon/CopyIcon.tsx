interface CopyIconProps {
  className?: string
}

// Two upright sheets, as iOS (doc.on.doc) and Material (content_copy) draw copy: lucide's two squares came out wider
// than the icons beside it. Drawn on lucide's grid and stroke.
export const CopyIcon = ({ className }: CopyIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="7" width="11" height="14" rx="2" />
    <path d="M5 16V5a2 2 0 0 1 2-2h8" />
  </svg>
)
