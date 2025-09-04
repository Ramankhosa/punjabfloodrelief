'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { t } from '@/lib/translations'

interface UserData {
  name: string
  mobile: string
  alternateNumber: string
}

interface UserDetailsFormProps {
  userData: UserData
  onUpdate: (data: Partial<UserData>) => void
  validationErrors?: Record<string, string>
}

export function UserDetailsForm({ userData, onUpdate, validationErrors = {} }: UserDetailsFormProps) {

  const validateMobile = (mobile: string) => {
    // Basic validation for Indian mobile numbers
    const cleanMobile = mobile.replace(/\D/g, '')
    return cleanMobile.length === 10 && /^[6-9]/.test(cleanMobile)
  }

  const handleMobileChange = (value: string) => {
    // Simple approach - just extract digits and limit to 10
    const digits = value.replace(/\D/g, '').slice(0, 10)
    onUpdate({ mobile: digits })
  }

  const isMobileValid = userData.mobile ? validateMobile(userData.mobile) : false

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <h2 className="text-xl font-semibold text-text">
        {t('userDetails.name')}
      </h2>

      <div className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">{t('userDetails.name')} *</Label>
          <Input
            id="name"
            type="text"
            value={userData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={t('userDetails.namePlaceholder')}
            className={`w-full ${validationErrors.name ? 'border-red-500' : ''}`}
            required
          />
          {validationErrors.name && (
            <p className="text-sm text-red-600">{validationErrors.name}</p>
          )}
        </div>

        {/* Mobile Field */}
        <div className="space-y-2">
          <Label htmlFor="mobile">{t('userDetails.mobile')} *</Label>
          <Input
            id="mobile"
            type="tel"
            value={userData.mobile}
            onChange={(e) => handleMobileChange(e.target.value)}
            placeholder="Enter 10 digit mobile number"
            className={`w-full ${validationErrors.mobile ? 'border-red-500' : ''}`}
            required
          />
          {validationErrors.mobile && (
            <p className="text-sm text-red-600">{validationErrors.mobile}</p>
          )}
        </div>

        {/* Alternate Number */}
        <div className="space-y-2">
          <Label htmlFor="alternateNumber">{t('userDetails.alternateNumber')}</Label>
          <Input
            id="alternateNumber"
            type="tel"
            value={userData.alternateNumber || ''}
            onChange={(e) => {
              // Simple formatting for alternate number
              const value = e.target.value.replace(/\D/g, '').slice(0, 10)
              let formatted = ''
              if (value.length >= 6) {
                formatted = `${value.slice(0, 5)} ${value.slice(5)}`
              } else if (value.length > 0) {
                formatted = value
              }
              onUpdate({ alternateNumber: formatted })
            }}
            placeholder="XXXXX XXXXX"
            className={`w-full ${validationErrors.alternateNumber ? 'border-red-500' : ''}`}
          />
          {validationErrors.alternateNumber && (
            <p className="text-sm text-red-600">{validationErrors.alternateNumber}</p>
          )}
        </div>
      </div>
    </div>
  )
}
