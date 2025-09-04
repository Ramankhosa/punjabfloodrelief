'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Share2, MessageCircle, Phone, Copy, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/service-request/LanguageSwitcher'
import { TopBar } from '@/components/service-request/TopBar'
import { t } from '@/lib/translations'

export default function ConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentLanguage, setCurrentLanguage] = useState<'pa' | 'hi' | 'en'>('pa')
  const [requestId, setRequestId] = useState<string>('')
  const [isMedicalEmergency, setIsMedicalEmergency] = useState(false)

  useEffect(() => {
    // Get request ID from URL params
    const id = searchParams.get('id')
    const medical = searchParams.get('medical') === 'true'

    if (id) {
      setRequestId(id)
      setIsMedicalEmergency(medical)
    } else {
      // If no ID, redirect back to form
      router.push('/service-request')
    }
  }, [searchParams, router])

  const shareViaWhatsApp = () => {
    const message = t('confirmation.shareMessage', {
      requestId,
      defaultValue: `My flood relief request ID is ${requestId}. Please help!`
    })
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const shareViaSMS = () => {
    const message = t('confirmation.shareMessage', {
      requestId,
      defaultValue: `My flood relief request ID is ${requestId}. Please help!`
    })
    const url = `sms:?body=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(requestId)
      // You could show a toast notification here
      alert('Request ID copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = requestId
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Request ID copied to clipboard!')
    }
  }

  const call108 = () => {
    window.location.href = 'tel:108'
  }

  const submitAnother = () => {
    router.push('/service-request')
  }

  const goBack = () => {
    router.back()
  }

  if (!requestId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Bar */}
      <TopBar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">
              {t('confirmation.title')}
            </h1>
            <p className="text-muted">
              {t('confirmation.whatNext')}
            </p>
          </div>

          {/* Request ID */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text">
              {t('confirmation.requestId')}
            </h2>
            <div className="bg-white border-2 border-dashed border-accent rounded-lg p-4">
              <p className="text-2xl font-mono font-bold text-accent">
                {requestId}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center space-x-2 mx-auto"
            >
              <Copy className="w-4 h-4" />
              <span>Copy ID</span>
            </Button>
          </div>

          {/* Share Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">
              {t('confirmation.share')}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={shareViaWhatsApp}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </Button>
              <Button
                onClick={shareViaSMS}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>SMS</span>
              </Button>
            </div>
          </div>

          {/* Medical Emergency Call */}
          {isMedicalEmergency && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <Phone className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">
                  Medical Emergency
                </span>
              </div>
              <p className="text-sm text-red-700 mb-3">
                For immediate medical assistance, call the emergency helpline.
              </p>
              <Button
                onClick={call108}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Call 108 Emergency
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={goBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </Button>
            <Button
              onClick={submitAnother}
              className="flex items-center space-x-2"
            >
              <span>{t('confirmation.submitAnother')}</span>
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-muted">
          <p>
            Keep this request ID safe. You can use it to check the status of your request
            or provide updates to the relief teams.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-4 text-center text-sm text-muted mt-8">
        <p className="max-w-2xl mx-auto">
          {t('nav.privacyNotice') || 'Your privacy is protected. Location and contact information is shared only with authorized relief teams.'}
        </p>
      </footer>
    </div>
  )
}
