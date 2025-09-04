'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, FileText, Settings, LogOut } from 'lucide-react'
import ReliefGroupsList from '@/components/ReliefGroupsList'

interface User {
  userId: string
  primaryLogin: string
  email?: string
  phone?: string
  roles: string[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthAndLoadUser()
  }, [router])

  const checkAuthAndLoadUser = async () => {
    try {
      // Check if user is authenticated
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        router.push('/auth/login')
        return
      }

      // Fetch user data from API
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        // Token might be invalid, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        router.push('/auth/login')
        return
      }

      const data = await response.json()

      if (data.user) {
        setUser({
          userId: data.user.userId,
          primaryLogin: data.user.primaryLogin,
          email: data.user.email,
          phone: data.user.phone,
          roles: data.user.roles,
        })
      } else {
        // No user data, redirect to login
        router.push('/auth/login')
        return
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // On error, redirect to login
      router.push('/auth/login')
      return
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted">Loading dashboard...</p>
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
            <h1 className="text-xl font-bold text-navy">Punjab Flood Relief</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">
              Welcome, {user.email || user.phone || 'User'}
            </span>
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
          <h1 className="text-3xl font-bold text-navy mb-2">Dashboard</h1>
          <p className="text-muted">
            Welcome to the Punjab Flood Relief coordination platform
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Admin Panel - Only show for admin/group_approver users */}
          {(user.roles.includes('admin') || user.roles.includes('group_approver')) && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-accent/20">
              <CardHeader>
                <Shield className="w-8 h-8 text-accent mb-2" />
                <CardTitle>Admin Panel</CardTitle>
                <CardDescription>
                  Manage relief groups, users, and system administration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin">
                    Access Admin
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Register Relief Group</CardTitle>
              <CardDescription>
                Register your organization or volunteer group to join relief efforts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/relief-group/register">
                  Get Started
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Report Incident</CardTitle>
              <CardDescription>
                Report flood-related incidents and request assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Report Now
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <Settings className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your profile and account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Relief Groups */}
        <div className="mb-8">
          <ReliefGroupsList onGroupSelect={(group) => {
            router.push(`/relief-operations/${group.groupId}`)
          }} />
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Primary Login:</span> {user.primaryLogin}
            </div>
            {user.email && (
              <div>
                <span className="font-medium">Email:</span> {user.email}
              </div>
            )}
            {user.phone && (
              <div>
                <span className="font-medium">Phone:</span> {user.phone}
              </div>
            )}
            <div>
              <span className="font-medium">Roles:</span>{' '}
              <span className="inline-flex items-center gap-1">
                {user.roles.map((role, index) => (
                  <span
                    key={role}
                    className="bg-accent/10 text-accent px-2 py-1 rounded text-xs font-medium"
                  >
                    {role}
                    {index < user.roles.length - 1 && ','}
                  </span>
                ))}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
