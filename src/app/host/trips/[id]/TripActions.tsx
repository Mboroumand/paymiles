'use client'
import { useState } from 'react'
import { updateTripStatus } from './actions'

export default function TripActions({ tripId, status }: { tripId: string; status: string }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(status)

  async function handle(newStatus: string) {
    setLoading(newStatus)
    setError('')
    const result = await updateTripStatus(tripId, newStatus)
    if (result?.error) {
      setError(result.error)
    } else {
      setCurrent(newStatus)
    }
    setLoading(null)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {current === 'pending' && (
        <div className="flex gap-3">
          <button onClick={() => handle('active')} disabled={!!loading}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition">
            {loading === 'active' ? 'Confirming…' : '✓ Confirm Trip'}
          </button>
          <button onClick={() => handle('cancelled')} disabled={!!loading}
            className="flex-1 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 text-red-400 border border-red-500/30 font-semibold py-3 rounded-xl text-sm transition">
            {loading === 'cancelled' ? 'Cancelling…' : '✕ Cancel Trip'}
          </button>
        </div>
      )}

      {current === 'active' && (
        <div className="flex gap-3">
          <button onClick={() => handle('completed')} disabled={!!loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition">
            {loading === 'completed' ? 'Completing…' : '✓ Mark as Completed'}
          </button>
          <button onClick={() => handle('cancelled')} disabled={!!loading}
            className="flex-1 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 text-red-400 border border-red-500/30 font-semibold py-3 rounded-xl text-sm transition">
            {loading === 'cancelled' ? 'Cancelling…' : '✕ Cancel Trip'}
          </button>
        </div>
      )}

      {(current === 'completed' || current === 'cancelled') && (
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-500 text-center">
          This trip is <span className="text-white font-medium">{current}</span> — no further actions available.
        </div>
      )}
    </div>
  )
}
