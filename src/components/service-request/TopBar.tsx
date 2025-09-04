'use client'

import { Phone } from 'lucide-react'
import { t } from '@/lib/translations'
import { LanguageSwitcher } from './LanguageSwitcher'

interface TopBarProps {
  currentLanguage: 'pa' | 'hi' | 'en'
  onLanguageChange: (lang: 'pa' | 'hi' | 'en') => void
}

export function TopBar({ currentLanguage, onLanguageChange }: TopBarProps) {

  const handleHelplineClick = () => {
    // Open phone dialer with helpline number
    window.location.href = 'tel:108'
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PFR</span>
            </div>
            <h1 className="text-lg font-semibold text-text">
              {t('nav.title')}
            </h1>
          </div>

          {/* Right: Language Switcher + Helpline */}
          <div className="flex items-center space-x-3">
            <LanguageSwitcher
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />

            <button
              onClick={handleHelplineClick}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              aria-label="Call helpline"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.helpline')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
