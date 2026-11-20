import { describe, expect, it } from "vitest"
import { providerStatus, staleSignals, toProvider, type Provider } from "../domain"
import { providerFields, statusView } from "."

const NOW = 1_800_000_000

const parse = (row: Record<string, unknown>): Provider => {
  const provider = toProvider({ pubkey: "abc", ...row })
  if (provider === null) throw new Error("the row did not parse")
  return provider
}

// Ages in seconds before NOW of the last online check and of the last telemetry
const seen = (online: number, telemetry: number, sends = true): Provider =>
  parse({ last_online_check_time: NOW - online, is_send_telemetry: sends, telemetry: { updated_at: NOW - telemetry } })

const fresh = seen(60, 60)
const silent = seen(60, 7200, false)
const down = seen(7200, 60)

describe("providerFields", () => {
  it("lists the card rows in order, the telemetry row only for a node that sends it", () => {
    expect(providerFields(fresh, NOW, "en").map((field) => field.id)).toEqual([
      "span",
      "maxBag",
      "workingTime",
      "lastOnline",
      "lastTelemetry",
      "location",
      "uptime",
      "rating",
      "price",
    ])
    expect(providerFields(silent, NOW, "en").map((field) => field.id)).not.toContain("lastTelemetry")
  })

  it("marks an age past ten minutes stale and fills a missing place with the dash", () => {
    const fields = providerFields(down, NOW, "ru")
    const online = fields.find((field) => field.id === "lastOnline")
    expect(online).toMatchObject({ label: "Последний онлайн", stale: true })
    expect(fields.find((field) => field.id === "lastTelemetry")?.stale).toBe(false)
    expect(fields.find((field) => field.id === "location")?.value).toBe("—")
  })
})

describe("statusView", () => {
  it("names the state in the language asked, with its tone and share", () => {
    const status = providerStatus({ status: 0, statusRatio: 0.9977, reasons: [] })
    expect(statusView(status, "ru")).toEqual({ tone: "green", label: "Стабильно", ratio: 0.9977 })
    expect(statusView({ state: "noProofs", ratio: null }, "en")).toEqual({
      tone: "orange",
      label: "No proofs",
      ratio: null,
    })
  })
})

describe("staleSignals", () => {
  it("raises offline and telemetry apart, and no telemetry signal for a node that sends none", () => {
    expect(staleSignals(fresh, NOW)).toEqual([])
    expect(staleSignals(down, NOW)).toEqual(["offline"])
    expect(staleSignals(silent, NOW)).toEqual([])
    expect(staleSignals(seen(60, 7200), NOW)).toEqual(["telemetry"])
  })

  it("says nothing about an age nobody reported", () => {
    expect(staleSignals(parse({ is_send_telemetry: true }), NOW)).toEqual([])
  })
})
