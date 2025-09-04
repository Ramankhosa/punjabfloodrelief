import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, MapPin, Users } from 'lucide-react'

interface FormData {
  groupName: string
  orgType: 'government' | 'ngo' | 'independent'
  registrationNumber: string
  homeDistrictCode: string
  homeTehsilCode: string
  contactEmail: string
  contactPhone: string
  intendedOperations: string[]
  serviceArea: string[]
}

interface Step2DetailsProps {
  formData: FormData
  updateFormData: (updates: Partial<FormData>) => void
  errors: Record<string, string>
}

const operationOptions = [
  { value: 'rescue', label: 'Rescue Operations', icon: '🚁' },
  { value: 'medical', label: 'Medical Aid', icon: '⚕️' },
  { value: 'relief', label: 'Relief Distribution', icon: '📦' },
  { value: 'shelter', label: 'Shelter Management', icon: '🏠' },
  { value: 'logistics', label: 'Logistics Support', icon: '🚛' },
  { value: 'communication', label: 'Communication', icon: '📡' },
]

const orgTypes = [
  { value: 'government', label: 'Government Agency' },
  { value: 'ngo', label: 'NGO/Non-Profit' },
  { value: 'independent', label: 'Independent Group' },
]

export function Step2Details({ formData, updateFormData, errors }: Step2DetailsProps) {
  const toggleOperation = (operation: string) => {
    const currentOps = formData.intendedOperations
    const newOps = currentOps.includes(operation)
      ? currentOps.filter(op => op !== operation)
      : [...currentOps, operation]

    updateFormData({ intendedOperations: newOps })
  }

  return (
    <div className="space-y-6">
      {/* Group Name */}
      <div>
        <Label htmlFor="groupName">Relief Group Name *</Label>
        <Input
          id="groupName"
          placeholder="Enter your relief group/organization name"
          value={formData.groupName}
          onChange={(e) => updateFormData({ groupName: e.target.value })}
        />
        {errors.groupName && (
          <p className="text-sm text-alert mt-1">{errors.groupName}</p>
        )}
      </div>

      {/* Organization Type */}
      <div>
        <Label>Organization Type *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {orgTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateFormData({ orgType: type.value as any })}
              className={`p-3 border rounded-lg text-left transition-colors ${
                formData.orgType === type.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-muted hover:border-accent/50'
              }`}
            >
              <div className="font-medium">{type.label}</div>
            </button>
          ))}
        </div>
        {errors.orgType && (
          <p className="text-sm text-alert mt-1">{errors.orgType}</p>
        )}
      </div>

      {/* Registration Number (conditional) */}
      {(formData.orgType === 'government' || formData.orgType === 'ngo') && (
        <div>
          <Label htmlFor="registrationNumber">
            Registration Number {formData.orgType === 'government' ? '(Optional)' : '(Optional)'}
          </Label>
          <Input
            id="registrationNumber"
            placeholder={`Enter ${formData.orgType} registration number`}
            value={formData.registrationNumber}
            onChange={(e) => updateFormData({ registrationNumber: e.target.value })}
          />
        </div>
      )}

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPhone">Contact Phone *</Label>
          <Input
            id="contactPhone"
            type="tel"
            placeholder="+91 9876543210"
            value={formData.contactPhone}
            onChange={(e) => updateFormData({ contactPhone: e.target.value })}
          />
          {errors.contactPhone && (
            <p className="text-sm text-alert mt-1">{errors.contactPhone}</p>
          )}
        </div>
        <div>
          <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="contact@organization.com"
            value={formData.contactEmail}
            onChange={(e) => updateFormData({ contactEmail: e.target.value })}
          />
        </div>
      </div>

      {/* Home Base Location */}
      <div>
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Home Base Location (Optional)
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Input
            placeholder="District"
            value={formData.homeDistrictCode}
            onChange={(e) => updateFormData({ homeDistrictCode: e.target.value })}
          />
          <Input
            placeholder="Tehsil/Sub-district"
            value={formData.homeTehsilCode}
            onChange={(e) => updateFormData({ homeTehsilCode: e.target.value })}
          />
        </div>
        <p className="text-xs text-muted mt-1">
          Your primary operational area
        </p>
      </div>

      {/* Intended Operations */}
      <div>
        <Label className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Intended Operations *
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {operationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOperation(option.value)}
              className={`p-3 border rounded-lg text-left transition-colors ${
                formData.intendedOperations.includes(option.value)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-muted hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
        {errors.intendedOperations && (
          <p className="text-sm text-alert mt-1">{errors.intendedOperations}</p>
        )}
        <p className="text-xs text-muted mt-1">
          Select all operations your group can provide
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-accent/5 border border-accent/20 p-4 rounded-md">
        <div className="flex items-start gap-2">
          <Building className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <h4 className="font-medium text-accent">Group Information</h4>
            <p className="text-sm text-muted mt-1">
              This information helps us coordinate relief efforts and match your group
              with appropriate tasks and resources in your operational area.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
