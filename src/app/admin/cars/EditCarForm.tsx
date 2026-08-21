'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CarPhotosManager from './CarPhotosManager'

const TESLA_MODELS = ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck', 'Roadster']
const COLORS = ['Black', 'White', 'Silver', 'Red', 'Blue', 'Gray', 'Pearl White', 'Midnight Silver', 'Deep Blue', 'Ultra Red']

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400 placeholder:text-gray-400'
const sel = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400'
const lbl = 'block text-xs font-medium text-gray-500 mb-1'

function CheckFsdButton({ carId, onResult }: { carId: string; onResult: (hasFsd: boolean) => void }) {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function check(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setChecking(true); setResult(null)
    const res = await fetch('/api/tesla/fsd-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carId }),
    })
    const data = await res.json()
    setChecking(false)
    if (res.ok) {
      onResult(data.has_fsd)
      setResult(data.has_fsd ? `✅ FSD active (${data.autopilot_version})` : `❌ No FSD (${data.autopilot_version || 'standard autopilot'})`)
    } else if (data.asleep) {
      setResult('😴 Vehicle asleep — try again in 30s')
    } else {
      setResult(`⚠️ ${data.error}`)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3">
      <button type="button" onClick={check} disabled={checking}
        className="text-xs px-3 py-1.5 bg-white border border-blue-300 hover:border-blue-500 text-blue-600 rounded-lg font-medium transition disabled:opacity-50">
        {checking ? 'Checking…' : '⚡ Check via Tesla API'}
      </button>
      {result && <span className="text-xs text-gray-600">{result}</span>}
    </div>
  )
}

interface Photo { id: string; url: string; is_primary: boolean }

interface Car {
  id: string
  name: string
  model: string
  year: number
  color: string | null
  license_plate: string | null
  rate_per_mile: number
  included_miles_per_day: number | null
  odometer_start: number | null
  location: string | null
  image_url: string | null
  tesla_vehicle_id: string | null
  listing_status: string
  has_fsd: boolean | null
  photos?: Photo[]
}

export default function EditCarForm({ car }: { car: Car }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    model: car.model ?? '',
    year: String(car.year ?? ''),
    color: car.color ?? '',
    license_plate: car.license_plate ?? '',
    rate_per_mile: String(car.rate_per_mile ?? ''),
    included_miles_per_day: String(car.included_miles_per_day ?? '30'),
    odometer_start: String(car.odometer_start ?? ''),
    location: car.location ?? '',
    tesla_vehicle_id: car.tesla_vehicle_id ?? '',
    listing_status: car.listing_status ?? 'approved',
    has_fsd: car.has_fsd ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function upd(k: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSaved(false)

    const res = await fetch('/api/admin/cars', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: car.id, ...form }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setSaved(true)
    setLoading(false)
    setTimeout(() => { setSaved(false); setOpen(false); router.refresh() }, 1000)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition">
        Edit
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">Edit {car.name}</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
          {saved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">Saved!</div>}

          {/* Photos */}
          <div>
            <label className={lbl}>Car Photos (up to 5)</label>
            <CarPhotosManager
              carId={car.id}
              initialPhotos={car.photos ?? (car.image_url ? [{ id: 'legacy', url: car.image_url, is_primary: true }] : [])}
            />
          </div>

          {/* Model & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Model *</label>
              <select value={form.model} onChange={upd('model')} className={sel}>
                {TESLA_MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Year *</label>
              <select value={form.year} onChange={upd('year')} className={sel}>
                {Array.from({ length: 12 }, (_, idx) => 2025 - idx).map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className={lbl}>Color</label>
            <select value={form.color} onChange={upd('color')} className={sel}>
              <option value="">—</option>
              {COLORS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Rate & Miles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Rate/mile ($) *</label>
              <input value={form.rate_per_mile} onChange={upd('rate_per_mile')} type="number" step="0.01" min="0" required className={inp} />
            </div>
            <div>
              <label className={lbl}>Miles/day included</label>
              <input value={form.included_miles_per_day} onChange={upd('included_miles_per_day')} type="number" min="1" className={inp} />
            </div>
          </div>

          {/* Plate & Odometer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>License Plate</label>
              <input value={form.license_plate} onChange={upd('license_plate')} placeholder="ABC-1234" className={inp} />
            </div>
            <div>
              <label className={lbl}>Starting Odometer</label>
              <input value={form.odometer_start} onChange={upd('odometer_start')} type="number" placeholder="12500" className={inp} />
            </div>
          </div>

          {/* Tesla ID */}
          <div>
            <label className={lbl}>Tesla Vehicle ID</label>
            <input value={form.tesla_vehicle_id} onChange={upd('tesla_vehicle_id')} placeholder="From Tesla Fleet API" className={inp} />
          </div>

          {/* FSD */}
          <div className={`px-4 py-3 rounded-xl border transition ${form.has_fsd ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setForm(f => ({ ...f, has_fsd: !f.has_fsd }))}>
              <div>
                <p className="text-sm font-medium text-gray-900">Full Self-Driving (FSD)</p>
                <p className="text-xs text-gray-400">Car includes Tesla FSD capability</p>
              </div>
              <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-4 ${form.has_fsd ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.has_fsd ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
            {car.tesla_vehicle_id && (
              <CheckFsdButton carId={car.id} onResult={(v) => setForm(f => ({ ...f, has_fsd: v }))} />
            )}
          </div>

          {/* Location */}
          <div>
            <label className={lbl}>Location</label>
            <input value={form.location} onChange={upd('location')} placeholder="123 Main St, City, State 94102" className={inp} />
          </div>

          {/* Status */}
          <div>
            <label className={lbl}>Listing Status</label>
            <select value={form.listing_status} onChange={upd('listing_status')} className={sel}>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition">
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
