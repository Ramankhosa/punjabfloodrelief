'use client'

import { t } from '@/lib/translations'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface ConsentSubmitProps {
  isValid: boolean
  isSubmitting: boolean
  onSubmit: () => void
}

export function ConsentSubmit({
  isValid,
  isSubmitting,
  onSubmit
}: ConsentSubmitProps) {

  console.log('ConsentSubmit render - isValid:', isValid, 'isSubmitting:', isSubmitting)

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Consent Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          {t('consent.submitNote')}
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{t('status.saving')}</span>
            </div>
          ) : (
            t('consent.submit')
          )}
        </Button>

        {/* Validation Messages */}
        {!isValid && (
          <div className="mt-4 space-y-2 text-sm text-red-600">
            <p>• Please fill in all required information to continue</p>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="pt-4 border-t">
        <p className="text-xs text-muted text-center">
          Your information will only be used for flood relief operations and will be handled according to privacy regulations.
          Authorized relief teams include government agencies, NGOs, and emergency services.
        </p>
      </div>
    </div>
  )
}
