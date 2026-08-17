'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { updateCarPhoto } from './actions'

export default function UpdateCarPhoto({ carId, hostId, currentImage }: { carId: string; hostId: string; currentImage: string | null }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentImage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    setPreview(URL.createObjectURL(file))

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${hostId}/${carId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(path, file, { upsert: true })

    if (uploadError) { setError('Upload failed'); setLoading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('car-images').getPublicUrl(path)

    const result = await updateCarPhoto(carId, publicUrl)
    if (result?.error) { setError(result.error); setLoading(false); return }

    router.refresh()
    setLoading(false)
  }

  return (
    <div className="relative group">
      {preview ? (
        <img src={preview} alt="Car" className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-white/5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12 text-gray-700">
            <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l4 4v6a2 2 0 01-2 2h-2" />
            <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
          </svg>
        </div>
      )}

      {/* Hover overlay */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <span className="text-white text-sm font-medium">Uploading…</span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-white">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span className="text-white text-sm font-medium">Change photo</span>
          </>
        )}
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      {error && <p className="absolute bottom-2 left-2 right-2 text-xs text-red-400 bg-black/70 rounded px-2 py-1">{error}</p>}
    </div>
  )
}
