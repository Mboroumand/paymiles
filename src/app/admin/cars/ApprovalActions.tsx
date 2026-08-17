'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ApprovalActions({ carId }: { carId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function update(listing_status: 'approved' | 'rejected') {
    setLoading(listing_status === 'approved' ? 'approve' : 'reject')
    const supabase = createClient()
    await supabase.from('cars').update({ listing_status }).eq('id', carId)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => update('approved')}
        disabled={!!loading}
        className="text-xs px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 disabled:opacity-40 transition">
        {loading === 'approve' ? '…' : 'Approve'}
      </button>
      <button
        onClick={() => update('rejected')}
        disabled={!!loading}
        className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 disabled:opacity-40 transition">
        {loading === 'reject' ? '…' : 'Reject'}
      </button>
    </div>
  )
}
