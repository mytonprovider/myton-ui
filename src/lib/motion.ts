export const reducedMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches

// A duration token as an animation call takes it: --dur-* are written in s or ms
export const toMs = (time: string): number => (time.trim().endsWith("ms") ? parseFloat(time) : parseFloat(time) * 1000)

export const scrollToTop = (top = 0): void => {
  window.scrollTo({ top, behavior: reducedMotion() ? "auto" : "smooth" })
}
