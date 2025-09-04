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

// Hindi translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    'nav.title': 'PFR – सहायता के लिए अनुरोध करें',
    'nav.helpline': 'हेल्पलाइन',
    'nav.privacyNotice': 'आपकी गोपनीयता सुरक्षित है। स्थान और संपर्क जानकारी को केवल अधिकृत राहत टीमों के साथ साझा किया जाता है।',
    'consent.purpose': 'कृपया अपनी जानकारी और आवश्यक सेवाएं बताएं।',
    'consent.location.gpsPrompt': 'कृपया अपनी GPS लोकेशन साझा करें',
    'consent.location.useGps': 'GPS का उपयोग करें',
    'consent.location.skip': 'GPS ना करें',
    'consent.location.gettingLocation': 'स्थान प्राप्त किया जा रहा है...',
    'consent.location.gpsSet': 'GPS सेट (±{accuracy}m)',
    'consent.location.gpsDenied': 'GPS अस्वीकृत',
    'consent.location.allowMessage': 'कृपया स्क्रीन पर आने वाला संदेश स्वीकार करें',
    'userDetails.name': 'नाम',
    'userDetails.namePlaceholder': 'अपना पूरा नाम दर्ज करें',
    'userDetails.mobile': 'मोबाइल नंबर',
    'userDetails.mobilePlaceholder': '+91 XXXXX XXXXX',
    'userDetails.alternateNumber': 'कोई दूसरा नंबर',
    'userDetails.alternateNumberPlaceholder': 'वैकल्पिक नंबर (वैकल्पिक)',
    'location.hierarchy.village': 'गांव',
    'location.hierarchy.district': 'जिला',
    'location.hierarchy.districtPlaceholder': 'जिला चुनें',
    'location.hierarchy.tehsil': 'तहसील',
    'location.hierarchy.tehsilPlaceholder': 'तहसील चुनें',
    'location.hierarchy.villagePlaceholder': 'गांव चुनें',
    'location.villageFinder.search': 'गांव खोजें...',
    'location.villageFinder.resultFormat': '{village} — {tehsil} — {district}',
    'location.or': 'या',
    'location.tools.suggestNearest': 'नजदीकी गांव सुझाएं',
    'location.tools.useGps': 'GPS का उपयोग करें',
    'services.title': 'आपको क्या चाहिए?',
    'services.food': 'खाना',
    'services.rescue': 'बचाव',
    'services.animalFodder': 'पशु चारा',
    'services.medicalEmergency': 'मेडिकल इमरजेंसी',
    'services.boat': 'नाव',
    'services.shelter': 'राहत शिविर',
    'serviceDetails.details': 'विवरण',
    'serviceDetails.food.peopleCount': 'लोगों की संख्या',
    'serviceDetails.food.needType': 'आवश्यकता का प्रकार',
    'serviceDetails.food.cookedFood': 'पकाया हुआ खाना',
    'serviceDetails.food.dryRation': 'सूखा राशन',
    'serviceDetails.food.duration': 'कितने दिनों के लिए?',
    'serviceDetails.food.today': 'आज',
    'serviceDetails.food.days3': '1–3 दिन',
    'serviceDetails.food.daysMore': '>3 दिन',
    'serviceDetails.rescue.peopleStranded': 'फंसे लोगों की संख्या',
    'serviceDetails.rescue.waterLevel': 'पानी का स्तर',
    'serviceDetails.rescue.knee': 'घुटने तक',
    'serviceDetails.rescue.waist': 'कमर तक',
    'serviceDetails.rescue.chest': 'छाती+',
    'serviceDetails.rescue.accessNotes': 'और सूचना?',
    'serviceDetails.animalFodder.animalsCount': 'जानवरों की संख्या',
    'serviceDetails.animalFodder.type': 'प्रकार',
    'serviceDetails.animalFodder.cattle': 'गाय',
    'serviceDetails.animalFodder.buffalo': 'भैंस',
    'serviceDetails.animalFodder.goatSheep': 'बकरी/भेड़',
    'serviceDetails.animalFodder.other': 'अन्य',
    'serviceDetails.animalFodder.urgency': 'तात्कालिकता',
    'serviceDetails.animalFodder.today': 'आज',
    'serviceDetails.animalFodder.hrs48': '48 घंटे',
    'serviceDetails.medicalEmergency.symptoms': 'लक्षण / आवश्यकता',
    'serviceDetails.medicalEmergency.patientCount': 'मरीजों की संख्या',
    'serviceDetails.medicalEmergency.critical': 'खून बहना / बेहोश / गंभीर',
    'serviceDetails.medicalEmergency.medication': 'दवा चाहिए?',
    'serviceDetails.medicalEmergency.call108': '108 पर कॉल करें',
    'serviceDetails.boat.peopleToMove': 'लोग ले जाने के लिए',
    'serviceDetails.boat.pickupLandmark': 'पिकअप लैंडमार्क',
    'serviceDetails.boat.waterFlow': 'पानी का बहाव',
    'serviceDetails.boat.calm': 'शांत',
    'serviceDetails.boat.fast': 'तेज',
    'serviceDetails.shelter.peopleCount': 'लोगों की संख्या',
    'serviceDetails.shelter.specialNeeds': 'विशेष आवश्यकताएं',
    'serviceDetails.shelter.elderly': 'बुजुर्ग',
    'serviceDetails.shelter.children': 'बच्चे',
    'serviceDetails.shelter.disabled': 'विकलांग व्यक्ति',
    'serviceDetails.shelter.daysNeeded': 'कितने दिनों के लिए?',
    'serviceDetails.shelter.women': 'महिलाएं',
    'serviceDetails.shelter.days1': '1',
    'serviceDetails.shelter.days2-3': '2–3',
    'serviceDetails.shelter.daysMore': '>3',
    'optional.note': 'कोई और जानकारी?',
    'optional.notePlaceholder': 'कोई अतिरिक्त जानकारी...',
    'optional.addPhoto': 'फोटो जोड़ें',
    'optional.recordAudio': 'ऑडियो संदेश रिकॉर्ड करें',
    'consent.submitNote': 'इस बटन को दबाने से आप राहत टीमों के साथ अपनी जानकारी साझा करने की अनुमति देते हैं।',
    'consent.submit': 'अनुरोध भेजें',
    'status.saving': 'सहेजा जा रहा है...',
    'validation.nameRequired': 'नाम आवश्यक है',
    'validation.mobileRequired': 'मोबाइल नंबर आवश्यक है',
    'validation.mobileInvalid': 'कृपया वैध मोबाइल नंबर दर्ज करें',
    'validation.villageRequired': 'कृपया अपना गांव चुनें',
    'validation.selectService': 'कृपया कम से कम एक सेवा चुनें',
    'validation.noteTooLong': 'नोट 120 अक्षरों से कम होना चाहिए',
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

export default function HindiServiceRequestPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'pa' | 'hi' | 'en'>('hi')

  // State management (same as English version)
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
