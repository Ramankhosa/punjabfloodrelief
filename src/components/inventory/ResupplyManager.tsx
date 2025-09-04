'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  MessageSquare,
  Send
} from 'lucide-react'

interface ResupplyRequest {
  request_id: string
  quantity_requested: number
  urgency_level: 'low' | 'normal' | 'high' | 'critical'
  reason?: string
  preferred_delivery_date?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED'
  created_at: string
  updated_at: string
  requester: {
    user_id: string
    primary_login: string
    email?: string
    phone_e164?: string
  }
  reviewer?: {
    user_id: string
    primary_login: string
    email?: string
    phone_e164?: string
  }
  inventory_entry: {
    entry_id: string
    item_type: {
      name: string
      category: string
      unit: string
    }
    district: { district_name: string }
    tehsil: { tehsil_name: string }
    quantity_available: number
    quantity_total: number
  }
}

interface ResupplyManagerProps {
  entryId?: string
  onRequestCreated?: () => void
  className?: string
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  FULFILLED: { label: 'Fulfilled', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle }
}

const URGENCY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-600' },
  normal: { label: 'Normal', color: 'text-blue-600' },
  high: { label: 'High', color: 'text-orange-600' },
  critical: { label: 'Critical', color: 'text-red-600' }
}

export function ResupplyManager({
  entryId,
  onRequestCreated,
  className = ''
}: ResupplyManagerProps) {
  const [requests, setRequests] = useState<ResupplyRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Create request form state
  const [quantityRequested, setQuantityRequested] = useState('')
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'normal' | 'high' | 'critical'>('normal')
  const [reason, setReason] = useState('')
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (entryId) {
      loadRequests()
    }
  }, [entryId])

  const loadRequests = async () => {
    if (!entryId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/inventory/${entryId}/resupply`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load resupply requests')
      }

      setRequests(data.resupplyRequests || [])
    } catch (err) {
      console.error('Error loading resupply requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to load resupply requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRequest = async () => {
    if (!entryId || !quantityRequested || parseInt(quantityRequested) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/inventory/${entryId}/resupply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token') || 'anonymous'}`
        },
        body: JSON.stringify({
          quantityRequested: parseInt(quantityRequested),
          urgencyLevel,
          reason: reason || undefined,
          preferredDeliveryDate: preferredDeliveryDate || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create resupply request')
      }

      // Add new request to list
      setRequests(prev => [data.resupplyRequest, ...prev])

      // Reset form
      setQuantityRequested('')
      setUrgencyLevel('normal')
      setReason('')
      setPreferredDeliveryDate('')
      setShowCreateForm(false)

      onRequestCreated?.()
    } catch (err) {
      console.error('Error creating resupply request:', err)
      setError(err instanceof Error ? err.message : 'Failed to create resupply request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRequest = async (requestId: string, status: string, reviewNotes?: string) => {
    if (!entryId) return

    try {
      const response = await fetch(`/api/inventory/${entryId}/resupply/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewNotes,
          reviewedBy: 'admin' // In real app, get from auth
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update request')
      }

      const data = await response.json()

      // Update request in list
      setRequests(prev =>
        prev.map(req =>
          req.request_id === requestId ? data.resupplyRequest : req
        )
      )
    } catch (err) {
      console.error('Error updating resupply request:', err)
      setError('Failed to update resupply request')
    }
  }

  const getRequestsByStatus = (status: string) => {
    return requests.filter(r => r.status === status)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading resupply requests...</span>
      </div>
    )
  }

  if (error && !entryId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadRequests} variant="outline">
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
          <h3 className="text-lg font-semibold text-gray-900">Resupply Requests</h3>
          <p className="text-gray-600">
            Manage requests for additional supplies
          </p>
        </div>

        {entryId && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
            variant={showCreateForm ? "outline" : "default"}
          >
            <Plus className="w-4 h-4" />
            {showCreateForm ? 'Cancel' : 'Request Resupply'}
          </Button>
        )}
      </div>

      {/* Create Request Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              New Resupply Request
            </CardTitle>
            <CardDescription>
              Request additional supplies for this inventory item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">Quantity Requested *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantityRequested}
                  onChange={(e) => setQuantityRequested(e.target.value)}
                  placeholder="e.g., 50"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="urgency" className="text-sm font-medium">Urgency Level</Label>
                <select
                  id="urgency"
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="preferredDate" className="text-sm font-medium">Preferred Delivery Date (Optional)</Label>
              <Input
                id="preferredDate"
                type="date"
                value={preferredDeliveryDate}
                onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="reason" className="text-sm font-medium">Reason for Request (Optional)</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you need these supplies..."
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequest}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {getRequestsByStatus('PENDING').length}
            </div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {getRequestsByStatus('APPROVED').length}
            </div>
            <p className="text-sm text-gray-600">Approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {getRequestsByStatus('FULFILLED').length}
            </div>
            <p className="text-sm text-gray-600">Fulfilled</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {getRequestsByStatus('REJECTED').length}
            </div>
            <p className="text-sm text-gray-600">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No resupply requests yet
            </h4>
            <p className="text-gray-600">
              {entryId
                ? 'Create your first resupply request to get more supplies.'
                : 'Select an inventory item to view its resupply requests.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const statusConfig = STATUS_CONFIG[request.status]
            const StatusIcon = statusConfig.icon

            return (
              <Card key={request.request_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {request.inventory_entry.item_type.name}
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline" className={`border-current ${URGENCY_CONFIG[request.urgency_level].color}`}>
                          {URGENCY_CONFIG[request.urgency_level].label} Priority
                        </Badge>
                      </CardTitle>

                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {request.requester.primary_login}
                        </span>
                        <span>
                          Requested: {request.quantity_requested} {request.inventory_entry.item_type.unit}
                        </span>
                        <span>
                          Available: {request.inventory_entry.quantity_available}/{request.inventory_entry.quantity_total}
                        </span>
                      </CardDescription>
                    </div>

                    <div className="text-right text-sm text-gray-500">
                      <div>{new Date(request.created_at).toLocaleDateString()}</div>
                      {request.preferred_delivery_date && (
                        <div>Preferred: {new Date(request.preferred_delivery_date).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {request.reason && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Reason:</span>
                        </div>
                        <p className="text-sm text-gray-600 ml-5">{request.reason}</p>
                      </div>
                    )}

                    {request.reviewer && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Reviewed by:</span> {request.reviewer.primary_login}
                      </div>
                    )}

                    {/* Action buttons for pending requests */}
                    {request.status === 'PENDING' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRequest(request.request_id, 'APPROVED')}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRequest(request.request_id, 'REJECTED')}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Mark as fulfilled button for approved requests */}
                    {request.status === 'APPROVED' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRequest(request.request_id, 'FULFILLED')}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark as Fulfilled
                        </Button>
                      </div>
                    )}
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
