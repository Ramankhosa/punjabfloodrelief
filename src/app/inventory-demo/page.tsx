'use client'

import { useState } from 'react'
import { InventoryList, InventoryCard, ResupplyManager, DonationManager } from '@/components/inventory'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  RefreshCw,
  Heart,
  AlertTriangle,
  CheckCircle,
  Users,
  MapPin,
  Clock
} from 'lucide-react'

export default function InventoryDemoPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

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

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex items-center gap-2"
            >
              ← Back to Inventory
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inventory Management System
          </h1>
          <p className="text-gray-600">
            Complete rewrite of the capability module with granular item availability management
          </p>

          {/* Key Features */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Granular Control</span>
                </div>
                <p className="text-sm text-gray-600">
                  Individual item availability management with real-time status updates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Resupply System</span>
                </div>
                <p className="text-sm text-gray-600">
                  Automated resupply requests with approval workflows
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Donor Integration</span>
                </div>
                <p className="text-sm text-gray-600">
                  Donors can directly offer supplies to relief groups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Online-Only</span>
                </div>
                <p className="text-sm text-gray-600">
                  Simplified online-only system without offline complexity
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="resupply">Resupply Requests</TabsTrigger>
            <TabsTrigger value="donations">Donation Offers</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryList
              onAddNew={handleAddNew}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="resupply" className="space-y-6">
            <ResupplyManager
              entryId={selectedEntryId || undefined}
            />
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
            <DonationManager
              entryId={selectedEntryId || undefined}
            />
          </TabsContent>
        </Tabs>

        {/* Implementation Notes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Implementation Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">✅ What's Been Implemented:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Complete inventory data model with granular item management</li>
                  <li>• Resupply request system with approval workflows</li>
                  <li>• Donor integration for direct supply offers</li>
                  <li>• Online-only architecture (no offline complexity)</li>
                  <li>• RESTful API endpoints for all operations</li>
                  <li>• React components with modern UI/UX</li>
                  <li>• Migration scripts from old capability system</li>
                  <li>• Database schema with proper relationships</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">🎯 Key Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Individual item availability management</li>
                  <li>• Real-time stock level monitoring</li>
                  <li>• Automated resupply request generation</li>
                  <li>• Donor-to-relief-group direct connections</li>
                  <li>• Batch tracking and expiry management</li>
                  <li>• Quality assessment and verification</li>
                  <li>• Location-based inventory distribution</li>
                  <li>• Comprehensive audit trails</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🚀 Next Steps:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Run database migration: <code className="bg-blue-100 px-1 rounded">npx prisma migrate dev</code></li>
                <li>2. Seed inventory item types: <code className="bg-blue-100 px-1 rounded">node scripts/seed-inventory-item-types.js</code></li>
                <li>3. Update frontend to use new inventory system</li>
                <li>4. Remove old capability components and API routes</li>
                <li>5. Test the complete system with real data</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
