import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { t as translate, type Locale, type TKey, getLocales, getLocaleLabel } from './i18n'

type LocaleCtx = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TKey) => string
  locales: { code: Locale; label: string }[]
}

const Ctx = createContext<LocaleCtx>({
  locale: 'en',
  setLocale: () => {},
  t: (key: TKey) => key,
  locales: [],
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem('polyfantasy_locale') as Locale | null
    return stored && ['en', 'ru'].includes(stored) ? stored : 'en'
  })

  const _setLocale = useCallback((l: Locale) => {
    setLocale(l)
    localStorage.setItem('polyfantasy_locale', l)
  }, [])

  const _t = useCallback((key: TKey) => translate(key, locale), [locale])

  const locales = getLocales().map(code => ({
    code: code as Locale,
    label: getLocaleLabel(code as Locale),
  }))

  return (
    <Ctx.Provider value={{ locale, setLocale: _setLocale, t: _t, locales }}>
      {children}
    </Ctx.Provider>
  )
}

export function useLocale() {
  return useContext(Ctx)
}
