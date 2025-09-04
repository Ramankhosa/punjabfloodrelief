'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, CheckCircle, XCircle, Clock, AlertCircle, Settings, LogOut, Eye, UserCheck } from 'lucide-react'
import ServiceManager from '@/components/ServiceManager'
import LocationManager from '@/components/LocationManager'
import AlertManager from '@/components/AlertManager'
import LocationStatusManager from '@/components/LocationStatusManager'

interface AdminStats {
  totalGroups: number
  pendingGroups: number
  approvedGroups: number
  rejectedGroups: number
  totalUsers: number
  adminUsers: number
}

interface User {
  user_id: string
  primary_login: string
  email?: string
  phone_e164?: string
  roles: string[]
  phone_verified_at?: string
  created_at: string
  last_login_at?: string
  is_active: boolean
  _count: {
    relief_groups: number
    reviewed_groups: number
  }
}

interface ReliefGroup {
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
  createdBy: {
    userId: string
    primaryLogin: string
    email?: string
    phone?: string
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
  documentCount: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [groups, setGroups] = useState<ReliefGroup[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // Check authentication
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        router.push('/auth/login')
        return
      }

      // Load user data and check permissions
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!userResponse.ok) {
        router.push('/auth/login')
        return
      }

      const userData = await userResponse.json()
      setUser(userData.user)

      // Check if user has admin or approver role
      if (!userData.user.roles.includes('admin') && !userData.user.roles.includes('group_approver')) {
        router.push('/dashboard')
        return
      }

      // Load admin data
      await Promise.all([
        loadStats(),
        loadGroups(),
        loadUsers(),
      ])
    } catch (error) {
      console.error('Error loading admin dashboard:', error)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin?stats=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadGroups = async (status?: string) => {
    try {
      const url = status ? `/api/admin?status=${status}` : '/api/admin'
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
      }
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin?users=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleApproveGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/admin/relief-groups/${groupId}?action=approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Approved by admin',
        }),
      })

      if (response.ok) {
        await loadGroups()
        await loadStats()
      } else {
        const error = await response.json()
        alert(`Error approving group: ${error.error}`)
      }
    } catch (error) {
      console.error('Error approving group:', error)
      alert('Error approving group')
    }
  }

  const handleRejectGroup = async (groupId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    try {
      const response = await fetch(`/api/admin/relief-groups/${groupId}?action=reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          notes: 'Rejected by admin',
        }),
      })

      if (response.ok) {
        await loadGroups()
        await loadStats()
      } else {
        const error = await response.json()
        alert(`Error rejecting group: ${error.error}`)
      }
    } catch (error) {
      console.error('Error rejecting group:', error)
      alert('Error rejecting group')
    }
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')

    if (refreshToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-muted bg-surface/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold text-navy">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">
              Welcome, {user.primary_login}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <Settings className="w-4 h-4 mr-2" />
                User Dashboard
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Admin Dashboard</h1>
          <p className="text-muted">
            Manage relief groups, users, and system administration
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="groups">Relief Groups</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="status">Location Status</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                    <Users className="h-4 w-4 text-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalGroups}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pendingGroups}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.approvedGroups}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    setActiveTab('groups')
                    loadGroups('submitted')
                  }}
                  className="h-auto p-4 flex flex-col items-start"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Review Pending Groups</span>
                  </div>
                  <span className="text-sm text-muted">
                    Approve or reject relief groups awaiting review
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setActiveTab('users')}
                  className="h-auto p-4 flex flex-col items-start"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-5 h-5" />
                    <span className="font-medium">Manage Users</span>
                  </div>
                  <span className="text-sm text-muted">
                    Update user roles and permissions
                  </span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            {/* Group Status Filter */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => loadGroups()}
                size="sm"
              >
                All Groups
              </Button>
              <Button
                variant="outline"
                onClick={() => loadGroups('submitted')}
                size="sm"
              >
                Pending Review
              </Button>
              <Button
                variant="outline"
                onClick={() => loadGroups('verified')}
                size="sm"
              >
                Approved
              </Button>
              <Button
                variant="outline"
                onClick={() => loadGroups('rejected')}
                size="sm"
              >
                Rejected
              </Button>
            </div>

            {/* Groups List */}
            <div className="space-y-4">
              {groups.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <p className="text-muted">No relief groups found</p>
                  </CardContent>
                </Card>
              ) : (
                groups.map((group) => (
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
                        <div className="flex gap-2">
                          {(group.status === 'submitted' || group.status === 'pending_review') && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveGroup(group.groupId)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectGroup(group.groupId)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/relief-groups/${group.groupId}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Location */}
                      {(group.homeLocation.district || group.homeLocation.tehsil) && (
                        <div className="flex items-start gap-2">
                          <div className="text-sm">
                            <span className="font-medium">Location:</span>{' '}
                            {[group.homeLocation.district, group.homeLocation.tehsil, group.homeLocation.village]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Contact & Representative */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {group.contactInfo.email && (
                          <div>
                            <span className="font-medium">Email:</span> {group.contactInfo.email}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Phone:</span> {group.contactInfo.phone}
                        </div>
                        {group.representative && (
                          <div>
                            <span className="font-medium">Rep:</span> {group.representative.name}
                          </div>
                        )}
                      </div>

                      {/* Operations */}
                      {group.intendedOperations.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Operations:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {group.intendedOperations.slice(0, 3).map((operation, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {operation}
                              </Badge>
                            ))}
                            {group.intendedOperations.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{group.intendedOperations.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Created/Reviewed Info */}
                      <div className="flex justify-between text-xs text-muted">
                        <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                        {group.reviewedAt && (
                          <span>Reviewed: {new Date(group.reviewedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-muted">No users found</p>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{user.primary_login}</div>
                          <div className="text-sm text-muted">
                            {user.email && <span>{user.email}</span>}
                            {user.email && user.phone_e164 && <span> • </span>}
                            {user.phone_e164 && <span>{user.phone_e164}</span>}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {user.roles.map((role, index) => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/users/${user.user_id}`)}
                        >
                          Manage Roles
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <ServiceManager />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <LocationManager />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertManager />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <LocationStatusManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>
                  Configure system settings and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-muted">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Admin settings panel coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
