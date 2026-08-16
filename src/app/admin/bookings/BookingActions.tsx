'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw } from 'lucide-react'

interface Props {
  booking: {
    id: string
    status: string
    car_id: string
    payment_status: string
  }
  car: {
    tesla_vehicle_id: string | null
  } | null
}

export default function BookingActions({ booking, car }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [odometerEnd, setOdometerEnd] = useState('')
  const [fetchingOdo, setFetchingOdo] = useState(false)

  async function activate() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'active' }).eq('id', booking.id)
    await supabase.from('cars').update({ status: 'rented' }).eq('id', booking.car_id)
    router.refresh()
    setLoading(false)
  }

  async function fetchLiveOdometer() {
    setFetchingOdo(true)
    const res = await fetch(`/api/tesla/odometer?carId=${booking.car_id}`)
    const data = await res.json()
    if (data.odometer != null) setOdometerEnd(String(data.odometer))
    setFetchingOdo(false)
  }

  async function complete() {
    if (!odometerEnd) { alert('Enter ending odometer reading first'); return }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('bookings').update({
      status: 'completed',
      odometer_end: parseFloat(odometerEnd),
      end_date: new Date().toISOString(),
    }).eq('id', booking.id)
    await supabase.from('cars').update({ status: 'available' }).eq('id', booking.car_id)
    router.refresh()
    setLoading(false)
  }

  async function markPaid() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('bookings').update({ payment_status: 'paid' }).eq('id', booking.id)
    router.refresh()
    setLoading(false)
  }

  async function cancel() {
    if (!confirm('Cancel this booking?')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    await supabase.from('cars').update({ status: 'available' }).eq('id', booking.car_id)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
      {booking.status === 'pending' && (
        <>
          <button onClick={activate} disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition">
            Activate Rental
          </button>
          <button onClick={cancel} disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition">
            Cancel
          </button>
        </>
      )}

      {booking.status === 'active' && (
        <>
          {car?.tesla_vehicle_id && (
            <button onClick={fetchLiveOdometer} disabled={fetchingOdo}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition flex items-center gap-1.5">
              <RefreshCw size={12} /> {fetchingOdo ? 'Fetching…' : 'Fetch Live Odometer'}
            </button>
          )}
          <input
            type="number" value={odometerEnd} onChange={e => setOdometerEnd(e.target.value)}
            placeholder="End odometer (mi)"
            className="text-xs bg-gray-800 border border-white/10 rounded-lg px-3 py-1.5 text-white w-44 focus:outline-none focus:border-blue-500"
          />
          <button onClick={complete} disabled={loading || !odometerEnd}
            className="text-xs px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 transition disabled:opacity-40">
            Complete & Calculate Bill
          </button>
        </>
      )}

      {booking.status === 'completed' && booking.payment_status === 'unpaid' && (
        <button onClick={markPaid} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 transition">
          Mark as Paid
        </button>
      )}
    </div>
  )
}
