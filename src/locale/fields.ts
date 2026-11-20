import { EMPTY, STATE_TONE, countryLabel, fmt, type Provider, type ProviderStatus, type StatusTone } from "../domain"
import { isStale } from "../domain/time"
import { locales, words, type Lang } from "./words"

export type ProviderFieldId =
  | "span"
  | "maxBag"
  | "workingTime"
  | "lastOnline"
  | "lastTelemetry"
  | "location"
  | "uptime"
  | "rating"
  | "price"

// The rows of a provider card's telemetry sections, under the filter groups' titles
export type DetailFieldId =
  | "address"
  | "cpuName"
  | "cpuCount"
  | "cpuVirtual"
  | "ram"
  | "space"
  | "diskRead"
  | "diskWrite"
  | "download"
  | "upload"
  | "ping"
  | "country"
  | "isp"
  | "storageHash"
  | "providerHash"

export interface ProviderField {
  id: ProviderFieldId
  label: string
  value: string
  stale: boolean
}

// The provider's own figures in the order every card lists them; a node that sends no telemetry has no row for it
export const providerFields = (provider: Provider, now: number, lang: Lang): ProviderField[] => {
  const labels = locales[lang].field
  const time = words[lang]
  const country = countryLabel(provider.location)
  const telemetryAt = provider.telemetry?.updatedAt ?? null
  const duration = (seconds: number | null) => fmt.duration(seconds, time.duration)
  const field = (id: ProviderFieldId, value: string, stale = false): ProviderField => ({
    id,
    label: labels[id],
    value,
    stale,
  })

  return [
    field("span", `${duration(provider.minSpan)} – ${duration(provider.maxSpan)}`),
    field("maxBag", fmt.bytes(provider.maxBagBytes)),
    field("workingTime", duration(provider.workingTime)),
    field("lastOnline", fmt.ago(now, provider.lastOnlineAt, time.ago), isStale(now, provider.lastOnlineAt)),
    ...(provider.sendsTelemetry
      ? [field("lastTelemetry", fmt.ago(now, telemetryAt, time.ago), isStale(now, telemetryAt))]
      : []),
    field("location", country ? [country, provider.location?.city].filter(Boolean).join(", ") : EMPTY),
    field("uptime", fmt.percent(provider.uptime)),
    field("rating", fmt.number(provider.rating, 2)),
    field("price", fmt.tonLabel(provider.price)),
  ]
}

export interface StatusView {
  tone: StatusTone
  label: string
  ratio: number | null
}

export const statusView = ({ state, ratio }: ProviderStatus, lang: Lang): StatusView => ({
  tone: STATE_TONE[state],
  label: locales[lang].status[state],
  ratio,
})
