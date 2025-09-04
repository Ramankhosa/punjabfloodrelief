'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Shield,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Calendar,
  Eye
} from 'lucide-react'

interface ReliefGroupDetail {
  groupId: string
  groupName: string
  orgType: 'government' | 'ngo' | 'independent'
  status: 'submitted' | 'pending_review' | 'verified' | 'rejected' | 'needs_more_info'
  registrationNumber?: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  reviewNotes?: string
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
  serviceArea?: any
  createdBy: {
    userId: string
    primaryLogin: string
    email?: string
    phone?: string
    roles: string[]
  }
  reviewedBy?: {
    userId: string
    primaryLogin: string
    email?: string
    phone?: string
  }
  representative?: {
    name: string
    phone: string
    verified: boolean
  }
  documents: Array<{
    docId: string
    type: string
    fileUrl: string
    checksum: string
    sizeBytes: number
    createdAt: string
  }>
  auditLogs: Array<{
    logId: string
    action: string
    targetType?: string
    targetId?: string
    metadata?: any
    createdAt: string
    actor?: {
      userId: string
      primaryLogin: string
    }
  }>
}

export default function AdminReliefGroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string

  const [group, setGroup] = useState<ReliefGroupDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    loadGroupDetails()
  }, [groupId])

  const loadGroupDetails = async () => {
    try {
      const response = await fetch(`/api/admin/relief-groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setGroup(data.group)
        setReviewNotes(data.group.reviewNotes || '')
      } else if (response.status === 404) {
        alert('Relief group not found')
        router.push('/admin')
      } else {
        const error = await response.json()
        alert(`Error loading group: ${error.error}`)
        router.push('/admin')
      }
    } catch (error) {
      console.error('Error loading group details:', error)
      alert('Error loading group details')
      router.push('/admin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveGroup = async () => {
    if (!confirm('Are you sure you want to approve this relief group?')) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/relief-groups/${groupId}?action=approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: reviewNotes,
        }),
      })

      if (response.ok) {
        alert('Relief group approved successfully!')
        await loadGroupDetails()
      } else {
        const error = await response.json()
        alert(`Error approving group: ${error.error}`)
      }
    } catch (error) {
      console.error('Error approving group:', error)
      alert('Error approving group')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectGroup = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    if (!confirm('Are you sure you want to reject this relief group?')) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/relief-groups/${groupId}?action=reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: rejectionReason,
          notes: reviewNotes,
        }),
      })

      if (response.ok) {
        alert('Relief group rejected successfully!')
        await loadGroupDetails()
      } else {
        const error = await response.json()
        alert(`Error rejecting group: ${error.error}`)
      }
    } catch (error) {
      console.error('Error rejecting group:', error)
      alert('Error rejecting group')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending_review':
      case 'needs_more_info':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-blue-500" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending_review':
      case 'needs_more_info':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const formatStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted">Loading relief group details...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Group Not Found</h2>
          <p className="text-muted mb-4">The relief group you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-muted bg-surface/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-accent" />
              <h1 className="text-lg font-bold text-navy">Relief Group Details</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(group.status)}
            <Badge className={getStatusBadgeColor(group.status)}>
              {formatStatusText(group.status)}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{group.groupName}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <Badge variant="outline" className="capitalize">
                    {group.orgType}
                  </Badge>
                  {group.registrationNumber && (
                    <span>Reg: {group.registrationNumber}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h3>
                  <div className="text-sm text-muted">
                    {[group.homeLocation.district, group.homeLocation.tehsil, group.homeLocation.village]
                      .filter(Boolean)
                      .join(', ')}
                    {group.homeLocation.lat && group.homeLocation.lon && (
                      <div className="mt-1">
                        Coordinates: {group.homeLocation.lat.toFixed(6)}, {group.homeLocation.lon.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div>Phone: {group.contactInfo.phone}</div>
                    {group.contactInfo.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {group.contactInfo.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Representative */}
                {group.representative && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Representative
                    </h3>
                    <div className="text-sm">
                      <div className="font-medium">{group.representative.name}</div>
                      <div className="text-muted">{group.representative.phone}</div>
                      {group.representative.verified && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Intended Operations */}
                <div>
                  <h3 className="font-medium mb-2">Intended Operations</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.intendedOperations.map((operation, index) => (
                      <Badge key={index} variant="secondary">
                        {operation}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents ({group.documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.documents.length === 0 ? (
                  <p className="text-muted">No documents uploaded</p>
                ) : (
                  <div className="space-y-3">
                    {group.documents.map((doc) => (
                      <div key={doc.docId} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium capitalize">{doc.type.replace('_', ' ')}</div>
                          <div className="text-sm text-muted">
                            {formatFileSize(doc.sizeBytes)} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.auditLogs.map((log) => (
                    <div key={log.logId} className="flex items-start gap-3 p-3 border rounded">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{log.action}</span>
                          {log.actor && (
                            <span className="text-muted"> by {log.actor.primaryLogin}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                        {log.metadata && (
                          <div className="text-xs text-muted mt-1">
                            {JSON.stringify(log.metadata, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Group Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Current Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(group.status)}
                    <Badge className={getStatusBadgeColor(group.status)}>
                      {formatStatusText(group.status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="text-sm text-muted mt-1">
                    {new Date(group.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {group.reviewedAt && (
                  <div>
                    <Label className="text-sm font-medium">Reviewed</Label>
                    <div className="text-sm text-muted mt-1">
                      {new Date(group.reviewedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <div className="text-sm mt-1">
                    {group.createdBy.primaryLogin}
                    <div className="text-xs text-muted">
                      {group.createdBy.email || group.createdBy.phone}
                    </div>
                  </div>
                </div>

                {group.reviewedBy && (
                  <div>
                    <Label className="text-sm font-medium">Reviewed By</Label>
                    <div className="text-sm mt-1">
                      {group.reviewedBy.primaryLogin}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Actions */}
            {(group.status === 'submitted' || group.status === 'pending_review') && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                  <CardDescription>
                    Approve or reject this relief group
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="review-notes">Review Notes</Label>
                    <Textarea
                      id="review-notes"
                      placeholder="Add any notes about your review..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {group.status !== 'rejected' && (
                    <Button
                      onClick={handleApproveGroup}
                      disabled={actionLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve Group
                    </Button>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                    <Textarea
                      id="rejection-reason"
                      placeholder="Provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleRejectGroup}
                    disabled={actionLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject Group
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Current Review Notes */}
            {group.reviewNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted">{group.reviewNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
