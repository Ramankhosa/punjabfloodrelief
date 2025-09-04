'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { Users, MapPin, Phone, Mail, FileText, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

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

interface ReliefGroupsListProps {
  onGroupSelect?: (group: ReliefGroup) => void
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-500" />
    case 'pending_review':
    case 'needs_more_info':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    default:
      return <Clock className="w-4 h-4 text-blue-500" />
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

export default function ReliefGroupsList({ onGroupSelect }: ReliefGroupsListProps) {
  const [groups, setGroups] = useState<ReliefGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReliefGroups()
  }, [])

  const fetchReliefGroups = async () => {
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
      setGroups(data.groups)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
            <p className="text-sm text-muted">Loading relief groups...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p>Error loading relief groups: {error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReliefGroups}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Relief Groups
          </CardTitle>
          <CardDescription>
            You haven&apos;t registered any relief groups yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/relief-group/register">
              Register Your First Group
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Your Relief Groups
        </h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/relief-group/register">
            Register New Group
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => (
          <Card key={group.groupId} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{group.groupName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted">
                    <Badge variant="outline" className="capitalize">
                      {group.orgType}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(group.status)}
                      <Badge className={getStatusBadgeColor(group.status)}>
                        {formatStatusText(group.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Location */}
              {(group.homeLocation.district || group.homeLocation.tehsil || group.homeLocation.village) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    {[group.homeLocation.district, group.homeLocation.tehsil, group.homeLocation.village]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {group.contactInfo.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4 text-muted" />
                    <span>{group.contactInfo.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-muted" />
                  <span>{group.contactInfo.phone}</span>
                </div>
              </div>

              {/* Representative */}
              {group.representative && (
                <div className="text-sm">
                  <span className="font-medium">Representative:</span> {group.representative.name}
                  {group.representative.verified && (
                    <CheckCircle className="w-4 h-4 text-green-500 inline ml-1" />
                  )}
                </div>
              )}

              {/* Operations */}
              {group.intendedOperations.length > 0 && (
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
              )}

              {/* Documents */}
              <div className="flex items-center gap-1 text-sm text-muted">
                <FileText className="w-4 h-4" />
                <span>{group.documentCount} document{group.documentCount !== 1 ? 's' : ''}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => onGroupSelect?.(group)}
                  disabled={group.status !== 'verified'}
                >
                  Manage Operations
                </Button>
                {group.status === 'needs_more_info' && (
                  <Button variant="outline" size="sm">
                    Update Information
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
