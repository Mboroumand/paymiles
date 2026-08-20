'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApproveButtons({ userId, currentStatus }: { userId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function setStatus(status: 'approved' | 'rejected') {
    setLoading(true)
    await fetch('/api/admin/dl-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={() => setStatus('approved')}
        disabled={loading || currentStatus === 'approved'}
        className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 transition">
        Approve
      </button>
      <button
        onClick={() => setStatus('rejected')}
        disabled={loading || currentStatus === 'rejected'}
        className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-40 transition">
        Reject
      </button>
    </div>
  )
}
