import type { ComponentType } from "react"
import type { BrandIconProps } from "../BrandIcons/BrandIcons"
import styles from "./SiteFooter.module.css"

export interface FooterLink {
  label: string
  href: string
  icon: ComponentType<BrandIconProps>
}

// Every link leaves the site, so each opens in a new tab; on a phone only the icons stay, the label reads aloud.
export const SiteFooter = ({ links }: { links: FooterLink[] }) => (
  <footer className={styles.footer}>
    <nav className={styles.inner}>
      {links.map(({ label, href, icon: Icon }) => (
        <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={styles.link}>
          <Icon className={styles.icon} />
          <span className={styles.label}>{label}</span>
        </a>
      ))}
    </nav>
  </footer>
)
