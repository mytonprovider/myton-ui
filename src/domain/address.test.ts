import { describe, expect, it } from "vitest"
import { parseAddress, toFriendly, toRaw } from "./address"

const BOUNCEABLE = "EQAjRhPNqC9mY2muFNsYwYI5eqb-lsq-sD5xk3SLfrDljMwB"
const NON_BOUNCEABLE = "UQAjRhPNqC9mY2muFNsYwYI5eqb-lsq-sD5xk3SLfrDljJHE"
const RAW = "0:234613cda82f666369ae14db18c182397aa6fe96cabeb03e7193748b7eb0e58c"
const TESTNET_BOUNCEABLE = "kQAjRhPNqC9mY2muFNsYwYI5eqb-lsq-sD5xk3SLfrDljHeL"
const TESTNET_NON_BOUNCEABLE = "0QAjRhPNqC9mY2muFNsYwYI5eqb-lsq-sD5xk3SLfrDljCpO"
// The elector of the masterchain, a well-known -1 address
const ELECTOR_RAW = `-1:${"33".repeat(32)}`
const ELECTOR = "Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF"

describe("toFriendly", () => {
  it("rewrites a bounceable address into the user-friendly form and keeps one already in it", () => {
    expect(toFriendly(BOUNCEABLE)).toBe(NON_BOUNCEABLE)
    expect(toFriendly(NON_BOUNCEABLE)).toBe(NON_BOUNCEABLE)
  })

  it("keeps the testnet flag while swapping the tag", () => {
    expect(toFriendly(TESTNET_BOUNCEABLE)).toBe(TESTNET_NON_BOUNCEABLE)
    expect(toFriendly(TESTNET_NON_BOUNCEABLE, { bounceable: true })).toBe(TESTNET_BOUNCEABLE)
  })

  it("writes the bounceable form on request", () => {
    expect(toFriendly(NON_BOUNCEABLE, { bounceable: true })).toBe(BOUNCEABLE)
    expect(toFriendly(RAW, { bounceable: true })).toBe(BOUNCEABLE)
  })

  it("turns a raw address into the friendly form", () => {
    expect(toFriendly(RAW)).toBe(NON_BOUNCEABLE)
    expect(toFriendly(RAW.toUpperCase())).toBe(NON_BOUNCEABLE)
    expect(toFriendly(ELECTOR_RAW, { bounceable: true })).toBe(ELECTOR)
  })

  it("reads the standard base64 alphabet and answers in the url-safe one", () => {
    expect(toFriendly(BOUNCEABLE.replace(/-/g, "+"))).toBe(NON_BOUNCEABLE)
    expect(toFriendly(ELECTOR.replace(/_/g, "/"))).toBe(toFriendly(ELECTOR))
  })

  it("refuses anything that is not an address instead of guessing", () => {
    expect(toFriendly("")).toBe(null)
    expect(toFriendly("EQAjRhPNqC9mY2muFNsYwYI5eqb-lsq-sD5xk3SLfrDljAAA")).toBe(null)
    expect(toFriendly(`${BOUNCEABLE}A`)).toBe(null)
    expect(toFriendly(BOUNCEABLE.slice(1))).toBe(null)
    expect(toFriendly("EQAjRhPNqC9mY2muFNsYwYI5eqb lsq-sD5xk3SLfrDljMwB")).toBe(null)
    expect(toFriendly(`1000:${"00".repeat(32)}`)).toBe(null)
  })
})

describe("toRaw", () => {
  it("reads every friendly form back to the same raw address", () => {
    expect(toRaw(BOUNCEABLE)).toBe(RAW)
    expect(toRaw(NON_BOUNCEABLE)).toBe(RAW)
    expect(toRaw(TESTNET_BOUNCEABLE)).toBe(RAW)
    expect(toRaw(ELECTOR)).toBe(ELECTOR_RAW)
  })

  it("normalises a raw address to lower-case hex and a plain workchain", () => {
    expect(toRaw(RAW.toUpperCase())).toBe(RAW)
    expect(toRaw(`00:${RAW.slice(2)}`)).toBe(RAW)
    expect(toRaw(`-0:${RAW.slice(2)}`)).toBe(RAW)
    expect(toRaw(ELECTOR_RAW)).toBe(ELECTOR_RAW)
  })

  it("has nothing for a missing or broken address", () => {
    expect(toRaw(null)).toBe(null)
    expect(toRaw(undefined)).toBe(null)
    expect(toRaw("")).toBe(null)
    expect(toRaw("0:abc")).toBe(null)
    expect(toRaw(`0:${"g".repeat(64)}`)).toBe(null)
    expect(toRaw(` ${RAW}`)).toBe(null)
    expect(toRaw(`128:${RAW.slice(2)}`)).toBe(null)
    expect(toRaw(`-129:${RAW.slice(2)}`)).toBe(null)
  })
})

describe("parseAddress", () => {
  it("reads the workchain, the hash and both flags", () => {
    const address = parseAddress(TESTNET_BOUNCEABLE)
    expect(address).toMatchObject({ workchain: 0, bounceable: true, testnet: true })
    expect(address?.hash).toHaveLength(32)
    expect(address?.hash[0]).toBe(0x23)
    expect(parseAddress(NON_BOUNCEABLE)).toMatchObject({ workchain: 0, bounceable: false, testnet: false })
    expect(parseAddress(ELECTOR)).toMatchObject({ workchain: -1, bounceable: true, testnet: false })
  })

  it("takes a raw address as bounceable mainnet, the form carries no flags", () => {
    expect(parseAddress(RAW)).toMatchObject({ workchain: 0, bounceable: true, testnet: false })
    expect(parseAddress(`-128:${RAW.slice(2)}`)).toMatchObject({ workchain: -128 })
    expect(parseAddress(`127:${RAW.slice(2)}`)).toMatchObject({ workchain: 127 })
  })

  it("rejects an unknown tag even when the checksum is right", () => {
    const bytes = Uint8Array.from(atob(NON_BOUNCEABLE.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))
    bytes[0] = 0x31
    let crc = 0
    for (const byte of bytes.subarray(0, 34)) {
      crc ^= byte << 8
      for (let bit = 0; bit < 8; bit += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
    bytes[34] = crc >> 8
    bytes[35] = crc & 0xff
    expect(parseAddress(btoa(String.fromCharCode(...bytes)))).toBe(null)
  })
})
