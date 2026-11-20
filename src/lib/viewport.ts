// How close a floating panel may come to the screen's edge: the page's own side gutter on a phone (--space-6), so a
// hint or a menu lines up with the cards under it instead of standing closer to the edge than they do.
export const VIEWPORT_EDGE = 16

export const clampToViewport = (left: number, width: number): number =>
  Math.min(Math.max(left, VIEWPORT_EDGE), window.innerWidth - width - VIEWPORT_EDGE)
