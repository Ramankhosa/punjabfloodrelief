'use client'

import { useState } from 'react'
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

// English translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    'nav.title': 'PFR - Service Request',
    'nav.helpline': 'Helpline',
    'nav.privacyNotice': 'Your privacy is protected. Location and contact information is shared only with authorized relief teams.',
    'consent.purpose': 'Please provide your information and required services.',
    'consent.location.gpsPrompt': 'Please share your GPS location',
    'consent.location.useGps': 'Use GPS',
    'consent.location.skip': 'Skip',
    'consent.location.gettingLocation': 'Getting location...',
    'consent.location.gpsSet': 'GPS set (±{accuracy}m)',
    'consent.location.gpsDenied': 'GPS denied',
    'userDetails.name': 'Name',
    'userDetails.namePlaceholder': 'Enter your full name',
    'userDetails.mobile': 'Mobile Number',
    'userDetails.mobilePlaceholder': '+91 XXXXX XXXXX',
    'userDetails.alternateNumber': 'Alternate Number',
    'userDetails.alternateNumberPlaceholder': 'Alternate number (optional)',
    'location.hierarchy.village': 'Village',
    'location.villageFinder.search': 'Find Village...',
    'services.title': 'What do you need?',
    'services.food': 'Food',
    'services.rescue': 'Rescue',
    'services.animalFodder': 'Animal Fodder',
    'services.medicalEmergency': 'Medical Emergency',
    'services.boat': 'Boat',
    'services.shelter': 'Relief Camp',
    'serviceDetails.shelter.specialNeeds': 'Special Needs',
    'serviceDetails.shelter.elderly': 'Elderly',
    'serviceDetails.shelter.children': 'Children',
    'serviceDetails.shelter.disabled': 'Persons with disability',
    'serviceDetails.shelter.women': 'Women',
    'serviceDetails.shelter.daysNeeded': 'How many days?',
    'optional.note': 'Any additional information?',
    'optional.notePlaceholder': 'Any additional information...',
    'optional.addPhoto': 'Add Photo',
    'optional.recordAudio': 'Record Audio Message',
    'consent.checkbox': 'Share my number & location with relief teams.',
    'consent.submit': 'Submit Request',
    'status.saving': 'Saving...',
    'validation.nameRequired': 'Name is required',
    'validation.mobileRequired': 'Mobile number is required',
    'validation.mobileInvalid': 'Please enter a valid mobile number',
    'validation.villageRequired': 'Please select your village',
    'validation.selectService': 'Please select at least one service',
    'validation.noteTooLong': 'Note must be less than 120 characters',
  }
  return translations[key] || key
}

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
  tehsil_id: string | null
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

export default function EnglishServiceRequestPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'pa' | 'hi' | 'en'>('en')

  // State management
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
    tehsil_id: null,
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

  // System status
  const [isOnline, setIsOnline] = useState(true)
  const [networkQuality, setNetworkQuality] = useState<'good' | 'slow' | 'offline'>('good')

  const handleLocationUpdate = (data: Partial<LocationData>) => {
    setLocationData(prev => ({ ...prev, ...data }))
  }

  const handleUserDataUpdate = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }))
  }

  const handleLocationSelectionUpdate = (data: Partial<LocationSelection>) => {
    setLocationSelection(prev => ({ ...prev, ...data }))
  }

  const handleServiceToggle = (service: keyof ServiceSelection) => {
    setServiceSelection(prev => ({
      ...prev,
      [service]: !prev[service]
    }))
  }

  const handleServiceDetailUpdate = (service: string, details: any) => {
    setServiceDetails(prev => ({
      ...prev,
      [service]: details
    }))
  }

  const isFormValid = () => {
    return (
      userData.name.trim() !== '' &&
      userData.mobile.trim() !== '' &&
      locationSelection.village_id !== null &&
      Object.values(serviceSelection).some(selected => selected)
    )
  }

  const handleSubmit = async () => {
    if (!isFormValid() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const submissionData = {
        name: userData.name,
        phone: userData.mobile ? `+91${userData.mobile}` : '',
        alternateNumber: userData.alternateNumber || null,
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
        note: optionalNote || null
      }

      console.log('Submitting request:', submissionData)

      await new Promise(resolve => setTimeout(resolve, 2000))

      const requestId = `PFR${Date.now().toString().slice(-8)}`
      const hasMedicalEmergency = serviceSelection.medicalEmergency

      window.location.href = `/service-request/confirmation?id=${requestId}&medical=${hasMedicalEmergency}`

    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
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
        {/* User Details */}
        <UserDetailsForm
          userData={userData}
          onUpdate={handleUserDataUpdate}
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
        />

        {/* Service Selection Grid */}
        <ServiceSelectionGrid
          selection={serviceSelection}
          onToggle={handleServiceToggle}
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
          {t('nav.privacyNotice')}
        </p>
      </footer>
    </div>
  )
}