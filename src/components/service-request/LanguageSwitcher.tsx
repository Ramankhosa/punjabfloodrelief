'use client'

import { useRouter, usePathname } from 'next/navigation'
import { t } from '@/lib/translations'

interface LanguageSwitcherProps {
  currentLanguage: 'pa' | 'hi' | 'en'
  onLanguageChange: (lang: 'pa' | 'hi' | 'en') => void
}

export function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()

  const languages = [
    { code: 'pa' as const, label: t('nav.languages.punjabi') },
    { code: 'hi' as const, label: t('nav.languages.hindi') },
    { code: 'en' as const, label: t('nav.languages.english') }
  ]

  const handleLanguageChange = (lang: 'pa' | 'hi' | 'en') => {
    onLanguageChange(lang)
    // In a real app, you'd update the URL locale here
    // For now, we'll just update the local state
    // router.push(`/${lang}${pathname}`)
  }

  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            currentLanguage === lang.code
              ? 'bg-white text-accent shadow-sm font-medium'
              : 'text-text hover:text-accent'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
