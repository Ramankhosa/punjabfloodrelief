'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Phone } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email')
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const payload = {
        password: formData.password,
        ...(contactMethod === 'email'
          ? { email: formData.email }
          : { phone: formData.phone }
        ),
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

      // Success - redirect to login
      router.push('/auth/login?message=Account created successfully')
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
          <CardTitle className="text-navy">Create Account</CardTitle>
          <CardDescription>
            Join the Punjab Flood Relief network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Method Toggle */}
            <div className="flex rounded-lg border border-muted p-1">
              <button
                type="button"
                onClick={() => setContactMethod('email')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  contactMethod === 'email'
                    ? 'bg-accent text-white'
                    : 'text-muted hover:text-text'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('phone')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  contactMethod === 'phone'
                    ? 'bg-accent text-white'
                    : 'text-muted hover:text-text'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
            </div>

            {/* Contact Input */}
            <div>
              <Label htmlFor="contact">
                {contactMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </Label>
              <Input
                id="contact"
                type={contactMethod === 'email' ? 'email' : 'tel'}
                placeholder={
                  contactMethod === 'email'
                    ? 'Enter your email'
                    : 'Enter your phone number (e.g., +91 9876543210)'
                }
                value={contactMethod === 'email' ? formData.email : formData.phone}
                onChange={(e) => handleInputChange(
                  contactMethod === 'email' ? 'email' : 'phone',
                  e.target.value
                )}
                required
              />
              {errors[contactMethod] && (
                <p className="text-sm text-alert mt-1">{errors[contactMethod]}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
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
              <p className="text-xs text-muted mt-1">
                Password must be 8-64 characters long
              </p>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-alert/10 border border-alert text-alert px-3 py-2 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-muted">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-accent hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
