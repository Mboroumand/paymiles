'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AddCarForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', model: '', year: '', color: '', vin: '',
    license_plate: '', rate_per_mile: '', tesla_vehicle_id: '', odometer_start: '', image_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('cars').insert({
      name: form.name,
      model: form.model,
      year: parseInt(form.year),
      color: form.color || null,
      vin: form.vin || null,
      license_plate: form.license_plate || null,
      rate_per_mile: parseFloat(form.rate_per_mile),
      tesla_vehicle_id: form.tesla_vehicle_id || null,
      odometer_start: form.odometer_start ? parseFloat(form.odometer_start) : null,
      image_url: form.image_url || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.refresh()
    setForm({ name: '', model: '', year: '', color: '', vin: '', license_plate: '', rate_per_mile: '', tesla_vehicle_id: '', odometer_start: '', image_url: '' })
    setLoading(false)
  }

  const fields = [
    { label: 'Car Name *', key: 'name', placeholder: 'Tesla Model 3', required: true },
    { label: 'Model *', key: 'model', placeholder: 'Model 3', required: true },
    { label: 'Year *', key: 'year', placeholder: '2024', required: true },
    { label: 'Color', key: 'color', placeholder: 'Midnight Silver' },
    { label: 'Rate per Mile ($) *', key: 'rate_per_mile', placeholder: '0.45', required: true },
    { label: 'VIN', key: 'vin', placeholder: '5YJ3E1EA...' },
    { label: 'License Plate', key: 'license_plate', placeholder: 'ABC-1234' },
    { label: 'Tesla Vehicle ID', key: 'tesla_vehicle_id', placeholder: 'From Tesla Fleet API' },
    { label: 'Starting Odometer (mi)', key: 'odometer_start', placeholder: '12500' },
    { label: 'Image URL', key: 'image_url', placeholder: 'https://...' },
  ]

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-3">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">{error}</div>}
      {fields.map(({ label, key, placeholder, required }) => (
        <div key={key}>
          <label className="block text-xs text-gray-400 mb-1">{label}</label>
          <input
            value={form[key as keyof typeof form]} onChange={update(key)} placeholder={placeholder} required={required}
            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      ))}
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition mt-2">
        {loading ? 'Adding…' : 'Add Car'}
      </button>
    </form>
  )
}
