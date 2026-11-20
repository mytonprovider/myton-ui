import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { cx } from "../../lib/cx"
import { scrollToTop } from "../../lib/motion"
import { IconButton, glyphClass } from "../IconButton/IconButton"
import { useUi } from "../UiProvider/UiProvider"
import styles from "./BackToTop.module.css"

const SHOW_AFTER_PX = 320
// Leaves before the footer comes in, so it never sits on the footer's links.
const FOOTER_AHEAD_PX = 240

// The element that takes focus at the top, so the keyboard lands where the eye does
const TARGET = "top"

export const BackToTop = () => {
  const { labels } = useUi()
  const [scrolled, setScrolled] = useState(false)
  const [footerNear, setFooterNear] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SHOW_AFTER_PX)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const footer = document.querySelector("footer")
    if (!footer) return
    const observer = new IntersectionObserver(([entry]) => setFooterNear(entry?.isIntersecting ?? false), {
      rootMargin: `0px 0px ${FOOTER_AHEAD_PX}px`,
    })
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  const shown = scrolled && !footerNear

  return (
    <IconButton
      label={labels.goUp}
      variant="primary"
      size="xl"
      aria-hidden={shown ? undefined : true}
      tabIndex={shown ? undefined : -1}
      className={cx(styles.button, shown && styles.shown)}
      onClick={() => {
        scrollToTop()
        document.getElementById(TARGET)?.focus({ preventScroll: true })
      }}
    >
      <ArrowUp className={glyphClass("md")} aria-hidden="true" />
    </IconButton>
  )
}
