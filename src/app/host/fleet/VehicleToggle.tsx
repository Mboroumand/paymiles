'use client'
import { useState } from 'react'
import { toggleVehicleActive } from './actions'

export default function VehicleToggle({ carId, isActive }: { carId: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(isActive)

  async function toggle() {
    setLoading(true)
    const result = await toggleVehicleActive(carId, !active)
    if (!result?.error) setActive(a => !a)
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
        active
          ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
          : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400' : 'bg-red-400'}`} />
      {loading ? '…' : active ? 'Active' : 'Inactive'}
    </button>
  )
}
