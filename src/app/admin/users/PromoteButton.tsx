'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PromoteButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleRole() {
    const newRole = currentRole === 'admin' ? 'guest' : 'admin'
    if (!confirm(`Change role to ${newRole}?`)) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={toggleRole} disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-40 ${
        currentRole === 'admin'
          ? 'bg-gray-600/20 text-gray-400 border-gray-500/30 hover:bg-red-600/20 hover:text-red-400'
          : 'bg-purple-600/20 text-purple-400 border-purple-500/30 hover:bg-purple-600/30'
      }`}>
      {loading ? '…' : currentRole === 'admin' ? 'Demote' : 'Make Admin'}
    </button>
  )
}
