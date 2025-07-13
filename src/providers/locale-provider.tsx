'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type Locale = 'en' | 'vi'

interface Messages {
  [key: string]: string | Messages
}

interface LocaleContextValue {
  locale: Locale
  t: (key: string) => string
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

const loaders: Record<Locale, () => Promise<Messages>> = {
  en: () => import('../locales/en.json').then((mod) => mod.default as Messages),
  vi: () => import('../locales/vi.json').then((mod) => mod.default as Messages),
}

function getFromMessages(messages: Messages, key: string): string {
  return (
    (key
      .split('.')
      .reduce<unknown>(
        (obj, segment) => (typeof obj === 'object' && obj ? (obj as Messages)[segment] : undefined),
        messages,
      ) as string) ?? key
  )
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  const [messages, setMessages] = useState<Messages>({})

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved) setLocale(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('locale', locale)
    loaders[locale]().then(setMessages)
  }, [locale])

  const t = useCallback(
    (key: string) => {
      return getFromMessages(messages, key)
    },
    [messages],
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
