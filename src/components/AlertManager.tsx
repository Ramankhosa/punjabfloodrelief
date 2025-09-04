'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Plus, Edit, Trash2, Palette, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface AlertCategory {
  category_id: string
  name: string
  description: string | null
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
  statuses: AlertStatus[]
  statusCount: number
}

interface AlertStatus {
  status_id: string
  category_id: string
  name: string
  value: string
  color: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Predefined color options for status chips
const colorOptions = [
  { name: 'Red', value: 'red', bg: 'bg-red-500', text: 'text-white' },
  { name: 'Green', value: 'green', bg: 'bg-green-500', text: 'text-white' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-500', text: 'text-white' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-500', text: 'text-black' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-500', text: 'text-white' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-500', text: 'text-white' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-500', text: 'text-white' },
  { name: 'Gray', value: 'gray', bg: 'bg-gray-500', text: 'text-white' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-500', text: 'text-white' },
  { name: 'Teal', value: 'teal', bg: 'bg-teal-500', text: 'text-white' }
]

export default function AlertManager() {
  const [categories, setCategories] = useState<AlertCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false)
  const [isCreateStatusDialogOpen, setIsCreateStatusDialogOpen] = useState(false)
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false)
  const [isEditStatusDialogOpen, setIsEditStatusDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AlertCategory | null>(null)
  const [editingStatus, setEditingStatus] = useState<AlertStatus | null>(null)
  const [selectedCategoryForStatus, setSelectedCategoryForStatus] = useState<string>('')

  // Form states
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    order_index: 0
  })

  const [newStatus, setNewStatus] = useState({
    name: '',
    value: '',
    color: 'gray',
    order_index: 0
  })

  const [editCategory, setEditCategory] = useState({
    name: '',
    description: '',
    order_index: 0
  })

  const [editStatus, setEditStatus] = useState({
    name: '',
    value: '',
    color: 'gray',
    order_index: 0
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        toast.error('Failed to load alert categories')
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Error loading categories')
    } finally {
      setIsLoading(false)
    }
  }

  const createCategory = async () => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      })

      if (response.ok) {
        toast.success('Category created successfully')
        setNewCategory({ name: '', description: '', order_index: 0 })
        setIsCreateCategoryDialogOpen(false)
        loadCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Error creating category')
    }
  }

  const createStatus = async () => {
    if (!selectedCategoryForStatus) {
      toast.error('Please select a category')
      return
    }

    try {
      const response = await fetch(`/api/admin/alerts/categories/${selectedCategoryForStatus}/statuses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStatus),
      })

      if (response.ok) {
        toast.success('Status created successfully')
        setNewStatus({ name: '', value: '', color: 'gray', order_index: 0 })
        setIsCreateStatusDialogOpen(false)
        loadCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create status')
      }
    } catch (error) {
      console.error('Error creating status:', error)
      toast.error('Error creating status')
    }
  }

  const updateCategory = async () => {
    if (!editingCategory) return

    try {
      const response = await fetch(`/api/admin/alerts/categories/${editingCategory.category_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editCategory),
      })

      if (response.ok) {
        toast.success('Category updated successfully')
        setEditCategory({ name: '', description: '', order_index: 0 })
        setIsEditCategoryDialogOpen(false)
        setEditingCategory(null)
        loadCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Error updating category')
    }
  }

  const updateStatus = async () => {
    if (!editingStatus) return

    try {
      const response = await fetch(`/api/admin/alerts/categories/${editingStatus.category_id}/statuses/${editingStatus.status_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editStatus),
      })

      if (response.ok) {
        toast.success('Status updated successfully')
        setEditStatus({ name: '', value: '', color: 'gray', order_index: 0 })
        setIsEditStatusDialogOpen(false)
        setEditingStatus(null)
        loadCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error updating status')
    }
  }

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This will also delete all its statuses.`)) return

    try {
      const response = await fetch(`/api/admin/alerts/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        toast.success('Category deleted successfully')
        loadCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Error deleting category')
    }
  }

  const deleteStatus = async (categoryId: string, statusId: string, statusName: string) => {
    if (!confirm(`Are you sure you want to delete the status "${statusName}"?`)) return

    try {
      const response = await fetch(`/api/admin/alerts/categories/${categoryId}/statuses/${statusId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        toast.success('Status deleted successfully')
        loadCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete status')
      }
    } catch (error) {
      console.error('Error deleting status:', error)
      toast.error('Error deleting status')
    }
  }

  const openEditCategoryDialog = (category: AlertCategory) => {
    setEditingCategory(category)
    setEditCategory({
      name: category.name,
      description: category.description || '',
      order_index: category.order_index
    })
    setIsEditCategoryDialogOpen(true)
  }

  const openEditStatusDialog = (status: AlertStatus) => {
    setEditingStatus(status)
    setEditStatus({
      name: status.name,
      value: status.value,
      color: status.color,
      order_index: status.order_index
    })
    setIsEditStatusDialogOpen(true)
  }

  const getColorClasses = (color: string) => {
    const colorOption = colorOptions.find(c => c.value === color)
    return colorOption ? `${colorOption.bg} ${colorOption.text}` : 'bg-gray-500 text-white'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted">Loading alert categories...</p>
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
                <AlertTriangle className="w-5 h-5" />
                Alert Management System
              </CardTitle>
              <CardDescription>
                Manage alert categories and their status values with color coding
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateStatusDialogOpen} onOpenChange={setIsCreateStatusDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Status</DialogTitle>
                    <DialogDescription>
                      Create a new status for an alert category
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status-category">Category</Label>
                      <Select value={selectedCategoryForStatus} onValueChange={setSelectedCategoryForStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.category_id} value={category.category_id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status-name">Status Name</Label>
                      <Input
                        id="status-name"
                        value={newStatus.name}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Active, Critical, Normal"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status-value">Status Value</Label>
                      <Input
                        id="status-value"
                        value={newStatus.value}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="e.g., active, critical, normal"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status-color">Color</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setNewStatus(prev => ({ ...prev, color: color.value }))}
                            className={`h-8 w-8 rounded-full ${color.bg} border-2 ${
                              newStatus.color === color.value ? 'border-black' : 'border-gray-300'
                            }`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateStatusDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createStatus} disabled={!selectedCategoryForStatus || !newStatus.name || !newStatus.value}>
                      Create Status
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new alert category for organizing statuses
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Category Name</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Impact Severity, Flood Stage"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category-description">Description</Label>
                      <Input
                        id="category-description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the category"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category-order">Display Order</Label>
                      <Input
                        id="category-order"
                        type="number"
                        value={newCategory.order_index}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createCategory} disabled={!newCategory.name}>
                      Create Category
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {categories.map((category) => (
              <Card key={category.category_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{category.statusCount} statuses</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditCategoryDialog(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCategory(category.category_id, category.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {category.statuses.map((status) => (
                      <div
                        key={status.status_id}
                        className="flex items-center gap-2 p-2 border rounded-lg"
                      >
                        <div className={`w-4 h-4 rounded-full ${getColorClasses(status.color)}`} />
                        <span className="text-sm font-medium">{status.name}</span>
                        <span className="text-xs text-muted-foreground">({status.value})</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditStatusDialog(status)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteStatus(category.category_id, status.status_id, status.name)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCategoryForStatus(category.category_id)
                      setIsCreateStatusDialogOpen(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Status to {category.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No alert categories found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                value={editCategory.name}
                onChange={(e) => setEditCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Impact Severity, Flood Stage"
              />
            </div>

            <div>
              <Label htmlFor="edit-category-description">Description</Label>
              <Input
                id="edit-category-description"
                value={editCategory.description}
                onChange={(e) => setEditCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the category"
              />
            </div>

            <div>
              <Label htmlFor="edit-category-order">Display Order</Label>
              <Input
                id="edit-category-order"
                type="number"
                value={editCategory.order_index}
                onChange={(e) => setEditCategory(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateCategory} disabled={!editCategory.name}>
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={isEditStatusDialogOpen} onOpenChange={setIsEditStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
            <DialogDescription>
              Update status information and color
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-status-name">Status Name</Label>
              <Input
                id="edit-status-name"
                value={editStatus.name}
                onChange={(e) => setEditStatus(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Active, Critical, Normal"
              />
            </div>

            <div>
              <Label htmlFor="edit-status-value">Status Value</Label>
              <Input
                id="edit-status-value"
                value={editStatus.value}
                onChange={(e) => setEditStatus(prev => ({ ...prev, value: e.target.value }))}
                placeholder="e.g., active, critical, normal"
              />
            </div>

            <div>
              <Label htmlFor="edit-status-color">Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setEditStatus(prev => ({ ...prev, color: color.value }))}
                    className={`h-8 w-8 rounded-full ${color.bg} border-2 ${
                      editStatus.color === color.value ? 'border-black' : 'border-gray-300'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-status-order">Display Order</Label>
              <Input
                id="edit-status-order"
                type="number"
                value={editStatus.order_index}
                onChange={(e) => setEditStatus(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateStatus} disabled={!editStatus.name || !editStatus.value}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
