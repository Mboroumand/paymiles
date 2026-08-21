'use client'
import { useState } from 'react'
import { updateTripStatus } from './actions'

export default function TripActions({ tripId, status, hasCheckin }: {
  tripId: string
  status: string
  hasCheckin?: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(status)

  async function handle(newStatus: string) {
    setLoading(newStatus)
    setError('')
    const result = await updateTripStatus(tripId, newStatus)
    if (result?.error) setError(result.error)
    else setCurrent(newStatus)
    setLoading(null)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {current === 'pending' && (
        <div className="flex gap-3">
          <button onClick={() => handle('active')} disabled={!!loading}
            className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition">
            {loading === 'active' ? 'Confirming…' : '✓ Confirm booking (skip check-in)'}
          </button>
          <button onClick={() => handle('cancelled')} disabled={!!loading}
            className="border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-500 font-semibold py-3 px-5 rounded-xl text-sm transition">
            Cancel
          </button>
        </div>
      )}

      {current === 'active' && (
        <div className="flex gap-3">
          <button onClick={() => handle('completed')} disabled={!!loading}
            className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition">
            {loading === 'completed' ? 'Completing…' : '✓ Mark completed (skip check-out)'}
          </button>
          <button onClick={() => handle('cancelled')} disabled={!!loading}
            className="border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-500 font-semibold py-3 px-5 rounded-xl text-sm transition">
            Cancel
          </button>
        </div>
      )}

      {(current === 'completed' || current === 'cancelled') && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 text-center">
          Trip is <span className="font-semibold text-gray-900">{current}</span>
        </div>
      )}
    </div>
  )
}
