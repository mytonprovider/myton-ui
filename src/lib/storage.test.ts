import { afterEach, describe, expect, it, vi } from "vitest"
import { readLocal, writeLocal } from "./storage"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("readLocal and writeLocal", () => {
  it("read and write through localStorage", () => {
    const store = new Map<string, string>()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    })
    expect(readLocal("mtp_theme")).toBe(null)
    expect(writeLocal("mtp_theme", "dark")).toBe(true)
    expect(readLocal("mtp_theme")).toBe("dark")
  })

  it("read nothing and write nothing when storage throws", () => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError")
    }
    vi.stubGlobal("localStorage", { getItem: blocked, setItem: blocked })
    expect(readLocal("mtp_theme")).toBe(null)
    expect(writeLocal("mtp_theme", "dark")).toBe(false)
  })
})
