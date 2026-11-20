import { useEffect, useState } from "react"
import { flushSync } from "react-dom"
import { reducedMotion } from "../lib/motion"
import { readLocal, writeLocal } from "../lib/storage"

type Theme = "dark" | "light"

const currentTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light")

const apply = (theme: Theme): void => {
  const root = document.documentElement
  root.setAttribute("data-theme-switching", "")
  root.setAttribute("data-theme", theme)
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-theme-switching")))

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta instanceof HTMLMetaElement) {
    meta.content = getComputedStyle(root).getPropertyValue("--bg").trim()
  }
}

const crossfade = (change: () => void): void => {
  if (reducedMotion() || typeof document.startViewTransition !== "function") {
    change()
    return
  }

  document.startViewTransition(change)
}

// A site's theme: the system's until the person picks one, dark when the system reports no preference, and the pick
// kept in the site's storage key. The first paint reads the same key in the site's index.html.
export const useSiteTheme = (storageKey: string): { dark: boolean; toggle: () => void } => {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  useEffect(() => {
    const scheme = window.matchMedia("(prefers-color-scheme: light)")

    const onScheme = () => {
      if (readLocal(storageKey)) return
      const next: Theme = scheme.matches ? "light" : "dark"
      apply(next)
      setTheme(next)
    }

    scheme.addEventListener("change", onScheme)
    return () => scheme.removeEventListener("change", onScheme)
  }, [storageKey])

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"

    writeLocal(storageKey, next)
    crossfade(() =>
      flushSync(() => {
        apply(next)
        setTheme(next)
      }),
    )
  }

  return { dark: theme === "dark", toggle }
}
