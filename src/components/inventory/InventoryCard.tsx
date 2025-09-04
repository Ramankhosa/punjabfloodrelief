'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus,
  X,
  MapPin,
  Clock,
  Users,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Save,
  Trash2,
  Copy,
  Package
} from 'lucide-react'

interface InventoryCardProps {
  groupId?: string
  providerId?: string
  onSave?: (entry: any) => void
  onCancel?: () => void
  initialData?: any
  minimal?: boolean
}

export function InventoryCard({
  groupId,
  providerId,
  onSave,
  onCancel,
  initialData,
  minimal = false
}: InventoryCardProps) {
  // Core state - item selection and quantities
  const [itemTypeId, setItemTypeId] = useState(initialData?.item_type_id || '')
  const [quantityTotal, setQuantityTotal] = useState(initialData?.quantity_total || '')
  const [quantityAvailable, setQuantityAvailable] = useState(initialData?.quantity_available || '')

  // Location details
  const [districtCode, setDistrictCode] = useState(initialData?.district_code || '')
  const [tehsilCode, setTehsilCode] = useState(initialData?.tehsil_code || '')
  const [villageCode, setVillageCode] = useState(initialData?.village_code || '')

  // Item details
  const [condition, setCondition] = useState(initialData?.condition || 'NEW')
  const [batchNumber, setBatchNumber] = useState(initialData?.batch_number || '')
  const [expiryDate, setExpiryDate] = useState(initialData?.expiry_date || '')
  const [storageLocation, setStorageLocation] = useState(initialData?.storage_location || '')

  // Availability details
  const [availabilityMode, setAvailabilityMode] = useState(initialData?.availability_mode || 'IMMEDIATE')
  const [availableFrom, setAvailableFrom] = useState(initialData?.available_from || '')
  const [availableUntil, setAvailableUntil] = useState(initialData?.available_until || '')
  const [responseHours, setResponseHours] = useState(initialData?.response_hours || 24)

  // Provider details
  const [alias, setAlias] = useState(initialData?.provider?.alias || '')
  const [contactType, setContactType] = useState(initialData?.provider?.contact_type || 'masked')
  const [contactValue, setContactValue] = useState(initialData?.provider?.contact_value || '')
  const [contactVisibility, setContactVisibility] = useState(initialData?.provider?.visibility?.contact || 'coordinators')

  // Other details
  const [visibility, setVisibility] = useState(initialData?.visibility || 'PUBLIC')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>(initialData?.evidence_urls || [])

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(!minimal)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [districts, setDistricts] = useState<any[]>([])
  const [tehsils, setTehsils] = useState<any[]>([])
  const [villages, setVillages] = useState<any[]>([])
  const [itemTypes, setItemTypes] = useState<any[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load data
  useEffect(() => {
    loadDistricts()
    loadItemTypes()
  }, [])

  useEffect(() => {
    if (districtCode) {
      loadTehsils(districtCode)
      setTehsilCode('')
      setVillageCode('')
    }
  }, [districtCode])

  useEffect(() => {
    if (tehsilCode) {
      loadVillages(tehsilCode)
      setVillageCode('')
    }
  }, [tehsilCode])

  // Mark changes when form data changes
  useEffect(() => {
    if (!initialData) { // Only for new entries
      setHasUnsavedChanges(true)
    }
  }, [
    itemTypeId, quantityTotal, quantityAvailable, districtCode, tehsilCode, villageCode,
    condition, batchNumber, expiryDate, storageLocation, availabilityMode, availableFrom,
    availableUntil, responseHours, alias, contactType, contactValue, contactVisibility,
    visibility, notes, evidenceUrls
  ])

  const loadItemTypes = async () => {
    try {
      setLoadingTypes(true)
      const response = await fetch('/api/inventory-item-types')
      if (response.ok) {
        const data = await response.json()
        setItemTypes(data.itemTypes || [])
      }
    } catch (error) {
      console.error('Error loading item types:', error)
    } finally {
      setLoadingTypes(false)
    }
  }

  const loadDistricts = async () => {
    try {
      const response = await fetch('/api/locations?type=districts')
      const data = await response.json()
      setDistricts(data.districts || [])
    } catch (error) {
      console.error('Error loading districts:', error)
    }
  }

  const loadTehsils = async (districtCode: string) => {
    try {
      const response = await fetch(`/api/locations?type=tehsils&districtCode=${districtCode}`)
      const data = await response.json()
      setTehsils(data.tehsils || [])
    } catch (error) {
      console.error('Error loading tehsils:', error)
    }
  }

  const loadVillages = async (tehsilCode: string) => {
    try {
      const response = await fetch(`/api/locations?type=villages&tehsilCode=${tehsilCode}`)
      const data = await response.json()
      setVillages(data.villages || [])
    } catch (error) {
      console.error('Error loading villages:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!itemTypeId) {
      newErrors.itemType = 'Please select an item type'
    }
    if (!districtCode) {
      newErrors.district = 'District is required'
    }
    if (!tehsilCode) {
      newErrors.tehsil = 'Tehsil is required'
    }
    if (!quantityTotal || quantityTotal <= 0) {
      newErrors.quantityTotal = 'Valid total quantity is required'
    }
    if (quantityAvailable !== '' && quantityAvailable < 0) {
      newErrors.quantityAvailable = 'Available quantity cannot be negative'
    }
    if (quantityAvailable !== '' && quantityTotal && quantityAvailable > quantityTotal) {
      newErrors.quantityAvailable = 'Available quantity cannot exceed total quantity'
    }
    if (!contactValue) {
      newErrors.contact = 'Contact information is required'
    }
    if (availabilityMode === 'SCHEDULED') {
      if (!availableFrom || !availableUntil) {
        newErrors.availability = 'Date range is required for scheduled availability'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const payload = {
        ...(groupId && { groupId }),
        ...(providerId && { providerId }),
        itemTypeId,
        districtCode,
        tehsilCode,
        ...(villageCode && { villageCode }),
        quantityTotal: parseInt(quantityTotal),
        ...(quantityAvailable !== '' && { quantityAvailable: parseInt(quantityAvailable) }),
        condition,
        ...(batchNumber && { batchNumber }),
        ...(expiryDate && { expiryDate }),
        ...(storageLocation && { storageLocation }),
        availabilityMode,
        ...(availabilityMode === 'SCHEDULED' && {
          availableFrom,
          availableUntil
        }),
        ...(availabilityMode === 'ON_REQUEST' && { responseHours: parseInt(responseHours) }),
        visibility,
        ...(alias && { alias }),
        contactType,
        contactValue,
        contactVisibility,
        ...(notes && { notes }),
        ...(evidenceUrls.length > 0 && { evidenceUrls })
      }

      console.log('Sending payload to API:', payload)

      const method = initialData ? 'PUT' : 'POST'
      const url = initialData
        ? `/api/inventory/${initialData.entry_id}`
        : '/api/inventory'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      let data: any
      try {
        data = await response.json()
      } catch {
        data = await response.text()
      }

      if (!response.ok) {
        console.error('API Error Response:', data)
        throw new Error(data.error || `Failed to save inventory entry (${response.status})`)
      }

      onSave?.(data.entry)
    } catch (error) {
      console.error('Error saving inventory entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save inventory entry'
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicate = () => {
    // Reset ID and create new
    const newData = { ...initialData }
    delete newData.entry_id
    delete newData.created_at
    delete newData.updated_at
    // Call onSave with modified data to create new entry
    onSave?.(newData)
  }

  const addEvidenceUrl = () => {
    setEvidenceUrls([...evidenceUrls, ''])
  }

  const updateEvidenceUrl = (index: number, value: string) => {
    const newUrls = [...evidenceUrls]
    newUrls[index] = value
    setEvidenceUrls(newUrls)
  }

  const removeEvidenceUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          {initialData ? 'Edit Inventory Entry' : 'Add New Inventory Item'}
        </CardTitle>
        <CardDescription>
          {minimal
            ? 'Quick setup - fill only the essentials'
            : 'Set up inventory details with granular availability control'
          }
        </CardDescription>

        {/* Status indicators */}
        <div className="flex items-center gap-2 text-sm mt-2">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errors.general}
          </div>
        )}

        {/* Item Type Selection */}
        <div>
          <Label className="text-base font-medium flex items-center gap-2">
            <Package className="w-4 h-4" />
            Item Type *
          </Label>
          <div className="mt-3">
            {loadingTypes ? (
              <div className="text-sm text-gray-500">Loading item types...</div>
            ) : itemTypes.length === 0 ? (
              <div className="text-sm text-gray-500">No item types available</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  itemTypes.reduce((acc, type) => {
                    if (!acc[type.category]) acc[type.category] = []
                    acc[type.category].push(type)
                    return acc
                  }, {} as Record<string, any[]>)
                ).map(([category, types]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-muted mb-2">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {types.map((type) => {
                        const isSelected = itemTypeId === type.item_type_id

                        return (
                          <button
                            key={type.item_type_id}
                            type="button"
                            onClick={() => setItemTypeId(type.item_type_id)}
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                              isSelected
                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {type.icon && <span>{type.icon}</span>}
                              <div>
                                <div className="font-medium">{type.name}</div>
                                <div className="text-xs text-gray-500">{type.unit}</div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.itemType && (
            <p className="text-sm text-red-600 mt-1">{errors.itemType}</p>
          )}
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantityTotal" className="text-sm font-medium">Total Quantity *</Label>
            <Input
              id="quantityTotal"
              type="number"
              min="1"
              value={quantityTotal}
              onChange={(e) => setQuantityTotal(e.target.value)}
              placeholder="e.g., 100"
              className="mt-1"
            />
            {errors.quantityTotal && (
              <p className="text-sm text-red-600 mt-1">{errors.quantityTotal}</p>
            )}
          </div>

          <div>
            <Label htmlFor="quantityAvailable" className="text-sm font-medium">Available Quantity</Label>
            <Input
              id="quantityAvailable"
              type="number"
              min="0"
              value={quantityAvailable}
              onChange={(e) => setQuantityAvailable(e.target.value)}
              placeholder="Leave empty to match total"
              className="mt-1"
            />
            {errors.quantityAvailable && (
              <p className="text-sm text-red-600 mt-1">{errors.quantityAvailable}</p>
            )}
          </div>
        </div>

        {/* Location Selection */}
        <div>
          <Label className="text-base font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location *
          </Label>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="district" className="text-sm">District</Label>
              <select
                id="district"
                value={districtCode}
                onChange={(e) => setDistrictCode(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.district_code} value={district.district_code}>
                    {district.district_name}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="text-sm text-red-600 mt-1">{errors.district}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tehsil" className="text-sm">Tehsil/Sub-district</Label>
              <select
                id="tehsil"
                value={tehsilCode}
                onChange={(e) => setTehsilCode(e.target.value)}
                disabled={!districtCode}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Tehsil</option>
                {tehsils.map((tehsil) => (
                  <option key={tehsil.tehsil_code} value={tehsil.tehsil_code}>
                    {tehsil.tehsil_name}
                  </option>
                ))}
              </select>
              {errors.tehsil && (
                <p className="text-sm text-red-600 mt-1">{errors.tehsil}</p>
              )}
            </div>

            <div>
              <Label htmlFor="village" className="text-sm">Village (Optional)</Label>
              <select
                id="village"
                value={villageCode}
                onChange={(e) => setVillageCode(e.target.value)}
                disabled={!tehsilCode}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">All villages in tehsil</option>
                {villages.map((village) => (
                  <option key={village.village_code} value={village.village_code}>
                    {village.village_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div>
          <Label className="text-base font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Availability *
          </Label>

          <div className="mt-3 space-y-3">
            <div className="flex gap-3">
              {[
                { key: 'IMMEDIATE', label: 'Available Immediately' },
                { key: 'SCHEDULED', label: 'Available on Schedule' },
                { key: 'ON_REQUEST', label: 'Available on Request' },
                { key: 'LIMITED_TIME', label: 'Limited Time Only' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAvailabilityMode(key)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    availabilityMode === key
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {availabilityMode === 'SCHEDULED' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from" className="text-sm">Available From</Label>
                  <Input
                    id="from"
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="until" className="text-sm">Available Until</Label>
                  <Input
                    id="until"
                    type="date"
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {availabilityMode === 'ON_REQUEST' && (
              <div>
                <Label htmlFor="hours" className="text-sm">Response within (hours)</Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  max="72"
                  value={responseHours}
                  onChange={(e) => setResponseHours(parseInt(e.target.value))}
                  className="mt-1 w-32"
                />
              </div>
            )}

            {errors.availability && (
              <p className="text-sm text-red-600">{errors.availability}</p>
            )}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        {!minimal && (
          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>
        )}

        {/* Advanced Options */}
        {(showAdvanced || minimal) && (
          <div className="space-y-4 pt-4">
            {/* Condition and Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition" className="text-sm font-medium">Condition</Label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>

              <div>
                <Label htmlFor="visibility" className="text-sm font-medium">Visibility</Label>
                <select
                  id="visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="COORDINATORS">Only verified coordinators</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
            </div>

            {/* Item Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batchNumber" className="text-sm font-medium">Batch Number (Optional)</Label>
                <Input
                  id="batchNumber"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g., BATCH-2024-001"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="storageLocation" className="text-sm font-medium">Storage Location (Optional)</Label>
              <Input
                id="storageLocation"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g., Warehouse A, Shelf 3"
                className="mt-1"
              />
            </div>

            {/* Evidence URLs */}
            <div>
              <Label className="text-sm font-medium">Evidence URLs (Photos/Videos)</Label>
              <div className="mt-2 space-y-2">
                {evidenceUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => updateEvidenceUrl(index, e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEvidenceUrl(index)}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEvidenceUrl}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Evidence URL
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Additional Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about this inventory item..."
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <div className="flex gap-2">
            {initialData && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </Button>
            )}
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : initialData ? 'Update' : 'Add Item'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
