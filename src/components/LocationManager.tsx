'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Plus, Edit, Trash2, ChevronDown, ChevronRight, TreePine, Building, Home, Maximize2, X, Grid, List, Filter, Search } from 'lucide-react'
import { toast } from 'sonner'

interface State {
  state_code: string
  state_name: string
  districts: District[]
}

interface District {
  district_code: string
  district_name: string
  state_code: string
  tehsils: Tehsil[]
}

interface Tehsil {
  tehsil_code: string
  tehsil_name: string
  district_code: string
  villages: Village[]
}

interface Village {
  village_code: string
  village_name: string
  tehsil_code: string
  district_code: string
  lat?: number
  lon?: number
}

interface LocationHierarchy {
  states: State[]
  districts: District[]
  tehsils: Tehsil[]
  villages: Village[]
}

export default function LocationManager() {
  const [locations, setLocations] = useState<LocationHierarchy | null>(null)
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set())
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set())
  const [expandedTehsils, setExpandedTehsils] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [fullscreenDistrict, setFullscreenDistrict] = useState<District | null>(null)
  const [fullscreenLayout, setFullscreenLayout] = useState<'grid' | 'list'>('grid')
  const [selectedTehsilFilter, setSelectedTehsilFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingEntity, setEditingEntity] = useState<any>(null)
  const [editType, setEditType] = useState<'state' | 'district' | 'tehsil' | 'village'>('state')
  const [newEntity, setNewEntity] = useState({
    type: 'district' as 'district' | 'tehsil' | 'village',
    state_code: '',
    district_code: '',
    tehsil_code: '',
    entity_code: '',
    entity_name: ''
  })
  const [editEntity, setEditEntity] = useState({
    entity_code: '',
    entity_name: '',
    state_code: '',
    district_code: '',
    tehsil_code: '',
    lat: '',
    lon: ''
  })

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      } else {
        toast.error('Failed to load locations')
      }
    } catch (error) {
      console.error('Error loading locations:', error)
      toast.error('Error loading locations')
    } finally {
      setIsLoading(false)
    }
  }

  const createEntity = async () => {
    try {
      let endpoint = ''
      let data = {}

      switch (newEntity.type) {
        case 'district':
          endpoint = '/api/admin/locations?type=district'
          data = {
            district_code: newEntity.entity_code,
            district_name: newEntity.entity_name,
            state_code: newEntity.state_code
          }
          break
        case 'tehsil':
          endpoint = '/api/admin/locations?type=tehsil'
          data = {
            tehsil_code: newEntity.entity_code,
            tehsil_name: newEntity.entity_name,
            district_code: newEntity.district_code
          }
          break
        case 'village':
          endpoint = '/api/admin/locations?type=village'
          data = {
            village_code: newEntity.entity_code,
            village_name: newEntity.entity_name,
            tehsil_code: newEntity.tehsil_code,
            district_code: newEntity.district_code
          }
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(`${newEntity.type.charAt(0).toUpperCase() + newEntity.type.slice(1)} created successfully`)
        setNewEntity({
          type: 'district',
          state_code: '',
          district_code: '',
          tehsil_code: '',
          entity_code: '',
          entity_name: ''
        })
        setIsCreateDialogOpen(false)
        loadLocations()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to create ${newEntity.type}`)
      }
    } catch (error) {
      console.error('Error creating entity:', error)
      toast.error(`Error creating ${newEntity.type}`)
    }
  }

  const updateEntity = async () => {
    if (!editingEntity) return

    try {
      let endpoint = ''
      let data = {}

      switch (editType) {
        case 'district':
          endpoint = `/api/admin/locations/districts/${editingEntity.district_code}`
          data = {
            district_name: editEntity.entity_name,
            state_code: editEntity.state_code
          }
          break
        case 'tehsil':
          endpoint = `/api/admin/locations/tehsils/${editingEntity.tehsil_code}`
          data = {
            tehsil_name: editEntity.entity_name,
            district_code: editEntity.district_code
          }
          break
        case 'village':
          endpoint = `/api/admin/locations/villages/${editingEntity.village_code}`
          data = {
            village_name: editEntity.entity_name,
            tehsil_code: editEntity.tehsil_code,
            district_code: editEntity.district_code,
            lat: editEntity.lat ? parseFloat(editEntity.lat) : undefined,
            lon: editEntity.lon ? parseFloat(editEntity.lon) : undefined
          }
          break
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(`${editType.charAt(0).toUpperCase() + editType.slice(1)} updated successfully`)
        setEditEntity({
          entity_code: '',
          entity_name: '',
          state_code: '',
          district_code: '',
          tehsil_code: '',
          lat: '',
          lon: ''
        })
        setIsEditDialogOpen(false)
        setEditingEntity(null)
        loadLocations()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to update ${editType}`)
      }
    } catch (error) {
      console.error('Error updating entity:', error)
      toast.error(`Error updating ${editType}`)
    }
  }

  const deleteEntity = async (type: string, code: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      let endpoint = ''

      switch (type) {
        case 'district':
          endpoint = `/api/admin/locations/districts/${code}`
          break
        case 'tehsil':
          endpoint = `/api/admin/locations/tehsils/${code}`
          break
        case 'village':
          endpoint = `/api/admin/locations/villages/${code}`
          break
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`)
        loadLocations()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to delete ${type}`)
      }
    } catch (error) {
      console.error('Error deleting entity:', error)
      toast.error(`Error deleting ${type}`)
    }
  }

  const toggleExpansion = (type: 'state' | 'district' | 'tehsil', code: string) => {
    switch (type) {
      case 'state':
        setExpandedStates(prev => {
          const newSet = new Set(prev)
          if (newSet.has(code)) {
            newSet.delete(code)
          } else {
            newSet.add(code)
          }
          return newSet
        })
        break
      case 'district':
        setExpandedDistricts(prev => {
          const newSet = new Set(prev)
          if (newSet.has(code)) {
            newSet.delete(code)
          } else {
            newSet.add(code)
          }
          return newSet
        })
        break
      case 'tehsil':
        setExpandedTehsils(prev => {
          const newSet = new Set(prev)
          if (newSet.has(code)) {
            newSet.delete(code)
          } else {
            newSet.add(code)
          }
          return newSet
        })
        break
    }
  }

  const openEditDialog = (type: 'district' | 'tehsil' | 'village', entity: any) => {
    setEditType(type)
    setEditingEntity(entity)
    setEditEntity({
      entity_code: entity[`${type}_code`],
      entity_name: entity[`${type}_name`],
      state_code: entity.state_code || '',
      district_code: entity.district_code || '',
      tehsil_code: entity.tehsil_code || '',
      lat: entity.lat?.toString() || '',
      lon: entity.lon?.toString() || ''
    })
    setIsEditDialogOpen(true)
  }

  const openFullscreenDistrict = (district: District) => {
    setFullscreenDistrict(district)
    setFullscreenLayout('grid')
    setSelectedTehsilFilter('all')
    setSearchQuery('')
    setIsFullscreenOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted">Loading locations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!locations) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted">Failed to load locations</p>
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
                Location Hierarchy Management
              </CardTitle>
              <CardDescription>
                Manage states, districts, tehsils, and villages in hierarchical order
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                  <DialogDescription>
                    Create a new district, tehsil, or village
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="entity-type">Type</Label>
                    <Select
                      value={newEntity.type}
                      onValueChange={(value: 'district' | 'tehsil' | 'village') => setNewEntity(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="district">District</SelectItem>
                        <SelectItem value="tehsil">Tehsil</SelectItem>
                        <SelectItem value="village">Village</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newEntity.type === 'district' && (
                    <div>
                      <Label htmlFor="state-select">State</Label>
                      <Select
                        value={newEntity.state_code}
                        onValueChange={(value) => setNewEntity(prev => ({ ...prev, state_code: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.states.map((state) => (
                            <SelectItem key={state.state_code} value={state.state_code}>
                              {state.state_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(newEntity.type === 'tehsil' || newEntity.type === 'village') && (
                    <div>
                      <Label htmlFor="district-select">District</Label>
                      <Select
                        value={newEntity.district_code}
                        onValueChange={(value) => setNewEntity(prev => ({ ...prev, district_code: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.districts.map((district) => (
                            <SelectItem key={district.district_code} value={district.district_code}>
                              {district.district_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newEntity.type === 'village' && (
                    <div>
                      <Label htmlFor="tehsil-select">Tehsil</Label>
                      <Select
                        value={newEntity.tehsil_code}
                        onValueChange={(value) => setNewEntity(prev => ({ ...prev, tehsil_code: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tehsil" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.tehsils
                            .filter(tehsil => tehsil.district_code === newEntity.district_code)
                            .map((tehsil) => (
                            <SelectItem key={tehsil.tehsil_code} value={tehsil.tehsil_code}>
                              {tehsil.tehsil_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="entity-code">Code</Label>
                    <Input
                      id="entity-code"
                      value={newEntity.entity_code}
                      onChange={(e) => setNewEntity(prev => ({ ...prev, entity_code: e.target.value }))}
                      placeholder={`${newEntity.type} code`}
                    />
                  </div>

                  <div>
                    <Label htmlFor="entity-name">Name</Label>
                    <Input
                      id="entity-name"
                      value={newEntity.entity_name}
                      onChange={(e) => setNewEntity(prev => ({ ...prev, entity_name: e.target.value }))}
                      placeholder={`${newEntity.type} name`}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createEntity} disabled={!newEntity.entity_code || !newEntity.entity_name}>
                    Create {newEntity.type.charAt(0).toUpperCase() + newEntity.type.slice(1)}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {locations.states.map((state) => (
              <div key={state.state_code} className="border rounded-lg">
                <div
                  className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => toggleExpansion('state', state.state_code)}
                >
                  <div className="flex items-center gap-2">
                    {expandedStates.has(state.state_code) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <TreePine className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">{state.state_name}</span>
                    <Badge variant="secondary">{state.districts.length} districts</Badge>
                  </div>
                </div>

                {expandedStates.has(state.state_code) && (
                  <div className="ml-6 space-y-2">
                    {state.districts.map((district) => (
                      <div key={district.district_code} className="border rounded">
                        <div
                          className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleExpansion('district', district.district_code)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedDistricts.has(district.district_code) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <Building className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{district.district_name}</span>
                            <Badge variant="outline" className="text-xs">{district.tehsils.length} tehsils</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                openFullscreenDistrict(district)
                              }}
                              title="Open in fullscreen"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog('district', district)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteEntity('district', district.district_code, district.district_name)
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {expandedDistricts.has(district.district_code) && (
                          <div className="ml-6 space-y-1">
                            {district.tehsils.map((tehsil) => (
                              <div key={tehsil.tehsil_code} className="border rounded">
                                <div
                                  className="flex items-center justify-between p-2 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                                  onClick={() => toggleExpansion('tehsil', tehsil.tehsil_code)}
                                >
                                  <div className="flex items-center gap-2">
                                    {expandedTehsils.has(tehsil.tehsil_code) ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                    <Home className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm font-medium">{tehsil.tehsil_name}</span>
                                    <Badge variant="outline" className="text-xs">{tehsil.villages.length} villages</Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openEditDialog('tehsil', tehsil)
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteEntity('tehsil', tehsil.tehsil_code, tehsil.tehsil_name)
                                      }}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>

                                {expandedTehsils.has(tehsil.tehsil_code) && (
                                  <div className="ml-6 p-2 space-y-1 max-h-60 overflow-y-auto">
                                    {tehsil.villages.map((village) => (
                                      <div key={village.village_code} className="flex items-center justify-between p-2 bg-background rounded border">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="w-3 h-3 text-gray-600" />
                                          <span className="text-sm">{village.village_name}</span>
                                          {village.lat && village.lon && (
                                            <Badge variant="outline" className="text-xs">
                                              📍 {village.lat.toFixed(4)}, {village.lon.toFixed(4)}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openEditDialog('village', village)}
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => deleteEntity('village', village.village_code, village.village_name)}
                                            className="text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editType.charAt(0).toUpperCase() + editType.slice(1)}</DialogTitle>
            <DialogDescription>
              Update {editType} information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-entity-name">Name</Label>
              <Input
                id="edit-entity-name"
                value={editEntity.entity_name}
                onChange={(e) => setEditEntity(prev => ({ ...prev, entity_name: e.target.value }))}
                placeholder={`${editType} name`}
              />
            </div>

            {(editType === 'tehsil' || editType === 'village') && (
              <div>
                <Label htmlFor="edit-district">District</Label>
                <Select
                  value={editEntity.district_code}
                  onValueChange={(value) => setEditEntity(prev => ({ ...prev, district_code: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.districts.map((district) => (
                      <SelectItem key={district.district_code} value={district.district_code}>
                        {district.district_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editType === 'village' && (
              <>
                <div>
                  <Label htmlFor="edit-tehsil">Tehsil</Label>
                  <Select
                    value={editEntity.tehsil_code}
                    onValueChange={(value) => setEditEntity(prev => ({ ...prev, tehsil_code: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tehsil" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.tehsils
                        .filter(tehsil => tehsil.district_code === editEntity.district_code)
                        .map((tehsil) => (
                        <SelectItem key={tehsil.tehsil_code} value={tehsil.tehsil_code}>
                          {tehsil.tehsil_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-lat">Latitude</Label>
                    <Input
                      id="edit-lat"
                      type="number"
                      step="0.000001"
                      value={editEntity.lat}
                      onChange={(e) => setEditEntity(prev => ({ ...prev, lat: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lon">Longitude</Label>
                    <Input
                      id="edit-lon"
                      type="number"
                      step="0.000001"
                      value={editEntity.lon}
                      onChange={(e) => setEditEntity(prev => ({ ...prev, lon: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateEntity} disabled={!editEntity.entity_name}>
              Update {editType.charAt(0).toUpperCase() + editType.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen District Modal */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Building className="w-6 h-6 text-blue-600" />
                  {fullscreenDistrict?.district_name} District - Full View
                </DialogTitle>
                <DialogDescription>
                  Complete overview of all tehsils and villages in {fullscreenDistrict?.district_name}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreenOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {fullscreenDistrict && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Controls Bar */}
              <div className="px-6 py-4 border-b bg-muted/30 flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search villages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>

                    {/* Tehsil Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <Select value={selectedTehsilFilter} onValueChange={setSelectedTehsilFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by tehsil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tehsils</SelectItem>
                          {fullscreenDistrict.tehsils.map((tehsil) => (
                            <SelectItem key={tehsil.tehsil_code} value={tehsil.tehsil_code}>
                              {tehsil.tehsil_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Layout Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">View:</span>
                    <div className="flex rounded-md border">
                      <Button
                        size="sm"
                        variant={fullscreenLayout === 'grid' ? 'default' : 'ghost'}
                        onClick={() => setFullscreenLayout('grid')}
                        className="rounded-r-none"
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={fullscreenLayout === 'list' ? 'default' : 'ghost'}
                        onClick={() => setFullscreenLayout('list')}
                        className="rounded-l-none"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-6 py-4">
                  <div className="space-y-6">
                    {/* District Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          District Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{fullscreenDistrict.tehsils.length}</div>
                            <div className="text-sm text-muted-foreground">Tehsils</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {fullscreenDistrict.tehsils.reduce((sum, tehsil) => sum + tehsil.villages.length, 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Villages</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {fullscreenDistrict.tehsils.reduce((sum, tehsil) =>
                                sum + tehsil.villages.filter(v => v.lat && v.lon).length, 0
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">With GPS</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">
                              {fullscreenDistrict.tehsils.reduce((sum, tehsil) =>
                                sum + tehsil.villages.filter(v => !v.lat || !v.lon).length, 0
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">Need GPS</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Filtered Tehsils and Villages */}
                    <div className="space-y-4">
                      {fullscreenDistrict.tehsils
                        .filter(tehsil => selectedTehsilFilter === 'all' || tehsil.tehsil_code === selectedTehsilFilter)
                        .map((tehsil) => {
                          const filteredVillages = tehsil.villages.filter(village =>
                            village.village_name.toLowerCase().includes(searchQuery.toLowerCase())
                          );

                          if (filteredVillages.length === 0 && searchQuery) return null;

                          return (
                            <Card key={tehsil.tehsil_code}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="flex items-center gap-2 text-lg">
                                    <Home className="w-5 h-5 text-orange-600" />
                                    {tehsil.tehsil_name}
                                    <Badge variant="secondary">{filteredVillages.length} villages</Badge>
                                    {searchQuery && (
                                      <Badge variant="outline">{tehsil.villages.length} total</Badge>
                                    )}
                                  </CardTitle>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openEditDialog('tehsil', tehsil)}
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit Tehsil
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteEntity('tehsil', tehsil.tehsil_code, tehsil.tehsil_name)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {fullscreenLayout === 'grid' ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {filteredVillages.map((village) => (
                                      <div
                                        key={village.village_code}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                          <div className="min-w-0 flex-1">
                                            <div className="font-medium text-sm truncate">{village.village_name}</div>
                                            {village.lat && village.lon && (
                                              <div className="text-xs text-muted-foreground">
                                                📍 {village.lat.toFixed(4)}, {village.lon.toFixed(4)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openEditDialog('village', village)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => deleteEntity('village', village.village_code, village.village_name)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {filteredVillages.map((village) => (
                                      <div
                                        key={village.village_code}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                      >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                          <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                          <div className="min-w-0 flex-1">
                                            <div className="font-medium">{village.village_name}</div>
                                            {village.lat && village.lon && (
                                              <div className="text-sm text-muted-foreground">
                                                📍 Latitude: {village.lat.toFixed(6)}, Longitude: {village.lon.toFixed(6)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openEditDialog('village', village)}
                                          >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => deleteEntity('village', village.village_code, village.village_name)}
                                            className="text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {filteredVillages.length === 0 && (
                                  <div className="text-center py-8 text-muted-foreground">
                                    {searchQuery ? 'No villages match your search' : 'No villages found in this tehsil'}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>

                    {fullscreenDistrict.tehsils.length === 0 && (
                      <Card>
                        <CardContent className="flex items-center justify-center py-8">
                          <div className="text-center text-muted-foreground">
                            <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No tehsils found in this district</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
