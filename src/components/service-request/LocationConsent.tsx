'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/translations'

interface LocationConsentProps {
  onLocationUpdate: (data: { lat: number; lng: number; accuracy: number; source: 'gps' }) => void
  onPermissionChange: (permission: 'granted' | 'denied' | 'prompt') => void
  currentPermission: 'granted' | 'denied' | 'prompt'
}

export function LocationConsent({
  onLocationUpdate,
  onPermissionChange,
  currentPermission
}: LocationConsentProps) {
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [showAllowMessage, setShowAllowMessage] = useState(false)

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    setIsRequestingLocation(true)
    setShowAllowMessage(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude, accuracy } = position.coords

      onLocationUpdate({
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy),
        source: 'gps'
      })

      onPermissionChange('granted')
    } catch (error) {
      console.error('Error getting location:', error)
      onPermissionChange('denied')

      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location permission denied. Please enable location access and try again.')
            break
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.')
            break
          case error.TIMEOUT:
            alert('Location request timed out.')
            break
        }
      }
    } finally {
      setIsRequestingLocation(false)
    }
  }

  const skipLocation = () => {
    onPermissionChange('denied')
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="text-center">

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={requestLocation}
            disabled={isRequestingLocation}
            className="flex items-center space-x-2"
          >
            <MapPin className="w-4 h-4" />
            <span>
              {isRequestingLocation ? t('consent.location.gettingLocation') : t('consent.location.useGps')}
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={skipLocation}
            disabled={isRequestingLocation}
          >
            {t('consent.location.skip')}
          </Button>
        </div>

        {currentPermission === 'granted' && (
          <p className="text-sm text-green-600 mt-3">
            ✓ {t('consent.location.gpsSet', { accuracy: 'N/A' })}
          </p>
        )}

        {currentPermission === 'denied' && (
          <p className="text-sm text-muted mt-3">
            {t('consent.location.gpsDenied')}
          </p>
        )}

        {showAllowMessage && isRequestingLocation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {t('consent.location.allowMessage')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
