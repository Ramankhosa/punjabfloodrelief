'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Pause,
  Eye,
  EyeOff,
  MoreVertical,
  FileText,
  RefreshCw,
  Filter
} from 'lucide-react'

interface InventoryEntry {
  entry_id: string
  quantity_total: number
  quantity_available: number
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'POOR'
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'RESERVED' | 'DAMAGED' | 'EXPIRED'
  availability_mode: 'IMMEDIATE' | 'SCHEDULED' | 'ON_REQUEST' | 'LIMITED_TIME'
  available_from?: string
  available_until?: string
  response_hours?: number
  batch_number?: string
  expiry_date?: string
  storage_location?: string
  visibility: 'PUBLIC' | 'COORDINATORS' | 'PRIVATE'
  notes?: string
  is_verified: boolean
  created_at: string
  updated_at: string
  item_type: {
    item_type_id: string
    category: string
    subcategory: string
    name: string
    description?: string
    icon?: string
    unit: string
    is_perishable: boolean
  }
  district: {
    district_name: string
  }
  tehsil: {
    tehsil_name: string
  }
  village?: {
    village_name: string
  }
  provider: {
    alias?: string
    contact_type: string
  }
  resupply_requests?: Array<{
    request_id: string
    status: string
    quantity_requested: number
    urgency_level: string
  }>
  donation_offers?: Array<{
    offer_id: string
    status: string
    quantity_offered: number
    donor_name: string
  }>
}

interface InventoryListProps {
  groupId?: string
  providerId?: string
  onAddNew?: () => void
  onEdit?: (entry: InventoryEntry) => void
  className?: string
}

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Available', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  LOW_STOCK: { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: Package },
  RESERVED: { label: 'Reserved', color: 'bg-blue-100 text-blue-800', icon: Pause },
  DAMAGED: { label: 'Damaged', color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
  EXPIRED: { label: 'Expired', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
}

const AVAILABILITY_CONFIG = {
  IMMEDIATE: { label: 'Immediate', color: 'text-green-600' },
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-600' },
  ON_REQUEST: { label: 'On Request', color: 'text-orange-600' },
  LIMITED_TIME: { label: 'Limited Time', color: 'text-purple-600' }
}

const CONDITION_CONFIG = {
  NEW: { label: 'New', color: 'text-green-600' },
  GOOD: { label: 'Good', color: 'text-blue-600' },
  FAIR: { label: 'Fair', color: 'text-yellow-600' },
  POOR: { label: 'Poor', color: 'text-red-600' }
}

export function InventoryList({
  groupId,
  providerId,
  onAddNew,
  onEdit,
  className = ''
}: InventoryListProps) {
  const [inventory, setInventory] = useState<InventoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    category: '',
    status: 'all',
    showLowStock: false
  })

  useEffect(() => {
    loadInventory()
  }, [groupId, providerId, filters])

  const loadInventory = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (groupId) params.set('groupId', groupId)
      if (providerId) params.set('providerId', providerId)
      if (filters.category) params.set('category', filters.category)
      if (filters.status !== 'all') params.set('status', filters.status)

      const response = await fetch(`/api/inventory?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load inventory')
      }

      let filteredInventory = data.inventory || []

      // Apply additional filters
      if (filters.showLowStock) {
        filteredInventory = filteredInventory.filter((entry: InventoryEntry) =>
          entry.quantity_available <= Math.max(5, entry.quantity_total * 0.2)
        )
      }

      setInventory(filteredInventory)
    } catch (err) {
      console.error('Error loading inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusToggle = async (entry: InventoryEntry) => {
    try {
      const newStatus = entry.status === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE'

      const response = await fetch(`/api/inventory/${entry.entry_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Update local state
      setInventory(prev =>
        prev.map(item =>
          item.entry_id === entry.entry_id
            ? { ...item, status: newStatus }
            : item
        )
      )
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update inventory status')
    }
  }

  const handleDelete = async (entry: InventoryEntry) => {
    const itemName = entry.item_type.name
    if (!confirm(`Delete "${itemName}" inventory entry?\n\nThis will also delete all related resupply requests and donation offers.`)) {
      return
    }

    try {
      const response = await fetch(`/api/inventory/${entry.entry_id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete inventory entry')
      }

      // Remove from local state
      setInventory(prev =>
        prev.filter(item => item.entry_id !== entry.entry_id)
      )
    } catch (err) {
      console.error('Error deleting inventory entry:', err)
      setError('Failed to delete inventory entry')
    }
  }

  const formatAvailability = (entry: InventoryEntry) => {
    const config = AVAILABILITY_CONFIG[entry.availability_mode]

    switch (entry.availability_mode) {
      case 'SCHEDULED':
        if (entry.available_from && entry.available_until) {
          const from = new Date(entry.available_from).toLocaleDateString()
          const until = new Date(entry.available_until).toLocaleDateString()
          return `${from} - ${until}`
        }
        return 'Date range set'
      case 'ON_REQUEST':
        return `${entry.response_hours || 24}h response`
      case 'LIMITED_TIME':
        if (entry.available_until) {
          return `Until ${new Date(entry.available_until).toLocaleDateString()}`
        }
        return 'Limited time'
      default:
        return config.label
    }
  }

  const getStockLevel = (entry: InventoryEntry) => {
    const percentage = (entry.quantity_available / entry.quantity_total) * 100
    if (percentage === 0) return 'out'
    if (percentage <= 20) return 'low'
    if (percentage <= 50) return 'medium'
    return 'high'
  }

  const getPendingRequestsCount = (entry: InventoryEntry) => {
    return entry.resupply_requests?.filter(r => r.status === 'PENDING').length || 0
  }

  const getActiveOffersCount = (entry: InventoryEntry) => {
    return entry.donation_offers?.filter(o => o.status === 'OFFERED').length || 0
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading inventory...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadInventory} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">
            Manage your relief supplies with granular availability control
          </p>
        </div>

        {onAddNew && (
          <Button onClick={onAddNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Inventory Item
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <select
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Categories</option>
          <option value="FOOD">Food</option>
          <option value="SHELTER">Shelter</option>
          <option value="MEDICAL">Medical</option>
          <option value="WATER_SANITATION">Water & Sanitation</option>
          <option value="TRANSPORT">Transport</option>
          <option value="COMMUNICATION">Communication</option>
          <option value="OTHER">Other</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="RESERVED">Reserved</option>
          <option value="DAMAGED">Damaged</option>
          <option value="EXPIRED">Expired</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.showLowStock}
            onChange={(e) => setFilters(prev => ({ ...prev, showLowStock: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm">Show Low Stock Only</span>
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {inventory.filter(e => e.status === 'AVAILABLE').length}
            </div>
            <p className="text-sm text-gray-600">Available Items</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {inventory.filter(e => e.status === 'LOW_STOCK').length}
            </div>
            <p className="text-sm text-gray-600">Low Stock Items</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {inventory.reduce((sum, e) => sum + getPendingRequestsCount(e), 0)}
            </div>
            <p className="text-sm text-gray-600">Pending Requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {inventory.reduce((sum, e) => sum + getActiveOffersCount(e), 0)}
            </div>
            <p className="text-sm text-gray-600">Active Offers</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory List */}
      {inventory.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No inventory items found
            </h3>
            <p className="text-gray-600 mb-6">
              {filters.showLowStock
                ? 'No items are currently low on stock.'
                : 'Add your first inventory item to start managing your relief supplies.'
              }
            </p>
            {onAddNew && !filters.showLowStock && (
              <Button onClick={onAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {inventory.map((entry) => {
            const statusConfig = STATUS_CONFIG[entry.status]
            const stockLevel = getStockLevel(entry)
            const pendingRequests = getPendingRequestsCount(entry)
            const activeOffers = getActiveOffersCount(entry)

            return (
              <Card key={entry.entry_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {entry.item_type.name}
                        {entry.is_verified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✓ Verified
                          </Badge>
                        )}
                        {entry.item_type.is_perishable && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Perishable
                          </Badge>
                        )}
                      </CardTitle>

                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {entry.district.district_name}, {entry.tehsil.tehsil_name}
                          {entry.village && `, ${entry.village.village_name}`}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatAvailability(entry)}
                        </span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>

                      {pendingRequests > 0 && (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {pendingRequests} request{pendingRequests > 1 ? 's' : ''}
                        </Badge>
                      )}

                      {activeOffers > 0 && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          {activeOffers} offer{activeOffers > 1 ? 's' : ''}
                        </Badge>
                      )}

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusToggle(entry)}
                          className="h-8 w-8 p-0"
                          title={entry.status === 'AVAILABLE' ? 'Mark as out of stock' : 'Mark as available'}
                        >
                          {entry.status === 'AVAILABLE' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>

                        {onEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(entry)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(entry)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Quantity and Condition */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="font-medium">Quantity:</span>{' '}
                          <span className={`font-bold ${
                            stockLevel === 'out' ? 'text-red-600' :
                            stockLevel === 'low' ? 'text-yellow-600' :
                            stockLevel === 'medium' ? 'text-blue-600' :
                            'text-green-600'
                          }`}>
                            {entry.quantity_available} / {entry.quantity_total} {entry.item_type.unit}
                          </span>
                        </div>

                        <div>
                          <span className="font-medium">Condition:</span>{' '}
                          <span className={CONDITION_CONFIG[entry.condition].color}>
                            {CONDITION_CONFIG[entry.condition].label}
                          </span>
                        </div>
                      </div>

                      {/* Stock Level Indicator */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Stock Level:</span>
                        <div className={`w-16 h-2 rounded-full ${
                          stockLevel === 'out' ? 'bg-red-200' :
                          stockLevel === 'low' ? 'bg-yellow-200' :
                          stockLevel === 'medium' ? 'bg-blue-200' :
                          'bg-green-200'
                        }`}>
                          <div
                            className={`h-full rounded-full ${
                              stockLevel === 'out' ? 'bg-red-500' :
                              stockLevel === 'low' ? 'bg-yellow-500' :
                              stockLevel === 'medium' ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (entry.quantity_available / entry.quantity_total) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="text-sm text-gray-600 space-y-1">
                      {entry.batch_number && (
                        <div><span className="font-medium">Batch:</span> {entry.batch_number}</div>
                      )}

                      {entry.expiry_date && (
                        <div>
                          <span className="font-medium">Expires:</span>{' '}
                          <span className={
                            new Date(entry.expiry_date) < new Date() ? 'text-red-600' :
                            new Date(entry.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-yellow-600' :
                            'text-gray-600'
                          }>
                            {new Date(entry.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {entry.storage_location && (
                        <div><span className="font-medium">Storage:</span> {entry.storage_location}</div>
                      )}

                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Added {new Date(entry.created_at).toLocaleDateString()}
                          {entry.provider.alias && ` • ${entry.provider.alias}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
