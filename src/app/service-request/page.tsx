'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { t } from '@/lib/translations'
import { LanguageSwitcher } from '@/components/service-request/LanguageSwitcher'
import { TopBar } from '@/components/service-request/TopBar'
import { SystemStatusStrip } from '@/components/service-request/SystemStatusStrip'
import { LocationConsent } from '@/components/service-request/LocationConsent'
import { UserDetailsForm } from '@/components/service-request/UserDetailsForm'
import { LocationFinder } from '@/components/service-request/LocationFinder'
import { ServiceSelectionGrid } from '@/components/service-request/ServiceSelectionGrid'
import { ServiceSubforms } from '@/components/service-request/ServiceSubforms'
import { OptionalNotePhoto } from '@/components/service-request/OptionalNotePhoto'
import { ConsentSubmit } from '@/components/service-request/ConsentSubmit'

type LocationData = {
  lat: number | null
  lng: number | null
  accuracy: number | null
  source: 'gps' | 'manual' | 'assisted'
}

type UserData = {
  name: string
  mobile: string
  alternateNumber: string
}

type LocationSelection = {
  district_id: string | null
  district_name: string | null
  tehsil_id: string | null
  tehsil_name: string | null
  village_id: string | null
  village_text: string | null
}

type ServiceSelection = {
  food: boolean
  rescue: boolean
  animalFodder: boolean
  medicalEmergency: boolean
  boat: boolean
  shelter: boolean
}

export default function ServiceRequestPage() {
  // Next.js router for reliable navigation
  const router = useRouter()

  // State management
  const [currentLanguage, setCurrentLanguage] = useState<'pa' | 'hi' | 'en'>('pa')
  const [locationData, setLocationData] = useState<LocationData>({
    lat: null,
    lng: null,
    accuracy: null,
    source: 'manual'
  })
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [userData, setUserData] = useState<UserData>({
    name: '',
    mobile: '',
    alternateNumber: ''
  })
  const [locationSelection, setLocationSelection] = useState<LocationSelection>({
    district_id: null,
    district_name: null,
    tehsil_id: null,
    tehsil_name: null,
    village_id: null,
    village_text: null
  })
  const [serviceSelection, setServiceSelection] = useState<ServiceSelection>({
    food: false,
    rescue: false,
    animalFodder: false,
    medicalEmergency: false,
    boat: false,
    shelter: false
  })
  const [serviceDetails, setServiceDetails] = useState<Record<string, any>>({})
  const [optionalNote, setOptionalNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // System status
  const [isOnline, setIsOnline] = useState(true)
  const [networkQuality, setNetworkQuality] = useState<'good' | 'slow' | 'offline'>('good')

  // Reset submitting state when component mounts
  useEffect(() => {
    console.log('Component mounted, resetting states')
    setIsSubmitting(false)
    setSubmitError(null)
    setValidationErrors({})
  }, [])

  // Debug effect to monitor isSubmitting state
  useEffect(() => {
    console.log('isSubmitting state changed to:', isSubmitting)
  }, [isSubmitting])

  // Cleanup effect to ensure states are reset on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up states')
      setIsSubmitting(false)
      setSubmitError(null)
      setValidationErrors({})
    }
  }, [])

  const handleLocationUpdate = (data: Partial<LocationData>) => {
    setLocationData(prev => ({ ...prev, ...data }))
  }

  const handleUserDataUpdate = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }))
    // Clear validation errors when user starts typing
    const hasErrors = Object.keys(data).some(key => validationErrors[key])
    if (hasErrors) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        if (data.name !== undefined) delete newErrors.name
        if (data.mobile !== undefined) delete newErrors.mobile
        if (data.alternateNumber !== undefined) delete newErrors.alternateNumber
        return newErrors
      })
    }
  }

  const handleLocationSelectionUpdate = (data: Partial<LocationSelection>) => {
    setLocationSelection(prev => ({ ...prev, ...data }))
    // Clear location validation errors
    const hasLocationData = Object.keys(data).some(key =>
      key.includes('village') || key.includes('district') || key.includes('tehsil')
    )
    if (hasLocationData && validationErrors.location) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.location
        return newErrors
      })
    }
  }

  const handleServiceToggle = (service: keyof ServiceSelection) => {
    setServiceSelection(prev => ({
      ...prev,
      [service]: !prev[service]
    }))
    // Clear service validation errors if they exist
    if (validationErrors.services) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.services
        return newErrors
      })
    }
  }

  const handleServiceDetailUpdate = (service: string, details: any) => {
    setServiceDetails(prev => ({
      ...prev,
      [service]: details
    }))
  }

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Name validation
    if (!userData.name.trim()) {
      errors.name = 'Name is required'
    } else if (userData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    // Phone validation
    if (!userData.mobile.trim()) {
      errors.mobile = 'Mobile number is required'
    } else if (!/^[6-9]\d{9}$/.test(userData.mobile.replace(/\s+/g, ''))) {
      errors.mobile = 'Please enter a valid 10-digit mobile number'
    }

    // Alternate phone validation (if provided)
    if (userData.alternateNumber.trim()) {
      if (!/^[6-9]\d{9}$/.test(userData.alternateNumber.replace(/\s+/g, ''))) {
        errors.alternateNumber = 'Please enter a valid 10-digit mobile number'
      }
    }

    // Location validation
    if (!locationSelection.village_id) {
      errors.location = 'Please select your village'
    }

    // Service validation
    if (!Object.values(serviceSelection).some(selected => selected)) {
      errors.services = 'Please select at least one service you need'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isFormValid = () => {
    // Check basic requirements without triggering validation
    return (
      userData.name.trim().length >= 2 &&
      userData.mobile.trim().length === 10 &&
      /^[6-9]\d{9}$/.test(userData.mobile.replace(/\s+/g, '')) &&
      (!userData.alternateNumber.trim() || /^[6-9]\d{9}$/.test(userData.alternateNumber.replace(/\s+/g, ''))) &&
      locationSelection.village_id !== null &&
      Object.values(serviceSelection).some(selected => selected)
    )
  }

  const handleSubmit = async () => {
    console.log('handleSubmit called, isSubmitting:', isSubmitting)

    // Clear previous errors
    setSubmitError(null)

    // Validate form before submission
    if (!validateForm()) {
      setSubmitError('Please correct the errors above and try again.')
      return
    }

    if (isSubmitting) {
      console.log('Already submitting, returning early')
      return
    }

    console.log('Setting isSubmitting to true')
    setIsSubmitting(true)

    try {
      // Clean and prepare submission data
      const cleanPhone = userData.mobile.replace(/\s+/g, '')
      const cleanAltPhone = userData.alternateNumber ? userData.alternateNumber.replace(/\s+/g, '') : null

      const submissionData = {
        name: userData.name.trim(),
        phone: cleanPhone,
        alternateNumber: cleanAltPhone,
        lang: currentLanguage,
        location: locationData,
        admin: locationSelection,
        needs: Object.keys(serviceSelection).filter(key => serviceSelection[key as keyof ServiceSelection]),
        details: serviceDetails,
        client: {
          offline_id: null,
          ts: new Date().toISOString(),
          net: networkQuality
        },
        note: optionalNote.trim() || null
      }

      // Submit to API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }))

        // Handle specific error types
        if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid request data. Please check your information.')
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(errorData.error || 'Failed to submit request')
        }
      }

      const result = await response.json()

      if (!result.request_number) {
        throw new Error('Invalid response from server')
      }

      console.log('Request submitted successfully:', result)

      // Check if medical emergency is selected
      const hasMedicalEmergency = serviceSelection.medicalEmergency

      console.log('Navigating to confirmation page with request number:', result.request_number)

      // Navigate to confirmation page with actual request number
      router.push(`/service-request/confirmation?id=${result.request_number}&medical=${hasMedicalEmergency}`)

    } catch (error) {
      console.error('Submission failed:', error)

      let errorMessage = 'An unexpected error occurred. Please try again.'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.'
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        } else {
          errorMessage = error.message
        }
      }

      setSubmitError(errorMessage)

      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      console.log('Finally block: resetting isSubmitting to false')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Bar */}
      <TopBar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      {/* System Status Strip */}
      <SystemStatusStrip
        locationPermission={locationPermission}
        isOnline={isOnline}
        networkQuality={networkQuality}
        locationAccuracy={locationData.accuracy}
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Error Messages */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 text-red-600">⚠️</div>
              <p className="text-red-800 font-medium">Error</p>
            </div>
            <p className="text-red-700 mt-1">{submitError}</p>
          </div>
        )}

        {/* User Details */}
        <UserDetailsForm
          userData={userData}
          onUpdate={handleUserDataUpdate}
          validationErrors={validationErrors}
        />

        {/* Location Consent */}
        <LocationConsent
          onLocationUpdate={handleLocationUpdate}
          onPermissionChange={setLocationPermission}
          currentPermission={locationPermission}
        />

        {/* Location Finder */}
        <LocationFinder
          locationSelection={locationSelection}
          onUpdate={handleLocationSelectionUpdate}
          locationData={locationData}
          onLocationUpdate={handleLocationUpdate}
          validationErrors={validationErrors}
        />

        {/* Service Selection Grid */}
        <ServiceSelectionGrid
          selection={serviceSelection}
          onToggle={handleServiceToggle}
          validationErrors={validationErrors}
        />

        {/* Service Sub-forms */}
        <ServiceSubforms
          selection={serviceSelection}
          details={serviceDetails}
          onUpdate={handleServiceDetailUpdate}
        />

        {/* Optional Note & Photo */}
        <OptionalNotePhoto
          note={optionalNote}
          onNoteChange={setOptionalNote}
          networkQuality={networkQuality}
        />

        {/* Consent & Submit */}
        <ConsentSubmit
          isValid={isFormValid()}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-4 text-center text-sm text-muted">
        <p className="max-w-2xl mx-auto">
          {t('nav.privacyNotice') || 'Your privacy is protected. Location and contact information is shared only with authorized relief teams.'}
        </p>
      </footer>
    </div>
  )
}
