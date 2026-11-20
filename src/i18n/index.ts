import i18next, { type i18n } from "i18next"
import { initReactI18next } from "react-i18next"
import { readLocal, writeLocal } from "../lib/storage"
import { locales, type Lang } from "../locale"

const LANGS: readonly Lang[] = ["en", "ru"]
const FALLBACK: Lang = "en"

const asLang = (code: string | null | undefined): Lang | null =>
  LANGS.find((lang) => lang === code?.toLowerCase().split("-")[0]) ?? null

// A language code from anywhere (the browser, Telegram, a stored profile) as one we speak, else English.
export const pickLang = (code: string | null | undefined): Lang => asLang(code) ?? FALLBACK

export interface LangChoice {
  // The language the person picked; null until they pick one, and while null the app follows the system.
  chosen: () => Lang | null
  // The system's language when it is not the browser's: Telegram's in a mini app.
  system?: () => string | null | undefined
}

// The person's pick, else the system's language when we speak it, else English.
export const resolveLang = (choice: LangChoice): Lang => choice.chosen() ?? pickLang(choice.system?.() ?? navigator.language)

// Nothing overwrites the person's pick; until they pick, a change of the system's language is followed. The page's
// lang always names the language shown.
export const createI18n = (translation: Record<Lang, Record<string, unknown>>, choice: LangChoice): i18n => {
  const instance = i18next.createInstance()
  void instance.use(initReactI18next).init({
    resources: Object.fromEntries(LANGS.map((lang) => [lang, { translation: translation[lang], ui: locales[lang] }])),
    lng: resolveLang(choice),
    fallbackLng: FALLBACK,
    interpolation: { escapeValue: false },
    showSupportNotice: false,
  })
  document.documentElement.lang = instance.language
  instance.on("languageChanged", (lang) => {
    document.documentElement.lang = lang
  })
  window.addEventListener("languagechange", () => {
    if (choice.chosen() === null) void instance.changeLanguage(resolveLang(choice))
  })
  return instance
}

// A site keeps the pick in its own storage key.
const createSiteI18n = (translation: Record<Lang, Record<string, unknown>>, storageKey: string) => {
  const instance = createI18n(translation, { chosen: () => asLang(readLocal(storageKey)) })
  const choose = (lang: Lang): void => {
    writeLocal(storageKey, lang)
    void instance.changeLanguage(lang)
  }
  return { i18n: instance, choose }
}

// A site builds its instance at start, while its language switch is wired at import, before there is one to switch
export const siteI18n = (translation: Record<Lang, Record<string, unknown>>, storageKey: string) => {
  let choose: ((lang: Lang) => void) | null = null
  return {
    init: (): void => {
      choose = createSiteI18n(translation, storageKey).choose
    },
    choose: (lang: Lang): void => choose?.(lang),
  }
}
