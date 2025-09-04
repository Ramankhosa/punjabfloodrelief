// Temporary translation utility until i18n is fixed
export const t = (key: string): string => {
  const translations: Record<string, string> = {
    // Navigation
    'nav.title': 'PFR – ਮਦਦ ਲਈ ਬੇਨਤੀ ਕਰੋ',
    'nav.helpline': 'ਹੈਲਪਲਾਈਨ',
    'nav.privacyNotice': 'Your privacy is protected. Location and contact information is shared only with authorized relief teams.',
    'nav.languages.punjabi': 'ਪੰਜਾਬੀ',
    'nav.languages.hindi': 'हिन्दी',
    'nav.languages.english': 'English',

    // Consent & Location
    'consent.purpose': 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਜਾਣਕਾਰੀ ਤੇ ਲੋੜੀਂਦੀ ਸੇਵਾ ਦੱਸੋ।',
    'consent.location.useGps': 'GPS ਵਰਤੋ',
    'consent.location.skip': 'GPS ਨਾ ਵਰਤੋ',
    'consent.location.gettingLocation': 'ਲੋਕੇਸ਼ਨ ਮਿਲ ਰਹੀ ਹੈ...',
    'consent.location.gpsSet': 'GPS ਸੈੱਟ (±{accuracy}m)',
    'consent.location.gpsDenied': 'GPS ਇਨਕਾਰ ਕੀਤਾ',
    'consent.location.allowMessage': 'ਕਿਰਪਾ ਕਰਕੇ ਸਕਰੀਨ ਤੇ ਆਉਣ ਵਾਲਾ ਸੁਨੇਹਾ ਮਨਜ਼ੂਰ ਕਰੋ',

    // User Details
    'userDetails.name': 'ਨਾਮ',
    'userDetails.namePlaceholder': 'ਆਪਣਾ ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ',
    'userDetails.mobile': 'ਮੋਬਾਈਲ ਨੰਬਰ',
    'userDetails.mobilePlaceholder': '+91 XXXXX XXXXX',
    'userDetails.alternateNumber': 'ਕੋਈ ਦੂਸਰਾ ਨੰਬਰ',
    'userDetails.alternateNumberPlaceholder': 'ਵਿਕਲਪਿਕ ਨੰਬਰ (ਵਿਕਲਪਿਕ)',

    // Location
    'location.hierarchy.village': 'ਪਿੰਡ',
    'location.hierarchy.district': 'ਜ਼ਿਲਾ',
    'location.hierarchy.districtPlaceholder': 'ਜ਼ਿਲਾ ਚੁਣੋ',
    'location.hierarchy.tehsil': 'ਤਹਿਸੀਲ',
    'location.hierarchy.tehsilPlaceholder': 'ਤਹਿਸੀਲ ਚੁਣੋ',
    'location.hierarchy.villagePlaceholder': 'ਪਿੰਡ ਚੁਣੋ',
    'location.villageFinder.search': 'ਪਿੰਡ ਲੱਭੋ...',
    'location.villageFinder.resultFormat': '{village} — {tehsil} — {district}',
    'location.or': 'ਜਾਂ',
    'location.tools.suggestNearest': 'ਨਜ਼ਦੀਕੀ ਪਿੰਡ ਸੁਝਾਓ',
    'location.tools.useGps': 'GPS ਵਰਤੋ',

    // Services
    'services.title': 'ਤੁਹਾਨੂੰ ਕੀ ਚਾਹੀਦਾ ਹੈ?',
    'services.food': 'ਖਾਣਾ',
    'services.rescue': 'ਬਚਾਅ',
    'services.animalFodder': 'ਪਸ਼ੂ ਚਾਰਾ',
    'services.medicalEmergency': 'ਮੈਡੀਕਲ ਐਮਰਜੈਂਸੀ',
    'services.boat': 'ਕਿਸ਼ਤੀ',
    'services.shelter': 'ਰਾਹਤ ਕੈਂਪ',

    // Service Details
    'serviceDetails.details': 'ਵੇਰਵੇ',
    'serviceDetails.food.peopleCount': 'ਲੋਕਾਂ ਦੀ ਗਿਣਤੀ',
    'serviceDetails.food.needType': 'ਲੋੜ ਦੀ ਕਿਸਮ',
    'serviceDetails.food.cookedFood': 'ਪਕਾਇਆ ਖਾਣਾ',
    'serviceDetails.food.dryRation': 'ਸੁੱਕਾ ਰਾਸ਼ਨ',
    'serviceDetails.food.duration': 'ਕਿੰਨੇ ਦਿਨਾਂ ਵਾਸਤੇ?',
    'serviceDetails.food.today': 'ਅੱਜ',
    'serviceDetails.food.days3': '1–3 ਦਿਨ',
    'serviceDetails.food.daysMore': '>3 ਦਿਨ',

    'serviceDetails.rescue.peopleStranded': 'ਫਸੇ ਲੋਕਾਂ ਦੀ ਗਿਣਤੀ',
    'serviceDetails.rescue.waterLevel': 'ਪਾਣੀ ਦਾ ਲੈਵਲ',
    'serviceDetails.rescue.knee': 'ਗੋਡੇ ਤੱਕ',
    'serviceDetails.rescue.waist': 'ਕਮਰ ਤੱਕ',
    'serviceDetails.rescue.chest': 'ਛਾਤੀ+',
    'serviceDetails.rescue.accessNotes': 'ਹੋਰ ਸੂਚਨਾ?',

    'serviceDetails.animalFodder.animalsCount': 'ਜਾਨਵਰਾਂ ਦੀ ਗਿਣਤੀ',
    'serviceDetails.animalFodder.type': 'ਕਿਸਮ',
    'serviceDetails.animalFodder.cattle': 'ਗਾਵਾਂ',
    'serviceDetails.animalFodder.buffalo': 'ਮੱਝਾਂ',
    'serviceDetails.animalFodder.goatSheep': 'ਬੱਕਰੀਆਂ/ਭੇਡ਼ਾਂ',
    'serviceDetails.animalFodder.other': 'ਹੋਰ',
    'serviceDetails.animalFodder.urgency': 'ਜ਼ਰੂਰਤ',
    'serviceDetails.animalFodder.today': 'ਅੱਜ',
    'serviceDetails.animalFodder.hrs48': '48 ਘੰਟੇ',

    'serviceDetails.medicalEmergency.symptoms': 'ਲੱਛਣ / ਲੋੜ',
    'serviceDetails.medicalEmergency.patientCount': 'ਮਰੀਜ਼ਾਂ ਦੀ ਗਿਣਤੀ',
    'serviceDetails.medicalEmergency.critical': 'ਖੂਨ ਨਿਕਲਣਾ / ਬੇਹੋਸ਼ / ਗੰਭੀਰ',
    'serviceDetails.medicalEmergency.medication': 'ਦਵਾਈ ਚਾਹੀਦੀ?',
    'serviceDetails.medicalEmergency.call108': '108 ਕਾਲ ਕਰੋ',

    'serviceDetails.boat.peopleToMove': 'ਲੋਕ ਲਿਜਾਣੇ',
    'serviceDetails.boat.pickupLandmark': 'ਪਿਕਅੱਪ ਲੈਂਡਮਾਰਕ',
    'serviceDetails.boat.waterFlow': 'ਪਾਣੀ ਦਾ ਵਹਾਅ',
    'serviceDetails.boat.calm': 'ਸ਼ਾਂਤ',
    'serviceDetails.boat.fast': 'ਤੇਜ਼',

    'serviceDetails.shelter.peopleCount': 'ਲੋਕਾਂ ਦੀ ਗਿਣਤੀ',
    'serviceDetails.shelter.specialNeeds': 'ਵਿਸ਼ੇਸ਼ ਲੋੜਾਂ',
    'serviceDetails.shelter.elderly': 'ਬੁਜ਼ੁਰਗ',
    'serviceDetails.shelter.children': 'ਬੱਚੇ',
    'serviceDetails.shelter.disabled': 'ਅਪਾਹਿਜ ਵਿਅਕਤੀ',
    'serviceDetails.shelter.women': 'ਔਰਤਾਂ',
    'serviceDetails.shelter.daysNeeded': 'ਕਿੰਨੇ ਦਿਨ ਵਾਸਤੇ?',
    'serviceDetails.shelter.days1': '1',
    'serviceDetails.shelter.days2-3': '2–3',
    'serviceDetails.shelter.daysMore': '>3',

    // Optional
    'optional.note': 'ਕੋਈ ਹੋਰ ਜਾਣਕਾਰੀ?',
    'optional.notePlaceholder': 'ਕੋਈ ਵਾਧੂ ਜਾਣਕਾਰੀ...',
    'optional.addPhoto': 'ਫੋਟੋ ਸ਼ਾਮਲ ਕਰੋ',
    'optional.recordAudio': 'ਆਡੀਓ ਮੈਸੇਜ ਰਿਕਾਰਡ ਕਰੋ',

    // Consent & Submit
    'consent.submitNote': 'ਇਸ ਬਟਨ ਨੂੰ ਦਬਾਉਣ ਨਾਲ ਤੁਸੀਂ ਰਿਲੀਫ ਟੀਮਾਂ ਨਾਲ ਆਪਣੀ ਜਾਣਕਾਰੀ ਸਾਂਝੀ ਕਰਨ ਦੀ ਮਨਜ਼ੂਰੀ ਦਿੰਦੇ ਹੋ।',
    'consent.submit': 'ਬੇਨਤੀ ਭੇਜੋ',

    // Status
    'status.saving': 'ਸੇਵ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...',
    'status.saving': 'ਸੇਵ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...',
    'status.retry': 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
    'status.accuracyLow': 'GPS ਐਕਿਊਰੇਸੀ ਘੱਟ—ਪਿੰਡ ਮੈਨੂਅਲੀ ਚੁਣੋ।',

    // Validation
    'validation.nameRequired': 'ਨਾਮ ਲੋੜੀਂਦਾ ਹੈ',
    'validation.mobileRequired': 'ਮੋਬਾਈਲ ਨੰਬਰ ਲੋੜੀਂਦਾ ਹੈ',
    'validation.mobileInvalid': 'ਕਿਰਪਾ ਕਰਕੇ ਵੈਧ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ',
    'validation.villageRequired': 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪਿੰਡ ਚੁਣੋ',
    'validation.selectService': 'ਕਿਰਪਾ ਕਰਕੇ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਸੇਵਾ ਚੁਣੋ',
    'validation.noteTooLong': 'ਨੋਟ 120 ਅੱਖਰਾਂ ਤੋਂ ਘੱਟ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',

    // Confirmation
    'confirmation.title': 'ਬੇਨਤੀ ਮਿਲ ਗਈ!',
    'confirmation.requestId': 'ਬੇਨਤੀ ID',
    'confirmation.whatNext': 'ਰੈਸਕਿਊ ਟੀਮਾਂ ਜ਼ਰੂਰਤ ਅਨੁਸਾਰ ਬੇਨਤੀਆਂ ਦੀ ਪ੍ਰਾਈਓਰਿਟੀ ਬਣਾ ਰਹੀਆਂ ਹਨ।',
    'confirmation.share': 'ਸ਼ੇਅਰ ਕਰੋ',
    'confirmation.submitAnother': 'ਇੱਕ ਹੋਰ ਬੇਨਤੀ ਭੇਜੋ',
    'confirmation.addUpdate': 'ਬਾਅਦ ਵਿੱਚ ਅਪਡੇਟ ਸ਼ਾਮਲ ਕਰੋ',
  }

  return translations[key] || key
}
