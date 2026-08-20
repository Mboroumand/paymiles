'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  profile: any
  userId: string
  email: string
}

function PhotoUpload({
  label, side, disabled, existingPath, onUploaded,
}: {
  label: string
  side: 'front' | 'back'
  disabled: boolean
  existingPath?: string
  onUploaded: (path: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [done, setDone] = useState(!!existingPath)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('side', side)

    const res = await fetch('/api/profile/upload-dl', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.ok) {
      setDone(true)
      onUploaded(data.url)
    }
  }

  return (
    <div
      onClick={() => !disabled && !uploading && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 transition cursor-pointer
        ${disabled ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : done ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-400 bg-white'}`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={disabled} />
      {preview ? (
        <img src={preview} alt={label} className="w-full h-32 object-cover rounded-lg" />
      ) : done ? (
        <div className="text-green-600 text-3xl">✓</div>
      ) : (
        <div className="text-gray-300 text-3xl">📷</div>
      )}
      <p className={`text-xs font-medium ${done ? 'text-green-700' : 'text-gray-500'}`}>
        {uploading ? 'Uploading…' : done ? `${label} uploaded` : `Tap to upload ${label}`}
      </p>
    </div>
  )
}

export default function ProfileForm({ profile, userId, email }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    date_of_birth: profile?.date_of_birth ?? '',
    dl_number: profile?.dl_number ?? '',
    dl_expiry: profile?.dl_expiry ?? '',
  })
  const [dlFrontPath, setDlFrontPath] = useState<string>(profile?.dl_front_url ?? '')
  const [dlBackPath, setDlBackPath] = useState<string>(profile?.dl_back_url ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const canEdit = !profile?.dl_status || profile?.dl_status === 'none' || profile?.dl_status === 'rejected'

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.dl_number || !form.dl_expiry) { setError("Driver's license number and expiry are required"); return }
    if (!dlFrontPath || !dlBackPath) { setError('Please upload both front and back photos of your license'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, dl_front_url: dlFrontPath, dl_back_url: dlBackPath }),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error ?? 'Failed to save'); setLoading(false); return }
    setSaved(true)
    setTimeout(() => { router.refresh(); setSaved(false) }, 1500)
    setLoading(false)
  }

  const inputCls = `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition ${canEdit ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed'}`

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
      {saved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">Saved! Pending admin review.</div>}

      {/* Basic info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Info</h2>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
          <input type="email" value={email} disabled className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
          <input type="text" value={form.full_name} onChange={set('full_name')} className={inputCls} disabled={!canEdit} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" className={inputCls} disabled={!canEdit} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Date of Birth</label>
          <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className={inputCls} disabled={!canEdit} />
        </div>
      </div>

      {/* Driver's License */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Driver's License</h2>
          {profile?.dl_status === 'approved' && <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">Verified</span>}
          {profile?.dl_status === 'pending' && <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full font-medium">Under review</span>}
          {profile?.dl_status === 'rejected' && <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">Rejected — resubmit</span>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">License Number <span className="text-red-400">*</span></label>
          <input type="text" value={form.dl_number} onChange={set('dl_number')} placeholder="e.g. D1234567" required className={inputCls} disabled={!canEdit} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Expiration Date <span className="text-red-400">*</span></label>
          <input type="date" value={form.dl_expiry} onChange={set('dl_expiry')} required
            min={new Date().toISOString().split('T')[0]} className={inputCls} disabled={!canEdit} />
        </div>

        {/* Photo uploads */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">License Photos <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            <PhotoUpload label="Front" side="front" disabled={!canEdit}
              existingPath={profile?.dl_front_url}
              onUploaded={setDlFrontPath} />
            <PhotoUpload label="Back" side="back" disabled={!canEdit}
              existingPath={profile?.dl_back_url}
              onUploaded={setDlBackPath} />
          </div>
          <p className="text-xs text-gray-400 mt-2">Upload clear photos of both sides of your driver's license</p>
        </div>

        {!canEdit && profile?.dl_status === 'approved' && (
          <p className="text-xs text-gray-400">Your license is verified. Contact support to update it.</p>
        )}
        {!canEdit && profile?.dl_status === 'pending' && (
          <p className="text-xs text-gray-400">Your submission is under review. You'll be able to edit once reviewed.</p>
        )}
      </div>

      {canEdit && (
        <button type="submit" disabled={loading}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition text-sm">
          {loading ? 'Submitting…' : 'Submit for Verification'}
        </button>
      )}
    </form>
  )
}
