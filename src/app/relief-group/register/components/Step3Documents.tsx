'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { authenticatedFetch } from '@/lib/auth'

interface FormData {
  repIdUrl: string
  orgCertUrl: string
}

interface Step3DocumentsProps {
  formData: FormData
  updateFormData: (updates: Partial<FormData>) => void
  errors: Record<string, string>
}

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

export function Step3Documents({ formData, updateFormData, errors }: Step3DocumentsProps) {
  const [repIdUpload, setRepIdUpload] = useState<UploadProgress | null>(null)
  const [orgCertUpload, setOrgCertUpload] = useState<UploadProgress | null>(null)
  const repIdInputRef = useRef<HTMLInputElement>(null)
  const orgCertInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (
    file: File,
    type: 'repId' | 'orgCert',
    setUploadState: (state: UploadProgress | null) => void
  ) => {
    // Validate file type
    if (!file.type.match('image/(jpeg|png|jpg)') && !file.type.match('application/pdf')) {
      setUploadState({
        file,
        progress: 0,
        status: 'error',
        error: 'Please upload a JPEG, PNG, or PDF file'
      })
      return
    }

    // Validate file size (300KB limit)
    if (file.size > 300 * 1024) {
      setUploadState({
        file,
        progress: 0,
        status: 'error',
        error: 'File size must be less than 300KB'
      })
      return
    }

    // Start upload process
    setUploadState({
      file,
      progress: 0,
      status: 'uploading'
    })

    try {
      // Get presigned URL
      const response = await authenticatedFetch('/api/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          scope: 'group-doc',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, fileUrl } = await response.json()

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => {
          if (!prev || prev.status !== 'uploading') return prev
          const newProgress = Math.min(prev.progress + 10, 90)
          return { ...prev, progress: newProgress }
        })
      }, 100)

      // Upload file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      clearInterval(progressInterval)

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      // Complete upload
      setUploadState({
        file,
        progress: 100,
        status: 'completed',
        url: fileUrl,
      })

      // Update form data
      if (type === 'repId') {
        updateFormData({ repIdUrl: fileUrl })
      } else {
        updateFormData({ orgCertUrl: fileUrl })
      }

    } catch (error) {
      setUploadState({
        file,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      })
    }
  }

  const handleFileInput = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'repId' | 'orgCert',
    setUploadState: (state: UploadProgress | null) => void
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file, type, setUploadState)
    }
  }

  const removeFile = (
    type: 'repId' | 'orgCert',
    setUploadState: (state: UploadProgress | null) => void
  ) => {
    setUploadState(null)
    if (type === 'repId') {
      updateFormData({ repIdUrl: '' })
    } else {
      updateFormData({ orgCertUrl: '' })
    }
  }

  const renderUploadSection = (
    title: string,
    description: string,
    type: 'repId' | 'orgCert',
    uploadState: UploadProgress | null,
    setUploadState: (state: UploadProgress | null) => void,
    inputRef: React.RefObject<HTMLInputElement>,
    isRequired: boolean = false
  ) => (
    <div className="space-y-3">
      <div>
        <Label className="flex items-center gap-2">
          {title}
          {isRequired && <span className="text-alert">*</span>}
        </Label>
        <p className="text-sm text-muted">{description}</p>
      </div>

      {!uploadState ? (
        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Choose File
            </Button>
            <p className="text-xs text-muted">JPEG, PNG, or PDF (max 300KB)</p>
          </div>
        </div>
      ) : (
        <div className="border border-muted rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted" />
              <div>
                <p className="font-medium text-sm">{uploadState.file.name}</p>
                <p className="text-xs text-muted">
                  {(uploadState.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeFile(type, setUploadState)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload Progress */}
          {uploadState.status === 'uploading' && (
            <div className="mt-3">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1">
                Uploading... {uploadState.progress}%
              </p>
            </div>
          )}

          {/* Upload Status */}
          {uploadState.status === 'completed' && (
            <div className="mt-3 flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Upload completed</span>
            </div>
          )}

          {uploadState.status === 'error' && (
            <div className="mt-3 flex items-center gap-2 text-alert">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{uploadState.error}</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        onChange={(e) => handleFileInput(e, type, setUploadState)}
        className="hidden"
      />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Representative ID */}
      {renderUploadSection(
        'Representative ID Proof (Optional)',
        'Upload a copy of your government-issued ID (Aadhaar, Driving License, etc.)',
        'repId',
        repIdUpload,
        setRepIdUpload,
        repIdInputRef,
        false
      )}



      {/* Organization Certificate (Optional) */}
      {renderUploadSection(
        'Organization Certificate (Optional)',
        'Upload registration certificate for government/NGO organizations',
        'orgCert',
        orgCertUpload,
        setOrgCertUpload,
        orgCertInputRef,
        false
      )}

      {/* Info Box */}
      <div className="bg-accent/5 border border-accent/20 p-4 rounded-md">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <h4 className="font-medium text-accent">Document Upload (Optional)</h4>
            <p className="text-sm text-muted mt-1">
              Documents help verify your identity and organization status, but you can
              proceed without them for now. You can upload documents later from your
              dashboard. All files are encrypted and stored securely. Files larger than
              300KB will be automatically compressed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
