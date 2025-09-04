'use client'

import { t } from '@/lib/translations'
import {
  UtensilsCrossed,
  Shield,
  Leaf,
  Heart,
  Ship,
  Home
} from 'lucide-react'

interface ServiceSelection {
  food: boolean
  rescue: boolean
  animalFodder: boolean
  medicalEmergency: boolean
  boat: boolean
  shelter: boolean
}

interface ServiceSelectionGridProps {
  selection: ServiceSelection
  onToggle: (service: keyof ServiceSelection) => void
  validationErrors?: Record<string, string>
}

const services = [
  {
    key: 'food' as const,
    icon: UtensilsCrossed,
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600'
  },
  {
    key: 'rescue' as const,
    icon: Shield,
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600'
  },
  {
    key: 'animalFodder' as const,
    icon: Leaf,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600'
  },
  {
    key: 'medicalEmergency' as const,
    icon: Heart,
    color: 'bg-red-600',
    hoverColor: 'hover:bg-red-700'
  },
  {
    key: 'boat' as const,
    icon: Ship,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600'
  },
  {
    key: 'shelter' as const,
    icon: Home,
    color: 'bg-indigo-500',
    hoverColor: 'hover:bg-indigo-600'
  }
]

export function ServiceSelectionGrid({ selection, onToggle, validationErrors = {} }: ServiceSelectionGridProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-text mb-6">
        {t('services.title')}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {services.map(({ key, icon: Icon, color, hoverColor }) => {
          const isSelected = selection[key]

          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200 text-center group
                ${isSelected
                  ? `border-accent bg-accent/10 text-accent shadow-lg`
                  : `border-gray-300 bg-gray-50 text-accent hover:shadow-md hover:bg-accent hover:text-white hover:border-accent`
                }
              `}
            >
              <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? 'text-accent' : 'text-accent group-hover:text-white transition-colors duration-200'}`} />
              <div className={`font-medium text-sm ${isSelected ? '' : 'group-hover:text-white transition-colors duration-200'}`}>
                {t(`services.${key}`)}
              </div>

              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selection validation */}
      {validationErrors.services && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {validationErrors.services}
          </p>
        </div>
      )}
    </div>
  )
}
