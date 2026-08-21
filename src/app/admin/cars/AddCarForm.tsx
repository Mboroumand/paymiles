'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TESLA_MODELS = ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck', 'Roadster']
const COLORS = ['Black', 'White', 'Silver', 'Red', 'Blue', 'Gray', 'Pearl White', 'Midnight Silver', 'Deep Blue', 'Ultra Red']
const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']

const s = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 disabled:opacity-40'
const i = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 placeholder:text-gray-400'
const l = 'block text-xs font-medium text-gray-500 mb-1.5'

export default function AddCarForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ model: '', year: '', color: '', license_plate: '', rate_per_mile: '', odometer_start: '', included_miles_per_day: '30', tesla_vehicle_id: '' })
  const [locState, setLocState] = useState('')
  const [locCity, setLocCity] = useState('')
  const [locAddress, setLocAddress] = useState('')
  const [locZip, setLocZip] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  function upd(k: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value })) }

  function buildLocation() {
    return [locAddress, locCity, locZip ? `${locState} ${locZip}` : locState].filter(Boolean).join(', ')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.model) { setError('Select a model'); return }
    setLoading(true); setError('')

    // Create car first
    const res = await fetch('/api/admin/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, location: buildLocation() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    // Upload photos to car_photos
    const carId = data.car.id
    for (let idx = 0; idx < photoFiles.length; idx++) {
      const fd = new FormData()
      fd.append('file', photoFiles[idx])
      fd.append('car_id', carId)
      fd.append('is_primary', idx === 0 ? 'true' : 'false')
      await fetch('/api/admin/cars/photos', { method: 'POST', body: fd })
    }

    setOpen(false)
    setForm({ model: '', year: '', color: '', license_plate: '', rate_per_mile: '', odometer_start: '', included_miles_per_day: '30', tesla_vehicle_id: '' })
    setLocState(''); setLocCity(''); setLocAddress(''); setLocZip('')
    setPhotoFiles([]); setPhotoPreviews([])
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-2xl py-6 text-gray-400 hover:text-gray-600 transition text-sm font-medium">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M12 5v14M5 12h14" /></svg>
        Add Car Directly
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Add Car</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Photos */}
      <div>
        <label className={l}>Car Photos (up to 5)</label>
        <div className="grid grid-cols-3 gap-2">
          {photoPreviews.map((src, pi) => (
            <div key={pi} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
              <img src={src} className="w-full h-full object-cover" alt="" />
              {pi === 0 && <span className="absolute top-1 left-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-medium">Primary</span>}
              <button type="button" onClick={() => {
                setPhotoFiles(f => f.filter((_, i) => i !== pi))
                setPhotoPreviews(p => p.filter((_, i) => i !== pi))
              }} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center">×</button>
            </div>
          ))}
          {photoPreviews.length < 5 && (
            <button type="button" onClick={() => photoInputRef.current?.click()}
              className="aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition text-xs gap-1">
              <span className="text-xl">+</span><span>Add photo</span>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">{photoPreviews.length}/5 photos · first photo is primary</p>
        <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => {
          if (!e.target.files) return
          const newFiles = Array.from(e.target.files).slice(0, 5 - photoFiles.length)
          setPhotoFiles(f => [...f, ...newFiles])
          setPhotoPreviews(p => [...p, ...newFiles.map(f => URL.createObjectURL(f))])
        }} />
      </div>

      {/* Model */}
      <div>
        <label className={l}>Tesla Model *</label>
        <select value={form.model} onChange={upd('model')} required className={s}>
          <option value="">Select model</option>
          {TESLA_MODELS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Year */}
      <div>
        <label className={l}>Year *</label>
        <select value={form.year} onChange={upd('year')} required className={s}>
          <option value="">Select year</option>
          {Array.from({ length: 12 }, (_, idx) => 2025 - idx).map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Color */}
      <div>
        <label className={l}>Color</label>
        <select value={form.color} onChange={upd('color')} className={s}>
          <option value="">Select color</option>
          {COLORS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={l}>Rate/mile ($) *</label>
          <input value={form.rate_per_mile} onChange={upd('rate_per_mile')} placeholder="0.35" required type="number" step="0.01" min="0" className={i} />
        </div>
        <div>
          <label className={l}>Miles/day included</label>
          <input value={form.included_miles_per_day} onChange={upd('included_miles_per_day')} type="number" min="1" className={i} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={l}>License Plate</label>
          <input value={form.license_plate} onChange={upd('license_plate')} placeholder="ABC-1234" className={i} />
        </div>
        <div>
          <label className={l}>Starting Odometer</label>
          <input value={form.odometer_start} onChange={upd('odometer_start')} placeholder="12500" type="number" className={i} />
        </div>
      </div>

      <div>
        <label className={l}>Tesla Vehicle ID</label>
        <input value={form.tesla_vehicle_id} onChange={upd('tesla_vehicle_id')} placeholder="From Tesla Fleet API" className={i} />
      </div>

      {/* Location */}
      <div className="space-y-2.5 pt-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Location</p>
        <div>
          <label className={l}>State</label>
          <select value={locState} onChange={e => { setLocState(e.target.value); setLocCity('') }} className={s}>
            <option value="">Select state</option>
            {US_STATES.map(st => <option key={st}>{st}</option>)}
          </select>
        </div>
        <div>
          <label className={l}>City</label>
          <input value={locCity} onChange={e => setLocCity(e.target.value)} placeholder="City" disabled={!locState} className={i} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={l}>ZIP</label>
            <input value={locZip} onChange={e => setLocZip(e.target.value)} placeholder="94102" className={i} />
          </div>
          <div>
            <label className={l}>Street</label>
            <input value={locAddress} onChange={e => setLocAddress(e.target.value)} placeholder="123 Main St" className={i} />
          </div>
        </div>
        {locCity && locState && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">📍 {buildLocation()}</div>
        )}
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition">
        {loading ? 'Adding…' : 'Add Car (auto-approved)'}
      </button>
    </form>
  )
}
