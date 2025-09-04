'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Phone, FileText, Building } from 'lucide-react'
import Link from 'next/link'
import { authenticatedFetch } from '@/lib/auth'

// Step components
import { Step1OTP } from './components/Step1OTP'
import { Step2Details } from './components/Step2Details'
import { Step3Documents } from './components/Step3Documents'

type RegistrationStep = 1 | 2 | 3
type OrgType = 'government' | 'ngo' | 'independent'

interface FormData {
  // Step 1: Representative Verification
  repName: string
  repPhone: string
  otpCode: string
  otpToken: string

  // Step 2: Group Details
  groupName: string
  orgType: OrgType
  registrationNumber: string
  homeDistrictCode: string
  homeTehsilCode: string
  contactEmail: string
  contactPhone: string
  intendedOperations: string[]
  serviceArea: string[]

  // Step 3: Documents
  repIdUrl: string
  orgCertUrl: string
}

export default function RegisterReliefGroupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    repName: '',
    repPhone: '',
    otpCode: '',
    otpToken: '',
    groupName: '',
    orgType: 'independent',
    registrationNumber: '',
    homeDistrictCode: '',
    homeTehsilCode: '',
    contactEmail: '',
    contactPhone: '',
    intendedOperations: [],
    serviceArea: [],
    repIdUrl: '',
    orgCertUrl: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/auth/login?redirect=/relief-group/register')
    }
  }, [router])

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setErrors({})
  }

  const validateStep = (step: RegistrationStep): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.repName.trim()) newErrors.repName = 'Representative name is required'
        if (!formData.repPhone.trim()) newErrors.repPhone = 'Phone number is required'
        if (!formData.otpToken) newErrors.otpToken = 'Please verify your phone number with OTP'
        break

      case 2:
        if (!formData.groupName.trim()) newErrors.groupName = 'Group name is required'
        if (!formData.orgType) newErrors.orgType = 'Organization type is required'
        if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Contact phone is required'
        if (formData.intendedOperations.length === 0) newErrors.intendedOperations = 'Select at least one operation'
        break

      case 3:
        // Documents are optional for now - no validation required
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        setCurrentStep(2)
      } else if (currentStep === 2) {
        // Allow skipping to submission or going to step 3
        setCurrentStep(3)
      }
      // currentStep === 3: stay on step 3
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep === 3 ? 2 : 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setIsLoading(true)

    try {
      const response = await authenticatedFetch('/api/relief-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otpToken: formData.otpToken,
          groupName: formData.groupName,
          orgType: formData.orgType,
          registrationNumber: formData.registrationNumber || undefined,
          homeDistrictCode: formData.homeDistrictCode || undefined,
          homeTehsilCode: formData.homeTehsilCode || undefined,
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone,
          intendedOperations: formData.intendedOperations,
          serviceArea: formData.serviceArea,
          repName: formData.repName,
          repPhone: formData.repPhone,
          docUrls: [formData.repIdUrl, formData.orgCertUrl].filter(Boolean),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error })
        return
      }

      // Success - redirect to success page
      router.push('/relief-group/success')
    } catch (error) {
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Verify Representative', icon: Phone },
    { number: 2, title: 'Group Details', icon: Building },
    { number: 3, title: 'Documents (Optional)', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-muted bg-surface/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 text-navy hover:text-accent">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold text-navy">Register Relief Group</h1>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.number === currentStep
              const isCompleted = step.number < currentStep

              return (
                <div key={step.number} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${isCompleted
                      ? 'bg-success border-success text-white'
                      : isActive
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-muted text-muted'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 font-medium ${
                    isActive ? 'text-accent' : isCompleted ? 'text-success' : 'text-muted'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      isCompleted ? 'bg-success' : 'bg-muted'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                Step {currentStep}: {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && 'Verify your identity as a group representative'}
                {currentStep === 2 && 'Provide your relief group details and capabilities'}
                {currentStep === 3 && 'Upload documents for verification (optional)'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Error */}
              {errors.general && (
                <div className="bg-alert/10 border border-alert text-alert px-3 py-2 rounded-md text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.general}
                </div>
              )}

              {/* Step Components */}
              {currentStep === 1 && (
                <Step1OTP
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                />
              )}
              {currentStep === 2 && (
                <Step2Details
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                />
              )}
              {currentStep === 3 && (
                <Step3Documents
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep === 1 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {currentStep === 2 && (
                      <Button
                        variant="outline"
                        onClick={handleNext}
                      >
                        Review Documents
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    <Button onClick={handleSubmit} disabled={isLoading}>
                      {isLoading ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
