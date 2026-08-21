'use client'
import { useState } from 'react'
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function upd(k: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value })) }

  function buildLocation() {
    return [locAddress, locCity, locZip ? `${locState} ${locZip}` : locState].filter(Boolean).join(', ')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.model) { setError('Select a model'); return }
    setLoading(true); setError('')

    let image_url: string | null = null
    if (imageFile) {
      const fd = new FormData(); fd.append('file', imageFile)
      const r = await fetch('/api/admin/cars/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setError(d.error); setLoading(false); return }
      image_url = d.url
    }

    const res = await fetch('/api/admin/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, image_url, location: buildLocation() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setOpen(false)
    setForm({ model: '', year: '', color: '', license_plate: '', rate_per_mile: '', odometer_start: '', included_miles_per_day: '30', tesla_vehicle_id: '' })
    setLocState(''); setLocCity(''); setLocAddress(''); setLocZip('')
    setImageFile(null); setImagePreview(null)
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

      {/* Photo */}
      <div>
        <label className={l}>Car Photo</label>
        <label className="cursor-pointer block">
          <div className={`border-2 border-dashed rounded-xl overflow-hidden transition ${imagePreview ? 'border-blue-400' : 'border-gray-200 hover:border-gray-400'}`}>
            {imagePreview
              ? <img src={imagePreview} className="w-full h-40 object-cover" alt="" />
              : <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-2 text-sm"><span className="text-3xl">📷</span>Click to upload</div>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) } }} />
        </label>
        {imagePreview && <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }} className="text-xs text-red-400 hover:underline mt-1">Remove</button>}
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
