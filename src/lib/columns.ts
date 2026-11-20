// Two columns of cards in their order, cut where the two come closest by rows: CSS columns balance by height too, but
// cannot stretch a column's last card to the common bottom, and a fixed half split cannot follow the cards' sizes
export const splitColumns = <T>(items: readonly T[], rows: (item: T) => number): [T[], T[]] => {
  const total = items.reduce((sum, item) => sum + rows(item), 0)
  let best = 0
  let bestGap = Infinity
  let left = 0
  for (let cut = 0; cut <= items.length; cut++) {
    const gap = Math.abs(total - 2 * left)
    if (gap < bestGap) {
      best = cut
      bestGap = gap
    }
    if (cut < items.length) left += rows(items[cut])
  }
  return [items.slice(0, best), items.slice(best)]
}
