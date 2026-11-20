import type { ReasonCount } from "./status"
import { GIB } from "./units"

const PUBKEY = /^[0-9a-f]{64}$/i

export const pubkeyFrom = (input: string | null | undefined): string | null => {
  const candidate = input?.trim() ?? ""
  return PUBKEY.test(candidate) ? candidate.toLowerCase() : null
}

// The provider as POST /api/v1/providers/search sends it (coordinator models/api/v1/types.go). Every field
// may be missing or null: the telemetry schema is not stable and one broken entry must not cost the page.
export interface CatalogTelemetryDto {
  storage_git_hash?: string | null
  provider_git_hash?: string | null
  qd64_disk_read_speed?: string | null
  qd64_disk_write_speed?: string | null
  country?: string | null
  isp?: string | null
  cpu_name?: string | null
  updated_at?: number | null
  total_provider_space?: number | null
  used_provider_space?: number | null
  total_ram?: number | null
  usage_ram?: number | null
  ram_usage_percent?: number | null
  speedtest_download?: number | null
  speedtest_upload?: number | null
  speedtest_ping?: number | null
  cpu_number?: number | null
  cpu_is_virtual?: boolean | null
}

export interface CatalogLocationDto {
  country?: string | null
  country_iso?: string | null
  city?: string | null
  time_zone?: string | null
}

export interface CatalogReasonDto {
  reason?: number | null
  cnt?: number | null
}

export interface CatalogProviderDto {
  location?: CatalogLocationDto | null
  status?: number | null
  pubkey?: string | null
  address?: string | null
  uptime?: number | null
  status_ratio?: number | null
  statuses_reason_stats?: CatalogReasonDto[] | null
  working_time?: number | null
  rating?: number | null
  max_span?: number | null
  price?: number | null
  min_span?: number | null
  max_bag_size_bytes?: number | null
  reg_time?: number | null
  last_online_check_time?: number | null
  is_send_telemetry?: boolean | null
  telemetry?: CatalogTelemetryDto | null
}

// Bytes everywhere below; disk speeds stay the fio strings the agent sends
export interface Telemetry {
  storageGitHash: string | null
  providerGitHash: string | null
  updatedAt: number | null
  cpuName: string | null
  cpuCount: number | null
  cpuVirtual: boolean | null
  totalSpaceBytes: number | null
  usedSpaceBytes: number | null
  totalRamBytes: number | null
  usageRamBytes: number | null
  ramUsagePercent: number | null
  diskRead: string | null
  diskWrite: string | null
  downloadBits: number | null
  uploadBits: number | null
  pingMs: number | null
  country: string | null
  isp: string | null
}

export interface ProviderLocation {
  country: string | null
  countryIso: string | null
  city: string | null
  timeZone: string | null
}

export interface Provider {
  pubkey: string
  address: string | null
  status: number | null
  statusRatio: number | null
  reasons: ReasonCount[]
  location: ProviderLocation | null
  uptime: number | null
  workingTime: number | null
  rating: number | null
  price: number | null
  minSpan: number | null
  maxSpan: number | null
  maxBagBytes: number | null
  regTime: number | null
  lastOnlineAt: number | null
  sendsTelemetry: boolean
  telemetry: Telemetry | null
}

// The wire keys of a DTO with nothing about their values trusted yet
type Unchecked<T> = { [K in keyof T]?: unknown }

const recordOf = <T>(value: unknown): Unchecked<T> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value : null

const numberOf = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null

const textOf = (value: unknown): string | null => (typeof value === "string" ? value : null)

const flagOf = (value: unknown): boolean | null => (typeof value === "boolean" ? value : null)

// The manager sends provider disk in GiB (space_gb = megabytes // 1024 in ton_storage_provider.py) and
// RAM in decimal GB (ByteUnitDec.GB in telemetry.py); the coordinator passes both through as they came
const GB = 1e9

const bytesOf = (value: unknown, factor: number): number | null => {
  const amount = numberOf(value)
  return amount === null ? null : amount * factor
}

const toTelemetry = (raw: unknown): Telemetry | null => {
  const dto = recordOf<CatalogTelemetryDto>(raw)
  if (dto === null) return null
  return {
    storageGitHash: textOf(dto.storage_git_hash),
    providerGitHash: textOf(dto.provider_git_hash),
    updatedAt: numberOf(dto.updated_at),
    cpuName: textOf(dto.cpu_name),
    cpuCount: numberOf(dto.cpu_number),
    cpuVirtual: flagOf(dto.cpu_is_virtual),
    totalSpaceBytes: bytesOf(dto.total_provider_space, GIB),
    usedSpaceBytes: bytesOf(dto.used_provider_space, GIB),
    totalRamBytes: bytesOf(dto.total_ram, GB),
    usageRamBytes: bytesOf(dto.usage_ram, GB),
    ramUsagePercent: numberOf(dto.ram_usage_percent),
    diskRead: textOf(dto.qd64_disk_read_speed),
    diskWrite: textOf(dto.qd64_disk_write_speed),
    downloadBits: numberOf(dto.speedtest_download),
    uploadBits: numberOf(dto.speedtest_upload),
    pingMs: numberOf(dto.speedtest_ping),
    country: textOf(dto.country),
    isp: textOf(dto.isp),
  }
}

const toLocation = (raw: unknown): ProviderLocation | null => {
  const dto = recordOf<CatalogLocationDto>(raw)
  if (dto === null) return null
  return {
    country: textOf(dto.country),
    countryIso: textOf(dto.country_iso),
    city: textOf(dto.city),
    timeZone: textOf(dto.time_zone),
  }
}

const toReason = (raw: unknown): ReasonCount[] => {
  const dto = recordOf<CatalogReasonDto>(raw)
  const reason = numberOf(dto?.reason)
  const count = numberOf(dto?.cnt)
  return reason !== null && count !== null && count > 0 ? [{ reason, count }] : []
}

export const toProvider = (raw: unknown): Provider | null => {
  const dto = recordOf<CatalogProviderDto>(raw)
  const pubkey = textOf(dto?.pubkey)
  if (dto === null || pubkey === null) return null
  return {
    pubkey,
    address: textOf(dto.address),
    status: numberOf(dto.status),
    statusRatio: numberOf(dto.status_ratio),
    reasons: Array.isArray(dto.statuses_reason_stats) ? dto.statuses_reason_stats.flatMap(toReason) : [],
    location: toLocation(dto.location),
    uptime: numberOf(dto.uptime),
    workingTime: numberOf(dto.working_time),
    rating: numberOf(dto.rating),
    price: numberOf(dto.price),
    minSpan: numberOf(dto.min_span),
    maxSpan: numberOf(dto.max_span),
    maxBagBytes: numberOf(dto.max_bag_size_bytes),
    regTime: numberOf(dto.reg_time),
    lastOnlineAt: numberOf(dto.last_online_check_time),
    sendsTelemetry: dto.is_send_telemetry === true,
    telemetry: toTelemetry(dto.telemetry),
  }
}

export interface CatalogPage {
  providers: Provider[]
  skipped: number
}

// null is a body that is not a catalog at all; a missing or null list is an empty catalog
export const toProviders = (body: unknown): CatalogPage | null => {
  const dto = recordOf<{ providers: unknown }>(body)
  if (dto === null) return null
  if (dto.providers == null) return { providers: [], skipped: 0 }
  if (!Array.isArray(dto.providers)) return null
  const providers = dto.providers.map(toProvider).filter((provider) => provider !== null)
  return { providers, skipped: dto.providers.length - providers.length }
}
