'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const MAX_PHOTOS = 20

const PHOTO_LABELS = [
  'Front exterior', 'Rear exterior', 'Driver side', 'Passenger side',
  'Dashboard', 'Interior front', 'Interior rear', 'Trunk/frunk',
  'Odometer', 'Charging screen', 'Driver side wheel', 'Passenger side wheel',
  'Roof', 'Windshield', 'Headlights', 'Taillights',
  'Charging port', 'Center console', 'Infotainment screen', 'Overall',
]

interface Photo { id?: string; url: string; label?: string; file?: File; uploading?: boolean }

export default function CheckinForm({ bookingId, phase, existingOdometer }: {
  bookingId: string
  phase: 'checkin' | 'checkout'
  existingOdometer?: number
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [odometer, setOdometer] = useState(existingOdometer != null ? String(existingOdometer) : '')
  const [battery, setBattery] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isCheckin = phase === 'checkin'

  async function uploadPhoto(file: File, idx: number, inspectionId: string): Promise<Photo> {
    const form = new FormData()
    form.append('file', file)
    form.append('inspection_id', inspectionId)
    const label = PHOTO_LABELS[idx] ?? `Photo ${idx + 1}`
    form.append('label', label)
    const res = await fetch('/api/trips/inspection/photos', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return { id: data.id, url: data.url, label }
  }

  function addFiles(files: FileList) {
    const remaining = MAX_PHOTOS - photos.length
    const toAdd = Array.from(files).slice(0, remaining)
    const newPhotos: Photo[] = toAdd.map(f => ({
      url: URL.createObjectURL(f),
      file: f,
      label: PHOTO_LABELS[photos.length] ?? `Photo ${photos.length + 1}`,
    }))
    setPhotos(prev => [...prev, ...newPhotos])
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!odometer) { setError('Odometer reading is required'); return }
    if (photos.length === 0) { setError('Please add at least 1 photo'); return }
    setSubmitting(true); setError('')

    // 1. Create inspection record
    const res = await fetch('/api/trips/inspection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        phase,
        odometer: parseInt(odometer),
        battery_percent: battery ? parseInt(battery) : null,
        notes: notes || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }

    const inspectionId = data.id

    // 2. Upload all photos
    try {
      await Promise.all(
        photos.map((p, i) => p.file ? uploadPhoto(p.file, i, inspectionId) : Promise.resolve(p))
      )
    } catch (err: any) {
      setError(`Photo upload failed: ${err.message}`)
      setSubmitting(false)
      return
    }

    router.push(`/host/trips/${bookingId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Inspection Photos <span className="text-gray-400 font-normal">({photos.length}/{MAX_PHOTOS})</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Capture front/back, both sides, dashboard, odometer, and charging screen
            </p>
          </div>
          {photos.length < MAX_PHOTOS && (
            <button type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-medium transition">
              + Add photos
            </button>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { if (e.target.files) { addFiles(e.target.files); e.target.value = '' } }} />

        {photos.length === 0 ? (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl py-12 text-center transition group">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm text-gray-400 group-hover:text-blue-500 font-medium">Tap to add inspection photos</p>
            <p className="text-xs text-gray-300 mt-1">Up to {MAX_PHOTOS} photos recommended</p>
          </button>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
                <button type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition font-bold">
                  ×
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1.5 pt-4">
                  <p className="text-white text-[9px] leading-tight truncate">{p.label}</p>
                </div>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 flex items-center justify-center text-2xl text-gray-300 hover:text-blue-400 transition">
                +
              </button>
            )}
          </div>
        )}
      </div>

      {/* Readings */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Vehicle Readings</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Odometer (miles) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
              placeholder="e.g. 24500"
              min="0"
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Battery / Charging %
            </label>
            <div className="relative">
              <input
                type="number"
                value={battery}
                onChange={e => setBattery(e.target.value)}
                placeholder="e.g. 82"
                min="0"
                max="100"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400 bg-white pr-8"
              />
              <span className="absolute right-3 top-2.5 text-sm text-gray-400">%</span>
            </div>
          </div>
        </div>

        {/* Battery visual bar */}
        {battery && parseInt(battery) >= 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Battery level</span>
              <span className="font-medium text-gray-700">{battery}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${parseInt(battery) < 20 ? 'bg-red-500' : parseInt(battery) < 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, parseInt(battery) || 0)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes / Damage remarks (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder={isCheckin ? 'Note any existing scratches, dents, or issues before the trip…' : 'Note any new damage, issues, or anything to flag…'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400 resize-none"
        />
      </div>

      {/* Submit */}
      <button type="submit" disabled={submitting}
        className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition disabled:opacity-50 ${
          isCheckin ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
        }`}>
        {submitting
          ? 'Saving…'
          : isCheckin
            ? '✓ Complete Check-in & Start Trip'
            : '✓ Complete Check-out & Finish Trip'}
      </button>
    </form>
  )
}
