'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/password-reset/request', {
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

      setSuccess(true)
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

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <CardTitle className="text-navy">Check Your Inbox</CardTitle>
            <CardDescription>
              If an account exists with that email or phone, we've sent you a password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted text-center">
              The link will expire in 30 minutes. Make sure to check your spam folder.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Back to Login
              </Button>
              <Button
                variant="outline"
                onClick={() => setSuccess(false)}
                className="w-full"
              >
                Send Another Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-navy">Reset Password</CardTitle>
          <CardDescription>
            Enter your email or phone number to receive a reset link or OTP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier Input */}
            <div>
              <Label htmlFor="identifier">Email or Phone Number</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter your email or phone (e.g., +91 9876543210)"
                value={formData.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                required
              />
              <p className="text-xs text-muted mt-1">
                We'll send a reset link to your email or an OTP to your phone
              </p>
              {errors.identifier && (
                <p className="text-sm text-alert mt-1">{errors.identifier}</p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-alert/10 border border-alert text-alert px-3 py-2 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.general}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-accent hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
