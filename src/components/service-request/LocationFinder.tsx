'use client'

import { useState, useEffect } from 'react'
import { t } from '@/lib/translations'
import { Search, MapPin, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LocationSelection {
  district_id: string | null
  district_name: string | null
  tehsil_id: string | null
  tehsil_name: string | null
  village_id: string | null
  village_text: string | null
}

interface LocationData {
  lat: number | null
  lng: number | null
  accuracy: number | null
  source: 'gps' | 'manual' | 'assisted'
}

interface LocationFinderProps {
  locationSelection: LocationSelection
  onUpdate: (data: Partial<LocationSelection>) => void
  locationData: LocationData
  onLocationUpdate: (data: Partial<LocationData>) => void
  validationErrors?: Record<string, string>
}

interface Location {
  id: string
  code: string
  name: string
  tehsil_code?: string
  district_code?: string
  tehsil_name?: string
  district_name?: string
}

export function LocationFinder({
  locationSelection,
  onUpdate,
  locationData,
  onLocationUpdate,
  validationErrors = {}
}: LocationFinderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [states, setStates] = useState<Location[]>([])
  const [districts, setDistricts] = useState<Location[]>([])
  const [tehsils, setTehsils] = useState<Location[]>([])
  const [villages, setVillages] = useState<Location[]>([])

  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [selectedTehsil, setSelectedTehsil] = useState<string>('')

  // Load initial data and populate based on existing selection
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load states first
        const response = await fetch('/api/public/locations')
        const data = await response.json()
        const statesData = data.states.map((state: any) => ({
          id: state.state_code,
          code: state.state_code,
          name: state.state_name
        }))
        setStates(statesData)

        // Find Punjab state (assuming it's the primary state for this app)
        const punjabState = statesData.find((state: any) => state.name.toLowerCase().includes('punjab'))
        const defaultStateCode = punjabState ? punjabState.code : (statesData.length > 0 ? statesData[0].code : '')

        if (defaultStateCode) {
          // Load districts for the default state
          const districtsResponse = await fetch(`/api/public/locations?action=districts&stateCode=${defaultStateCode}`)
          const districtsData = await districtsResponse.json()
          const districtsMapped = districtsData.districts.map((district: any) => ({
            id: district.district_code,
            code: district.district_code,
            name: district.district_name
          }))
          setDistricts(districtsMapped)
        }

        // If we already have a district selected, load tehsils
        if (locationSelection.district_id) {
          loadTehsils(locationSelection.district_id)
        }
        // If we already have a tehsil selected, load villages
        if (locationSelection.tehsil_id) {
          loadVillages(locationSelection.tehsil_id)
        }
      } catch (error) {
        console.error('Error initializing location data:', error)
      }
    }

    initializeData()
  }, [])

  // Sync internal state with locationSelection prop
  useEffect(() => {
    if (locationSelection.district_id && districts.length > 0) {
      const district = districts.find(d => d.id === locationSelection.district_id)
      if (district) {
        setSelectedDistrict(district.code)
      }
    }
    if (locationSelection.tehsil_id && tehsils.length > 0) {
      const tehsil = tehsils.find(t => t.id === locationSelection.tehsil_id)
      if (tehsil) {
        setSelectedTehsil(tehsil.code)
      }
    }
  }, [locationSelection.district_id, locationSelection.tehsil_id, districts, tehsils])

  const loadDistricts = async (stateCode: string) => {
    try {
      const response = await fetch(`/api/public/locations?action=districts&stateCode=${stateCode}`)
      const data = await response.json()
      setDistricts(data.districts.map((district: any) => ({
        id: district.district_code,
        code: district.district_code,
        name: district.district_name
      })))
    } catch (error) {
      console.error('Error loading districts:', error)
    }
  }

  const loadDistrictsForVillage = async (districtCode: string) => {
    try {
      // We need to find the state that contains this district
      // For now, let's assume Punjab state (common for this app)
      const response = await fetch('/api/public/locations')
      const data = await response.json()
      const punjabState = data.states.find((state: any) => state.state_name.toLowerCase().includes('punjab'))

      if (punjabState) {
        const districtsResponse = await fetch(`/api/public/locations?action=districts&stateCode=${punjabState.state_code}`)
        const districtsData = await districtsResponse.json()
        const districtsMapped = districtsData.districts.map((district: any) => ({
          id: district.district_code,
          code: district.district_code,
          name: district.district_name
        }))
        setDistricts(districtsMapped)
        setSelectedDistrict(districtCode)
      }
    } catch (error) {
      console.error('Error loading districts for village:', error)
    }
  }

  const loadTehsils = async (districtCode: string) => {
    try {
      const response = await fetch(`/api/public/locations?action=tehsils&districtCode=${districtCode}`)
      const data = await response.json()
      const tehsilsMapped = data.tehsils.map((tehsil: any) => ({
        id: tehsil.tehsil_code,
        code: tehsil.tehsil_code,
        name: tehsil.tehsil_name
      }))
      setTehsils(tehsilsMapped)
      return tehsilsMapped
    } catch (error) {
      console.error('Error loading tehsils:', error)
      return []
    }
  }

  const loadVillages = async (tehsilCode: string) => {
    try {
      const response = await fetch(`/api/public/locations?action=villages&tehsilCode=${tehsilCode}`)
      const data = await response.json()
      const villagesMapped = data.villages.map((village: any) => ({
        id: village.village_code,
        code: village.village_code,
        name: village.village_name,
        tehsil_code: village.tehsil?.tehsil_code,
        district_code: village.tehsil?.district?.district_code,
        tehsil_name: village.tehsil?.tehsil_name,
        district_name: village.tehsil?.district?.district_name
      }))
      setVillages(villagesMapped)
      return villagesMapped
    } catch (error) {
      console.error('Error loading villages:', error)
      return []
    }
  }

  const searchVillages = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/public/locations?action=search&q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.villages.slice(0, 10))
    } catch (error) {
      console.error('Error searching villages:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const findNearestVillages = async () => {
    if (!locationData.lat || !locationData.lng) return

    try {
      const response = await fetch(
        `/api/public/locations?action=nearest&lat=${locationData.lat}&lng=${locationData.lng}`
      )
      const data = await response.json()
      setSearchResults(data.villages.slice(0, 5))
    } catch (error) {
      console.error('Error finding nearest villages:', error)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchVillages(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode)
    setSelectedDistrict('')
    setSelectedTehsil('')
    setDistricts([])
    setTehsils([])
    setVillages([])
    loadDistricts(stateCode)
  }

  const handleDistrictChange = (districtCode: string) => {
    setSelectedDistrict(districtCode)
    setSelectedTehsil('')
    setTehsils([])
    setVillages([])
    loadTehsils(districtCode)

    // Update location selection - clear dependent fields
    const selectedDistrictObj = districts.find(d => d.code === districtCode)
    if (selectedDistrictObj) {
      onUpdate({
        district_id: selectedDistrictObj.id,
        tehsil_id: null,  // Clear tehsil when district changes
        village_id: null, // Clear village when district changes
        village_text: null
      })
    }
  }

  const handleTehsilChange = (tehsilCode: string) => {
    setSelectedTehsil(tehsilCode)
    setVillages([])
    loadVillages(tehsilCode)

    // Update location selection - clear dependent fields
    const selectedTehsilObj = tehsils.find(t => t.code === tehsilCode)
    if (selectedTehsilObj) {
      onUpdate({
        tehsil_id: selectedTehsilObj.id,
        village_id: null, // Clear village when tehsil changes
        village_text: null
      })
    }
  }

  const handleVillageSelect = (village: any) => {
    const districtCode = village.tehsil?.district?.district_code
    const tehsilCode = village.tehsil?.tehsil_code

    // Update the location selection
    onUpdate({
      village_id: village.village_code,
      village_text: village.village_name,
      district_id: districtCode || null,
      district_name: village.tehsil?.district?.district_name || null,
      tehsil_id: tehsilCode || null,
      tehsil_name: village.tehsil?.tehsil_name || null
    })

    // Ensure hierarchical dropdowns are populated
    if (districtCode) {
      // Load districts if not already loaded
      if (districts.length === 0) {
        loadDistrictsForVillage(districtCode)
      } else {
        // Set the selected district
        setSelectedDistrict(districtCode)
      }

      // Load tehsils for this district
      if (tehsilCode) {
        loadTehsils(districtCode).then(() => {
          setSelectedTehsil(tehsilCode)

          // Load villages for this tehsil
          loadVillages(tehsilCode)
        })
      }
    }

    setSearchQuery('')
    setSearchResults([])
  }

  const handleUseGps = () => {
    if (locationData.lat && locationData.lng) {
      findNearestVillages()
    }
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <h2 className="text-xl font-semibold text-text">
        {t('location.hierarchy.village')} *
      </h2>

      {/* Village Finder (Fast Path) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('location.villageFinder.search')}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {searchResults.map((village) => (
              <button
                key={village.village_code}
                onClick={() => handleVillageSelect(village)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{village.village_name}</div>
                <div className="text-sm text-gray-600">
                  {t('location.villageFinder.resultFormat', {
                    village: village.village_name,
                    tehsil: village.tehsil?.tehsil_name || '',
                    district: village.tehsil?.district?.district_name || ''
                  })}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Quick Tools */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseGps}
            disabled={!locationData.lat || !locationData.lng}
            className="flex items-center space-x-2"
          >
            <MapPin className="w-4 h-4" />
            <span>{t('location.tools.suggestNearest')}</span>
          </Button>
        </div>
      </div>

      {/* OR Divider */}
      <div className="flex items-center justify-center py-4">
        <div className="border-t border-gray-300 flex-1"></div>
        <span className="px-4 text-text font-medium">{t('location.or')}</span>
        <div className="border-t border-gray-300 flex-1"></div>
      </div>

      {/* Hierarchical Browsing (Fallback) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-text">
          {t('location.hierarchy.district')}
        </h3>

        {/* PROJECT RULE: All dropdown menus must have solid backgrounds for readability */}
        {/* CSS variables ensure dropdowns are never transparent - see globals.css */}

        <div className="grid grid-cols-1 gap-4">
          {/* State Selection (if needed in future) */}

          {/* District Selection */}
          <div className="bg-white border border-gray-300 rounded-md p-3 space-y-2">
            <label className="text-sm font-medium text-gray-700">District</label>
            <Select
              value={locationSelection.district_id || ''}
              onValueChange={(districtCode) => {
                const selectedDistrictObj = districts.find(d => d.code === districtCode)
                if (selectedDistrictObj) {
                  setSelectedDistrict(districtCode)
                  onUpdate({
                    district_id: selectedDistrictObj.id,
                    district_name: selectedDistrictObj.name,
                    tehsil_id: null,
                    tehsil_name: null,
                    village_id: null,
                    village_text: null
                  })
                  setSelectedTehsil('')
                  setTehsils([])
                  setVillages([])
                  loadTehsils(districtCode)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('location.hierarchy.districtPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district.code} value={district.code}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tehsil Selection */}
          <div className="bg-white border border-gray-300 rounded-md p-3 space-y-2">
            <label className="text-sm font-medium text-gray-700">Tehsil</label>
            <Select
              value={locationSelection.tehsil_id || ''}
              onValueChange={(tehsilCode) => {
                const selectedTehsilObj = tehsils.find(t => t.code === tehsilCode)
                if (selectedTehsilObj) {
                  setSelectedTehsil(tehsilCode)
                  onUpdate({
                    tehsil_id: selectedTehsilObj.id,
                    tehsil_name: selectedTehsilObj.name,
                    village_id: null,
                    village_text: null
                  })
                  setVillages([])
                  loadVillages(tehsilCode)
                }
              }}
              disabled={!locationSelection.district_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('location.hierarchy.tehsilPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {tehsils.map((tehsil) => (
                  <SelectItem key={tehsil.code} value={tehsil.code}>
                    {tehsil.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Village Selection */}
          <div className="bg-white border border-gray-300 rounded-md p-3 space-y-2">
            <label className="text-sm font-medium text-gray-700">Village</label>
            <Select
              value={locationSelection.village_id || ''}
              onValueChange={(villageCode) => {
                const selectedVillage = villages.find(v => v.code === villageCode)
                if (selectedVillage) {
                  onUpdate({
                    village_id: selectedVillage.id,
                    village_text: selectedVillage.name,
                    district_id: selectedVillage.district_code,
                    district_name: selectedVillage.district_name,
                    tehsil_id: selectedVillage.tehsil_code,
                    tehsil_name: selectedVillage.tehsil_name
                  })
                }
              }}
              disabled={!locationSelection.tehsil_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('location.hierarchy.villagePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {villages.map((village) => (
                  <SelectItem key={village.code} value={village.code}>
                    {village.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Location Display within Hierarchical Section */}
          {locationSelection.village_text && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">
                  Selected Location
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {locationSelection.district_name && (
                  <div className="text-green-700">
                    <span className="font-medium">District:</span> {locationSelection.district_name}
                  </div>
                )}
                {locationSelection.tehsil_name && (
                  <div className="text-green-700">
                    <span className="font-medium">Tehsil:</span> {locationSelection.tehsil_name}
                  </div>
                )}
                <div className="text-green-700">
                  <span className="font-medium">Village:</span> {locationSelection.village_text}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location validation */}
      {validationErrors.location && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {validationErrors.location}
          </p>
        </div>
      )}

    </div>
  )
}
