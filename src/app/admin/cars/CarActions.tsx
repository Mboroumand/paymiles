'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Trash2 } from 'lucide-react'

interface Props {
  carId: string
  currentStatus: string
  teslaVehicleId: string | null
}

export default function CarActions({ carId, currentStatus, teslaVehicleId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [odometer, setOdometer] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('cars').update({ status }).eq('id', carId)
    router.refresh()
    setLoading(false)
  }

  async function fetchOdometer() {
    setLoading(true)
    const res = await fetch(`/api/tesla/odometer?carId=${carId}`)
    const data = await res.json()
    setOdometer(data.odometer != null ? `${data.odometer.toLocaleString()} mi` : 'Error: ' + data.error)
    setLoading(false)
  }

  async function deleteCar() {
    if (!confirm('Delete this car? This cannot be undone.')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('cars').delete().eq('id', carId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {currentStatus !== 'available' && (
        <button onClick={() => updateStatus('available')} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 transition">
          Mark Available
        </button>
      )}
      {currentStatus !== 'maintenance' && (
        <button onClick={() => updateStatus('maintenance')} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30 transition">
          Mark Maintenance
        </button>
      )}
      {teslaVehicleId && (
        <button onClick={fetchOdometer} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition flex items-center gap-1.5">
          <RefreshCw size={12} /> {loading ? 'Loading…' : 'Live Odometer'}
        </button>
      )}
      {odometer && (
        <span className="text-xs text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg">📍 {odometer}</span>
      )}
      <button onClick={deleteCar} disabled={loading}
        className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition flex items-center gap-1.5">
        <Trash2 size={12} /> Delete
      </button>
    </div>
  )
}
