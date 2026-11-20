import { DAY, GIB, NANO } from "./units"

// A typical catalogue row: list placeholders print it through the real formatters, so each takes a value's width
export const PROVIDER_SAMPLE = {
  rating: 23.82,
  uptime: 99.68,
  price: 10 * NANO,
  freeBytes: 1402 * GIB,
  freePercent: 50,
  workingTime: 400 * DAY,
  country: "Russia",
} as const
