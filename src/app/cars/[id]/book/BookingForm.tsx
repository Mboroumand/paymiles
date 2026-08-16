'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Car } from '@/lib/types'

export default function BookingForm({ car, userId }: { car: Car; userId: string }) {
  const router = useRouter()
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('bookings').insert({
      guest_id: userId,
      car_id: car.id,
      status: 'pending',
      start_date: new Date(startDate).toISOString(),
      rate_per_mile: car.rate_per_mile,
      odometer_start: car.odometer_start,
      notes,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/bookings')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-white/10 rounded-2xl p-8 space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Car summary */}
      <div className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <p className="font-semibold">{car.name}</p>
          <p className="text-gray-400 text-sm">{car.year} · {car.color}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-400 text-xl font-bold">${car.rate_per_mile}</p>
          <p className="text-gray-500 text-xs">per mile</p>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Pickup Date & Time</label>
        <input
          type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required
          min={new Date().toISOString().slice(0, 16)}
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Notes (optional)</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Any special requests…"
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 text-sm text-gray-300">
        <p className="font-medium text-blue-400 mb-1">How billing works</p>
        <p>Your odometer is recorded at pickup via Tesla API. When you return the car, the difference is multiplied by <strong>${car.rate_per_mile}/mile</strong> for your total.</p>
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition text-lg"
      >
        {loading ? 'Booking…' : 'Confirm Booking'}
      </button>
    </form>
  )
}
