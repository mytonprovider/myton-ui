import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"

// An icon slot takes a component, not an element, so the package sets its size. A lucide icon is named on its own:
// the tab dock passes it `fill`, which a front's own glyph type does not take.
export type Glyph = ComponentType<{ className?: string; "aria-hidden"?: "true" }> | LucideIcon
