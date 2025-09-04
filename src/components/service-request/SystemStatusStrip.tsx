'use client'

import { Wifi, WifiOff, MapPin, AlertTriangle } from 'lucide-react'
import { t } from '@/lib/translations'

interface SystemStatusStripProps {
  locationPermission: 'granted' | 'denied' | 'prompt'
  isOnline: boolean
  networkQuality: 'good' | 'slow' | 'offline'
  locationAccuracy: number | null
}

export function SystemStatusStrip({
  locationPermission,
  isOnline,
  networkQuality,
  locationAccuracy
}: SystemStatusStripProps) {

  const getLocationStatus = () => {
    switch (locationPermission) {
      case 'granted':
        if (locationAccuracy) {
          return {
            text: t('consent.location.gpsSet', { accuracy: locationAccuracy }),
            color: 'text-green-600',
            icon: MapPin
          }
        }
        return {
          text: t('consent.location.gettingLocation'),
          color: 'text-blue-600',
          icon: MapPin
        }
      case 'denied':
        return {
          text: t('consent.location.gpsDenied'),
          color: 'text-red-600',
          icon: AlertTriangle
        }
      default:
        return null
    }
  }

  const getNetworkStatus = () => {
    if (!isOnline) {
      return {
        text: t('errors.offline'),
        color: 'text-red-600',
        icon: WifiOff
      }
    }

    switch (networkQuality) {
      case 'slow':
        return {
          text: 'Slow connection',
          color: 'text-yellow-600',
          icon: Wifi
        }
      case 'offline':
        return {
          text: t('errors.offline'),
          color: 'text-red-600',
          icon: WifiOff
        }
      default:
        return null
    }
  }

  const locationStatus = getLocationStatus()
  const networkStatus = getNetworkStatus()

  if (!locationStatus && !networkStatus) {
    return null
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="max-w-2xl mx-auto flex items-center space-x-4 text-sm">
        {locationStatus && (
          <div className={`flex items-center space-x-2 ${locationStatus.color}`}>
            <locationStatus.icon className="w-4 h-4" />
            <span>{locationStatus.text}</span>
          </div>
        )}

        {networkStatus && (
          <div className={`flex items-center space-x-2 ${networkStatus.color}`}>
            <networkStatus.icon className="w-4 h-4" />
            <span>{networkStatus.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}
