import { describe, expect, it } from "vitest"
import { splitColumns } from "./columns"

describe("splitColumns", () => {
  it("cuts where the two columns come closest, keeping the order", () => {
    expect(splitColumns([12, 3, 3, 6, 6], (rows) => rows)).toEqual([
      [12, 3],
      [3, 6, 6],
    ])
  })

  it("keeps the first cut of two equally close ones", () => {
    expect(splitColumns([2, 2, 2, 2], (rows) => rows)).toEqual([
      [2, 2],
      [2, 2],
    ])
  })

  it("leaves one long card alone in its column", () => {
    expect(splitColumns([10, 1], (rows) => rows)).toEqual([[10], [1]])
    expect(splitColumns([], (rows: number) => rows)).toEqual([[], []])
  })
})
