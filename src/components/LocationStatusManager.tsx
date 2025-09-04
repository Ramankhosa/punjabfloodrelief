'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertTriangle,
  MapPin,
  ChevronDown,
  ChevronRight,
  Edit,
  AlertCircle,
  Info,
  Loader2,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface Location {
  code: string
  name: string
  type: 'state' | 'district' | 'tehsil' | 'village'
  state_code?: string
  district_code?: string
  tehsil_code?: string
  village_code?: string
  alerts?: Alert[]
  children?: Location[]
}

interface Alert {
  alert_id: string
  category_id: string
  status_id: string
  location_type: 'state' | 'district' | 'tehsil' | 'village'
  state_code?: string
  district_code?: string
  tehsil_code?: string
  village_code?: string
  notes?: string
  severity: 'info' | 'warning' | 'critical'
  is_active: boolean
  category: {
    category_id: string
    name: string
    description?: string
  }
  status: {
    status_id: string
    name: string
    value: string
    color: string
  }
  created_by: {
    user_id: string
    primary_login: string
  }
  updated_by?: {
    user_id: string
    primary_login: string
  }
}

interface AlertCategory {
  category_id: string
  name: string
  description?: string
  statuses: AlertStatus[]
}

interface AlertStatus {
  status_id: string
  name: string
  value: string
  color: string
}

export default function LocationStatusManager() {
  const [locations, setLocations] = useState<Location[]>([])
  const [categories, setCategories] = useState<AlertCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isVillageStatusDialogOpen, setIsVillageStatusDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingCategory, setEditingCategory] = useState<AlertCategory | null>(null)
  const [selectedBulkLocations, setSelectedBulkLocations] = useState<Set<string>>(new Set())

  // Dropdown states for nested UI
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set())

  // Form states
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [alertNotes, setAlertNotes] = useState('')
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkNotes, setBulkNotes] = useState('')


  useEffect(() => {
    loadData()
  }, [])


  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        toast.error('Authentication required')
        console.error('No access token found in localStorage')
        return
      }

      console.log('Access token found, making API calls...')

      // Test basic API connectivity first
      try {
        const testResponse = await fetch('/api/test')
        console.log('Test API response:', testResponse.ok, testResponse.status)
        if (!testResponse.ok) {
          console.error('Basic API test failed')
          toast.error('API server not responding')
          return
        }
      } catch (testError) {
        console.error('Test API call failed:', testError)
        toast.error('Cannot connect to API server')
        return
      }

      // Load locations and alerts in parallel
      const [locationsResponse, categoriesResponse, alertsResponse] = await Promise.all([
        fetch('/api/admin/locations', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }),
        fetch('/api/admin/alerts', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }),
        fetch('/api/admin/alerts/locations?include_inactive=true', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })
      ])

      if (locationsResponse.ok && categoriesResponse.ok && alertsResponse.ok) {
        const locationsData = await locationsResponse.json()
        const categoriesData = await categoriesResponse.json()
        const alertsData = await alertsResponse.json()

        // Build hierarchical location structure
        const allAlerts = [
          ...alertsData.alerts.states,
          ...alertsData.alerts.districts,
          ...alertsData.alerts.tehsils,
          ...alertsData.alerts.villages
        ]

        const hierarchicalLocations = buildLocationHierarchy(locationsData, allAlerts)

        console.log('Refreshing location data:', {
          locationsCount: hierarchicalLocations.length,
          categoriesCount: categoriesData.categories.length,
          alertsCount: allAlerts.length
        })

        setLocations(hierarchicalLocations)
        setCategories(categoriesData.categories)
      } else {
        // Better error handling
        const errors = []
        if (!locationsResponse.ok) errors.push('locations')
        if (!categoriesResponse.ok) errors.push('categories')
        if (!alertsResponse.ok) errors.push('alerts')

        console.error('API Response Details:', {
          locations: {
            ok: locationsResponse.ok,
            status: locationsResponse.status,
            statusText: locationsResponse.statusText,
            url: locationsResponse.url
          },
          categories: {
            ok: categoriesResponse.ok,
            status: categoriesResponse.status,
            statusText: categoriesResponse.statusText,
            url: categoriesResponse.url
          },
          alerts: {
            ok: alertsResponse.ok,
            status: alertsResponse.status,
            statusText: alertsResponse.statusText,
            url: alertsResponse.url
          }
        })

        // Try to get error details from responses
        try {
          if (!locationsResponse.ok) {
            const errorData = await locationsResponse.text()
            console.error('Locations API error:', errorData)
          }
          if (!categoriesResponse.ok) {
            const errorData = await categoriesResponse.text()
            console.error('Categories API error:', errorData)
          }
          if (!alertsResponse.ok) {
            const errorData = await alertsResponse.text()
            console.error('Alerts API error:', errorData)
          }
        } catch (parseError) {
          console.error('Error parsing API responses:', parseError)
        }

        toast.error(`Failed to load: ${errors.join(', ')}`)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error loading location status data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const buildLocationHierarchy = (locationsData: {
    states: Array<{
      state_code: string;
      state_name: string;
      districts: Array<{
        district_code: string;
        district_name: string;
        tehsils: Array<{
          tehsil_code: string;
          tehsil_name: string;
          villages: Array<{
            village_code: string;
            village_name: string;
          }>;
        }>;
      }>;
    }>;
  }, allAlerts: Alert[]): Location[] => {
    const { states } = locationsData

    return states.map((state) => ({
      code: state.state_code,
      name: state.state_name,
      type: 'state' as const,
      state_code: state.state_code,
      alerts: allAlerts.filter((a) => a.state_code === state.state_code) || [],
      children: state.districts.map((district) => ({
        code: district.district_code,
        name: district.district_name,
        type: 'district' as const,
        state_code: state.state_code,
        district_code: district.district_code,
        alerts: allAlerts.filter((a) => a.district_code === district.district_code) || [],
        children: district.tehsils.map((tehsil) => ({
          code: tehsil.tehsil_code,
          name: tehsil.tehsil_name,
          type: 'tehsil' as const,
          state_code: state.state_code,
          district_code: district.district_code,
          tehsil_code: tehsil.tehsil_code,
          alerts: allAlerts.filter((a) => a.tehsil_code === tehsil.tehsil_code) || [],
          children: tehsil.villages.map((village) => ({
            code: village.village_code,
            name: village.village_name,
            type: 'village' as const,
            state_code: state.state_code,
            district_code: district.district_code,
            tehsil_code: tehsil.tehsil_code,
            village_code: village.village_code,
            alerts: allAlerts.filter((a) => a.village_code === village.village_code) || []
          }))
        }))
      }))
    }))
  }

  // Helper function to get location codes based on hierarchy
  const getLocationCodes = (location: Location) => {
    const codes: { state_code?: string; district_code?: string; tehsil_code?: string; village_code?: string } = {}

    // Return the codes that are already set on the location object
    if (location.state_code) codes.state_code = location.state_code
    if (location.district_code) codes.district_code = location.district_code
    if (location.tehsil_code) codes.tehsil_code = location.tehsil_code
    if (location.village_code) codes.village_code = location.village_code

    return codes
  }

  const toggleLocationExpansion = (locationCode: string) => {
    const newExpanded = new Set(expandedLocations)
    if (newExpanded.has(locationCode)) {
      newExpanded.delete(locationCode)
    } else {
      newExpanded.add(locationCode)
    }
    setExpandedLocations(newExpanded)
  }



  const toggleLocationSelection = (locationCode: string) => {
    const newSelected = new Set(selectedLocations)
    if (newSelected.has(locationCode)) {
      newSelected.delete(locationCode)
    } else {
      newSelected.add(locationCode)
    }
    setSelectedLocations(newSelected)
  }

  const getAlertForCategory = (location: Location, categoryId: string): Alert | undefined => {
    return location.alerts && Array.isArray(location.alerts)
      ? location.alerts.find(alert => alert.category_id === categoryId && alert.is_active)
      : undefined
  }

  const getStatusColor = (color: string) => {
    switch (color.toLowerCase()) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200'
      case 'green': return 'bg-green-100 text-green-800 border-green-200'
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'gray': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }



  const openIndividualStatusDialog = (location: Location, category: AlertCategory) => {
    const existingAlert = getAlertForCategory(location, category.category_id)

    setEditingLocation(location)
    setEditingCategory(category)
    setSelectedCategory(category.category_id)
    setSelectedStatus(existingAlert?.status_id || '')
    setAlertNotes(existingAlert?.notes || '')
    setIsEditDialogOpen(true)
  }

  const openVillageStatusDialog = (location: Location) => {
    // Open overview dialog showing all categories
    setEditingLocation(location)
    setEditingCategory(null) // Reset editing category when opening overview
    setIsVillageStatusDialogOpen(true)
  }

  const saveAlert = async () => {
    if (!editingLocation || !selectedCategory || !selectedStatus) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        toast.error('Authentication required')
        return
      }

      // Check if there's an existing alert for this location and category
      const existingAlert = editingLocation ? getAlertForCategory(editingLocation, selectedCategory) : null

      // Use POST for new alerts, PATCH for updating existing ones
      const method = existingAlert ? 'PATCH' : 'POST'
      const url = existingAlert
        ? `/api/admin/alerts/locations/${editingLocation.code}?type=${editingLocation.type}&category_id=${selectedCategory}`
        : '/api/admin/alerts/locations'

      const requestBody = existingAlert ? {
        status_id: selectedStatus,
        notes: alertNotes,
        is_active: true
      } : {
        ...getLocationCodes(editingLocation),
        location_code: editingLocation.code,
        location_type: editingLocation.type,
        category_id: selectedCategory,
        status_id: selectedStatus,
        notes: alertNotes,
        is_active: true
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        toast.success(existingAlert ? 'Alert updated successfully' : 'Alert created successfully')
        setIsEditDialogOpen(false)

        // Store current state before resetting
        const wasVillageDialogOpen = isVillageStatusDialogOpen
        const currentEditingLocation = editingLocation

        // Reset form states and add a small delay to ensure the dialog closes before refreshing data
        setSelectedStatus('')
        setAlertNotes('')
        setEditingLocation(null)
        setEditingCategory(null)

        setTimeout(() => {
          loadData()

          // If the village status overview dialog was open, we need to force a re-render
          // by temporarily closing and reopening it to show updated data
          if (wasVillageDialogOpen && currentEditingLocation) {
            console.log('Refreshing village status overview dialog with updated data')
            setIsVillageStatusDialogOpen(false)
            setTimeout(() => {
              setEditingLocation(currentEditingLocation)
              setEditingCategory(null) // Reset category selection
              setIsVillageStatusDialogOpen(true)
            }, 150)
          }
        }, 100)
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${existingAlert ? 'update' : 'create'} alert`)
      }
    } catch (error) {
      console.error('Error saving alert:', error)
      toast.error('Error saving alert')
    }
  }


  const bulkUpdateAlerts = async () => {
    if (!bulkCategory || !bulkStatus || selectedBulkLocations.size === 0) {
      toast.error('Please select category, status, and at least one location')
      return
    }

    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        toast.error('Authentication required')
        return
      }

      const locationCodes = Array.from(selectedBulkLocations)
      const locationType = locationCodes[0].startsWith('D') ? 'district' : 'tehsil'

      const response = await fetch('/api/admin/alerts/locations', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: bulkCategory,
          status_id: bulkStatus,
          location_type: locationType,
          location_codes: locationCodes,
          notes: bulkNotes,
          is_active: true
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Updated ${result.summary.total} locations (${result.summary.created} created, ${result.summary.updated} updated)`)
        setIsBulkDialogOpen(false)
        setSelectedBulkLocations(new Set())

        // Reset bulk form states and add a small delay to ensure the dialog closes before refreshing data
        setBulkCategory('')
        setBulkStatus('')
        setBulkNotes('')

        setTimeout(() => {
          loadData()
        }, 100)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to bulk update alerts')
      }
    } catch (error) {
      console.error('Error bulk updating alerts:', error)
      toast.error('Error bulk updating alerts')
    }
  }

  const renderLocationRow = (location: Location, depth = 0, isLastChild = false, parentExpanded = true) => {
    if (!location) return null

    const hasChildren = location.children && location.children.length > 0
    const isExpanded = expandedLocations.has(location.code)
    const isSelected = selectedLocations.has(location.code)

    // Enhanced indentation with better visual hierarchy
    const indentSize = depth * 24 // 24px per level for clear separation
    const indentStyle = { paddingLeft: `${indentSize}px` }

    // Color coding for different location types
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'state': return 'text-blue-700 font-semibold'
        case 'district': return 'text-green-700 font-medium'
        case 'tehsil': return 'text-orange-700'
        case 'village': return 'text-gray-700'
        default: return 'text-gray-700'
      }
    }

    // Background color for different levels
    const getLevelBackground = (depth: number) => {
      switch (depth) {
        case 0: return 'bg-blue-50/30' // State level - very light blue
        case 1: return 'bg-green-50/20' // District level - very light green
        case 2: return 'bg-orange-50/20' // Tehsil level - very light orange
        case 3: return 'bg-gray-50/20' // Village level - very light gray
        default: return ''
      }
    }

    // Icon for different location types
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'state': return '🏛️'
        case 'district': return '🏢'
        case 'tehsil': return '🏘️'
        case 'village': return '🏠'
        default: return '📍'
      }
    }

    return (
      <div key={location.code}>
        {/* Hierarchical connecting lines */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 flex items-center"
            style={{ left: `${(depth - 1) * 24 + 12}px` }}
          >
            <div className="w-px bg-gray-300 h-full" />
            {isLastChild && <div className="w-3 h-px bg-gray-300" />}
          </div>
        )}

        <div
          className={`relative flex items-center justify-between py-2 px-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${depth > 0 ? 'border-l-2 border-l-gray-200' : ''} ${getLevelBackground(depth)}`}
          style={indentStyle}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Expand/collapse button with better positioning */}
            <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
              {hasChildren ? (
                <button
                  onClick={() => toggleLocationExpansion(location.code)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-300" />
              )}
            </div>

            {/* Location icon */}
            <span className="text-sm flex-shrink-0" title={location.type}>
              {getTypeIcon(location.type)}
            </span>

            {/* Location details */}
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm truncate ${getTypeColor(location.type)}`}>
                {location.name}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                {location.type}
              </div>
            </div>
          </div>

          {/* Status Summary and Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-xs text-gray-600">
              {location.alerts?.length || 0} active
            </div>

            {/* Set Status Button */}
            <Button
              size="sm"
              className="h-7 px-3 text-xs font-medium bg-blue-600 hover:bg-blue-700"
              onClick={() => openVillageStatusDialog(location)}
            >
              Set Status
            </Button>

            {/* Bulk Selection Checkbox */}
            {location.type === 'district' || location.type === 'tehsil' ? (
              <Checkbox
                checked={selectedBulkLocations.has(location.code)}
                onCheckedChange={(checked) => {
                  const newSelected = new Set(selectedBulkLocations)
                  if (checked) {
                    newSelected.add(location.code)
                  } else {
                    newSelected.delete(location.code)
                  }
                  setSelectedBulkLocations(newSelected)
                }}
                className="flex-shrink-0"
              />
            ) : null}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative">
            {location.children!.map((child, index) => {
              const isLastChild = index === location.children!.length - 1
              return renderLocationRow(child, depth + 1, isLastChild, isExpanded)
            })}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading location status data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Status Management
              </CardTitle>
              <CardDescription>
                Simplified status management for locations with modal-based editing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-medium text-sm">Location Status Management</h3>
                <p className="text-xs text-gray-600">
                  {locations.length} locations • {categories.length} categories • Click &quot;Set Status&quot; to manage alerts
                </p>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedBulkLocations.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedBulkLocations.size} selected
                </span>
                <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3 mr-1" />
                      Bulk Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Update Status</DialogTitle>
                      <DialogDescription>
                        Update status for {selectedBulkLocations.size} selected locations
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bulk-category">Category</Label>
                        <Select value={bulkCategory} onValueChange={setBulkCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-300 shadow-lg">
                            {categories.map((category) => (
                              <SelectItem key={category.category_id} value={category.category_id} className="bg-white hover:bg-gray-50">
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bulk-status">Status</Label>
                        <Select value={bulkStatus} onValueChange={setBulkStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-300 shadow-lg">
                            {categories.find(c => c.category_id === bulkCategory)?.statuses.map((status) => (
                              <SelectItem key={status.status_id} value={status.status_id} className="bg-white hover:bg-gray-50">
                                {status.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>


                      <div>
                        <Label htmlFor="bulk-notes">Notes</Label>
                        <Textarea
                          id="bulk-notes"
                          value={bulkNotes}
                          onChange={(e) => setBulkNotes(e.target.value)}
                          placeholder="Optional notes for all locations"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={bulkUpdateAlerts}>
                        Update {selectedBulkLocations.size} Locations
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Compact Location List */}
          <div className="border rounded-lg overflow-hidden bg-white relative">
            {locations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No locations found</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {locations.map((location, index) => {
                  const isLastChild = index === locations.length - 1
                  return renderLocationRow(location, 0, isLastChild, true)
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How to use:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Click the arrow next to locations to expand/collapse</li>
              <li>• Click &quot;Set Status&quot; to open the status management modal</li>
              <li>• In the modal, click on existing status badges to edit them</li>
              <li>• Check boxes to select locations for bulk updates</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Alert Status Overview Dialog */}
      <Dialog open={isVillageStatusDialogOpen} onOpenChange={setIsVillageStatusDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6" />
                <span>Alert Status Overview for</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-blue-900">{editingLocation?.name}</span>
                <span className="text-sm text-gray-600 capitalize">{editingLocation?.type}</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-base">
              View all alert categories and their current statuses. Click on any status to update it individually.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
            {/* Alert Categories Overview */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                  {categories.map((category) => {
                    const existingAlert = editingLocation ? getAlertForCategory(editingLocation, category.category_id) : null

                    return (
                      <div key={category.category_id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-base mb-1">{category.name}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {category.description || `Configure ${category.name} status for better situational awareness.`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {existingAlert ? (
                              <Badge
                                className={`text-xs px-3 py-1 ${getStatusColor(existingAlert.status.color)} cursor-pointer hover:opacity-80 transition-opacity`}
                                onClick={() => openIndividualStatusDialog(editingLocation!, category)}
                              >
                                {existingAlert.status.name}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-500 italic">No status set</span>
                            )}
                          </div>

                          {!existingAlert && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 px-3"
                              onClick={() => openIndividualStatusDialog(editingLocation!, category)}
                            >
                              Set Status
                            </Button>
                          )}
                        </div>

                        {/* Show notes if they exist */}
                        {existingAlert?.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700 line-clamp-2">
                            <strong>Notes:</strong> {existingAlert.notes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="border-t pt-4 mt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {(() => {
                    const totalCategories = categories.length
                    const configuredCategories = categories.filter(cat =>
                      editingLocation && getAlertForCategory(editingLocation, cat.category_id)
                    ).length
                    return `${configuredCategories} of ${totalCategories} categories configured`
                  })()}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsVillageStatusDialogOpen(false)
                    setEditingLocation(null)
                    setEditingCategory(null)
                  }}
                  className="px-6"
                >
                  Close Overview
                </Button>
              </div>
            </div>
          </div>

        </DialogContent>
      </Dialog>

      {/* Individual Status Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span>Edit Status for</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-blue-900">{editingCategory?.name}</span>
                <span className="text-sm text-gray-600">{editingLocation?.name} ({editingLocation?.type})</span>
              </div>
            </DialogTitle>
            <DialogDescription>
              Update the status and notes for this alert category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Status Display */}
            {(() => {
              const existingAlert = editingLocation && editingCategory ?
                getAlertForCategory(editingLocation, editingCategory.category_id) : null

              return existingAlert ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Current Status</h3>
                  <div className="flex items-center gap-3">
                    <Badge className={`px-3 py-1 text-sm font-medium ${getStatusColor(existingAlert.status.color)}`}>
                      {existingAlert.status.name}
                    </Badge>
                  </div>
                  {existingAlert.notes && (
                    <div className="mt-2 text-sm text-gray-700">
                      <strong>Notes:</strong> {existingAlert.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">No Status Set</h3>
                  <p className="text-sm text-yellow-800">
                    No status has been configured for <strong>{editingCategory?.name}</strong> in this location yet.
                  </p>
                </div>
              )
            })()}

            {/* Status Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-status" className="text-base font-semibold text-gray-900">
                  Select Status
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Choose the appropriate status for <strong>{editingCategory?.name}</strong>
                </p>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a status..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-lg">
                    {editingCategory?.statuses.map((status) => (
                      <SelectItem key={status.status_id} value={status.status_id} className="py-3 bg-white hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${getStatusColor(status.color)}`} />
                          <div>
                            <div className="font-medium">{status.name}</div>
                            <div className="text-xs text-gray-500">{status.value}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Preview */}
              {selectedStatus && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Status Preview</h4>
                  {(() => {
                    const selectedStatusData = editingCategory?.statuses.find(s => s.status_id === selectedStatus)
                    return selectedStatusData ? (
                      <div className="flex items-center gap-3">
                        <Badge className={`px-3 py-1 ${getStatusColor(selectedStatusData.color)}`}>
                          {selectedStatusData.name}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          This will be displayed for {editingCategory?.name}
                        </span>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              <div>
                <Label htmlFor="edit-notes" className="text-base font-semibold text-gray-900">
                  Additional Notes
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Provide any additional context or details about this status
                </p>
                <Textarea
                  id="edit-notes"
                  value={alertNotes}
                  onChange={(e) => setAlertNotes(e.target.value)}
                  placeholder="Enter detailed notes about this status..."
                  className="min-h-20 text-base"
                />
              </div>
            </div>

            {/* Category Information */}
            {editingCategory && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">About {editingCategory.name}</h4>
                <p className="text-sm text-gray-700">
                  {editingCategory.description || `Configure ${editingCategory.name} status for better situational awareness.`}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="px-6">
              Cancel
            </Button>
            <Button onClick={saveAlert} disabled={!selectedStatus} className="px-8 bg-blue-600 hover:bg-blue-700">
              {(() => {
                const existingAlert = editingLocation && editingCategory ?
                  getAlertForCategory(editingLocation, editingCategory.category_id) : null
                return existingAlert ? 'Update Status' : 'Create Status'
              })()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
