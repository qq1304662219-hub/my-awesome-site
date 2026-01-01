"use client"

import { create } from 'zustand'
import { zh } from './locales/zh'
import { en } from './locales/en'

type Locale = 'zh' | 'en'
type Translations = typeof zh

interface I18nStore {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
}

export const useI18n = create<I18nStore>((set) => ({
  locale: 'zh',
  t: zh,
  setLocale: (locale) => set({ locale, t: locale === 'zh' ? zh : en }),
}))

// Helper to access nested keys with dot notation (optional, but typed access is better)
// For now, we expose the full typed object 't'
