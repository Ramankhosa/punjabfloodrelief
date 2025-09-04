'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { InventoryList, InventoryCard, ResupplyManager, DonationManager } from '@/components/inventory'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/components/ui'
import {
  Package,
  RefreshCw,
  Heart,
  AlertTriangle,
  CheckCircle,
  Users,
  MapPin,
  Clock,
  ArrowLeft,
  Activity
} from 'lucide-react'

interface ReliefGroup {
  groupId: string
  groupName: string
  orgType: 'government' | 'ngo' | 'independent'
  status: 'submitted' | 'pending_review' | 'verified' | 'rejected' | 'needs_more_info'
  homeLocation: {
    district?: string
    tehsil?: string
    village?: string
    lat?: number
    lon?: number
  }
  contactInfo: {
    email?: string
    phone: string
  }
  intendedOperations: string[]
  representative: {
    name: string
    phone: string
    verified: boolean
  } | null
  documentCount: number
  createdAt: string
  updatedAt: string
}

export default function ReliefOperationsPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupId as string

  const [group, setGroup] = useState<ReliefGroup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'inventory' | 'resupply' | 'donations'>('inventory')

  const fetchGroupDetails = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        throw new Error('No access token found. Please log in again.')
      }

      const response = await fetch('/api/relief-groups', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.')
        }
        throw new Error('Failed to fetch relief groups')
      }

      const data = await response.json()
      const foundGroup = data.groups.find((g: ReliefGroup) => g.groupId === groupId)

      if (!foundGroup) {
        throw new Error('Relief group not found')
      }

      if (foundGroup.status !== 'verified') {
        throw new Error('This relief group is not verified yet')
      }

      setGroup(foundGroup)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails()
    }
  }, [groupId, fetchGroupDetails])

  const handleAddNew = () => {
    setShowAddForm(true)
    setSelectedEntryId(null)
  }

  const handleEdit = (entry: any) => {
    setShowAddForm(true)
    setSelectedEntryId(entry.entry_id)
  }

  const handleSave = (entry: any) => {
    console.log('Saved inventory entry:', entry)
    setShowAddForm(false)
    setSelectedEntryId(null)
    // In a real app, this would refresh the inventory list
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setSelectedEntryId(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted">Loading relief operations...</p>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-navy mb-2">Access Denied</h1>
          <p className="text-muted mb-6">
            {error || 'Unable to load relief operations for this group.'}
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-surface py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Operations
            </Button>
          </div>

          <InventoryCard
            onSave={handleSave}
            onCancel={handleCancel}
            initialData={selectedEntryId ? { entry_id: selectedEntryId } : undefined}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-muted bg-surface/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-navy">{group.groupName}</h1>
                <p className="text-sm text-muted">Relief Operations Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {group.orgType}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Group Info Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Operations Overview
            </CardTitle>
            <CardDescription>
              Manage inventory, resupply requests, and donation offers for {group.groupName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted" />
                <div className="text-sm">
                  <span className="font-medium">Location:</span>
                  <div>
                    {[group.homeLocation.district, group.homeLocation.tehsil, group.homeLocation.village]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted" />
                <div className="text-sm">
                  <span className="font-medium">Representative:</span>
                  <div>{group.representative?.name || 'Not specified'}</div>
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Operations:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {group.intendedOperations.map((operation, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {operation}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted" />
                <div className="text-sm">
                  <span className="font-medium">Registered:</span>
                  <div>{new Date(group.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations Navigation */}
        <div className="border-b border-muted mb-6">
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'inventory' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('inventory')}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Inventory
            </Button>
            <Button
              variant={activeTab === 'resupply' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('resupply')}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Resupply
            </Button>
            <Button
              variant={activeTab === 'donations' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('donations')}
              className="flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Donations
            </Button>
          </div>
        </div>

        {/* Operations Content */}
        <div className="space-y-6">
          {activeTab === 'inventory' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Inventory Management</h3>
                  <p className="text-sm text-muted">
                    Manage available supplies and track inventory levels
                  </p>
                </div>
                <Button onClick={handleAddNew} className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Add Inventory Item
                </Button>
              </div>
              <InventoryList
                onAddNew={handleAddNew}
                onEdit={handleEdit}
              />
            </>
          )}

          {activeTab === 'resupply' && (
            <>
              <div>
                <h3 className="text-lg font-semibold">Resupply Requests</h3>
                <p className="text-sm text-muted">
                  Request additional supplies when inventory runs low
                </p>
              </div>
              <ResupplyManager
                entryId={selectedEntryId || undefined}
              />
            </>
          )}

          {activeTab === 'donations' && (
            <>
              <div>
                <h3 className="text-lg font-semibold">Donation Offers</h3>
                <p className="text-sm text-muted">
                  View and manage offers from donors to support your operations
                </p>
              </div>
              <DonationManager
                entryId={selectedEntryId || undefined}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
