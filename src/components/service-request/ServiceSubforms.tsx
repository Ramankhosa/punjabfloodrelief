'use client'

import { useState } from 'react'
import { t } from '@/lib/translations'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface ServiceSelection {
  food: boolean
  rescue: boolean
  animalFodder: boolean
  medicalEmergency: boolean
  boat: boolean
  shelter: boolean
}

interface ServiceSubformsProps {
  selection: ServiceSelection
  details: Record<string, any>
  onUpdate: (service: string, details: any) => void
}

const serviceConfigs = {
  food: {
    fields: [
      {
        key: 'peopleCount',
        type: 'number' as const,
        label: 'serviceDetails.food.peopleCount',
        placeholder: '0',
        min: 0
      },
      {
        key: 'needType',
        type: 'select' as const,
        label: 'serviceDetails.food.needType',
        options: [
          { value: 'cooked', label: 'serviceDetails.food.cookedFood' },
          { value: 'dry', label: 'serviceDetails.food.dryRation' }
        ]
      },
      {
        key: 'duration',
        type: 'select' as const,
        label: 'serviceDetails.food.duration',
        options: [
          { value: 'today', label: 'serviceDetails.food.today' },
          { value: '3days', label: 'serviceDetails.food.days3' },
          { value: 'more', label: 'serviceDetails.food.daysMore' }
        ]
      }
    ]
  },
  rescue: {
    fields: [
      {
        key: 'peopleStranded',
        type: 'number' as const,
        label: 'serviceDetails.rescue.peopleStranded',
        placeholder: '0',
        min: 0
      },
      {
        key: 'waterLevel',
        type: 'select' as const,
        label: 'serviceDetails.rescue.waterLevel',
        options: [
          { value: 'knee', label: 'serviceDetails.rescue.knee' },
          { value: 'waist', label: 'serviceDetails.rescue.waist' },
          { value: 'chest', label: 'serviceDetails.rescue.chest' }
        ]
      },
      {
        key: 'accessNotes',
        type: 'textarea' as const,
        label: 'serviceDetails.rescue.accessNotes',
        placeholder: '',
        maxLength: 80
      }
    ]
  },
  animalFodder: {
    fields: [
      {
        key: 'animalsCount',
        type: 'number' as const,
        label: 'serviceDetails.animalFodder.animalsCount',
        placeholder: '0',
        min: 0
      },
      {
        key: 'type',
        type: 'multiselect' as const,
        label: 'serviceDetails.animalFodder.type',
        options: [
          { value: 'cattle', label: 'serviceDetails.animalFodder.cattle' },
          { value: 'buffalo', label: 'serviceDetails.animalFodder.buffalo' },
          { value: 'goat', label: 'serviceDetails.animalFodder.goatSheep' },
          { value: 'other', label: 'serviceDetails.animalFodder.other' }
        ]
      },
      {
        key: 'urgency',
        type: 'select' as const,
        label: 'serviceDetails.animalFodder.urgency',
        options: [
          { value: 'today', label: 'serviceDetails.animalFodder.today' },
          { value: '48hrs', label: 'serviceDetails.animalFodder.hrs48' }
        ]
      }
    ]
  },
  medicalEmergency: {
    fields: [
      {
        key: 'symptoms',
        type: 'textarea' as const,
        label: 'serviceDetails.medicalEmergency.symptoms',
        placeholder: '',
        maxLength: 120
      },
      {
        key: 'patientCount',
        type: 'number' as const,
        label: 'serviceDetails.medicalEmergency.patientCount',
        placeholder: '1',
        min: 1
      },
      {
        key: 'critical',
        type: 'checkbox' as const,
        label: 'serviceDetails.medicalEmergency.critical'
      },
      {
        key: 'medication',
        type: 'textarea' as const,
        label: 'serviceDetails.medicalEmergency.medication',
        placeholder: '',
        maxLength: 80
      }
    ]
  },
  boat: {
    fields: [
      {
        key: 'peopleToMove',
        type: 'number' as const,
        label: 'serviceDetails.boat.peopleToMove',
        placeholder: '0',
        min: 0
      },
      {
        key: 'pickupLandmark',
        type: 'textarea' as const,
        label: 'serviceDetails.boat.pickupLandmark',
        placeholder: '',
        maxLength: 80
      },
      {
        key: 'waterFlow',
        type: 'select' as const,
        label: 'serviceDetails.boat.waterFlow',
        options: [
          { value: 'calm', label: 'serviceDetails.boat.calm' },
          { value: 'fast', label: 'serviceDetails.boat.fast' }
        ]
      }
    ]
  },
  shelter: {
    fields: [
      {
        key: 'peopleCount',
        type: 'number' as const,
        label: 'serviceDetails.shelter.peopleCount',
        placeholder: '0',
        min: 0
      },
      {
        key: 'specialNeeds',
        type: 'multiselect' as const,
        label: 'serviceDetails.shelter.specialNeeds',
        options: [
          { value: 'elderly', label: 'serviceDetails.shelter.elderly' },
          { value: 'children', label: 'serviceDetails.shelter.children' },
          { value: 'disabled', label: 'serviceDetails.shelter.disabled' },
          { value: 'women', label: 'serviceDetails.shelter.women' }
        ]
      },
      {
        key: 'daysNeeded',
        type: 'select' as const,
        label: 'serviceDetails.shelter.daysNeeded',
        options: [
          { value: '1', label: '1' },
          { value: '2-3', label: '2–3' },
          { value: 'more', label: '>3' }
        ]
      }
    ]
  }
}

export function ServiceSubforms({ selection, details, onUpdate }: ServiceSubformsProps) {
  const selectedServices = Object.keys(selection).filter(key => selection[key as keyof ServiceSelection])

  // Auto-expand all selected services
  const expandedForms = new Set(selectedServices)

  const toggleForm = (serviceKey: string) => {
    // Since we want them always expanded when selected, this is now optional
    // Users can still manually collapse if they want
    console.log('Toggle form:', serviceKey)
  }

  if (selectedServices.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {selectedServices.map((serviceKey) => {
        const config = serviceConfigs[serviceKey as keyof typeof serviceConfigs]
        const isExpanded = expandedForms.has(serviceKey)
        const serviceDetails = details[serviceKey] || {}

        return (
          <div key={serviceKey} className="bg-white rounded-lg border overflow-hidden">
            <button
              onClick={() => toggleForm(serviceKey)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-text">
                {t(`services.${serviceKey}`)} {t('serviceDetails.details', 'Details')}
              </h3>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {isExpanded && (
              <div className="px-6 pb-6 space-y-4">
                {config.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{t(field.label)}</Label>

                    {field.type === 'number' && (
                      <Input
                        type="number"
                        value={serviceDetails[field.key] || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : ''
                          onUpdate(serviceKey, {
                            ...serviceDetails,
                            [field.key]: value
                          })
                        }}
                        placeholder={field.placeholder}
                        min={field.min}
                      />
                    )}

                    {field.type === 'select' && (
                      <Select
                        value={serviceDetails[field.key] || ''}
                        onValueChange={(value) =>
                          onUpdate(serviceKey, {
                            ...serviceDetails,
                            [field.key]: value
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {t(option.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'textarea' && (
                      <Textarea
                        value={serviceDetails[field.key] || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (!field.maxLength || value.length <= field.maxLength) {
                            onUpdate(serviceKey, {
                              ...serviceDetails,
                              [field.key]: value
                            })
                          }
                        }}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    )}

                    {field.type === 'checkbox' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${serviceKey}-${field.key}`}
                          checked={serviceDetails[field.key] || false}
                          onCheckedChange={(checked) =>
                            onUpdate(serviceKey, {
                              ...serviceDetails,
                              [field.key]: checked
                            })
                          }
                        />
                        <Label htmlFor={`${serviceKey}-${field.key}`}>
                          {t(field.label)}
                        </Label>
                      </div>
                    )}

                    {field.type === 'multiselect' && (
                      <div className="space-y-2">
                        {field.options?.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${serviceKey}-${field.key}-${option.value}`}
                              checked={(serviceDetails[field.key] || []).includes(option.value)}
                              onCheckedChange={(checked) => {
                                const currentValues = serviceDetails[field.key] || []
                                let newValues
                                if (checked) {
                                  newValues = [...currentValues, option.value]
                                } else {
                                  newValues = currentValues.filter((v: string) => v !== option.value)
                                }
                                onUpdate(serviceKey, {
                                  ...serviceDetails,
                                  [field.key]: newValues
                                })
                              }}
                            />
                            <Label htmlFor={`${serviceKey}-${field.key}-${option.value}`}>
                              {t(option.label)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
