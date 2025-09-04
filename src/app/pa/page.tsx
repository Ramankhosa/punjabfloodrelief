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

// Punjabi translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    'nav.title': 'PFR – ਮਦਦ ਲਈ ਬੇਨਤੀ ਕਰੋ',
    'nav.helpline': 'ਹੈਲਪਲਾਈਨ',
    'nav.privacyNotice': 'ਤੁਹਾਡੀ ਗੋਪਨੀਯਤਾ ਸੁਰੱਖਿਅਤ ਹੈ। ਟਿਕਾਣਾ ਅਤੇ ਸੰਪਰਕ ਜਾਣਕਾਰੀ ਨੂੰ ਸਿਰਫ਼ ਅਧਿਕਾਰਤ ਰਾਹਤ ਟੀਮਾਂ ਨਾਲ ਸਾਂਝਾ ਕੀਤਾ ਜਾਂਦਾ ਹੈ।',
    'consent.purpose': 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਜਾਣਕਾਰੀ ਤੇ ਲੋੜੀਂਦੀ ਸੇਵਾ ਦੱਸੋ।',
    'consent.location.gpsPrompt': 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ GPS ਲੋਕੇਸ਼ਨ ਦਿਉ',
    'consent.location.useGps': 'GPS ਵਰਤੋ',
    'consent.location.skip': 'ਛੱਡੋ',
    'consent.location.gettingLocation': 'ਲੋਕੇਸ਼ਨ ਮਿਲ ਰਹੀ ਹੈ...',
    'consent.location.gpsSet': 'GPS ਸੈੱਟ (±{accuracy}m)',
    'consent.location.gpsDenied': 'GPS ਇਨਕਾਰ ਕੀਤਾ',
    'userDetails.name': 'ਨਾਮ',
    'userDetails.namePlaceholder': 'ਆਪਣਾ ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ',
    'userDetails.mobile': 'ਮੋਬਾਈਲ ਨੰਬਰ',
    'userDetails.mobilePlaceholder': '+91 XXXXX XXXXX',
    'userDetails.alternateNumber': 'ਕੋਈ ਦੂਸਰਾ ਨੰਬਰ',
    'userDetails.alternateNumberPlaceholder': 'ਵਿਕਲਪਿਕ ਨੰਬਰ (ਵਿਕਲਪਿਕ)',
    'location.hierarchy.village': 'ਪਿੰਡ',
    'location.villageFinder.search': 'ਪਿੰਡ ਲੱਭੋ...',
    'services.title': 'ਤੁਹਾਨੂੰ ਕੀ ਚਾਹੀਦਾ ਹੈ?',
    'services.food': 'ਖਾਣਾ',
    'services.rescue': 'ਬਚਾਅ',
    'services.animalFodder': 'ਪਸ਼ੂ ਚਾਰਾ',
    'services.medicalEmergency': 'ਤਬੀ ਐਮਰਜੈਂਸੀ',
    'services.boat': 'ਕਿਸ਼ਤੀ',
    'services.shelter': 'ਰਾਹਤ ਕੈਂਪ',
    'serviceDetails.shelter.specialNeeds': 'ਵਿਸ਼ੇਸ਼ ਲੋੜਾਂ',
    'serviceDetails.shelter.elderly': 'ਬੁਜ਼ੁਰਗ',
    'serviceDetails.shelter.children': 'ਬੱਚੇ',
    'serviceDetails.shelter.disabled': 'ਅਪਾਹਿਜ ਵਿਅਕਤੀ',
    'serviceDetails.shelter.women': 'ਔਰਤਾਂ',
    'serviceDetails.shelter.daysNeeded': 'ਕਿੰਨੇ ਦਿਨ ਵਾਸਤੇ?',
    'optional.note': 'ਕੋਈ ਹੋਰ ਜਾਣਕਾਰੀ?',
    'optional.notePlaceholder': 'ਕੋਈ ਵਾਧੂ ਜਾਣਕਾਰੀ...',
    'optional.addPhoto': 'ਫੋਟੋ ਸ਼ਾਮਲ ਕਰੋ',
    'optional.recordAudio': 'ਆਡੀਓ ਮੈਸੇਜ ਰਿਕਾਰਡ ਕਰੋ',
    'consent.checkbox': 'ਰਿਲੀਫ ਟੀਮਾਂ ਨਾਲ ਮੇਰਾ ਨੰਬਰ ਅਤੇ ਲੋਕੇਸ਼ਨ ਸ਼ੇਅਰ ਕਰੋ।',
    'consent.submit': 'ਬੇਨਤੀ ਭੇਜੋ',
    'status.saving': 'ਸੇਵ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...',
    'validation.nameRequired': 'ਨਾਮ ਲੋੜੀਂਦਾ ਹੈ',
    'validation.mobileRequired': 'ਮੋਬਾਈਲ ਨੰਬਰ ਲੋੜੀਂਦਾ ਹੈ',
    'validation.mobileInvalid': 'ਕਿਰਪਾ ਕਰਕੇ ਵੈਧ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ',
    'validation.villageRequired': 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪਿੰਡ ਚੁਣੋ',
    'validation.selectService': 'ਕਿਰਪਾ ਕਰਕੇ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਸੇਵਾ ਚੁਣੋ',
    'validation.noteTooLong': 'ਨੋਟ 120 ਅੱਖਰਾਂ ਤੋਂ ਘੱਟ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',
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

export default function PunjabiServiceRequestPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'pa' | 'hi' | 'en'>('pa')

  // State management (same as other versions)
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
      <TopBar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      <SystemStatusStrip
        locationPermission={locationPermission}
        isOnline={isOnline}
        networkQuality={networkQuality}
        locationAccuracy={locationData.accuracy}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <UserDetailsForm
          userData={userData}
          onUpdate={handleUserDataUpdate}
        />

        <LocationConsent
          onLocationUpdate={handleLocationUpdate}
          onPermissionChange={setLocationPermission}
          currentPermission={locationPermission}
        />

        <LocationFinder
          locationSelection={locationSelection}
          onUpdate={handleLocationSelectionUpdate}
          locationData={locationData}
          onLocationUpdate={handleLocationUpdate}
        />

        <ServiceSelectionGrid
          selection={serviceSelection}
          onToggle={handleServiceToggle}
        />

        <ServiceSubforms
          selection={serviceSelection}
          details={serviceDetails}
          onUpdate={handleServiceDetailUpdate}
        />

        <OptionalNotePhoto
          note={optionalNote}
          onNoteChange={setOptionalNote}
          networkQuality={networkQuality}
        />

        <ConsentSubmit
          isValid={isFormValid()}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-4 text-center text-sm text-muted">
        <p className="max-w-2xl mx-auto">
          {t('nav.privacyNotice')}
        </p>
      </footer>
    </div>
  )
}
