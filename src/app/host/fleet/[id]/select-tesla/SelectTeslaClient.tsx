'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { linkTeslaVehicle } from '../actions'

export default function SelectTeslaClient({ carId, vehicles }: {
  carId: string
  vehicles: { id: string; name: string; vin: string }[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLink() {
    if (!selected) return
    setLoading(true)
    await linkTeslaVehicle(carId, selected)
    router.push(`/host/fleet/${carId}?tab=details&tesla=connected`)
  }

  return (
    <div className="space-y-3">
      {vehicles.map(v => (
        <button key={v.id} onClick={() => setSelected(String(v.id))}
          className={`w-full text-left px-4 py-4 rounded-xl border transition ${selected === String(v.id) ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
          <p className="font-semibold text-gray-900">{v.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">VIN: {v.vin}</p>
        </button>
      ))}
      <button onClick={handleLink} disabled={!selected || loading}
        className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 transition mt-2">
        {loading ? 'Linking…' : 'Link this vehicle'}
      </button>
    </div>
  )
}
