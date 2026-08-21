'use client'
import { useState, useRef } from 'react'

interface Photo { id: string; url: string; is_primary: boolean }

interface Props {
  carId: string
  initialPhotos: Photo[]
  onPhotosChange?: (photos: Photo[]) => void
}

export default function CarPhotosManager({ carId, initialPhotos, onPhotosChange }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const canAdd = photos.length < 5

  async function handleFiles(files: FileList) {
    const toUpload = Array.from(files).slice(0, 5 - photos.length)
    if (toUpload.length === 0) return
    setUploading(true); setError('')

    const newPhotos = [...photos]
    for (const file of toUpload) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('car_id', carId)
      fd.append('is_primary', newPhotos.length === 0 ? 'true' : 'false')
      const res = await fetch('/api/admin/cars/photos', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error); break }
      newPhotos.push(data.photo)
    }
    setPhotos(newPhotos)
    onPhotosChange?.(newPhotos)
    setUploading(false)
  }

  async function handleDelete(photoId: string) {
    const res = await fetch('/api/admin/cars/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photoId }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error); return }
    const updated = photos.filter(p => p.id !== photoId)
    setPhotos(updated)
    onPhotosChange?.(updated)
  }

  return (
    <div>
      {error && <div className="text-red-500 text-xs mb-2">{error}</div>}

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
            <img src={photo.url} alt="" className="w-full h-full object-cover" />
            {photo.is_primary && (
              <span className="absolute top-1 left-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-medium">Primary</span>
            )}
            <button
              type="button"
              onClick={() => handleDelete(photo.id)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
            >×</button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition text-xs gap-1 disabled:opacity-50"
          >
            {uploading ? (
              <span>Uploading…</span>
            ) : (
              <>
                <span className="text-xl">+</span>
                <span>Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-1.5">{photos.length}/5 photos · hover a photo to remove it</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files) }}
      />
    </div>
  )
}
