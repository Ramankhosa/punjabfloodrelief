'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const messageParam = searchParams.get('message')
    if (messageParam) {
      setMessage(messageParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setMessage(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          const errorMap: Record<string, string> = {}
          data.details.forEach((error: any) => {
            errorMap[error.path[0]] = error.message
          })
          setErrors(errorMap)
        } else {
          setErrors({ general: data.error })
        }
        return
      }

      // Success - store tokens and redirect
      localStorage.setItem('accessToken', data.tokens.accessToken)
      localStorage.setItem('refreshToken', data.tokens.refreshToken)

      setMessage('Login successful! Redirecting...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-navy">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Punjab Flood Relief account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Success Message */}
            {message && (
              <div className="bg-success/10 border border-success text-success px-3 py-2 rounded-md text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {message}
              </div>
            )}

            {/* Identifier Input */}
            <div>
              <Label htmlFor="identifier">Email or Phone</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter your email or phone number"
                value={formData.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                required
              />
              {errors.identifier && (
                <p className="text-sm text-alert mt-1">{errors.identifier}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-alert mt-1">{errors.password}</p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-alert/10 border border-alert text-alert px-3 py-2 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.general}
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Signup Link */}
            <div className="text-center">
              <p className="text-sm text-muted">
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="text-accent hover:underline font-medium"
                >
                  Create account
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
