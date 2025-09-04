'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Shield,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Save
} from 'lucide-react'

interface UserDetail {
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

const AVAILABLE_ROLES = [
  { id: 'admin', label: 'Administrator', description: 'Full system access and user management' },
  { id: 'group_approver', label: 'Group Approver', description: 'Can approve/reject relief groups' },
  { id: 'group_rep', label: 'Group Representative', description: 'Relief group representative' },
  { id: 'user', label: 'User', description: 'Basic user access' },
]

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [reason, setReason] = useState('')

  useEffect(() => {
    loadUserDetails()
  }, [userId])

  const loadUserDetails = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setSelectedRoles(data.user.roles)
      } else if (response.status === 404) {
        alert('User not found')
        router.push('/admin')
      } else {
        const error = await response.json()
        alert(`Error loading user: ${error.error}`)
        router.push('/admin')
      }
    } catch (error) {
      console.error('Error loading user details:', error)
      alert('Error loading user details')
      router.push('/admin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId])
    } else {
      setSelectedRoles(prev => prev.filter(role => role !== roleId))
    }
  }

  const handleSaveRoles = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the role changes')
      return
    }

    if (selectedRoles.length === 0) {
      alert('User must have at least one role')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roles: selectedRoles,
          reason: reason.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(prev => prev ? { ...prev, roles: data.user.roles } : null)
        setReason('')
        alert('User roles updated successfully!')
      } else {
        const error = await response.json()
        alert(`Error updating roles: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating user roles:', error)
      alert('Error updating user roles')
    } finally {
      setIsSaving(false)
    }
  }

  const hasRoleChanged = () => {
    if (!user) return false
    return JSON.stringify(user.roles.sort()) !== JSON.stringify(selectedRoles.sort())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-muted mb-4">The user you're looking for doesn't exist.</p>
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
              <h1 className="text-lg font-bold text-navy">User Management</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.is_active ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="w-6 h-6" />
                  {user.primary_login}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {user.roles.map((role, index) => (
                    <Badge key={role} variant="outline" className="capitalize">
                      {role.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Primary Login
                    </Label>
                    <div className="text-sm mt-1">{user.primary_login}</div>
                  </div>

                  {user.email && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <div className="text-sm mt-1">{user.email}</div>
                    </div>
                  )}

                  {user.phone_e164 && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </Label>
                      <div className="text-sm mt-1">
                        {user.phone_e164}
                        {user.phone_verified_at && (
                          <CheckCircle className="w-3 h-3 text-green-500 inline ml-1" />
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Account Created
                    </Label>
                    <div className="text-sm mt-1">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {user.last_login_at && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Last Login
                      </Label>
                      <div className="text-sm mt-1">
                        {new Date(user.last_login_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Activity Summary */}
                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{user._count.relief_groups}</div>
                    <div className="text-sm text-muted">Relief Groups</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{user._count.reviewed_groups}</div>
                    <div className="text-sm text-muted">Groups Reviewed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role Management */}
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
                <CardDescription>
                  Update user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {AVAILABLE_ROLES.map((role) => (
                    <div key={role.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={role.id}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                        disabled={isSaving}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={role.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {role.label}
                        </Label>
                        <p className="text-xs text-muted">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {hasRoleChanged() && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="reason">Reason for Changes</Label>
                      <Textarea
                        id="reason"
                        placeholder="Explain why you're making these role changes..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1"
                        disabled={isSaving}
                      />
                    </div>

                    <Button
                      onClick={handleSaveRoles}
                      disabled={isSaving || !reason.trim()}
                      className="w-full"
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Role Changes
                    </Button>
                  </div>
                )}

                {/* Current Roles Summary */}
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium">Current Roles</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.roles.map((role, index) => (
                      <Badge key={role} variant="secondary" className="capitalize">
                        {role.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Selected Roles Preview */}
                {hasRoleChanged() && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">New Roles</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRoles.map((role, index) => (
                        <Badge key={role} variant="outline" className="capitalize">
                          {role.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Back to User List
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin?tab=users')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Role Information */}
            <Card>
              <CardHeader>
                <CardTitle>Role Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm">Administrator</h4>
                  <p className="text-xs text-muted">
                    Can manage users, approve groups, and access all admin features
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm">Group Approver</h4>
                  <p className="text-xs text-muted">
                    Can approve or reject relief group applications
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm">Group Representative</h4>
                  <p className="text-xs text-muted">
                    Represents a registered relief group
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm">User</h4>
                  <p className="text-xs text-muted">
                    Basic user with access to standard features
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
