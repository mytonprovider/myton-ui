import { describe, expect, it } from "vitest"
import {
  ago,
  durationParts,
  formatAgo,
  formatDuration,
  JUST_NOW_SEC,
  pluralIndexEn,
  pluralIndexRu,
  type AgoWords,
  type PluralForms,
} from "./time"

const same = (word: string): PluralForms => [word, word, word]

// The short words: Russian abbreviations do not decline
const ru: AgoWords = {
  units: { second: same("сек"), minute: same("мин"), hour: same("ч"), day: same("дн"), year: same("г") },
  plural: pluralIndexRu,
  justNow: "Только что",
  ago: (time) => `${time} назад`,
}

const en: AgoWords = {
  units: { second: same("sec"), minute: same("min"), hour: same("hr"), day: same("d"), year: same("y") },
  plural: pluralIndexEn,
  justNow: "Just now",
  ago: (time) => `${time} ago`,
}

const DAY = 86400
const ruTime = (seconds: number | null | undefined) => formatDuration(durationParts(seconds), ru)

describe("durationParts", () => {
  it("hands back values and unit keys, no words", () => {
    expect(durationParts(3660)).toEqual([
      { value: 1, unit: "hour" },
      { value: 1, unit: "minute" },
    ])
    expect(durationParts(400 * DAY)).toEqual([
      { value: 1, unit: "year" },
      { value: 35, unit: "day" },
    ])
    expect(durationParts(45)).toEqual([{ value: 45, unit: "second" }])
  })

  it("keeps only the largest unit when one part is asked for", () => {
    expect(durationParts(23 * DAY + 4 * 3600, { maxParts: 1 })).toEqual([{ value: 23, unit: "day" }])
    expect(durationParts(45, { maxParts: 1 })).toEqual([{ value: 45, unit: "second" }])
  })

  it("clamps a negative duration to zero seconds", () => {
    expect(durationParts(0)).toEqual([{ value: 0, unit: "second" }])
    expect(durationParts(-5)).toEqual([{ value: 0, unit: "second" }])
    expect(durationParts(-50)).toEqual([{ value: 0, unit: "second" }])
  })

  it("has nothing for a missing or broken value", () => {
    expect(durationParts(null)).toBe(null)
    expect(durationParts(undefined)).toBe(null)
    expect(durationParts(Number.NaN)).toBe(null)
    expect(durationParts(Number.POSITIVE_INFINITY)).toBe(null)
  })
})

describe("formatDuration", () => {
  it.each([
    [-5, "0 сек"],
    [59.4, "59 сек"],
    [59.6, "1 мин"],
    [60, "1 мин"],
    [61, "1 мин"],
    [3599, "59 мин"],
    [3600, "1 ч"],
    [3660, "1 ч 1 мин"],
    [86399, "23 ч 59 мин"],
    [86400, "1 дн"],
    [90061, "1 дн 1 ч"],
    [8 * DAY + 3 * 3600, "8 дн 3 ч"],
    [27064916, "313 дн 6 ч"],
    [365 * DAY, "1 г"],
    [400 * DAY, "1 г 35 дн"],
    [735 * DAY, "2 г 5 дн"],
  ])("prints %d seconds as %s, as the spec table reads", (seconds, text) => {
    expect(ruTime(seconds)).toBe(text)
  })

  it("has nothing to print for a missing value", () => {
    expect(ruTime(null)).toBe(null)
    expect(ruTime(Number.NaN)).toBe(null)
    expect(formatDuration(null, ru)).toBe(null)
  })
})

describe("plural index", () => {
  it.each([
    [0, 2],
    [1, 0],
    [2, 1],
    [4, 1],
    [5, 2],
    [11, 2],
    [12, 2],
    [14, 2],
    [21, 0],
    [22, 1],
    [25, 2],
    [101, 0],
    [111, 2],
    [112, 2],
    [122, 1],
  ])("reads %i in Russian as form %i", (count, form) => {
    expect(pluralIndexRu(count)).toBe(form)
  })

  it("reads English as one and the rest", () => {
    expect(pluralIndexEn(1)).toBe(0)
    expect(pluralIndexEn(0)).toBe(2)
    expect(pluralIndexEn(2)).toBe(2)
    expect(pluralIndexEn(11)).toBe(2)
    expect(pluralIndexEn(21)).toBe(2)
    expect(pluralIndexEn(101)).toBe(2)
  })
})

describe("ago", () => {
  const then = 1785545100

  it("calls the last minute just now, a negative age included", () => {
    expect(ago(990, 1000)).toEqual({ justNow: true })
    expect(ago(then, then)).toEqual({ justNow: true })
    expect(ago(then + JUST_NOW_SEC - 1, then)).toEqual({ justNow: true })
    expect(ago(then - 30, then)).toEqual({ justNow: true })
  })

  it("counts once there is something to count", () => {
    expect(ago(then + 60, then)).toEqual({ justNow: false, parts: [{ value: 1, unit: "minute" }] })
    expect(ago(1000 + 3 * 3600 + 720, 1000)).toEqual({
      justNow: false,
      parts: [
        { value: 3, unit: "hour" },
        { value: 12, unit: "minute" },
      ],
    })
  })

  it("has nothing for a moment that never came", () => {
    expect(ago(then, null)).toBe(null)
    expect(ago(then, undefined)).toBe(null)
    expect(ago(then, 0)).toBe(null)
    expect(ago(then, -1)).toBe(null)
    expect(ago(then, Number.NaN)).toBe(null)
    expect(ago(Number.NaN, then)).toBe(null)
  })
})

describe("formatAgo", () => {
  const then = 1785545100

  it("says just now under a minute and two parts above", () => {
    expect(formatAgo(990, 1000, ru)).toBe("Только что")
    expect(formatAgo(then + 59, then, en)).toBe("Just now")
    expect(formatAgo(1000 + 3 * 3600 + 720, 1000, ru)).toBe("3 ч 12 мин назад")
    expect(formatAgo(then + 120, then, en)).toBe("2 min ago")
  })

  it("leaves the empty value to the front", () => {
    expect(formatAgo(then, null, ru)).toBe(null)
    expect(formatAgo(then, 0, ru)).toBe(null)
  })
})
