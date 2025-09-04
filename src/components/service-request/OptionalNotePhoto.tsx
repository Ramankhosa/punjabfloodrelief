'use client'

import { useState, useRef } from 'react'
import { t } from '@/lib/translations'
import { Camera, Mic, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface OptionalNotePhotoProps {
  note: string
  onNoteChange: (note: string) => void
  networkQuality: 'good' | 'slow' | 'offline'
}

export function OptionalNotePhoto({
  note,
  onNoteChange,
  networkQuality
}: OptionalNotePhotoProps) {
  const [photo, setPhoto] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Compress image client-side
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!

          // Calculate new dimensions (max 800px width, maintain aspect ratio)
          const maxWidth = 800
          const ratio = Math.min(maxWidth / img.width, 1)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio

          // Draw and compress
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)

          // Check file size (target < 200KB)
          const compressedSize = Math.round((compressedDataUrl.length * 3) / 4 / 1024)
          if (compressedSize > 200) {
            // Compress further if still too large
            const furtherCompressed = canvas.toDataURL('image/jpeg', 0.6)
            setPhoto(furtherCompressed)
          } else {
            setPhoto(compressedDataUrl)
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const removePhoto = () => {
    setPhoto(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAudio = () => {
    setAudioBlob(null)
  }

  const showPhotoUpload = networkQuality === 'good' || networkQuality === 'slow'

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <h2 className="text-xl font-semibold text-text">
        {t('optional.note')}
      </h2>

      {/* Note Textarea */}
      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => {
            const value = e.target.value
            if (value.length <= 120) {
              onNoteChange(value)
            }
          }}
          placeholder={t('optional.notePlaceholder')}
          rows={3}
          className="resize-none"
        />
        <div className="text-right text-sm text-gray-500">
          {note.length}/120
        </div>
      </div>

      {/* Photo Upload */}
      {showPhotoUpload && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text">
              {t('optional.addPhoto')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>{t('optional.addPhoto')}</span>
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          {/* Photo Preview */}
          {photo && (
            <div className="relative">
              <img
                src={photo}
                alt="Selected photo"
                className="w-full max-w-sm h-32 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={removePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Audio Recording */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-text">
            {t('optional.recordAudio')}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center space-x-2 ${
              isRecording ? 'bg-red-50 border-red-200 text-red-700' : ''
            }`}
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
            <span>
              {isRecording ? 'Recording...' : t('optional.recordAudio')}
            </span>
          </Button>
        </div>

        {/* Audio Preview */}
        {audioBlob && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <audio controls className="w-full">
                <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
              </audio>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeAudio}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Network Quality Notice */}
      {networkQuality === 'slow' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Slow connection detected. Photo upload may be limited.
          </p>
        </div>
      )}
    </div>
  )
}
