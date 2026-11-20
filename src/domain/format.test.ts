import { describe, expect, it } from "vitest"
import { words } from "../locale"
import { durationParts, formatDuration } from "./time"
import {
  countryLabel,
  fitKey,
  fmt as defaultFmt,
  formatBytes,
  formatDiskSpeed,
  formatMbits,
  formatNumber,
  formatPercent,
  formatPing,
  formatTon,
  formatSpace,
  groupDigits,
  parseDiskSpeed,
  shortKey,
  shortText,
  shortenMiddle,
  spacePair,
  withEmpty,
} from "./format"

const KB = 1024
const MB = 1024 ** 2
const GB = 1024 ** 3
const TB = 1024 ** 4
const HEX64 = "3a65231e59031a3a0c6f363030712730".repeat(2)

describe("formatNumber", () => {
  it("rounds to the digits and drops trailing zeros", () => {
    expect(formatNumber(4.5678, 2)).toBe("4.57")
    expect(formatNumber(4.5, 2)).toBe("4.5")
    expect(formatNumber(4, 2)).toBe("4")
    expect(formatNumber(1234.5, 0)).toBe("1235")
    expect(formatNumber(10.002432, 2)).toBe("10")
    expect(formatNumber(20.415426, 2)).toBe("20.42")
    expect(formatNumber(163.59, 0)).toBe("164")
    expect(formatNumber(0.999, 2)).toBe("1")
  })

  it("prints zero and a negative that rounds to zero without a sign", () => {
    expect(formatNumber(0, 2)).toBe("0")
    expect(formatNumber(-0.004, 2)).toBe("0")
    expect(formatNumber(-1.5, 2)).toBe("-1.5")
  })

  it("has nothing to show for a missing or infinite value", () => {
    expect(formatNumber(null, 2)).toBe(null)
    expect(formatNumber(undefined, 2)).toBe(null)
    expect(formatNumber(Number.NaN, 2)).toBe(null)
    expect(formatNumber(Number.POSITIVE_INFINITY, 2)).toBe(null)
    expect(formatNumber(Number.NEGATIVE_INFINITY, 2)).toBe(null)
  })
})

describe("groupDigits", () => {
  it("puts a thin space between thousands", () => {
    expect(groupDigits(0)).toBe("0")
    expect(groupDigits(999)).toBe("999")
    expect(groupDigits(1000)).toBe("1\u2009000")
    expect(groupDigits(1023)).toBe("1\u2009023")
    expect(groupDigits(1234567)).toBe("1\u2009234\u2009567")
    expect(groupDigits(-1234)).toBe("-1\u2009234")
  })

  it("groups only the whole part of a fraction", () => {
    expect(groupDigits(1234.5678)).toBe("1\u2009235")
    expect(groupDigits(1234.5678, 2)).toBe("1\u2009234.57")
    expect(groupDigits(1234.5678, 4)).toBe("1\u2009234.5678")
  })

  it("has nothing to show for a missing value", () => {
    expect(groupDigits(null)).toBe(null)
    expect(groupDigits(undefined)).toBe(null)
    expect(groupDigits(Number.NaN)).toBe(null)
  })
})

describe("formatPercent", () => {
  it("defaults to two digits and appends the sign", () => {
    expect(formatPercent(99.5)).toBe("99.5%")
    expect(formatPercent(99.999)).toBe("100%")
    expect(formatPercent(100)).toBe("100%")
    expect(formatPercent(0)).toBe("0%")
    expect(formatPercent(-1)).toBe("-1%")
    expect(formatPercent(99.717606)).toBe("99.72%")
    expect(formatPercent(99.77, 1)).toBe("99.8%")
  })

  it("has nothing to show for a missing value", () => {
    expect(formatPercent(null)).toBe(null)
    expect(formatPercent(undefined)).toBe(null)
    expect(formatPercent(Number.NaN)).toBe(null)
  })
})

describe("formatBytes rounding down", () => {
  it("prints a limit below what it allows, so the bag cap never reads as the impossible 4 GB", () => {
    expect(formatBytes(4 * 1024 ** 3 - 4 * 1024 ** 2, "down")).toBe("3.99 GB")
    expect(formatBytes(4 * 1024 ** 3 - 4 * 1024 ** 2)).toBe("4 GB")
    expect(formatBytes(4 * 1024 ** 3, "down")).toBe("4 GB")
    expect(formatBytes(1023.999 * 1024 ** 2, "down")).toBe("1023 MB")
  })
})

describe("formatTon", () => {
  it("prints nanotons as GRAM with two digits and no unit", () => {
    expect(formatTon(0)).toBe("0")
    expect(formatTon(4_999_000)).toBe("0")
    expect(formatTon(123_456_789)).toBe("0.12")
    expect(formatTon(1_000_000_000)).toBe("1")
    expect(formatTon(2_345_678_901)).toBe("2.35")
    expect(formatTon(10_000_000_000)).toBe("10")
  })

  it("takes the digits a place asks for, a contract payment its three", () => {
    expect(formatTon(501_000_000, 3)).toBe("0.501")
    expect(formatTon(501_000_000)).toBe("0.5")
  })

  it("keeps the sign of a negative price instead of hiding it", () => {
    expect(formatTon(-1_000_000_000)).toBe("-1")
  })

  it("has nothing to show for a missing value", () => {
    expect(formatTon(null)).toBe(null)
    expect(formatTon(undefined)).toBe(null)
    expect(formatTon(Number.NaN)).toBe(null)
  })
})

describe("formatBytes", () => {
  it("steps by 1024 and labels the steps in Latin", () => {
    expect(formatBytes(1)).toBe("1 B")
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1024)).toBe("1 KB")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(MB)).toBe("1 MB")
    expect(formatBytes(96 * MB)).toBe("96 MB")
    expect(formatBytes(4 * GB)).toBe("4 GB")
    expect(formatBytes(4.28e9)).toBe("3.99 GB")
    expect(formatBytes(4284481536)).toBe("3.99 GB")
    expect(formatBytes(17.18e9)).toBe("16 GB")
    expect(formatBytes(TB)).toBe("1 TB")
    expect(formatBytes(2700 * GB)).toBe("2.64 TB")
    expect(formatBytes(14000 * GB)).toBe("13.67 TB")
  })

  it("drops the fraction from a thousand in the current unit", () => {
    expect(formatBytes(999)).toBe("999 B")
    expect(formatBytes(1000)).toBe("1000 B")
    expect(formatBytes(1023)).toBe("1023 B")
    expect(formatBytes(999.5 * KB)).toBe("999.5 KB")
    expect(formatBytes(1023 * KB)).toBe("1023 KB")
    expect(formatBytes(1048575)).toBe("1024 KB")
  })

  it("stops at TB", () => {
    expect(formatBytes(5 * TB)).toBe("5 TB")
    expect(formatBytes(1234.56 * TB)).toBe("1235 TB")
    expect(formatBytes(1024 ** 5)).toBe("1024 TB")
  })

  it("has nothing to show for zero, negatives and missing values", () => {
    expect(formatBytes(0)).toBe(null)
    expect(formatBytes(-5)).toBe(null)
    expect(formatBytes(null)).toBe(null)
    expect(formatBytes(undefined)).toBe(null)
    expect(formatBytes(Number.NaN)).toBe(null)
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe(null)
  })
})

describe("formatSpace", () => {
  it("keeps disk and RAM in gigabytes, the way the installer asks for them", () => {
    expect(formatSpace(512 * MB)).toBe("512 MB")
    expect(formatSpace(1.5 * GB)).toBe("1.5 GB")
    expect(formatSpace(4.01e9)).toBe("3.73 GB")
    expect(formatSpace(512.5 * GB)).toBe("512.5 GB")
    expect(formatSpace(1500 * GB)).toBe("1500 GB")
    expect(formatSpace(3689 * GB)).toBe("3689 GB")
    expect(formatSpace(14000 * GB)).toBe("14000 GB")
    expect(formatSpace(5 * TB)).toBe("5120 GB")
  })

  it("drops the fraction from a thousand up", () => {
    expect(formatSpace(999)).toBe("999 B")
    expect(formatSpace(1000)).toBe("1000 B")
    expect(formatSpace(1023)).toBe("1023 B")
    expect(formatSpace(1024)).toBe("1 KB")
    expect(formatSpace(999.5 * GB)).toBe("999.5 GB")
    expect(formatSpace(1000 * GB)).toBe("1000 GB")
  })

  it("shows a full disk's zero free space as a value", () => {
    expect(formatSpace(0)).toBe("0 B")
  })

  it("has nothing to show for negatives and missing values", () => {
    expect(formatSpace(-1)).toBe(null)
    expect(formatSpace(null)).toBe(null)
    expect(formatSpace(undefined)).toBe(null)
    expect(formatSpace(Number.NaN)).toBe(null)
  })
})

describe("spacePair", () => {
  it("puts both halves on the scale of the total", () => {
    expect(spacePair(1844 * GB, 3689 * GB)).toEqual({ used: "1844", total: "3689", unit: "GB" })
    expect(spacePair(3656.41 * GB, 3820 * GB)).toEqual({ used: "3656", total: "3820", unit: "GB" })
    expect(spacePair(3689.28 * GB, 14000 * GB)).toEqual({ used: "3689", total: "14000", unit: "GB" })
    expect(spacePair(1.5 * GB, 100 * GB)).toEqual({ used: "1.5", total: "100", unit: "GB" })
    expect(spacePair(8 * GB, 16 * GB)).toEqual({ used: "8", total: "16", unit: "GB" })
    expect(spacePair(100 * MB, 512 * MB)).toEqual({ used: "100", total: "512", unit: "MB" })
    expect(spacePair(1023, 1023)).toEqual({ used: "1023", total: "1023", unit: "B" })
    expect(spacePair(1024, 1024)).toEqual({ used: "1", total: "1", unit: "KB" })
  })

  it("keeps a used figure above the total, the way the node sent it", () => {
    expect(spacePair(5000 * GB, 4000 * GB)).toEqual({ used: "5000", total: "4000", unit: "GB" })
  })

  it("shows the total alone when the used figure is unknown", () => {
    expect(spacePair(null, 3689 * GB)).toEqual({ used: null, total: "3689", unit: "GB" })
    expect(spacePair(undefined, 17.18e9)).toEqual({ used: null, total: "16", unit: "GB" })
    expect(spacePair(Number.NaN, 3689 * GB)).toEqual({ used: null, total: "3689", unit: "GB" })
    expect(spacePair(-1, 3689 * GB)).toEqual({ used: null, total: "3689", unit: "GB" })
  })

  it("prints an empty disk's zero", () => {
    expect(spacePair(0, 3689 * GB)).toEqual({ used: "0", total: "3689", unit: "GB" })
  })

  it("has nothing to show without a positive total", () => {
    expect(spacePair(10 * GB, null)).toBe(null)
    expect(spacePair(10 * GB, undefined)).toBe(null)
    expect(spacePair(10 * GB, 0)).toBe(null)
    expect(spacePair(1, -1)).toBe(null)
    expect(spacePair(1, Number.NaN)).toBe(null)
  })
})

describe("parseDiskSpeed", () => {
  it("brings every fio reading to binary MiB/s", () => {
    expect(parseDiskSpeed("1.5 GiB/s")).toBe(1536)
    expect(parseDiskSpeed("1.2GiB/s")).toBeCloseTo(1228.8, 9)
    expect(parseDiskSpeed("800 MiB/s")).toBe(800)
    expect(parseDiskSpeed("63.9MiB/s")).toBe(63.9)
    expect(parseDiskSpeed("101MiB/s")).toBe(101)
    expect(parseDiskSpeed("1152KiB/s")).toBe(1.125)
    expect(parseDiskSpeed("512KiB/s")).toBe(0.5)
    expect(parseDiskSpeed("1023KiB/s")).toBeCloseTo(0.999, 3)
    expect(parseDiskSpeed("1024KiB/s")).toBe(1)
  })

  it("reads decimal prefixes as powers of ten", () => {
    expect(parseDiskSpeed("500 MB/s")).toBeCloseTo(476.837, 3)
    expect(parseDiskSpeed("1 GB/s")).toBeCloseTo(953.674, 3)
    expect(parseDiskSpeed("1000 KB/s")).toBeCloseTo(0.954, 3)
    expect(parseDiskSpeed("1024 B/s")).toBeCloseTo(0.00098, 5)
  })

  it("accepts the forms the coordinator itself accepts", () => {
    expect(parseDiskSpeed("1.5MiBps")).toBe(1.5)
    expect(parseDiskSpeed("63.9 MiBps")).toBe(63.9)
    expect(parseDiskSpeed("63.9MiB")).toBe(63.9)
    expect(parseDiskSpeed("63.9mib/s")).toBe(63.9)
    expect(parseDiskSpeed("0 MiB/s")).toBe(0)
  })

  it("gives up on anything it cannot read whole", () => {
    expect(parseDiskSpeed(null)).toBe(null)
    expect(parseDiskSpeed(undefined)).toBe(null)
    expect(parseDiskSpeed("")).toBe(null)
    expect(parseDiskSpeed("fast")).toBe(null)
    expect(parseDiskSpeed("n/a")).toBe(null)
    expect(parseDiskSpeed("read: 1.5 MiB/s, ok")).toBe(null)
    expect(parseDiskSpeed("-5 MiB/s")).toBe(null)
    expect(parseDiskSpeed("1.2.3 MiB/s")).toBe(null)
    expect(parseDiskSpeed("NaN MiB/s")).toBe(null)
  })
})

describe("formatDiskSpeed", () => {
  it("prints the reading in MiB/s rounded to two digits", () => {
    expect(formatDiskSpeed("1.2GiB/s")).toBe("1228.8 MiB/s")
    expect(formatDiskSpeed("1152KiB/s")).toBe("1.13 MiB/s")
    expect(formatDiskSpeed("1023KiB/s")).toBe("1 MiB/s")
    expect(formatDiskSpeed("1024 B/s")).toBe("0 MiB/s")
    expect(formatDiskSpeed("63.9mib/s")).toBe("63.9 MiB/s")
    expect(formatDiskSpeed(null)).toBe(null)
  })
})

describe("formatMbits", () => {
  it("reads the speedtest as bits and prints whole megabits", () => {
    expect(formatMbits(499_999)).toBe("0 Mbit/s")
    expect(formatMbits(500_000)).toBe("1 Mbit/s")
    expect(formatMbits(999_999)).toBe("1 Mbit/s")
    expect(formatMbits(1e6)).toBe("1 Mbit/s")
    expect(formatMbits(1_499_999)).toBe("1 Mbit/s")
    expect(formatMbits(940_123_456)).toBe("940 Mbit/s")
    expect(formatMbits(1.5e9)).toBe("1500 Mbit/s")
    expect(formatMbits(1_970_199_300)).toBe("1970 Mbit/s")
  })

  it("has nothing to show for zero, negatives and missing values", () => {
    expect(formatMbits(0)).toBe(null)
    expect(formatMbits(-1)).toBe(null)
    expect(formatMbits(null)).toBe(null)
    expect(formatMbits(undefined)).toBe(null)
    expect(formatMbits(Number.NaN)).toBe(null)
    expect(formatMbits(Number.POSITIVE_INFINITY)).toBe(null)
  })
})

describe("formatPing", () => {
  it("prints milliseconds with one digit", () => {
    expect(formatPing(12.345)).toBe("12.3 ms")
    expect(formatPing(15.970891)).toBe("16 ms")
    expect(formatPing(0.04)).toBe("0 ms")
    expect(formatPing(999)).toBe("999 ms")
    expect(formatPing(1000)).toBe("1000 ms")
    expect(formatPing(9999.96)).toBe("10000 ms")
  })

  it("keeps a slow real reading up to the 30 s timeout", () => {
    expect(formatPing(10_000)).toBe("10000 ms")
    expect(formatPing(15_000)).toBe("15000 ms")
    expect(formatPing(99_999)).toBe("99999 ms")
  })

  it("treats the ceiling and the failed-attempt values as no reading", () => {
    expect(formatPing(100_000)).toBe(null)
    expect(formatPing(600_000)).toBe(null)
    expect(formatPing(1_800_000)).toBe(null)
  })

  it("has nothing to show for zero, negatives and missing values", () => {
    expect(formatPing(0)).toBe(null)
    expect(formatPing(-3)).toBe(null)
    expect(formatPing(null)).toBe(null)
    expect(formatPing(undefined)).toBe(null)
    expect(formatPing(Number.NaN)).toBe(null)
  })
})

describe("shortenMiddle", () => {
  it("collapses the middle of a long value into a single ellipsis", () => {
    expect(shortenMiddle("abcdef0123456789", 6, 6)).toBe("abcdef…456789")
    expect(shortenMiddle("abcdefghijklmnop", 4, 4)).toBe("abcd…mnop")
    expect(shortenMiddle("3a65231e59031a3a0c6f363030712730", 6, 6)).toBe("3a6523…712730")
    expect(shortenMiddle("3a65231e59031a3a0c6f363030712730", 8, 8)).toBe("3a65231e…30712730")
    expect(shortenMiddle(HEX64, 8, 8)).toBe(`${HEX64.slice(0, 8)}…${HEX64.slice(-8)}`)
  })

  it("leaves a value that fits alone", () => {
    expect(shortenMiddle("abc", 6, 6)).toBe("abc")
    expect(shortenMiddle("abcdef", 6, 6)).toBe("abcdef")
    expect(shortenMiddle("abcdefghi", 4, 4)).toBe("abcdefghi")
    expect(shortenMiddle("abcdef0123456", 6, 6)).toBe("abcdef0123456")
    expect(shortenMiddle("short", 8, 8)).toBe("short")
  })

  it("keeps no tail when asked for none", () => {
    expect(shortenMiddle("abcdef0123456789", 4, 0)).toBe("abcd…")
  })

  it("has nothing to show for a missing value", () => {
    expect(shortenMiddle(null, 6, 6)).toBe(null)
    expect(shortenMiddle(undefined, 6, 6)).toBe(null)
    expect(shortenMiddle("", 6, 6)).toBe(null)
  })
})

describe("shortKey and shortText", () => {
  it("writes a key 6…6 and a long text 14…6", () => {
    expect(shortKey(HEX64)).toBe(`${HEX64.slice(0, 6)}…${HEX64.slice(-6)}`)
    expect(shortText("AMD EPYC 7763 64-Core Processor")).toBe("AMD EPYC 7763 …cessor")
  })

  it("leaves a value that fits alone and has nothing for a missing one", () => {
    expect(shortKey("3a65231e59031")).toBe("3a65231e59031")
    expect(shortText("Hetzner Online GmbH")).toBe("Hetzner Online GmbH")
    expect(shortKey(null)).toBe(null)
    expect(shortText("")).toBe(null)
  })
})

describe("fitKey", () => {
  it("fits a key into the width it is given", () => {
    expect(fitKey(HEX64, 13)).toBe(shortenMiddle(HEX64, 6, 6))
    expect(fitKey("3a65231e59031a3a0c6f363030712730", 13)).toBe("3a6523…712730")
    expect(fitKey(HEX64, 9)).toBe(`${HEX64.slice(0, 6)}…${HEX64.slice(-2)}`)
  })

  it("keeps the head and drops the tail when the width runs out", () => {
    expect(fitKey(HEX64, 5)).toBe(`${HEX64.slice(0, 4)}…`)
    expect(fitKey(HEX64, 1)).toBe(`${HEX64.slice(0, 1)}…`)
    expect(fitKey(HEX64, 0)).toBe(`${HEX64.slice(0, 1)}…`)
    expect(fitKey(HEX64, -3)).toBe(`${HEX64.slice(0, 1)}…`)
  })

  it("leaves a key that fits whole", () => {
    expect(fitKey(HEX64, 64)).toBe(HEX64)
    expect(fitKey(HEX64, 80)).toBe(HEX64)
    expect(fitKey("3a65231e5903", 13)).toBe("3a65231e5903")
    expect(fitKey(HEX64, Number.POSITIVE_INFINITY)).toBe(HEX64)
    expect(fitKey(HEX64, Number.NaN)).toBe(HEX64)
  })

  it("has nothing to show for a missing value", () => {
    expect(fitKey(null, 13)).toBe(null)
    expect(fitKey(undefined, 13)).toBe(null)
    expect(fitKey("", 13)).toBe(null)
  })
})

describe("withEmpty", () => {
  it("fills a missing value with a dash by default", () => {
    const fmt = withEmpty()
    expect(fmt.number(null, 2)).toBe("—")
    expect(fmt.groupDigits(Number.NaN)).toBe("—")
    expect(fmt.percent(undefined)).toBe("—")
    expect(fmt.price(null)).toBe("—")
    expect(fmt.bytes(0)).toBe("—")
    expect(fmt.space(-1)).toBe("—")
    expect(fmt.spacePair(10 * GB, 0)).toBe("—")
    expect(fmt.diskSpeed("fast")).toBe("—")
    expect(fmt.mbits(0)).toBe("—")
    expect(fmt.ping(100_000)).toBe("—")
    expect(fmt.shortenMiddle(null, 6, 6)).toBe("—")
    expect(fmt.splitSpace(null)).toEqual({ value: "—", unit: "" })
    expect(fmt.duration(null, words.en.duration)).toBe("—")
    expect(fmt.ago(1_000, null, words.en.ago)).toBe("—")
    expect(defaultFmt.number(null, 2)).toBe("—")
  })

  it("takes the empty value a front chooses", () => {
    const fmt = withEmpty("")
    expect(fmt.number(null, 2)).toBe("")
    expect(fmt.price(Number.NaN)).toBe("")
  })

  it("passes a real value through untouched", () => {
    const fmt = withEmpty("")
    expect(fmt.number(4.5678, 2)).toBe("4.57")
    expect(fmt.groupDigits(1234.5678, 2)).toBe("1\u2009234.57")
    expect(fmt.percent(99.77, 1)).toBe("99.8%")
    expect(fmt.price(0)).toBe("0")
    expect(fmt.bytes(1536)).toBe("1.5 KB")
    expect(fmt.space(0)).toBe("0 B")
    expect(fmt.diskSpeed("800 MiB/s")).toBe("800 MiB/s")
    expect(fmt.mbits(1e6)).toBe("1 Mbit/s")
    expect(fmt.ping(12.345)).toBe("12.3 ms")
    expect(fmt.shortenMiddle("abcdef0123456789", 6, 6)).toBe("abcdef…456789")
    expect(fmt.splitSpace(2048 * 1024 ** 3)).toEqual({ value: "2048", unit: "GB" })
    expect(fmt.duration(90_000, words.en.duration)).toBe(formatDuration(durationParts(90_000), words.en.duration))
    expect(fmt.ago(1_000, 990, words.en.ago)).toBe(words.en.ago.justNow)
    expect(defaultFmt.shortText(HEX64)).toBe(shortText(HEX64))
  })

  it("writes a space pair with its unit once at the end", () => {
    const fmt = withEmpty()
    expect(fmt.spacePair(1844 * GB, 3689 * GB)).toBe("1844 / 3689 GB")
    expect(fmt.spacePair(null, 3689 * GB)).toBe("3689 GB")
    expect(fmt.spacePair(100 * MB, 512 * MB)).toBe("100 / 512 MB")
    expect(fmt.spacePair(5000 * GB, 4000 * GB)).toBe("5000 / 4000 GB")
    expect(fmt.spacePair(10 * GB, null)).toBe("—")
  })
})

describe("countryLabel", () => {
  it("names the country and falls back to its code", () => {
    expect(countryLabel({ country: "Russia", countryIso: "RU" })).toBe("Russia")
    expect(countryLabel({ country: "", countryIso: "RU" })).toBe("RU")
    expect(countryLabel({ country: null, countryIso: "NL" })).toBe("NL")
  })

  it("leaves a provider without a country to the front", () => {
    expect(countryLabel({ country: "", countryIso: "" })).toBe(null)
    expect(countryLabel({ country: null, countryIso: null })).toBe(null)
    expect(countryLabel(null)).toBe(null)
    expect(countryLabel(undefined)).toBe(null)
  })
})
