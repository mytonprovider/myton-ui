import { afterEach, describe, expect, it, vi } from "vitest"
import { copyText } from "./clipboard"

// A document just big enough for the textarea fallback, recording what it was asked
const fakeDocument = (execCommand: () => boolean, dialog = false) => {
  const hosts: string[] = []
  const area = { value: "", style: {}, setAttribute: vi.fn(), select: vi.fn(), remove: vi.fn() }
  const host = (name: string) => ({ append: () => hosts.push(name) })
  const doc = {
    body: host("body"),
    querySelector: () => (dialog ? host("dialog") : null),
    createElement: () => area,
    execCommand: vi.fn(execCommand),
  }
  return { doc, area, hosts }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("copyText", () => {
  it("copies through the Clipboard API when it is there", async () => {
    const writeText = vi.fn(() => Promise.resolve())
    const { doc } = fakeDocument(() => true)
    vi.stubGlobal("navigator", { clipboard: { writeText } })
    vi.stubGlobal("document", doc)
    expect(await copyText("3F8A")).toBe(true)
    expect(writeText).toHaveBeenCalledWith("3F8A")
    expect(doc.execCommand).not.toHaveBeenCalled()
  })

  it("falls back to a selected textarea when the API refuses, and removes it", async () => {
    const { doc, area, hosts } = fakeDocument(() => true)
    vi.stubGlobal("navigator", { clipboard: { writeText: () => Promise.reject(new Error("denied")) } })
    vi.stubGlobal("document", doc)
    expect(await copyText("3F8A")).toBe(true)
    expect(area.value).toBe("3F8A")
    expect(hosts).toEqual(["body"])
    expect(area.remove).toHaveBeenCalled()
  })

  it("falls back when there is no Clipboard API at all", async () => {
    const { doc } = fakeDocument(() => true)
    vi.stubGlobal("navigator", {})
    vi.stubGlobal("document", doc)
    expect(await copyText("3F8A")).toBe(true)
    expect(doc.execCommand).toHaveBeenCalledWith("copy")
  })

  it("puts the textarea into an open dialog", async () => {
    const { doc, hosts } = fakeDocument(() => true, true)
    vi.stubGlobal("navigator", {})
    vi.stubGlobal("document", doc)
    await copyText("3F8A")
    expect(hosts).toEqual(["dialog"])
  })

  it("reports a failure when the fallback does not copy or throws", async () => {
    vi.stubGlobal("navigator", {})
    const refused = fakeDocument(() => false)
    vi.stubGlobal("document", refused.doc)
    expect(await copyText("3F8A")).toBe(false)
    expect(refused.area.remove).toHaveBeenCalled()

    const broken = fakeDocument(() => {
      throw new Error("not allowed")
    })
    vi.stubGlobal("document", broken.doc)
    expect(await copyText("3F8A")).toBe(false)
    expect(broken.area.remove).toHaveBeenCalled()
  })
})
