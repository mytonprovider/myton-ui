import { describe, expect, it } from "vitest"
import { checkKind } from "./checks"

describe("checkKind", () => {
  it.each([
    [0, "stored"],
    [101, "unavailable"],
    [102, "unchecked"],
    [103, "unavailable"],
    [104, "unchecked"],
    [105, "unchecked"],
    [201, "unavailable"],
    [202, "unchecked"],
    [203, "unavailable"],
    [301, "noBagInfo"],
    [302, "noBagInfo"],
    [401, "noProof"],
    [402, "noProof"],
    [403, "noProof"],
  ])("reads code %i as %s", (code, kind) => {
    expect(checkKind(code)).toBe(kind)
  })

  it("names a code the upstream has not shipped yet unknown", () => {
    expect(checkKind(404)).toBe("unknown")
    expect(checkKind(100)).toBe("unknown")
    expect(checkKind(-1)).toBe("unknown")
    expect(checkKind(101.5)).toBe("unknown")
    expect(checkKind(Number.NaN)).toBe("unknown")
  })

  it("has no kind when no check ran", () => {
    expect(checkKind(null)).toBe(null)
    expect(checkKind(undefined)).toBe(null)
  })
})
