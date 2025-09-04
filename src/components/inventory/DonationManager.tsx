'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  User,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  MessageSquare,
  Send,
  Phone,
  Mail
} from 'lucide-react'

interface DonationOffer {
  offer_id: string
  donor_name: string
  donor_contact: string
  quantity_offered: number
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'POOR'
  available_date?: string
  delivery_method?: string
  notes?: string
  status: 'OFFERED' | 'ACCEPTED' | 'DELIVERED' | 'CANCELLED'
  created_at: string
  updated_at: string
  donor: {
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

interface DonationManagerProps {
  entryId?: string
  onOfferCreated?: () => void
  className?: string
}

const STATUS_CONFIG = {
  OFFERED: { label: 'Offered', color: 'bg-blue-100 text-blue-800', icon: Heart },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  DELIVERED: { label: 'Delivered', color: 'bg-purple-100 text-purple-800', icon: Truck },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle }
}

const CONDITION_CONFIG = {
  NEW: { label: 'New', color: 'text-green-600' },
  GOOD: { label: 'Good', color: 'text-blue-600' },
  FAIR: { label: 'Fair', color: 'text-yellow-600' },
  POOR: { label: 'Poor', color: 'text-red-600' }
}

export function DonationManager({
  entryId,
  onOfferCreated,
  className = ''
}: DonationManagerProps) {
  const [offers, setOffers] = useState<DonationOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Create offer form state
  const [quantityOffered, setQuantityOffered] = useState('')
  const [condition, setCondition] = useState<'NEW' | 'GOOD' | 'FAIR' | 'POOR'>('NEW')
  const [availableDate, setAvailableDate] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorContact, setDonorContact] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (entryId) {
      loadOffers()
    }
  }, [entryId])

  const loadOffers = async () => {
    if (!entryId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/inventory/${entryId}/donations`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load donation offers')
      }

      setOffers(data.donationOffers || [])
    } catch (err) {
      console.error('Error loading donation offers:', err)
      setError(err instanceof Error ? err.message : 'Failed to load donation offers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateOffer = async () => {
    if (!entryId || !quantityOffered || parseInt(quantityOffered) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (!donorName || !donorContact) {
      setError('Please provide donor name and contact information')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/inventory/${entryId}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token') || 'anonymous'}`
        },
        body: JSON.stringify({
          quantityOffered: parseInt(quantityOffered),
          condition,
          availableDate: availableDate || undefined,
          deliveryMethod: deliveryMethod || undefined,
          donorName,
          donorContact,
          notes: notes || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create donation offer')
      }

      // Add new offer to list
      setOffers(prev => [data.donationOffer, ...prev])

      // Reset form
      setQuantityOffered('')
      setCondition('NEW')
      setAvailableDate('')
      setDeliveryMethod('')
      setDonorName('')
      setDonorContact('')
      setNotes('')
      setShowCreateForm(false)

      onOfferCreated?.()
    } catch (err) {
      console.error('Error creating donation offer:', err)
      setError(err instanceof Error ? err.message : 'Failed to create donation offer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getOffersByStatus = (status: string) => {
    return offers.filter(o => o.status === status)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading donation offers...</span>
      </div>
    )
  }

  if (error && !entryId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadOffers} variant="outline">
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
          <h3 className="text-lg font-semibold text-gray-900">Donation Offers</h3>
          <p className="text-gray-600">
            Manage offers from donors to supply your needed items
          </p>
        </div>

        {entryId && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
            variant={showCreateForm ? "outline" : "default"}
          >
            <Heart className="w-4 h-4" />
            {showCreateForm ? 'Cancel' : 'Offer Donation'}
          </Button>
        )}
      </div>

      {/* Create Offer Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              New Donation Offer
            </CardTitle>
            <CardDescription>
              Offer to supply items to help with relief efforts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Donor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="donorName" className="text-sm font-medium">Your Name *</Label>
                <Input
                  id="donorName"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="donorContact" className="text-sm font-medium">Contact Information *</Label>
                <Input
                  id="donorContact"
                  value={donorContact}
                  onChange={(e) => setDonorContact(e.target.value)}
                  placeholder="Phone number or email"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Offer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">Quantity Offered *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantityOffered}
                  onChange={(e) => setQuantityOffered(e.target.value)}
                  placeholder="e.g., 100"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="condition" className="text-sm font-medium">Item Condition</Label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="availableDate" className="text-sm font-medium">Available Date (Optional)</Label>
                <Input
                  id="availableDate"
                  type="date"
                  value={availableDate}
                  onChange={(e) => setAvailableDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="deliveryMethod" className="text-sm font-medium">Delivery Method (Optional)</Label>
                <Input
                  id="deliveryMethod"
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  placeholder="e.g., Courier, Self-delivery"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Additional Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about your donation offer..."
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
                onClick={handleCreateOffer}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Offer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {getOffersByStatus('OFFERED').length}
            </div>
            <p className="text-sm text-gray-600">Offered</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {getOffersByStatus('ACCEPTED').length}
            </div>
            <p className="text-sm text-gray-600">Accepted</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {getOffersByStatus('DELIVERED').length}
            </div>
            <p className="text-sm text-gray-600">Delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {getOffersByStatus('CANCELLED').length}
            </div>
            <p className="text-sm text-gray-600">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No donation offers yet
            </h4>
            <p className="text-gray-600">
              {entryId
                ? 'Be the first to offer donations for this item.'
                : 'Select an inventory item to view donation offers.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const statusConfig = STATUS_CONFIG[offer.status]
            const StatusIcon = statusConfig.icon

            return (
              <Card key={offer.offer_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        {offer.inventory_entry.item_type.name}
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline" className={`border-current ${CONDITION_CONFIG[offer.condition].color}`}>
                          {CONDITION_CONFIG[offer.condition].label}
                        </Badge>
                      </CardTitle>

                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {offer.donor_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {offer.donor_contact}
                        </span>
                        <span>
                          Offered: {offer.quantity_offered} {offer.inventory_entry.item_type.unit}
                        </span>
                      </CardDescription>
                    </div>

                    <div className="text-right text-sm text-gray-500">
                      <div>{new Date(offer.created_at).toLocaleDateString()}</div>
                      {offer.available_date && (
                        <div>Available: {new Date(offer.available_date).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {offer.delivery_method && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Truck className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Delivery Method:</span>
                        </div>
                        <p className="text-sm text-gray-600 ml-5">{offer.delivery_method}</p>
                      </div>
                    )}

                    {offer.notes && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Notes:</span>
                        </div>
                        <p className="text-sm text-gray-600 ml-5">{offer.notes}</p>
                      </div>
                    )}

                    {offer.reviewer && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Reviewed by:</span> {offer.reviewer.primary_login}
                      </div>
                    )}

                    {/* Action buttons for offered donations */}
                    {offer.status === 'OFFERED' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept Offer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {/* Mark as delivered button for accepted offers */}
                    {offer.status === 'ACCEPTED' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-600 border-purple-300 hover:bg-purple-50"
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          Mark as Delivered
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
