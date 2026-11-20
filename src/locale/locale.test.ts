import { describe, expect, it } from "vitest"
import { STATE_TONE, formatDuration } from "../domain"
import { REASON } from "../domain/checks"
import { durationParts, formatAgo } from "../domain/time"
import { fill, locales, reasonKey, words } from "."
import { en } from "./en"
import { ru } from "./ru"

// Every leaf path with the arity of a plural, so a missing key or a missing form shows by name
const paths = (node: unknown, prefix = ""): string[] =>
  Array.isArray(node)
    ? [`${prefix}[${node.length}]`]
    : typeof node === "object" && node !== null
      ? Object.entries(node).flatMap(([key, value]) => paths(value, prefix ? `${prefix}.${key}` : key))
      : [prefix]

const DAY = 86400

describe("locale", () => {
  it("has the same keys in Russian and English", () => {
    expect(paths(en)).toEqual(paths(ru))
  })

  it("names every upstream code and every provider state", () => {
    for (const locale of Object.values(locales)) {
      for (const code of Object.values(REASON)) {
        expect(locale.reason[`${code}`]).toBeTruthy()
      }
      for (const state of Object.keys(STATE_TONE)) expect(locale.status).toHaveProperty(state)
    }
  })

  it("puts the code after every reason but the pass and no checks", () => {
    for (const locale of Object.values(locales)) {
      for (const code of Object.values(REASON)) {
        const text = fill(locale.reason[`${code}`], { code: String(code) })
        expect(text.endsWith(` (${code})`)).toBe(code !== REASON.ValidStorageProof)
      }
      expect(fill(locale.reason.unknown, { code: "999" })).toMatch(/ \(999\)$/)
      expect(locale.reason.none).not.toMatch(/\(/)
    }
  })

  it("keeps the chosen words for the states and the copy button", () => {
    expect(ru.status).toMatchObject({ unavailable: "Недоступен", notStored: "Не хранит", noProofs: "Нет пруфов" })
    expect(ru.ui.copy).toBe("Скопировать")
  })
})

describe("reasonKey", () => {
  it("names a known code by itself, a new one as unknown and no checks as none", () => {
    expect(reasonKey(REASON.ValidStorageProof)).toBe("0")
    expect(reasonKey(401)).toBe("401")
    expect(reasonKey(999)).toBe("unknown")
    expect(reasonKey(null)).toBe("none")
  })
})

describe("fill", () => {
  it("puts the values into the i18next placeholders", () => {
    expect(fill(ru.ui.rangeFrom, { label: "Рейтинг" })).toBe("Рейтинг, от")
    expect(fill(en.ui.showing, { shown: 20, total: 147 })).toBe("Showing 20 of 147")
    expect(fill(ru.reason.unknown, { code: 999 })).toBe("Неизвестная причина (999)")
  })

  it("leaves a placeholder with no value in sight", () => {
    expect(fill(ru.ui.sortColumn, {})).toBe("Сортировать по {{label}}")
  })
})

describe("words", () => {
  const ruShort = (seconds: number) => formatDuration(durationParts(seconds), words.ru.duration)
  const ruLong = (seconds: number) => formatDuration(durationParts(seconds, { maxParts: 1 }), words.ru.durationLong)
  const enShort = (seconds: number) => formatDuration(durationParts(seconds), words.en.duration)
  const enLong = (seconds: number) => formatDuration(durationParts(seconds, { maxParts: 1 }), words.en.durationLong)

  it.each([
    [59.4, "59 сек"],
    [3660, "1 ч 1 мин"],
    [400 * DAY, "1 г 35 дн"],
  ])("prints %d seconds as %s with the short words of §3.5", (seconds, text) => {
    expect(ruShort(seconds)).toBe(text)
  })

  it("prints the short English units without a plural", () => {
    expect(enShort(DAY)).toBe("1 d")
    expect(enShort(2 * DAY + 3 * 3600)).toBe("2 d 3 hr")
  })

  it.each([
    [DAY, "1 день"],
    [2 * DAY, "2 дня"],
    [5 * DAY, "5 дней"],
    [11 * DAY, "11 дней"],
    [21 * DAY, "21 день"],
    [22 * 3600, "22 часа"],
    [5 * 60, "5 минут"],
    [2 * 365 * DAY, "2 года"],
    [5 * 365 * DAY, "5 лет"],
  ])("declines the long Russian unit: %d seconds is %s", (seconds, text) => {
    expect(ruLong(seconds)).toBe(text)
  })

  it("declines the long English unit", () => {
    expect(enLong(DAY)).toBe("1 day")
    expect(enLong(2 * DAY)).toBe("2 days")
    expect(enLong(1)).toBe("1 second")
  })

  it("says just now and ago in both languages", () => {
    expect(formatAgo(990, 1000, words.ru.ago)).toBe("Только что")
    expect(formatAgo(1000 + 3 * 3600 + 720, 1000, words.ru.ago)).toBe("3 ч 12 мин назад")
    expect(formatAgo(1000 + 3 * 3600 + 720, 1000, words.en.ago)).toBe("3 hr 12 min ago")
    expect(formatAgo(1060, 1000, words.en.ago)).toBe("1 min ago")
  })
})
