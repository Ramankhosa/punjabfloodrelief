import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Phone } from 'lucide-react'
import { authenticatedFetch } from '@/lib/auth'

interface FormData {
  repName: string
  repPhone: string
  otpCode: string
  otpToken: string
}

interface Step1OTPProps {
  formData: FormData
  updateFormData: (updates: Partial<FormData>) => void
  errors: Record<string, string>
}

export function Step1OTP({ formData, updateFormData, errors }: Step1OTPProps) {
  const [isRequestingOTP, setIsRequestingOTP] = useState(false)
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false)
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [verifyError, setVerifyError] = useState('')

  const handleRequestOTP = async () => {
    if (!formData.repPhone.trim()) {
      setRequestError('Please enter your phone number')
      return
    }

    setIsRequestingOTP(true)
    setRequestError('')

    try {
      const response = await authenticatedFetch('/api/relief-groups/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repPhone: formData.repPhone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setRequestError(data.error)
        return
      }

      setOtpRequested(true)
      setRequestError('')
    } catch (error) {
      setRequestError('Failed to send OTP. Please try again.')
    } finally {
      setIsRequestingOTP(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!formData.otpCode.trim()) {
      setVerifyError('Please enter the OTP code')
      return
    }

    setIsVerifyingOTP(true)
    setVerifyError('')

    try {
      const response = await authenticatedFetch('/api/relief-groups/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repPhone: formData.repPhone,
          code: formData.otpCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setVerifyError(data.error)
        return
      }

      updateFormData({ otpToken: data.otpToken })
      setOtpVerified(true)
      setVerifyError('')
    } catch (error) {
      setVerifyError('Failed to verify OTP. Please try again.')
    } finally {
      setIsVerifyingOTP(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Representative Name */}
      <div>
        <Label htmlFor="repName">Representative Full Name</Label>
        <Input
          id="repName"
          placeholder="Enter your full name"
          value={formData.repName}
          onChange={(e) => updateFormData({ repName: e.target.value })}
        />
        {errors.repName && (
          <p className="text-sm text-alert mt-1">{errors.repName}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="repPhone">Representative Phone Number</Label>
        <div className="flex gap-2">
          <Input
            id="repPhone"
            type="tel"
            placeholder="+91 9876543210"
            value={formData.repPhone}
            onChange={(e) => {
              updateFormData({ repPhone: e.target.value })
              if (otpRequested && !otpVerified) {
                setOtpRequested(false)
                setOtpVerified(false)
                updateFormData({ otpCode: '', otpToken: '' })
              }
            }}
          />
          <Button
            type="button"
            onClick={handleRequestOTP}
            disabled={isRequestingOTP || !formData.repPhone.trim()}
            variant={otpRequested ? "outline" : "default"}
          >
            {isRequestingOTP ? 'Sending...' : otpRequested ? 'Resend OTP' : 'Send OTP'}
          </Button>
        </div>
        {errors.repPhone && (
          <p className="text-sm text-alert mt-1">{errors.repPhone}</p>
        )}
        {requestError && (
          <p className="text-sm text-alert mt-1">{requestError}</p>
        )}
      </div>

      {/* OTP Input */}
      {otpRequested && !otpVerified && (
        <div>
          <Label htmlFor="otpCode">Enter 6-digit OTP</Label>
          <div className="flex gap-2">
            <Input
              id="otpCode"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={formData.otpCode}
              onChange={(e) => updateFormData({ otpCode: e.target.value.replace(/\D/g, '') })}
            />
            <Button
              type="button"
              onClick={handleVerifyOTP}
              disabled={isVerifyingOTP || formData.otpCode.length !== 6}
            >
              {isVerifyingOTP ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
          {errors.otpToken && (
            <p className="text-sm text-alert mt-1">{errors.otpToken}</p>
          )}
          {verifyError && (
            <p className="text-sm text-alert mt-1">{verifyError}</p>
          )}
          <p className="text-xs text-muted mt-1">
            OTP sent to your phone. Valid for 5 minutes.
          </p>
        </div>
      )}

      {/* Verification Status */}
      {otpVerified && (
        <div className="bg-success/10 border border-success text-success px-3 py-2 rounded-md flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Phone number verified successfully
        </div>
      )}

      {/* Info Box */}
      <div className="bg-accent/5 border border-accent/20 p-4 rounded-md">
        <div className="flex items-start gap-2">
          <Phone className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <h4 className="font-medium text-accent">Phone Verification Required</h4>
            <p className="text-sm text-muted mt-1">
              We need to verify your phone number to ensure you're authorized to register
              relief groups. This helps prevent spam and ensures accountability.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
