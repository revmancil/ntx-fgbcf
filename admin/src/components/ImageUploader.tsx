import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.85
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

async function resizeImage(file: File): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type)) return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  if (scale === 1) return file

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), file.type === 'image/png' ? 'image/png' : 'image/jpeg', JPEG_QUALITY)
  })
}

export function ImageUploader({
  bucket,
  currentUrl,
  onUploaded,
  pathPrefix = '',
}: {
  bucket: string
  currentUrl: string | null
  onUploaded: (url: string) => void
  pathPrefix?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const inputRef = useRef<HTMLInputElement>(null)
  const { notify } = useToast()

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      notify('Please choose a JPEG, PNG, or WebP image.', 'error')
      return
    }

    setUploading(true)
    try {
      const resized = await resizeImage(file)
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${pathPrefix}${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, resized, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      setPreview(data.publicUrl)
      onUploaded(data.publicUrl)
      notify('Image uploaded.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed.', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="image-uploader">
      {preview && <img src={preview} alt="" className="image-uploader-preview" />}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {uploading && <span className="upload-status">Uploading…</span>}
    </div>
  )
}
