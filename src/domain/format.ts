import type { ProviderLocation } from "./catalog"
import { durationParts, formatAgo, formatDuration, type AgoWords, type DurationWords } from "./time"
import { GRAM, NANO } from "./units"

const THIN_SPACE = "\u2009"

const trim = (value: number, digits: number): string => String(Number(value.toFixed(digits)))

export const formatNumber = (value: number | null | undefined, digits: number): string | null =>
  value == null || !Number.isFinite(value) ? null : trim(value, digits)

export const groupDigits = (value: number | null | undefined, digits = 0): string | null => {
  const text = formatNumber(value, digits)
  if (text === null) return null
  const [whole, fraction] = text.split(".")
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE)
  return fraction === undefined ? grouped : `${grouped}.${fraction}`
}

export const formatPercent = (value: number | null | undefined, digits = 2): string | null => {
  const text = formatNumber(value, digits)
  return text === null ? null : `${text}%`
}

// Nanotons as GRAM, with as many decimals as the place needs: a price takes two, a contract payment three.
export const formatTon = (nanoTon: number | null | undefined, digits = 2): string | null =>
  nanoTon == null ? null : formatNumber(nanoTon / NANO, digits)

// One scale for every front: divisor 1024 and Latin labels, no GiB or MiB on screen
const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"]
const BYTE_TOP = BYTE_UNITS.length - 1
// Disk and RAM stop at GB so the number matches what the provider typed into the installer,
// which asks for gigabytes and multiplies by 1024
const SPACE_TOP = BYTE_UNITS.indexOf("GB")
const WHOLE_FROM = 1000

const scaleFor = (bytes: number, top: number): { divisor: number; unit: string } => {
  let divisor = 1
  let index = 0
  while (bytes >= divisor * 1024 && index < top) {
    divisor *= 1024
    index += 1
  }
  return { divisor, unit: BYTE_UNITS[index] }
}

// A limit is printed rounded down: rounded to the nearest, the bag cap read as the impossible 4 GB
type Rounding = "nearest" | "down"

const scaled = (bytes: number, divisor: number, rounding: Rounding = "nearest"): string => {
  const value = bytes / divisor
  const digits = value >= WHOLE_FROM ? 0 : 2
  return trim(rounding === "down" ? Math.floor(value * 10 ** digits) / 10 ** digits : value, digits)
}

const sized = (bytes: number, top: number, rounding: Rounding = "nearest"): string => {
  const { divisor, unit } = scaleFor(bytes, top)
  return `${scaled(bytes, divisor, rounding)} ${unit}`
}

export const formatBytes = (bytes: number | null | undefined, rounding?: Rounding): string | null =>
  bytes == null || !Number.isFinite(bytes) || bytes <= 0 ? null : sized(bytes, BYTE_TOP, rounding)

// Zero is a real reading here: a full disk has no free space left
export const formatSpace = (bytes: number | null | undefined): string | null =>
  bytes == null || !Number.isFinite(bytes) || bytes < 0 ? null : sized(bytes, SPACE_TOP)

export const spacePair = (
  used: number | null | undefined,
  total: number | null | undefined,
): { used: string | null; total: string; unit: string } | null => {
  if (total == null || !Number.isFinite(total) || total <= 0) return null
  const { divisor, unit } = scaleFor(total, SPACE_TOP)
  const known = used != null && Number.isFinite(used) && used >= 0
  return { used: known ? scaled(used, divisor) : null, total: scaled(total, divisor), unit }
}

const SPEED_FACTOR: Record<string, number | undefined> = {
  B: 1,
  KB: 1e3,
  KIB: 1024,
  MB: 1e6,
  MIB: 1024 ** 2,
  GB: 1e9,
  GIB: 1024 ** 3,
}

// fio readings as the agent sends them: "63.9MiB/s", "63.9 MiBps", "63.9MiB"
const SPEED_FORM = /^([\d.]+)\s*(B|[KMG]iB|[KMG]B)(?:\/s|ps)?$/i

export const parseDiskSpeed = (text: string | null | undefined): number | null => {
  const match = text == null ? null : SPEED_FORM.exec(text)
  if (match === null) return null
  const amount = Number(match[1])
  const factor = SPEED_FACTOR[match[2].toUpperCase()]
  return factor === undefined || !Number.isFinite(amount) ? null : (amount * factor) / 1024 ** 2
}

export const formatDiskSpeed = (text: string | null | undefined): string | null => {
  const mib = parseDiskSpeed(text)
  return mib === null ? null : `${trim(mib, 2)} MiB/s`
}

// The speedtest reports bits per second: librespeed is multiplied by 10**6 in the manager's
// benchmark.py, speedtest-cli gives bits already
export const formatMbits = (bitsPerSec: number | null | undefined): string | null =>
  bitsPerSec == null || !Number.isFinite(bitsPerSec) || bitsPerSec <= 0 ? null : `${Math.round(bitsPerSec / 1e6)} Mbit/s`

// speedtest-cli 2.1.3 books 3600 s for every failed attempt and averages as sum / 6 * 1000, so one
// miss in three lands at 600 000 ms or more; a real reading stops at 15 000 ms on the 30 s timeout
export const PING_MAX = 100_000

export const formatPing = (ms: number | null | undefined): string | null =>
  ms == null || !Number.isFinite(ms) || ms <= 0 || ms >= PING_MAX ? null : `${trim(ms, 1)} ms`

export const shortenMiddle = (value: string | null | undefined, head: number, tail: number): string | null => {
  if (!value) return null
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(value.length - tail)}`
}

// A key, a bag id or an address reads 6…6 on every front
export const KEY_SIDE = 6
// A long text (a CPU model, an ISP, a commit hash) is told apart by its start, so the head keeps more
const TEXT_HEAD = 14

export const shortKey = (value: string | null | undefined): string | null => shortenMiddle(value, KEY_SIDE, KEY_SIDE)

export const shortText = (value: string | null | undefined): string | null => shortenMiddle(value, TEXT_HEAD, KEY_SIDE)

export const fitKey = (value: string | null | undefined, chars: number): string | null => {
  if (!value) return null
  if (Number.isNaN(chars) || value.length <= chars) return value
  const head = Math.min(KEY_SIDE, Math.max(1, chars - 1))
  const tail = Math.max(0, chars - head - 1)
  return `${value.slice(0, head)}…${value.slice(value.length - tail)}`
}

// The catalog fills country_iso where the country name is empty; whether nothing at all reads as the empty
// value or as a word is the front's call
export const countryLabel = (
  location: Pick<ProviderLocation, "country" | "countryIso"> | null | undefined,
): string | null => location?.country || location?.countryIso || null

export const EMPTY = "—"

export const withEmpty = (empty = EMPTY) => {
  const or = (text: string | null): string => text ?? empty
  return {
    number: (value: number | null | undefined, digits: number) => or(formatNumber(value, digits)),
    groupDigits: (value: number | null | undefined, digits?: number) => or(groupDigits(value, digits)),
    percent: (value: number | null | undefined, digits?: number) => or(formatPercent(value, digits)),
    // The catalog price is nanotons for 200 GB over 30 days (upstream providers/helpers.go)
    price: (nanoTon: number | null | undefined) => or(formatTon(nanoTon)),
    ton: (nanoTon: number | null | undefined, digits?: number) => or(formatTon(nanoTon, digits)),
    tonLabel: (nanoTon: number | null | undefined, digits?: number) => `${or(formatTon(nanoTon, digits))} ${GRAM}`,
    bytes: (bytes: number | null | undefined, rounding?: Rounding) => or(formatBytes(bytes, rounding)),
    space: (bytes: number | null | undefined) => or(formatSpace(bytes)),
    // The value and its unit apart, for a cell that sets the unit smaller
    splitSpace: (bytes: number | null | undefined): { value: string; unit: string } => {
      const text = formatSpace(bytes)
      if (text === null) return { value: empty, unit: "" }
      const [value, unit = ""] = text.split(" ")
      return { value, unit }
    },
    spacePair: (used: number | null | undefined, total: number | null | undefined) => {
      const pair = spacePair(used, total)
      if (pair === null) return empty
      return pair.used === null ? `${pair.total} ${pair.unit}` : `${pair.used} / ${pair.total} ${pair.unit}`
    },
    diskSpeed: (text: string | null | undefined) => or(formatDiskSpeed(text)),
    mbits: (bitsPerSec: number | null | undefined) => or(formatMbits(bitsPerSec)),
    ping: (ms: number | null | undefined) => or(formatPing(ms)),
    shortenMiddle: (value: string | null | undefined, head: number, tail: number) =>
      or(shortenMiddle(value, head, tail)),
    shortKey: (value: string | null | undefined) => or(shortKey(value)),
    shortText: (value: string | null | undefined) => or(shortText(value)),
    duration: (seconds: number | null | undefined, words: DurationWords, maxParts?: 1 | 2) =>
      or(formatDuration(durationParts(seconds, { maxParts }), words)),
    ago: (now: number, then: number | null | undefined, words: AgoWords) => or(formatAgo(now, then, words)),
  }
}

export const fmt = withEmpty()
