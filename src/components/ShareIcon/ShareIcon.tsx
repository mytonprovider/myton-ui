interface ShareIconProps {
  className?: string
}

// The curved arrow YouTube and Facebook share with, chosen over Android's three nodes and Apple's boxed arrow for
// all three fronts. Drawn on lucide's grid and stroke so it sits with the other icons; the path is Tabler's share-3
// (MIT, @tabler/icons 3.19.0).
export const ShareIcon = ({ className }: ShareIconProps) => (
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
    <path d="M13 4v4c-6.575 1.028-9.02 6.788-10 12-.037.206 5.384-5.962 10-6v4l8-7-8-7z" />
  </svg>
)
