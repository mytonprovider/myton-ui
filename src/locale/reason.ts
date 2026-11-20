import { REASON } from "../domain/checks"
import type { ReasonKey } from "./ru"

const KNOWN = new Set<number>(Object.values(REASON))

// A code upstream added since this list was written reads through `unknown` with its number
export const reasonKey = (reason: number | null): ReasonKey =>
  reason === null ? "none" : KNOWN.has(reason) ? (`${reason}` as ReasonKey) : "unknown"
