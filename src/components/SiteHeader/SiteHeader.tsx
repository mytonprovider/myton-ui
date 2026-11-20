import type { MouseEvent, ReactNode } from "react"
import { Moon, Sun } from "lucide-react"
import { scrollToTop } from "../../lib/motion"
import type { Lang } from "../../locale"
import { cx } from "../../lib/cx"
import { IconButton, glyphClass } from "../IconButton/IconButton"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./SiteHeader.module.css"

interface SiteHeaderProps {
  title: string
  logo: string
  language: Lang
  onLanguage: (next: Lang) => void
  dark: boolean
  onToggleTheme: () => void
  // Sits before the language and theme buttons, as the storage site's wallet does.
  actions?: ReactNode
}

export const SiteHeader = ({ title, logo, language, onLanguage, dark, onToggleTheme, actions }: SiteHeaderProps) => {
  const { labels } = useUi()
  const next: Lang = language === "ru" ? "en" : "ru"

  const brandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    scrollToTop()
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="#top" onClick={brandClick} aria-label={title} className={styles.brand}>
          <img src={logo} alt="" width={36} height={36} className={styles.logo} />
          <span className={styles.title}>{title}</span>
        </a>

        <span className={styles.spacer} />

        {actions}

        <IconButton label={labels.language} size="lg" className={styles.language} onClick={() => onLanguage(next)}>
          {next.toUpperCase()}
        </IconButton>

        <IconButton label={labels.theme} size="lg" onClick={onToggleTheme}>
          {dark ? (
            <Sun className={cx(glyphClass("md"), styles.icon)} aria-hidden="true" />
          ) : (
            <Moon className={cx(glyphClass("md"), styles.icon)} aria-hidden="true" />
          )}
        </IconButton>
      </div>
    </header>
  )
}
