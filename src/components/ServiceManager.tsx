'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Package, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Service {
  service_id: string
  broad_category: string
  subcategory: string
  created_at: string
  updated_at: string
}

interface ServiceGroup {
  category: string
  services: Service[]
  isExpanded: boolean
}

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([])
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([])
  const [broadCategories, setBroadCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [newService, setNewService] = useState({ broad_category: '', subcategory: '', useExistingCategory: true })
  const [editService, setEditService] = useState({ broad_category: '', subcategory: '' })

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    // Group services by broad category
    const groups = services.reduce((acc: ServiceGroup[], service) => {
      const existingGroup = acc.find(group => group.category === service.broad_category)
      if (existingGroup) {
        existingGroup.services.push(service)
      } else {
        acc.push({
          category: service.broad_category,
          services: [service],
          isExpanded: true
        })
      }
      return acc
    }, [])

    // Sort services within each group
    groups.forEach(group => {
      group.services.sort((a, b) => a.subcategory.localeCompare(b.subcategory))
    })

    // Sort groups by category name
    groups.sort((a, b) => a.category.localeCompare(b.category))

    // Extract unique broad categories
    const categories = [...new Set(services.map(service => service.broad_category))].sort()

    setServiceGroups(groups)
    setBroadCategories(categories)
  }, [services])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setServices(data.services)
      } else {
        toast.error('Failed to load services')
      }
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Error loading services')
    } finally {
      setIsLoading(false)
    }
  }

  const createService = async () => {
    try {
      const serviceData = {
        broad_category: newService.broad_category,
        subcategory: newService.subcategory
      }

      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })

      if (response.ok) {
        toast.success('Service created successfully')
        setNewService({ broad_category: '', subcategory: '', useExistingCategory: true })
        setIsCreateDialogOpen(false)
        loadServices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create service')
      }
    } catch (error) {
      console.error('Error creating service:', error)
      toast.error('Error creating service')
    }
  }

  const updateService = async () => {
    if (!editingService) return

    try {
      const response = await fetch(`/api/admin/services/${editingService.service_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editService),
      })

      if (response.ok) {
        toast.success('Service updated successfully')
        setEditService({ broad_category: '', subcategory: '' })
        setIsEditDialogOpen(false)
        setEditingService(null)
        loadServices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update service')
      }
    } catch (error) {
      console.error('Error updating service:', error)
      toast.error('Error updating service')
    }
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        toast.success('Service deleted successfully')
        loadServices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete service')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Error deleting service')
    }
  }

  const toggleCategoryExpansion = (category: string) => {
    setServiceGroups(groups =>
      groups.map(group =>
        group.category === category
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }

  const openEditDialog = (service: Service) => {
    setEditingService(service)
    setEditService({
      broad_category: service.broad_category,
      subcategory: service.subcategory
    })
    setIsEditDialogOpen(true)
  }

  const openCreateDialog = (selectedCategory?: string) => {
    setNewService({
      broad_category: selectedCategory || (broadCategories.length > 0 ? broadCategories[0] : ''),
      subcategory: '',
      useExistingCategory: selectedCategory ? true : broadCategories.length > 0
    })
    setIsCreateDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted">Loading services...</p>
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
                <Package className="w-5 h-5" />
                Relief Services Management
              </CardTitle>
              <CardDescription>
                Manage broad categories and subcategories for relief services
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openCreateDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                  <DialogDescription>
                    Create a new relief service with broad category and subcategory.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-existing-category"
                      checked={newService.useExistingCategory}
                      onChange={(e) => setNewService(prev => ({
                        ...prev,
                        useExistingCategory: e.target.checked,
                        broad_category: e.target.checked ? prev.broad_category : ''
                      }))}
                      className="rounded"
                    />
                    <Label htmlFor="use-existing-category">Use existing broad category</Label>
                  </div>

                  {newService.useExistingCategory ? (
                    <div>
                      <Label htmlFor="existing-category">Select Broad Category</Label>
                      <Select
                        value={newService.broad_category}
                        onValueChange={(value) => setNewService(prev => ({ ...prev, broad_category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a broad category" />
                        </SelectTrigger>
                        <SelectContent>
                          {broadCategories.length > 0 ? (
                            broadCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No categories available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="new-broad-category">Broad Category</Label>
                      <Input
                        id="new-broad-category"
                        value={newService.broad_category}
                        onChange={(e) => setNewService(prev => ({ ...prev, broad_category: e.target.value }))}
                        placeholder="e.g., Food, Medical, Shelter & NFI"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="new-subcategory">Subcategory</Label>
                    <Input
                      id="new-subcategory"
                      value={newService.subcategory}
                      onChange={(e) => setNewService(prev => ({ ...prev, subcategory: e.target.value }))}
                      placeholder="e.g., Cooked meals, First-aid kit"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setNewService({ broad_category: '', subcategory: '', useExistingCategory: true })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createService}
                    disabled={
                      !newService.broad_category ||
                      !newService.subcategory ||
                      (newService.useExistingCategory && !broadCategories.includes(newService.broad_category))
                    }
                  >
                    Create Service
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {serviceGroups.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted">No services found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceGroups.map((group) => (
                <div key={group.category} className="border rounded-lg group">
                  <div
                    className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => toggleCategoryExpansion(group.category)}
                  >
                    <div className="flex items-center gap-2">
                      {group.isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <h3 className="font-semibold text-lg">{group.category}</h3>
                      <Badge variant="secondary">{group.services.length} services</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        openCreateDialog(group.category)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {group.isExpanded && (
                    <div className="p-4 space-y-2">
                      {group.services.map((service) => (
                        <div key={service.service_id} className="flex items-center justify-between p-3 border rounded bg-background">
                          <div>
                            <div className="font-medium">{service.subcategory}</div>
                            <div className="text-sm text-muted">
                              Created: {new Date(service.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteService(service.service_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the broad category and subcategory for this service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-broad-category">Broad Category</Label>
              <Input
                id="edit-broad-category"
                value={editService.broad_category}
                onChange={(e) => setEditService(prev => ({ ...prev, broad_category: e.target.value }))}
                placeholder="e.g., Food, Medical, Shelter & NFI"
              />
            </div>
            <div>
              <Label htmlFor="edit-subcategory">Subcategory</Label>
              <Input
                id="edit-subcategory"
                value={editService.subcategory}
                onChange={(e) => setEditService(prev => ({ ...prev, subcategory: e.target.value }))}
                placeholder="e.g., Cooked meals, First-aid kit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateService} disabled={!editService.broad_category || !editService.subcategory}>
              Update Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
