import type { GlobeWords } from "../domain/globe"
import { pluralIndexEn, pluralIndexRu, type AgoWords, type DurationWords } from "../domain/time"
import { en } from "./en"
import { fill } from "./fill"
import { ru, type Locale } from "./ru"

export interface TimeWords {
  duration: DurationWords
  durationLong: DurationWords
  ago: AgoWords
}

const timeWords = (locale: Locale, plural: DurationWords["plural"]): TimeWords => ({
  duration: { units: locale.units, plural },
  durationLong: { units: locale.unitsLong, plural },
  ago: {
    units: locale.units,
    plural,
    justNow: locale.time.justNow,
    ago: (time) => fill(locale.time.ago, { time }),
  },
})

export const locales = { ru, en }

export type Lang = keyof typeof locales

export const words: Record<Lang, TimeWords> = {
  ru: timeWords(ru, pluralIndexRu),
  en: timeWords(en, pluralIndexEn),
}

export const globeWords: Record<Lang, GlobeWords> = {
  ru: { ...ru.globe, plural: pluralIndexRu },
  en: { ...en.globe, plural: pluralIndexEn },
}
