import type { ReactNode } from "react"
import { BackToTop } from "../BackToTop/BackToTop"
import styles from "./SitePage.module.css"

interface SitePageProps {
  // The site's own SiteHeader and SiteFooter, with its logo and links.
  header: ReactNode
  footer: ReactNode
  title: ReactNode
  subtitle: ReactNode
  children: ReactNode
}

// The title block keeps one height on every site, so whatever the body starts with stands at the same place on each.
export const SitePage = ({ header, footer, title, subtitle, children }: SitePageProps) => (
  <div className={styles.shell}>
    {header}
    <main id="top" tabIndex={-1} className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      {children}
    </main>
    <BackToTop />
    {footer}
  </div>
)
